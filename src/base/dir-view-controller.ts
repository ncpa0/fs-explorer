import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Queue } from "async-await-queue";
import { Explorer } from "../explorer";
import { FStat } from "../filesystem-interface";
import { Fmt } from "../utils/formatters";
import { Immediate } from "../utils/immediate";
import { Path } from "../utils/path";
import { Scheduler } from "../utils/scheduler";
import { sortFiles, SortMode } from "./components/dir-view/sort-files";
import { FilesMutation } from "./fs-controller";
import { HistoryEntry } from "./history";
import { TabController } from "./tab-controller";

export interface DirectoryInfo {
  filecount: string;
  dircount: string;
  size: string;
  selection?: {
    filecount: string;
    dircount: string;
    size: string;
  };
}

export class DirViewController {
  private readonly cdQueue = new Queue(1);
  public readonly activeEntry = sig<string | null>(null);
  public readonly stat = sig<FStat | undefined>(undefined);
  public readonly files = sig<ReadonlyArray<FStat>>([]);
  public readonly sorting = sig({ mode: SortMode.Alpha, reverse: false });
  public readonly showHidden = sig(false);
  /** Whether this tab should display its files in a gallery grid instead of a list */
  public readonly galleryView = sig(false);
  public readonly selection = sig<ReadonlyArray<FStat>>([]);
  public readonly loading = sig(false);
  public readonly error = sig<any>();

  public readonly filesView = this.deriveFilesView();
  public readonly directoryInfo = this.deriveDirectoryInfo();

  public onContentChange?: (scrollPosition: number) => void;
  public scrollToFile?: (file: string | Path) => void;

  private scheduler = new Scheduler(250);

  constructor(
    protected explorer: Explorer,
    protected tab: TabController,
  ) {
    const onEscape = () => {
      this.activeEntry.dispatch(null);
      this.selection.dispatch([]);
    };
    explorer.onEscapePress(onEscape);

    // unselect any files that disappear from the view
    this.filesView.add((filesView) => {
      const selected = this.selection.get();
      const visibleSelected: FStat[] = [];
      for (let i = 0; i < selected.length; i++) {
        const sfile = selected[i]!;
        const isVisible = filesView.some(f => f.path === sfile.path);
        if (isVisible) {
          visibleSelected.push(sfile);
        }
      }
      if (visibleSelected.length !== selected.length) {
        this.selection.dispatch(visibleSelected);
      }
    });
  }

  private deriveFilesView() {
    return sig.derive(
      this.files,
      this.sorting,
      this.showHidden,
      (files, sorting, showHidden) => {
        return sortFiles(
          showHidden
            ? files
            : files.filter(f => !f.hidden),
          sorting.mode,
          sorting.reverse,
        );
      },
    );
  }

  private deriveDirectoryInfo() {
    return sig.derive(
      this.files,
      this.selection,
      (files, selectedFiles): DirectoryInfo => {
        files = files.filter(f => !f.hidden);
        const nonDirs = files.filter(f => !f.directory);
        const totalSize = nonDirs.reduce(
          (totalSize, f) => totalSize + f.size,
          0,
        );

        const slectedNonDirs = selectedFiles.filter(f => !f.directory);
        const selectedSize = slectedNonDirs.reduce(
          (totalSize, f) => totalSize + f.size,
          0,
        );

        return {
          filecount: String(nonDirs.length),
          dircount: String(files.length - nonDirs.length),
          size: Fmt.size(totalSize),
          selection: selectedFiles.length > 0
            ? {
              filecount: String(slectedNonDirs.length),
              dircount: String(selectedFiles.length - slectedNonDirs.length),
              size: Fmt.size(selectedSize),
            }
            : undefined,
        };
      },
    );
  }

  updateFiles(
    dir: string | Path,
    updates: FilesMutation[],
    skipFetch = false,
  ) {
    dir = Path.from(dir);

    if (!skipFetch) {
      const s = this.scheduler.byKey(dir.toString());
      s.cancelNext();
      s.schedule(() => {
        this.explorer.filesystem.readdirStat(dir.toString())
          .then((files) => {
            this.explorer.cache.add(dir.toString(), files);

            const current = this.stat.get();
            if (current && dir.equals(current.path)) {
              this.files.dispatch(files);
            }
          });
      });
    }

    const current = this.stat.get();
    if (!current) return false;

    if (dir.equals(current.path)) {
      this.files.dispatch(files => {
        for (const update of updates) {
          files = update(files);
        }
        return files;
      });
      this.explorer.cache.add(dir.toString(), this.files.get());
      return true;
    }

    return false;
  }

  refreshDirectory(
    entry: HistoryEntry,
    scrollPosition?: number | "RETAIN",
  ) {
    const current = this.stat.get();
    if (current && entry.path.equals(current.path)) {
      return this.changeDirectory(entry, scrollPosition);
    }

    const locationPath = entry.path.toString();
    this.scheduler.byKey(locationPath).cancelNext();

    return this.explorer.filesystem.readdirStat(locationPath)
      .then((files) => {
        this.explorer.cache.add(entry.path.toString(), files);
      });
  }

  changeDirectory(
    entry: HistoryEntry,
    scrollPosition?: number | "RETAIN",
  ) {
    const dirpath = entry.path;

    this.cdQueue.run(async () => {
      const isSameDir = dirpath.equals(this.stat.get()?.path ?? "");
      const locationPath = Path.from(dirpath).toString();
      this.scheduler.byKey(locationPath).cancelNext();

      const cached = this.explorer.cache.get(dirpath.toString());
      if (cached) {
        if (!isSameDir) {
          this.selection.dispatch([]);
        }
        this.files.dispatch(cached.files);
        if (this.onContentChange) {
          queueMicrotask(() => {
            this.onContentChange!(entry.scrollPosition!);
          });
        }
      } else {
        this.loading.dispatch(true);
      }

      const data = Immediate.all(
        this.explorer.filesystem.stat(locationPath),
        this.explorer.filesystem.readdirStat(locationPath),
      );

      await data.then(([dirStat, files]) => {
        this.explorer.cache.add(dirpath.toString(), files);

        sig.startBatch();
        this.loading.dispatch(false);
        if (!isSameDir) {
          this.selection.dispatch([]);
        }
        this.stat.dispatch(dirStat);
        this.files.dispatch(files);
        this.error.dispatch(undefined);
        sig.commitBatch();

        queueMicrotask(() => {
          if (this.onContentChange && scrollPosition != null) {
            if (scrollPosition === "RETAIN") {
              scrollPosition = this.tab.history.getEntry()?.scrollPosition;
            }
            this.onContentChange(scrollPosition!);
          }
        });
      }).catch(err => {
        sig.startBatch();
        this.loading.dispatch(false);
        this.selection.dispatch([]);
        this.stat.dispatch(undefined);
        this.files.dispatch([]);
        this.error.dispatch(err);
        sig.commitBatch();
      });
    });
  }

  toggleSelectFile(file: FStat) {
    this.selection.dispatch(selected => {
      const idx = selected.findIndex(f => f.path === file.path);
      if (idx !== -1) {
        const copy = selected.slice();
        copy.splice(idx, 1);
        return copy;
      } else {
        return [...selected, file];
      }
    });
  }

  addSelectFile(filepath: string | Path) {
    filepath = Path.from(filepath);

    const fstat = this.files.get().find(f => filepath.equals(f.path));

    if (fstat) {
      this.selection.dispatch(selected => {
        const idx = selected.findIndex(f => filepath.equals(f.path));
        if (idx !== -1) {
          return selected;
        } else {
          return [...selected, fstat];
        }
      });
      this.scrollToFile?.(filepath);
    }
  }

  toggleSorting(sortBy: "name" | "date" | "size") {
    this.sorting.dispatch(prev => {
      switch (sortBy) {
        case "name": {
          return {
            mode: SortMode.Alpha,
            reverse: prev.mode === SortMode.Alpha && !prev.reverse,
          };
        }
        case "date": {
          return {
            mode: SortMode.Date,
            reverse: prev.mode === SortMode.Date && !prev.reverse,
          };
        }
        case "size": {
          return {
            mode: SortMode.Size,
            reverse: prev.mode === SortMode.Size && !prev.reverse,
          };
        }
      }
    });
  }

  showHiddenFilesToggle() {
    this.showHidden.dispatch(v => !v);
  }

  getActionableFiles() {
    const sel = this.selection.get();
    if (sel.length) {
      return sel;
    }
    const active = this.getActiveEntryFile();
    if (active) {
      return [active];
    }
    return null;
  }

  selectAll() {
    if (this.showHidden.get()) {
      this.selection.dispatch(this.files.get());
    } else {
      this.selection.dispatch(this.files.get().filter(f => !f.hidden));
    }
  }

  getActiveEntryFile() {
    const fpath = this.activeEntry.get();
    const allfiles = this.files.get();
    if (fpath != null) {
      const p = Path.from(fpath);
      return allfiles.find(f => p.equals(f.path));
    }
  }
}
