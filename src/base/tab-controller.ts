import { Explorer } from "../explorer";
import { Path } from "../utils/path";
import { DirViewController } from "./dir-view-controller";
import { FilesMutation } from "./fs-controller";
import {
  ExplorerLocation,
  ExplorerPopEvent,
  ExplorerTabHistory,
  HistoryEntry,
} from "./history";

let i = 0;

export class TabController {
  public readonly id = Symbol(`TAB_${i++}`);
  public readonly history: ExplorerTabHistory;
  public readonly location: ExplorerLocation;
  public readonly directory: DirViewController;
  public readonly fullLocationPreview;
  public readonly locationPreview;

  constructor(
    protected explorer: Explorer,
    protected cleanups: Array<() => void>,
  ) {
    this.history = new ExplorerTabHistory();
    this.location = this.history["location"];
    this.directory = new DirViewController(explorer, this);
    this.fullLocationPreview = this.location.signal.derive(l => l.toString());
    this.locationPreview = this.location.signal.derive(l =>
      l.basename() || "/"
    );
  }

  private updateDirContents(
    entry: HistoryEntry,
    scrollPosition: number | "RETAIN",
  ) {
    this.directory.changeDirectory(
      entry,
      scrollPosition,
    );
  }

  initiate() {
    const popHandler = (event: Event) => {
      ExplorerPopEvent.assertIs(event);
      this.explorer.previewPane.close();

      this.updateDirContents(
        event.historyEntry,
        event.historyEntry.scrollPosition,
      );

      // Navigation changed this tab's location - re-push the set of dirs
      // open in tabs so the host filesystem keeps watchers in sync.
      // (Location is only ever mutated by the history methods, and every one
      // of them dispatches a pop event, so this covers all navigations.)
      this.explorer.syncWatchedDirs();
    };

    this.history.addEventListener(
      "pop",
      popHandler,
    );

    this.cleanups.push(() => {
      this.history.removeEventListener(
        "pop",
        popHandler,
      );
    });
  }

  async updateFiles(
    dir: string | Path,
    updates: FilesMutation[],
    skipFetch = false,
  ) {
    this.directory.updateFiles(dir, updates, skipFetch);
  }

  refresh(dir?: string) {
    if (dir != null) {
      const dirEntry = this.history.findEntry(dir);
      if (dirEntry) {
        this.directory.refreshDirectory(
          dirEntry,
          "RETAIN",
        );
      }
    } else {
      const currentEntry = this.history.getEntry();
      if (currentEntry) {
        this.updateDirContents(
          currentEntry,
          "RETAIN",
        );
      }
    }
  }

  open(path: string | Path) {
    path = Path.from(path);

    if (this.location.path.equals(path)) {
      return;
    }

    this.history.push(path);
  }

  replace(path: string | Path) {
    path = Path.from(path);

    if (this.location.path.equals(path)) {
      return;
    }

    this.history.replace(path);
  }

  getActiveFile() {
    return this.directory.activeEntry.get();
  }

  getCurrentDir() {
    return {
      stat: this.directory.stat.get(),
      files: this.directory.files.get(),
    };
  }

  getSelectedFiles() {
    return this.directory.selection.get();
  }
}
