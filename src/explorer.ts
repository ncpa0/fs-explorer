import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { ClipcoardController } from "./base/clipboard-controller";
import { BulkRename } from "./base/components/bulk-rename/bulk-rename";
import { ExplorerWindow } from "./base/components/window/window";
import { ContextMenuController } from "./base/context-menu-controller";
import { DragController } from "./base/drag-controller";
import { FsController } from "./base/fs-controller";
import { JobsController } from "./base/jobs-controller";
import { OverlayController } from "./base/overlay-controller";
import { PlacesStorage } from "./base/places-storage";
import { PreviewPaneController } from "./base/preview-pane-controller";
import { PromptController } from "./base/prompt-controller";
import { TabController } from "./base/tab-controller";
import { Filesystem, FStat } from "./filesystem-interface";
import { ActionError } from "./interfaces/action-error";
import { Styles } from "./styles-component";
import { Immediate } from "./utils/immediate";
import { Path } from "./utils/path";
import "adwaveui/dist/esm/components/switch/switch";
import "adwaveui/dist/esm/components/selector/selector";
import { DirCache } from "./base/dir-cache";

export interface StorageInterface {
  getItem(key: string): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
}

export interface Place {
  readonly id: string;
  readonly label: string;
  readonly path: string;
}

export type ActionType =
  | "newfile"
  | "newdir"
  | "open"
  | "copy"
  | "cut"
  | "paste"
  | "delete"
  | "rename"
  | "createShortcut";

export interface ActionFilter {
  readonly match: (
    file: readonly FStat[],
    info: { isCurrentDir: boolean },
  ) => boolean;
  allowed: Array<ActionType>;
}

export interface FileAction {
  readonly label: string;
  readonly match: (
    file: readonly FStat[],
    info: { isCurrentDir: boolean },
  ) => boolean;
  readonly run: (file: readonly FStat[], explorer: Explorer) => void;
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
   * List of filters that can define which actions should be allowed for givent files.
   */
  readonly actionFilters?: ReadonlyArray<ActionFilter>;
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
  /**
   * When set to true the left panel displaying the shortcuts will not be visible
   */
  readonly hideLeftPane?: boolean;
  /**
   * When set to true the directory file list will only show the icon and the filename, without the additional
   * information about the file size and modified date.
   */
  readonly plainList?: boolean;
  /**
   * When set to true clikcking on a file will never open a preview right panel, also the "Properties" option will
   * disappear from the context menu.
   */
  readonly noPreview?: boolean;
  /**
   * Path to the directory that will be opened when the explorer is initieated. The Default is `/`.
   */
  readonly initDir?: string;
  readonly fileDropHandler?: (data: DataTransfer, droppedInto: FStat) => void;
  /**
   * When set to true dragging files inside the explorer window will be
   * disabled. Dropping files from outside of the window (via
   * `fileDropHandler`) is unaffected and keeps working.
   */
  readonly disableDrag?: boolean;
  /**
   * Called when an active (emulated) file drag leaves the explorer window
   * (pointer exit while the drag is still held). Return true if the host took
   * over the drag (e.g. handed it to the OS) - the emulated drag is then ended
   * without dropping. Return false (or omit) to keep the previous behavior
   * (the drag is cancelled when the pointer leaves the window).
   */
  readonly nativeDragOut?: (files: readonly FStat[]) => boolean;
  readonly storage?: StorageInterface;
}

export interface PromptModal {
  open: boolean;
  prompt?: string;
  onConfirm?: (value: string) => void;
  validate?: (value: string) => "ok" | { msg: string };
  initialValue?: string;
  confirmBtnLabel?: string;
}

const isHtmlElem = (v: any): v is HTMLElement => "closest" in v;

export class Explorer {
  private cleanups: Array<() => void> = [];
  private escapeKeyHandlers: Array<(e: KeyboardEvent) => void> = [];
  /** Last set of dirs pushed via `setWatchedDirs`, for change detection. */
  private lastWatchedDirs: readonly string[] | null = null;

  public window: Element | null = null;

  public readonly previewPane = new PreviewPaneController(this);
  public readonly clipboard = new ClipcoardController(this);
  public readonly prompt = new PromptController(this);
  public readonly fs;

  public readonly tabs = sig<ReadonlyArray<TabController>>([
    new TabController(this, this.cleanups),
  ]);
  public readonly activeTab = sig(this.tabs.get()[0]!.id);

  public readonly contextMenu = new ContextMenuController(this);
  public readonly overlay = new OverlayController();
  public readonly drag = new DragController(this, this.cleanups);
  public readonly jobs = new JobsController();

  // location visible on the left pane
  public readonly places: PlacesStorage;
  public readonly staticPlaces = sig<ReadonlyArray<Place>>([]);

  public readonly actionError = sig<ActionError | undefined>(undefined);
  public readonly hideLeftPane = sig(false);
  public readonly plainList = sig(false);
  public readonly noPreview = sig(false);
  public readonly actionFilters: ReadonlyArray<ActionFilter> = [];

  public readonly cache = new DirCache();

  currentTab = sig.derive(this.activeTab, this.tabs, (id, tabs) => {
    const activeTab = tabs.find((tab) => tab.id === id) ?? tabs[0]!;
    return activeTab;
  });
  history = this.currentTab.derive(t => t.history);
  location = this.currentTab.derive(t => t.location);
  directory = this.currentTab.derive(t => t.directory);

  constructor(
    public readonly filesystem: Filesystem,
    public readonly options: ExplorerOptions = {},
  ) {
    this.fs = new FsController(this, filesystem);
    this.places = new PlacesStorage(
      options.storage ?? localStorage,
      options.places,
    );

    if (options.staticPlaces) {
      this.staticPlaces.dispatch(options.staticPlaces.slice());
    }
    if ("hideLeftPane" in options) {
      this.hideLeftPane.dispatch(!!options.hideLeftPane);
    }
    if ("plainList" in options) {
      this.plainList.dispatch(!!options.plainList);
    }
    if ("noPreview" in options) {
      this.noPreview.dispatch(!!options.noPreview);
    }
    if (options.actionFilters) {
      this.actionFilters = options.actionFilters;
    }

    const onChange = (dirPath?: string) => {
      for (const tab of this.tabs.get()) {
        tab.refresh(dirPath);
      }
    };
    filesystem.onChange(onChange);
    this.cleanups.push(() => filesystem.offChange(onChange));

    // Watcher support: keep the filesystem implementation informed about the
    // set of directories currently open in tabs, so hosts that implement
    // `setWatchedDirs` only keep watchers for dirs the user is actually
    // looking at (instead of everything ever browsed). Tab navigation pushes
    // the set via the tabs' pop handler (see TabController.initiate); the
    // initial set is pushed here because no pop event fires at construction.
    this.syncWatchedDirs();

    window.addEventListener("keydown", this.globalKeyDownHandler);
    this.cleanups.push(() => {
      window.removeEventListener("keydown", this.globalKeyDownHandler);
    });

    for (const tab of this.tabs.get()) {
      tab.initiate();
    }

    if (options.initDir) {
      this.history.get().replace(options.initDir);
    }
  }

  private globalKeyDownHandler = (e: KeyboardEvent) => {
    const hasFocus = () => {
      if (e.target && isHtmlElem(e.target)) {
        return e.target.tagName === "INPUT" || e.target.tagName === "TEXT_AREA"
          || e.target.tagName === "BUTTON"
          || e.target.closest(".explorer-window");
      }
      return false;
    };

    switch (e.key) {
      case "Escape": {
        if (this.prompt.isOpen()) {
          this.prompt.cancel();
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
        if (!hasFocus() && e.ctrlKey && !e.shiftKey && !e.altKey) {
          const files = this.directory.get().getActionableFiles();
          if (files) {
            this.clipboard.put(files, "copy");
          }
        }
        break;
      }
      case "x": {
        if (!hasFocus() && e.ctrlKey && !e.shiftKey && !e.altKey) {
          const files = this.directory.get().getActionableFiles();
          if (files) {
            this.clipboard.put(files, "move");
          }
        }
        break;
      }
      case "v": {
        if (!hasFocus() && e.ctrlKey && !e.shiftKey && !e.altKey) {
          const dstat = this.directory.get().stat.get();
          if (dstat && dstat.write) {
            this.fs.clipboardPaste(dstat.path);
          }
        }
        break;
      }
      case "a": {
        if (!hasFocus() && e.ctrlKey && !e.shiftKey && !e.altKey) {
          const dir = this.directory.get();
          dir.selectAll();
          e.preventDefault();
        }
        break;
      }
      case "F2": {
        if (!hasFocus() && !e.ctrlKey && !e.shiftKey && !e.altKey) {
          const selected = this.directory.get().getActionableFiles();
          if (selected && selected.length === 1) {
            const file = selected[0]!;
            this.prompt.input({
              title: "Rename",
              message: "Enter new name:",
              initialValue: file.name,
              placeholder: "Filename",
              validate: this.contextMenu.nameValidator(file.name),
            }).then((name) => {
              if (!name) return;
              const newPath = Path.from(file.path).dir().joinSegment(
                name,
              );
              this.fs.move(file, newPath);
            });
          } else if (selected) {
            this.overlay.display(
              BulkRename({ files: selected, explorer: this }),
            );
          }
        }
        break;
      }
      case "F5": {
        if (!hasFocus() && e.ctrlKey && !e.shiftKey && !e.altKey) {
          e.preventDefault();
          this.refresh();
        }
        break;
      }
      case "Delete": {
        if (!hasFocus() && !e.ctrlKey && !e.shiftKey && !e.altKey) {
          const files = this.directory.get().getActionableFiles();
          if (files) {
            Immediate.all(...files.map(f => this.fs.remove(f))).then(() => {
              this.refresh();
            });
          }
        }
      }
    }
  };

  focusTab(id: symbol) {
    const tabs = this.tabs.get();
    if (tabs.some(tab => tab.id === id)) {
      this.activeTab.dispatch(id);
    }
  }

  newTab(initLocation?: Path | string) {
    const tab = new TabController(this, this.cleanups);
    // The tab must join the tabs list BEFORE its history is seeded below:
    // `history.replace` fires a pop event whose handler recomputes the
    // watched dirs from the open tabs, and the new tab has to be part of it.
    this.tabs.dispatch(current => current.concat(tab));
    this.activeTab.dispatch(tab.id);
    tab.initiate();
    if (initLocation) {
      tab.history.replace(initLocation);
    }
    // Covers the no-initLocation case (no pop event fires then) and is a
    // no-op otherwise (syncWatchedDirs skips unchanged sets).
    this.syncWatchedDirs();
  }

  closeTab(id: symbol) {
    sig.startBatch();
    const currentTabs = this.tabs.get();
    const newTabs = currentTabs.filter(tab => tab.id !== id);
    this.tabs.dispatch(newTabs);
    if (this.activeTab.get() === id) {
      const newActiveTab = newTabs[0];
      if (newActiveTab) {
        this.activeTab.dispatch(newActiveTab.id);
      }
    }
    sig.commitBatch();

    // Closing a tab fires no pop event, so the watched set is recomputed
    // explicitly here.
    this.syncWatchedDirs();
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
    for (const tab of this.tabs.get()) {
      tab.refresh(dir);
    }
  }

  open(path: string | Path) {
    this.currentTab.get().open(path);
  }

  replace(path: string | Path) {
    this.currentTab.get().replace(path);
  }

  getActiveFile() {
    return this.currentTab.get().getActiveFile();
  }

  getCurrentDir() {
    return this.currentTab.get().getCurrentDir();
  }

  getSelectedFiles() {
    return this.currentTab.get().getSelectedFiles();
  }

  getClipboard() {
    return this.clipboard.data.get();
  }

  addPlace(place: Place) {
    this.places.addPlace(place);
  }

  removePlace(id: string) {
    this.places.removePlace(id);
  }

  listPlaces() {
    return this.places.list().get();
  }

  removeAllPlaces() {
    return this.places.clear();
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

  mountTo(element: HTMLElement) {
    element.appendChild(this.element());
  }

  element(): Element {
    if (!this.window) {
      this.window = ExplorerWindow({ explorer: this });
      this.window.prepend(Styles());
    }
    return this.window;
  }

  dispose() {
    for (const cleanup of this.cleanups) {
      cleanup();
    }
  }

  /**
   * Pushes the set of directories currently open in tabs (one per tab
   * location, deduplicated) to the filesystem implementation. Called on
   * every tab navigation (from the tabs' pop handler), when a tab is opened
   * or closed, and once at construction. Skips unchanged sets so redundant
   * pop events don't re-push the same set. No-op for filesystems without
   * watcher support.
   */
  syncWatchedDirs() {
    const dirs = new Set<string>();
    for (const tab of this.tabs.get()) {
      dirs.add(tab.location.pathname);
    }
    const next = [...dirs];
    const prev = this.lastWatchedDirs;
    if (
      prev !== null && prev.length === next.length
      && next.every(dir => prev.includes(dir))
    ) {
      return;
    }
    this.lastWatchedDirs = next;
    this.filesystem.setWatchedDirs?.(next);
  }
}
