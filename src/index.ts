import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { ExplorerWindow } from "./base/components/window/window";
import { ExplorerHistory, ExplorerLocation } from "./base/history";
import { Filesystem, FStat } from "./filesystem-interface";
import { Styles } from "./styles-component";
import { Path } from "./utils/path";

export interface Place {
  readonly id: string;
  readonly label: string;
  readonly path: string;
}

export interface FileAction {
  readonly label: string;
  readonly match: { test(filepath: string): boolean };
  readonly run: (file: FStat) => void;
}

export interface FileActionApi {
  openPreview(): void;
}

export interface ExplorerOptions {
  readonly openAction?: (
    filepath: string,
  ) => undefined | ((file: FStat, api: FileActionApi) => void);
  /**
   * List of actions that can be performed on different files. If an action
   * matches a file, it will be displayed in the context menu, when that
   * file is pressed.
   */
  readonly actions?: ReadonlyArray<FileAction>;
  /**
   * Initial list of links that will appear in the left pane. User can add,
   * remove or reorder these as they see fit.
   */
  readonly places?: ReadonlyArray<Place>;
  /**
   * List of links that will always appear in the left pane. User can't
   * remove or reorder these.
   */
  readonly staticPlaces?: ReadonlyArray<Place>;
  readonly showLeftPane?: boolean;
}

export interface ContextMenuData {
  file: FStat;
  posX: number;
  posY: number;
}

export class Explorer {
  private cleanups: Array<() => void> = [];

  public readonly history = new ExplorerHistory();
  public readonly location: ExplorerLocation = this.history["location"];

  public readonly currentDir = sig<ReadonlyArray<FStat>>([]);
  public readonly places = sig<ReadonlyArray<Place>>([]);
  public readonly staticPlaces = sig<ReadonlyArray<Place>>([]);
  public readonly preview = sig<undefined | FStat>(undefined);
  public readonly contextMenu = sig<undefined | ContextMenuData>(undefined);

  constructor(
    public readonly filesystem: Filesystem,
    public readonly options: ExplorerOptions = {},
  ) {
    ExplorerLocation.signal(this.location).observe((path) => {
      this.updateDirContents(path);
    });

    const onChange = () => {
      this.refresh();
    };

    filesystem.onChange(onChange);
    this.cleanups.push(() => filesystem.offChange(onChange));

    if (options.places) {
      this.places.dispatch(options.places.slice());
    }
    if (options.staticPlaces) {
      this.staticPlaces.dispatch(options.staticPlaces.slice());
    }
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

  addPlace(place: Place) {
    this.places.dispatch((places) => {
      return [...places, place];
    });
  }

  removePlace(id: string) {
    this.places.dispatch((places) => {
      return places.filter((place) => place.id !== id);
    });
  }

  addStaticPlace(place: Place) {
    this.staticPlaces.dispatch((places) => {
      return [...places, place];
    });
  }

  removeStaticPlace(id: string) {
    this.staticPlaces.dispatch((places) => {
      return places.filter((place) => place.id !== id);
    });
  }
}
