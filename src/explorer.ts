import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { ClipcoardController } from "./base/clipboard-controller";
import { ExplorerWindow } from "./base/components/window/window";
import { ContextMenuController } from "./base/context-menu-controller";
import { DirViewController } from "./base/dir-view-controller";
import { FsController } from "./base/fs-controller";
import { ExplorerHistory, ExplorerLocation } from "./base/history";
import { PreviewPaneController } from "./base/preview-pane-controller";
import { PromptController } from "./base/prompt-controller";
import { Filesystem, FStat } from "./filesystem-interface";
import { ActionError } from "./interfaces/action-error";
import { Styles } from "./styles-component";
import { Immediate } from "./utils/immediate";
import { Path } from "./utils/path";

export interface Place {
  readonly id: string;
  readonly label: string;
  readonly path: string;
}

export interface FileAction {
  readonly label: string;
  readonly match: (
    file: readonly FStat[],
    info: { isCurrentDir: boolean },
  ) => boolean;
  readonly run: (file: readonly FStat[]) => void;
}

export interface ExplorerAction {
  readonly label: string;
  readonly run: (explorer: Explorer) => void;
}

export interface FileActionApi {
  openPreview(): void;
}

export interface ExplorerOptions {
  readonly openAction?: (
    file: FStat,
  ) => undefined | ((file: FStat, api: FileActionApi) => void);
  /**
   * List of actions that can be performed on different files. If an action
   * matches a file, it will be displayed in the context menu, when that
   * file is pressed.
   */
  readonly actions?: ReadonlyArray<FileAction>;
  /**
   * Action available in the explorer toolbar menu.
   */
  readonly explorerActions?: ReadonlyArray<ExplorerAction>;
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
  readonly hideLeftPane?: boolean;
  /**
   * Path to the directory that will be opened when the explorer is initieated. The Default is `/`.
   */
  readonly initDir?: string;
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
  public readonly directory = new DirViewController(this);
  public readonly contextMenu = new ContextMenuController(this);
  public readonly previewPane = new PreviewPaneController(this);
  public readonly clipboard = new ClipcoardController(this);
  public readonly prompt = new PromptController(this);
  public readonly fs;

  // location visible on the left pane
  public readonly places = sig<ReadonlyArray<Place>>([]);
  public readonly staticPlaces = sig<ReadonlyArray<Place>>([]);

  public readonly actionError = sig<ActionError | undefined>(undefined);
  public readonly hideLeftPane = sig<boolean>(false);

  constructor(
    public readonly filesystem: Filesystem,
    public readonly options: ExplorerOptions = {},
  ) {
    this.fs = new FsController(this, filesystem);

    if (options.places) {
      this.places.dispatch(options.places.slice());
    }
    if (options.staticPlaces) {
      this.staticPlaces.dispatch(options.staticPlaces.slice());
    }
    if ("hideLeftPane" in options) {
      this.hideLeftPane.dispatch(!!options.hideLeftPane);
    }

    if (options.initDir) {
      this.history.replace(options.initDir);
    }
    const { detach } = this.location.signal.add(
      (path) => {
        this.previewPane.close();
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
    switch (e.key) {
      case "Escape": {
        if (this.prompt.isOpen.get()) {
          this.prompt.internal.cancel();
          return;
        }

        if (this.contextMenu.isOpen.get()) {
          this.contextMenu.close();
          return;
        }

        for (const handler of this.escapeKeyHandlers) {
          handler(e);
        }
        break;
      }
      case "c": {
        if (e.ctrlKey && !e.shiftKey && !e.altKey) {
          const files = this.directory.getActionableFiles();
          if (files) {
            this.clipboard.put(files, "copy");
          }
        }
        break;
      }
      case "x": {
        if (e.ctrlKey && !e.shiftKey && !e.altKey) {
          const files = this.directory.getActionableFiles();
          if (files) {
            this.clipboard.put(files, "move");
          }
        }
        break;
      }
      case "v": {
        if (e.ctrlKey && !e.shiftKey && !e.altKey) {
          const dstat = this.directory.stat.get();
          if (dstat && dstat.write) {
            this.fs.clipboardPaste(dstat.path);
          }
        }
        break;
      }
      case "F2": {
        if (!e.ctrlKey && !e.shiftKey && !e.altKey) {
          const selected = this.directory.getActionableFiles();
          if (selected && selected.length === 1) {
            const file = selected[0]!;
            this.prompt.input({
              title: "Rename",
              message: "Enter new name:",
              initialValue: file.name,
              placeholder: "Filename",
              validate: this.contextMenu.nameValidator(file.name),
            }).then((name) => {
              const newPath = Path.from(file.path).base().joinSegment(
                name,
              );
              this.fs.move(file, newPath);
            });
          }
        }
        break;
      }
      case "Delete": {
        if (!e.ctrlKey && !e.shiftKey && !e.altKey) {
          const files = this.directory.getActionableFiles();
          if (files) {
            Immediate.all(...files.map(f => this.fs.remove(f))).then(() => {
              this.refresh();
            });
          }
        }
      }
    }
  };

  private updateDirContents(path: Path | string) {
    this.directory.changeDirectory(
      path,
    );
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
    path = Path.from(path);

    if (this.location.path.equals(path)) {
      return;
    }

    return this.filesystem.dirExists(path.toString()).then((exists) => {
      if (exists) {
        this.history.push(path);
        return true;
      }
      return false;
    });
  }

  replace(path: string | Path) {
    path = Path.from(path);

    if (this.location.path.equals(path)) {
      return;
    }

    return this.filesystem.dirExists(path.toString()).then((exists) => {
      if (exists) {
        this.history.replace(path);
        return true;
      }
      return false;
    });
  }

  element(): Element {
    if (!this.window) {
      this.window = ExplorerWindow({ explorer: this });
      this.window.prepend(Styles());
    }
    return this.window;
  }

  mountTo(element: HTMLElement) {
    element.appendChild(this.element());
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

  getClipboard() {
    return this.clipboard.files.get();
  }
}
