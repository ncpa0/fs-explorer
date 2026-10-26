import { Explorer } from "../explorer";
import { Filesystem, FStat } from "../filesystem-interface";
import { ActionError } from "../interfaces/action-error";
import { Immediate, Resolvable } from "../utils/immediate";
import { Path } from "../utils/path";
import { DirViewController } from "./dir-view-controller";
import { QueuedJob } from "./jobs-controller";

export type FilesMutation = (files: readonly FStat[]) => readonly FStat[];

export class FsController {
  constructor(
    protected explorer: Explorer,
    protected filesystem: Filesystem,
  ) {}

  private createDirFStat(filepath: string | Path): FStat {
    filepath = Path.from(filepath);
    return {
      name: filepath.basename(),
      basedir: filepath.dir().toString(),
      size: 0,
      path: filepath.toString(),
      directory: true,
      hidden: filepath.basename().startsWith("."),
      read: true,
      write: true,
      mtime: Date.now() / 1000,
    };
  }

  private createFileFStat(filepath: string | Path): FStat {
    filepath = Path.from(filepath);
    return {
      name: filepath.basename(),
      basedir: filepath.dir().toString(),
      size: 0,
      path: filepath.toString(),
      directory: false,
      hidden: filepath.basename().startsWith("."),
      read: true,
      write: true,
      mtime: Date.now() / 1000,
    };
  }

  private actionRemoveFile(file: FStat): FilesMutation {
    const filepath = Path.from(file.path);
    return (files) => {
      if (files.some(f => filepath.equals(f.path))) {
        return files.filter(f => !filepath.equals(f.path));
      }
      return files;
    };
  }

  private actionAddFile(
    file: FStat,
    newParentDir?: string | Path,
  ): FilesMutation {
    if (newParentDir) {
      const newFullPath = Path.from(newParentDir).joinSegment(file.name);
      file = {
        ...file,
        path: newFullPath.toString(),
        basedir: newParentDir.toString(),
      };
    }

    const filepath = Path.from(file.path);

    return (files) => {
      if (files.some(f => filepath.equals(f.path))) {
        // A same-path entry can already be in the listing: an overwrite's
        // optimistic update, or a "keep both" copy onto the file's own
        // directory.
        return files.map(f => filepath.equals(f.path) ? { ...file } : f);
      }
      return [...files, { ...file }];
    };
  }

  private updateTabFiles(dir: string | Path, ...updates: FilesMutation[]) {
    this.explorer.forEachTab(tab => {
      tab.updateFiles(dir, updates);
    });
  }

  /**
   * Destination paths reserved by in-flight copy/move operations. A "keep
   * both" destination is resolved from a readdir snapshot that cannot see
   * files other in-flight operations are about to create — unioning this set
   * into the resolution closes that gap.
   */
  private readonly inFlightDests = new Set<string>();

  private claimDest(dest: Path): void {
    this.inFlightDests.add(dest.toString());
  }

  private releaseDest(dest: Path): void {
    this.inFlightDests.delete(dest.toString());
  }

  /**
   * Colliding names get suffixed: `name (1).ext`, `name (2).ext`, ... An
   * existing ` (N)` suffix is stripped first so a suffixed copy continues
   * the sequence instead of nesting.
   */
  private createUniqueName(name: string, taken: ReadonlySet<string>): string {
    const path = Path.from(name);
    let ext = path.ext();
    let stem = path.basename(false);
    if (stem === "") {
      // dotfiles (e.g. ".gitignore") have no extension to keep
      stem = name;
      ext = undefined;
    }
    while (/ \(\d+\)$/.test(stem)) {
      stem = stem.replace(/ \(\d+\)$/, "");
    }
    if (stem === "") {
      // the whole stem was a ` (N)` suffix (e.g. name "(1).pdf")
      stem = name;
    }
    for (let i = 1;; i++) {
      const candidate = ext !== undefined
        ? `${stem} (${i}).${ext}`
        : `${stem} (${i})`;
      if (!taken.has(candidate)) {
        return candidate;
      }
    }
  }

  /**
   * Resolves the destination for a "keep both" operation at execution time:
   * the original path if the conflict is gone by then, otherwise the first
   * free `name (N).ext` variant. Claims the result synchronously with the
   * resolution — deferring the claim past the awaiting caller reopens a
   * window for another operation to pick the same name.
   */
  private async resolveUniqueDest(dest: Path): Promise<Path> {
    const dir = dest.dir();
    const name = dest.basename();
    const existingFiles = await this.filesystem.readdir(dir.toString());
    const taken = new Set(existingFiles);
    // readdir is a snapshot; also exclude names claimed by in-flight
    // operations that haven't created their files yet.
    for (const claimed of this.inFlightDests) {
      const claimedPath = Path.from(claimed);
      if (claimedPath.dir().equals(dir)) {
        taken.add(claimedPath.basename());
      }
    }
    const finalName = taken.has(name)
      ? this.createUniqueName(name, taken)
      : name;
    const finalPath = dir.joinSegment(finalName);
    this.claimDest(finalPath);
    return finalPath;
  }

  /**
   * Asks how to resolve a destination-name conflict. "cancel" means skip the
   * file, not abort the batch. Never prompts when the ask-before-overwrite
   * setting is off, returning "keepBoth".
   */
  private async askOverwrite(
    filename: string,
  ): Promise<"overwrite" | "keepBoth" | "cancel"> {
    if (!this.explorer.userSettings.askBeforeOverwrite.get()) {
      return "keepBoth";
    }
    const res = await this.explorer.prompt.ask(
      {
        title: "File already exist",
        message:
          `File "${filename}" already exists, do you want to overwrite it?`,
        cancelBtnLabel: "Skip",
        confirmBtnLabel: "Overwrite",
        secondaryBtnLabel: "Keep both",
      },
    );
    return res.confirmed
      ? "overwrite"
      : res.secondaryChoice
      ? "keepBoth"
      : "cancel";
  }

  /**
   * Removes the files after a single batch confirmation, unless the
   * "confirm before delete" setting is switched off. Rejects only on
   * filesystem errors, never on the user cancelling the prompt.
   */
  async removeWithConfirm(files: readonly FStat[]): Promise<void> {
    if (this.explorer.userSettings.confirmBeforeDelete.get()) {
      const message = files.length === 1
        ? `Delete "${files[0]!.name}"?`
        : `Delete ${files.length} files?`;
      try {
        const res = await this.explorer.prompt.ask({
          title: "Confirm deletion",
          message,
          confirmBtnLabel: "Delete",
          cancelBtnLabel: "Cancel",
        });
        if (!res.confirmed) {
          return;
        }
      } catch {
        // prompt cancelled e.g. via the Escape key
        return;
      }
    }
    await Immediate.all(...files.map(f => this.remove(f)));
  }

  private _copy(
    from: FStat,
    to: string | Path,
    owner: undefined | DirViewController,
    keepBoth = false,
  ) {
    to = Path.from(to);

    if (to.equals(from.path) && !keepBoth) {
      return;
    }

    const job = this.explorer.jobs.createJob("copy", from, async () => {
      const dest = keepBoth ? await this.resolveUniqueDest(to) : to;
      if (!keepBoth) {
        this.claimDest(dest);
      }
      try {
        await this.filesystem.copy(from.path, dest.toString());
        this.updateTabFiles(
          dest.dir(),
          this.actionAddFile({ ...from, name: dest.basename() }, dest.dir()),
        );
        this.explorer.cache.invalidateDirSize(dest.dir());
        owner?.addSelectFile(dest.toString());
      } catch (err) {
        this.explorer.actionError.dispatch(
          ActionError.copy(err, from.path, to.toString()),
        );
      } finally {
        this.releaseDest(dest);
      }
    });

    return job;
  }

  private _move(
    file: FStat,
    to: string | Path,
    owner: undefined | DirViewController,
    keepBoth = false,
  ) {
    const filePath = Path.from(file.path);
    to = Path.from(to);

    if (to.equals(filePath) && !keepBoth) {
      return;
    }

    const job = this.explorer.jobs.createJob("move", file, async () => {
      const dest = keepBoth ? await this.resolveUniqueDest(to) : to;
      if (!keepBoth) {
        this.claimDest(dest);
      }
      try {
        await this.filesystem.move(filePath.toString(), dest.toString());
        const fromDir = filePath.dir();
        const toDir = dest.dir();

        this.updateTabFiles(fromDir, this.actionRemoveFile(file));
        this.updateTabFiles(
          toDir,
          this.actionAddFile({ ...file, name: dest.basename() }, toDir),
        );
        this.explorer.cache.invalidateDirSize(fromDir);
        this.explorer.cache.invalidateDirSize(toDir);
        owner?.addSelectFile(dest.toString());
      } catch (err) {
        this.explorer.actionError.dispatch(
          ActionError.move(err, filePath.toString(), to.toString()),
        );
      } finally {
        this.releaseDest(dest);
      }
    });

    return job;
  }

  copy(files: readonly FStat[], to: string | Path, owner?: DirViewController) {
    to = Path.from(to);
    return this.filesystem.readdir(to.toString()).then(
      async (existingFiles) => {
        const copyJobs = await Promise.all(
          files.map(async (f): Promise<QueuedJob<any>[]> => {
            let keepBoth = false;
            if (existingFiles.some((efname) => efname === f.name)) {
              const strategy = await this.askOverwrite(f.name);
              if (strategy === "cancel") {
                return [];
              }
              keepBoth = strategy === "keepBoth";
            }

            const dest = to.joinSegment(f.name);
            const job = this._copy(f, dest, owner, keepBoth);
            return job ? [job] : [];
          }),
        ).then((jobs) => jobs.flat());

        for (const job of copyJobs) {
          await job.start();
        }
      },
    );
  }

  move(
    file: FStat,
    to: string | Path,
    owner?: DirViewController,
  ): Resolvable<any>;
  move(
    files: readonly FStat[],
    to: string | Path,
    owner?: DirViewController,
  ): Resolvable<any>;
  move(
    files: FStat | readonly FStat[],
    to: string | Path,
    owner?: DirViewController,
  ): Resolvable<any> {
    to = Path.from(to);

    if (Array.isArray(files)) {
      return this.filesystem.readdir(to.toString()).then(
        async (existingFiles) => {
          const copyJobs = await Promise.all(
            files.map(async (f): Promise<QueuedJob<any>[]> => {
              let keepBoth = false;
              if (existingFiles.some((efname) => efname === f.name)) {
                const strategy = await this.askOverwrite(f.name);
                if (strategy === "cancel") {
                  return [];
                }
                keepBoth = strategy === "keepBoth";
              }

              const dest = to.joinSegment(f.name);
              const job = this._move(f, dest, owner, keepBoth);
              return job ? [job] : [];
            }),
          ).then((jobs) => jobs.flat());

          for (const job of copyJobs) {
            await job.start();
          }
        },
      );
    } else {
      const file = files as FStat;
      return this.filesystem.exists(to.toString()).then(async exists => {
        let targetDir: Path;
        let filename: string;
        if (exists) {
          const isDir = await this.filesystem.stat(to.toString()).then(s =>
            s.directory
          );
          if (!isDir) {
            filename = to.basename();
            targetDir = to.dir();
          } else {
            targetDir = to;
            filename = file.name;
          }
        } else {
          targetDir = to.dir();
          filename = to.basename();
        }

        return this.filesystem.readdir(targetDir.toString()).then(
          async existingFiles => {
            let keepBoth = false;
            if (existingFiles.some((efname) => efname === filename)) {
              const strategy = await this.askOverwrite(filename);
              if (strategy === "cancel") {
                return [];
              }
              keepBoth = strategy === "keepBoth";
            }

            const dest = targetDir.joinSegment(filename);
            const job = this._move(file, dest, owner, keepBoth);
            return job?.start();
          },
        );
      });
    }
  }

  remove(file: FStat) {
    const path = Path.from(file.path);

    return this.filesystem.remove(path.toString())
      .then(() => {
        this.updateTabFiles(path.dir(), this.actionRemoveFile(file));
        this.explorer.cache.invalidateDirSize(path);
      })
      .catch(err => {
        this.explorer.actionError.dispatch(
          ActionError.remove(err, path.toString()),
        );
      });
  }

  mkdir(path: string | Path) {
    path = Path.from(path);

    return this.filesystem.mkdir(path.toString())
      .then(() => {
        this.updateTabFiles(
          path.dir(),
          this.actionAddFile(this.createDirFStat(path)),
        );
      })
      .catch(err => {
        this.explorer.actionError.dispatch(
          ActionError.mkdir(err, path.toString()),
        );
      });
  }

  touch(path: string | Path) {
    path = Path.from(path);

    return this.filesystem.touch(path.toString())
      .then(() => {
        this.updateTabFiles(
          path.dir(),
          this.actionAddFile(this.createFileFStat(path)),
        );
      })
      .catch(err => {
        this.explorer.actionError.dispatch(
          ActionError.touch(err, path.toString()),
        );
      });
  }

  clipboardPaste(to: string | Path, owner?: DirViewController) {
    to = Path.from(to);
    const { files, mode } = this.explorer.clipboard.data.get();
    if (files) {
      this.explorer.clipboard.clear();
      this.filesystem.readdir(to.toString()).then(async (existingFiles) => {
        const copyJobs = await Promise.all(
          files.map(async (f): Promise<QueuedJob<any>[]> => {
            let keepBoth = false;
            if (existingFiles.some((efname) => efname === f.name)) {
              const strategy = await this.askOverwrite(f.name);
              if (strategy === "cancel") {
                return [];
              }
              keepBoth = strategy === "keepBoth";
            }

            const dest = to.joinSegment(f.name);
            if (mode === "move") {
              const job = this._move(f, dest, owner, keepBoth);
              return job ? [job] : [];
            } else {
              const job = this._copy(f, dest, owner, keepBoth);
              return job ? [job] : [];
            }
          }),
        ).then((jobs) => jobs.flat());

        for (const job of copyJobs) {
          await job.start();
        }
      });
    }
  }
}
