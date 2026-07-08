import { Explorer } from "../explorer";
import { Filesystem, FStat } from "../filesystem-interface";
import { ActionError } from "../interfaces/action-error";
import { Resolvable } from "../utils/immediate";
import { Path } from "../utils/path";
import { QueuedJob } from "./jobs-controller";

const overwritePrompt = (filename: string) => ({
  title: "File already exist",
  message: `File "${filename}" already exists, do you want to overwrite it?`,
  cancelBtnLabel: "Skip",
  confirmBtnLabel: "Overwrite",
});

export class FsController {
  constructor(
    protected explorer: Explorer,
    protected filesystem: Filesystem,
  ) {}

  private propagatesChangesIn(...dirPaths: Path[]) {
    for (const tab of this.explorer.tabs.get()) {
      if (dirPaths.some(p => p.equals(tab.location.path))) {
        tab.queueRefresh(undefined, true);
      }
    }
  }

  private _copy(from: FStat, to: string | Path) {
    to = Path.from(to);

    if (to.equals(from.path)) {
      return;
    }

    const job = this.explorer.jobs.createJob("copy", from, () => {
      return this.filesystem.copy(from.path, to.toString())
        .then(() => {
          this.propagatesChangesIn(to.dir());
        })
        .catch(err => {
          this.explorer.actionError.dispatch(
            ActionError.copy(err, from.path, to.toString()),
          );
        });
    });

    return job;
  }

  private _move(file: FStat, to: string | Path) {
    const filePath = Path.from(file.path);
    to = Path.from(to);

    if (to.equals(filePath)) {
      return;
    }

    const job = this.explorer.jobs.createJob("move", file, () => {
      return this.filesystem.move(filePath.toString(), to.toString())
        .then(() => {
          const fromDir = filePath.dir();
          const toDir = to.dir();
          this.propagatesChangesIn(fromDir, toDir);
        })
        .catch(err => {
          this.explorer.actionError.dispatch(
            ActionError.move(err, filePath.toString(), to.toString()),
          );
        });
    });

    return job;
  }

  copy(files: readonly FStat[], to: string | Path) {
    to = Path.from(to);
    return this.filesystem.readdir(to.toString()).then(
      async (existingFiles) => {
        const copyJobs = await Promise.all(
          files.map(async (f): Promise<QueuedJob<any>[]> => {
            if (existingFiles.some((efname) => efname === f.name)) {
              const res = await this.explorer.prompt.ask(
                overwritePrompt(f.name),
              );

              if (res.answer === false) {
                return [];
              }
            }

            const dest = to.joinSegment(f.name);
            const job = this._copy(f, dest);
            return job ? [job] : [];
          }),
        ).then((jobs) => jobs.flat());

        for (const job of copyJobs) {
          await job.start();
        }
      },
    );
  }

  move(file: FStat, to: string | Path): Resolvable<any>;
  move(files: readonly FStat[], to: string | Path): Resolvable<any>;
  move(files: FStat | readonly FStat[], to: string | Path): Resolvable<any> {
    to = Path.from(to);

    if (Array.isArray(files)) {
      return this.filesystem.readdir(to.toString()).then(
        async (existingFiles) => {
          const copyJobs = await Promise.all(
            files.map(async (f): Promise<QueuedJob<any>[]> => {
              if (existingFiles.some((efname) => efname === f.name)) {
                const res = await this.explorer.prompt.ask(
                  overwritePrompt(f.name),
                );

                if (res.answer === false) {
                  return [];
                }
              }

              const dest = to.joinSegment(f.name);
              const job = this._move(f, dest);
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
            if (existingFiles.some((efname) => efname === filename)) {
              const res = await this.explorer.prompt.ask(
                overwritePrompt(filename),
              );

              if (res.answer === false) {
                return;
              }
            }

            const dest = targetDir.joinSegment(filename);
            const job = this._move(file, dest);
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
        this.propagatesChangesIn(path.dir());
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
        this.propagatesChangesIn(path.dir());
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
        this.propagatesChangesIn(path.dir());
      })
      .catch(err => {
        this.explorer.actionError.dispatch(
          ActionError.touch(err, path.toString()),
        );
      });
  }

  clipboardPaste(to: string | Path) {
    to = Path.from(to);
    const { files, mode } = this.explorer.clipboard.data.get();
    if (files) {
      this.explorer.clipboard.clear();
      this.filesystem.readdir(to.toString()).then(async (existingFiles) => {
        const copyJobs = await Promise.all(
          files.map(async (f): Promise<QueuedJob<any>[]> => {
            if (existingFiles.some((efname) => efname === f.name)) {
              const res = await this.explorer.prompt.ask(
                overwritePrompt(f.name),
              );

              if (res.answer === false) {
                return [];
              }
            }

            const dest = to.joinSegment(f.name);
            if (mode === "move") {
              const job = this._move(f, dest);
              return job ? [job] : [];
            } else {
              const job = this._copy(f, dest);
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
