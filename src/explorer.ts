import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { ExplorerWindow } from "./base/components/window/window";
import { FsController } from "./base/fs-controller";
import { ExplorerHistory, ExplorerLocation } from "./base/history";
import { Filesystem, FStat } from "./filesystem-interface";
import { ActionError } from "./interfaces/action-error";
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
  open: boolean;
  file?: FStat[];
  left?: number;
  top?: number;
  bottom?: number;
}

export interface FileClipboard {
  file: FStat[];
  cut?: boolean;
}

export interface PromptModal {
  open: boolean;
  prompt?: string;
  onConfirm?: (value: string) => void;
  validate?: (value: string) => "ok" | { msg: string };
  initialValue?: string;
  confirmBtnLabel?: string;
}

export class Explorer {
  private cleanups: Array<() => void> = [];
  private escapeKeyHandlers: Array<(e: KeyboardEvent) => void> = [];

  public window: Element | null = null;

  public readonly history = new ExplorerHistory();
  public readonly location: ExplorerLocation = this.history["location"];
  public readonly fs;

  // location visible on the left pane
  public readonly places = sig<ReadonlyArray<Place>>([]);
  public readonly staticPlaces = sig<ReadonlyArray<Place>>([]);

  // currentyl opened directory
  public readonly currentDirStat = sig<FStat | undefined>(undefined);
  public readonly currentDir = sig<ReadonlyArray<FStat>>([]);

  // right pane preview
  public readonly preview = sig<undefined | FStat>(undefined);
  public readonly actionError = sig<ActionError | undefined>(undefined);
  public readonly clipboard = sig<FileClipboard>({ file: [] });

  public readonly promptModal = sig<PromptModal>({
    open: false,
  });
  public readonly contextMenu = sig<ContextMenuData>({
    open: false,
    left: 0,
    top: 0,
  });

  constructor(
    private readonly filesystem: Filesystem,
    public readonly options: ExplorerOptions = {},
  ) {
    this.fs = new FsController(this, filesystem);

    if (options.places) {
      this.places.dispatch(options.places.slice());
    }
    if (options.staticPlaces) {
      this.staticPlaces.dispatch(options.staticPlaces.slice());
    }

    const { detach } = ExplorerLocation.signal(this.location).observe(
      (path) => {
        this.preview.dispatch(undefined);
        this.updateDirContents(path);
      },
    );
    this.cleanups.push(detach);

    const onChange = this.refresh.bind(this);
    filesystem.onChange(onChange);
    this.cleanups.push(() => filesystem.offChange(onChange));

    window.addEventListener("keydown", this.globalKeyDownHandler);
    this.cleanups.push(() => {
      window.removeEventListener("keydown", this.globalKeyDownHandler);
    });
  }

  private globalKeyDownHandler = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      if (this.promptModal.get().open) {
        this.promptModal.dispatch({
          open: false,
        });
        return;
      }

      if (this.contextMenu.get().open) {
        this.contextMenu.dispatch({
          open: false,
        });
        return;
      }

      for (const handler of this.escapeKeyHandlers) {
        handler(e);
      }
    }
  };

  private updateDirContents(path: Path | string) {
    const locationPath = path.toString();
    this.filesystem.readdirStat(locationPath).then((stats) => {
      this.currentDir.dispatch(stats);
    });
    this.filesystem.stat(locationPath).then((stat) => {
      this.currentDirStat.dispatch(stat);
    });
  }

  onEscapePress(handler: (e: KeyboardEvent) => void) {
    this.escapeKeyHandlers.push(handler);
    return () => {
      const idx = this.escapeKeyHandlers.indexOf(handler);
      if (idx !== -1) {
        this.escapeKeyHandlers.splice(idx, 1);
      }
    };
  }

  refresh(dir?: string) {
    if (dir != null) {
      if (this.location.path.equals(dir)) {
        this.updateDirContents(this.location.pathname);
      }
    } else {
      this.updateDirContents(this.location.pathname);
    }
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
    if (!this.window) {
      this.window = ExplorerWindow({ explorer: this });
      this.window.prepend(Styles());
    }
    element.appendChild(this.window);
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
