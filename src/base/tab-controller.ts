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

  constructor(
    protected explorer: Explorer,
    protected cleanups: Array<() => void>,
  ) {
    this.history = new ExplorerTabHistory();
    this.location = this.history["location"];
    this.directory = new DirViewController(explorer);
  }

  private updateDirContents(path: Path | string, scrollPosition = 0) {
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

  refresh(dir?: string) {
    const currentScrollPos = this.history.getEntry()?.scrollPosition;
    if (dir != null) {
      if (this.location.path.equals(dir)) {
        this.updateDirContents(
          this.location.pathname,
          currentScrollPos,
        );
      }
    } else {
      this.updateDirContents(
        this.location.pathname,
        currentScrollPos,
      );
    }
  }

  open(path: string | Path) {
    path = Path.from(path);

    if (this.location.path.equals(path)) {
      return;
    }

    return this.explorer.filesystem.dirExists(path.toString()).then(
      (exists) => {
        if (exists) {
          this.history.push(path);
          return true;
        }
        return false;
      },
    );
  }

  replace(path: string | Path) {
    path = Path.from(path);

    if (this.location.path.equals(path)) {
      return;
    }

    return this.explorer.filesystem.dirExists(path.toString()).then(
      (exists) => {
        if (exists) {
          this.history.replace(path);
          return true;
        }
        return false;
      },
    );
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
