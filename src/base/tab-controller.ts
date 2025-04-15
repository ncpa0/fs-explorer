import { Explorer } from "../explorer";
import { Path } from "../utils/path";
import { DirViewController } from "./dir-view-controller";
import {
  ExplorerLocation,
  ExplorerPopEvent,
  ExplorerTabHistory,
} from "./history";

let i = 0;

export class TabController {
  public readonly id = Symbol(`TAB_${i++}`);
  public readonly history: ExplorerTabHistory;
  public readonly location: ExplorerLocation;
  public readonly directory: DirViewController;
  private isRefreshQueued = false;
  private refreshTimer?: Timer;

  constructor(
    protected explorer: Explorer,
    protected cleanups: Array<() => void>,
  ) {
    this.history = new ExplorerTabHistory();
    this.location = this.history["location"];
    this.directory = new DirViewController(explorer, this);
  }

  private updateDirContents(
    path: Path | string,
    scrollPosition: number | "RETAIN",
  ) {
    this.directory.changeDirectory(
      path,
      scrollPosition,
    );
  }

  initiate() {
    const popHandler = (event: Event) => {
      ExplorerPopEvent.assertIs(event);
      this.explorer.previewPane.close();
      this.updateDirContents(event.path, event.historyEntry.scrollPosition);
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

  /*&
  * Queue a refresh to happen after a short delay or
  * do nothing if a refresh is already queued tyo happen.
  *
  * Normal refresh, open and replace operations will
  * cancel the queued refresh.
  */
  queueRefresh(dir?: string) {
    if (this.isRefreshQueued) {
      return;
    }
    this.isRefreshQueued = true;

    this.refreshTimer = setTimeout(() => {
      this.isRefreshQueued = false;
      this.refreshTimer = undefined;
      this.refresh(dir);
    }, 100);
  }

  /**
   * If there is a refresh queued, prevent it from happening.
   */
  clearQueue() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.isRefreshQueued = false;
      this.refreshTimer = undefined;
    }
  }

  refresh(dir?: string) {
    this.clearQueue();

    if (dir != null) {
      if (this.location.path.equals(dir)) {
        this.updateDirContents(
          this.location.pathname,
          "RETAIN",
        );
      }
    } else {
      this.updateDirContents(
        this.location.pathname,
        "RETAIN",
      );
    }
  }

  open(path: string | Path) {
    this.clearQueue();

    path = Path.from(path);

    if (this.location.path.equals(path)) {
      return;
    }

    this.history.push(path);
  }

  replace(path: string | Path) {
    this.clearQueue();

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
