import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Explorer } from "../explorer";
import { FStat } from "../filesystem-interface";
import { Fmt } from "../utils/formatters";
import { Immediate, Resolvable } from "../utils/immediate";
import { Path } from "../utils/path";
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
  private readonly queue = new ChangeDirQueue();
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

  public restoreScrollPos?: (scrollPosition: number) => void;
  public scrollToFile?: (file: string | Path) => void;

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

  private isCurrentDir(pth: string | Path) {
    pth = Path.from(pth);
    return pth.equals(this.stat.get()?.path ?? "");
  }

  updateFiles(
    dir: string | Path,
    updates: FilesMutation[],
    skipFetch = false,
  ) {
    dir = Path.from(dir);

    if (!skipFetch) {
      this.explorer.scheduleRefresh(dir);
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
    this.explorer.scheduleRefresh(locationPath, false);
  }

  notifyScheduledRefreshCompleted(dir: Path, files: readonly FStat[]) {
    const stat = this.stat.get();
    if (stat && dir.equals(stat.path)) {
      this.files.dispatch(files);
    }
  }

  changeDirectory(
    entry: HistoryEntry,
    scrollPosition?: number | "RETAIN",
  ) {
    const dirpath = entry.path;
    const locationPath = Path.from(dirpath).toString();
    const dir = this;

    this.queue.cd({
      before() {
        const cached = dir.explorer.cache.get(dirpath.toString());
        if (cached) {
          if (!dir.isCurrentDir(dirpath)) {
            dir.selection.dispatch([]);
          }
          dir.files.dispatch(cached.files);
          if (dir.restoreScrollPos) {
            queueMicrotask(() => {
              dir.restoreScrollPos!(entry.scrollPosition!);
            });
          }
        } else {
          dir.loading.dispatch(true);
        }
      },
      fetch() {
        return Immediate.all(
          dir.explorer.filesystem.stat(locationPath),
          dir.explorer.filesystem.readdirStat(locationPath),
        );
      },
      commit(dirStat, files) {
        sig.startBatch();
        dir.loading.dispatch(false);
        if (!dir.isCurrentDir(dirpath)) {
          dir.selection.dispatch([]);
        }
        dir.stat.dispatch(dirStat);
        dir.files.dispatch(files);
        dir.error.dispatch(undefined);
        sig.commitBatch();

        queueMicrotask(() => {
          if (dir.restoreScrollPos && scrollPosition != null) {
            if (scrollPosition === "RETAIN") {
              scrollPosition = dir.tab.history.getEntry()?.scrollPosition;
            }
            dir.restoreScrollPos(scrollPosition!);
          }
        });
      },
      after(dirStat, files) {
        dir.explorer.cache.add(dirpath.toString(), files);
      },
      error(err) {
        sig.startBatch();
        dir.loading.dispatch(false);
        dir.selection.dispatch([]);
        dir.stat.dispatch(undefined);
        dir.files.dispatch([]);
        dir.error.dispatch(err);
        sig.commitBatch();
      },
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

  toggleSorting(sortBy: "name" | "date" | "size" | "type") {
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
        case "type": {
          return {
            mode: SortMode.Type,
            reverse: prev.mode === SortMode.Type && !prev.reverse,
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

  unselectAll() {
    this.selection.dispatch([]);
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

type CdAction = {
  before(): void;
  fetch(): Resolvable<[FStat, FStat[]]>;
  after(dirstat: FStat, files: FStat[]): any;
  commit(dirstat: FStat, files: FStat[]): any;
  error(err: Error): void;
};

type InternalAction = CdAction & {
  canceled: boolean;
};

class ChangeDirQueue {
  private pendingActions: Array<InternalAction> = [];

  private cancelAll() {
    for (const a of this.pendingActions) {
      a.canceled = true;
    }
  }

  private removeAction(action: InternalAction) {
    const idx = this.pendingActions.indexOf(action);
    if (idx >= 0) {
      this.pendingActions.splice(idx, 1);
    }
  }

  cd(cdAction: CdAction) {
    const action: InternalAction = { ...cdAction, canceled: false };

    this.cancelAll();
    this.pendingActions.push(action);

    try {
      action.before();
    } catch (err) {
      action.error(toError(err));
      return;
    }

    action.fetch()
      .then(([stat, files]) => {
        if (!action.canceled) {
          action.commit(stat, files);
        }
        action.after(stat, files);
        this.removeAction(action);
      })
      .catch((err) => {
        this.removeAction(action);
        if (!action.canceled) {
          action.error(toError(err));
        }
      });
  }
}

let isError: (error: unknown) => error is Error;

if ("isError" in Error) {
  isError = Error.isError;
} else {
  isError = function isError(e: unknown): e is Error {
    return typeof e === "object" && e != null && "message" in e;
  };
}

function toError(e: any): Error {
  if (isError(e)) {
    return e;
  }
  return new Error(String(e));
}
