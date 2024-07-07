import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { ExplorerWindow } from "./base/components/window/window";
import { ExplorerHistory, ExplorerLocation } from "./base/history";
import { Filesystem, FStat } from "./filesystem-interface";
import { Styles } from "./styles-component";
import { Path } from "./utils/path";

export class Explorer {
  private cleanups: Array<() => void> = [];

  public readonly history = new ExplorerHistory();
  public readonly location: ExplorerLocation = this.history["location"];
  public readonly currentDir = sig<FStat[]>([]);

  constructor(public readonly filesystem: Filesystem) {
    ExplorerLocation.signal(this.location).observe((path) => {
      this.updateDirContents(path);
    });

    const onChange = () => {
      this.refresh();
    };

    filesystem.onChange(onChange);
    this.cleanups.push(() => filesystem.offChange(onChange));
  }

  private updateDirContents(path: Path | string) {
    const locationPath = path.toString();
    this.filesystem.readdirStat(locationPath).then((stats) => {
      this.currentDir.dispatch(stats);
    });
  }

  refresh() {
    this.updateDirContents(this.location.pathname);
  }

  open(path: string | Path) {
    return this.filesystem.dirExists(path.toString()).then((exists) => {
      if (exists) {
        this.history.push(path);
        return true;
      }
      return false;
    });
  }

  mountTo(element: HTMLElement) {
    const window = ExplorerWindow({ explorer: this });
    window.prepend(Styles());
    element.appendChild(window);
  }

  dispose() {
    for (const cleanup of this.cleanups) {
      cleanup();
    }
  }
}
