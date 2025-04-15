import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { ActionType, Explorer, Place } from "../explorer";
import { FStat } from "../filesystem-interface";
import { FileActionContext } from "../interfaces/file-action";
import { Path } from "../utils/path";
import { BulkRename } from "./components/bulk-rename/bulk-rename";
import { ContextMenu } from "./components/context-menu/context-menu";

export interface ElementPosition {
  top?: string | number;
  right?: string | number;
  bottom?: string | number;
  left?: string | number;
}

export interface OpenMenuParams {
  position: ElementPosition;
  relatedFiles: readonly FStat[];
  triggerFile?: FStat;
}

class BtnAccessController {
  constructor(
    protected explorer: Explorer,
  ) {}

  canOpen(file?: FStat): boolean {
    if (!file) {
      return false;
    }

    if (file.directory) {
      return true;
    }

    const action = this.explorer.options.openAction?.(file);
    return !!action;
  }

  canCreateNewFile(parentFile?: FStat): boolean {
    if (!parentFile) {
      return false;
    }

    if (parentFile.directory) {
      return parentFile.write;
    }

    return false;
  }

  canPaste(to?: FStat): boolean {
    const clipboard = this.explorer.clipboard;
    return Boolean(
      to && to.directory && to.write && clipboard.data.get().files.length,
    );
  }

  canCopy(...files: FStat[]): boolean {
    return files.every(f => f.read);
  }

  canCut(...files: FStat[]): boolean {
    return files.every(f => f.read && f.write);
  }

  canDelete(...files: FStat[]): boolean {
    return files.every(f => f.write);
  }

  canRename(...files: FStat[]): boolean {
    return files.every(f => f.write);
  }
}

const ALL_ALLOWED = [
  "copy",
  "createShortcut",
  "cut",
  "delete",
  "newdir",
  "newfile",
  "open",
  "paste",
  "rename",
] satisfies Array<ActionType>;

export class ContextMenuController {
  static ContextMenuActions = class ContextMenuActions {
    constructor(
      public menu: ContextMenuController,
      public btnAccessController: BtnAccessController,
    ) {
    }

    get currentDir() {
      return this.menu.explorer.directory.get().stat;
    }

    isPossibleTo = {
      open: () => {
        if (!this.menu.filesAllowedActions.includes("open")) {
          return false;
        }
        const file = this.menu.triggerFile.get();
        return this.btnAccessController.canOpen(file);
      },
      createFile: () => {
        if (!this.menu.dirAllowedActions.includes("newfile")) {
          return false;
        }
        return this.btnAccessController.canCreateNewFile(
          this.currentDir.get(),
        );
      },
      paste: () => {
        if (!this.menu.dirAllowedActions.includes("paste")) {
          return false;
        }
        return this.btnAccessController.canPaste(
          this.currentDir.get(),
        );
      },
      pasteTo: () => {
        if (!this.menu.filesAllowedActions.includes("paste")) {
          return false;
        }

        return this.btnAccessController.canPaste(
          this.menu.getTargetFile(),
        );
      },
      copy: () => {
        if (!this.menu.filesAllowedActions.includes("copy")) {
          return false;
        }
        const target = this.menu.getTargetFile();
        return this.btnAccessController.canCopy(
          ...(target ? [target] : this.menu.selectedFiles.get()),
        );
      },
      cut: () => {
        if (!this.menu.filesAllowedActions.includes("cut")) {
          return false;
        }
        const target = this.menu.getTargetFile();
        return this.btnAccessController.canCut(
          ...(target ? [target] : this.menu.selectedFiles.get()),
        );
      },
      delete: () => {
        if (!this.menu.filesAllowedActions.includes("delete")) {
          return false;
        }
        const target = this.menu.getTargetFile();
        return this.btnAccessController.canDelete(
          ...(target ? [target] : this.menu.selectedFiles.get()),
        );
      },
      rename: () => {
        if (!this.menu.filesAllowedActions.includes("rename")) {
          return false;
        }
        const target = this.menu.getTargetFile();
        return this.btnAccessController.canRename(
          ...(target ? [target] : this.menu.selectedFiles.get()),
        );
      },
      createShortcut: () => {
        if (!this.menu.filesAllowedActions.includes("createShortcut")) {
          return false;
        }
        const target = this.menu.getTargetFile();
        return !!target && target.directory
          && !this.menu.explorer.places.findByPath(target.path);
      },
      removeShortcut: () => {
        const target = this.menu.getTargetFile();
        return !!target
          && this.menu.explorer.places.findByPath(target.path);
      },
    };

    open() {
      const explorer = this.menu.explorer;
      const file = this.menu.triggerFile.get();
      this.menu.close();

      if (file) {
        if (file.directory) {
          explorer.open(file.path);
        } else {
          const action = explorer.options.openAction?.(file);
          if (action) {
            const ctx = new FileActionContext(
              explorer,
              file,
            );
            action(file, ctx);
          }
        }
      }
    }

    createFile() {
      this.menu.close();

      const explorer = this.menu.explorer;

      explorer.prompt.input({
        title: "Create File",
        message: "Name of the new file:",
        initialValue: "New File",
        placeholder: "File name",
        validate: this.menu.nameValidator(),
      }).then(name => {
        if (!name) return;
        const filepath = explorer.location.get().path.joinSegment(name);
        explorer.fs.touch(filepath);
      });
    }

    createDirectory() {
      this.menu.close();

      const explorer = this.menu.explorer;

      explorer.prompt.input({
        title: "Create Directory",
        message: "Name of the new directory:",
        initialValue: "New Directory",
        placeholder: "Directory name",
        validate: this.menu.nameValidator(),
      }).then(name => {
        if (!name) return;
        const filepath = explorer.location.get().path.joinSegment(name);
        explorer.fs.mkdir(filepath);
      });
    }

    paste() {
      this.menu.close();

      const explorer = this.menu.explorer;
      const dir = explorer.directory;

      const to = dir.get().stat.get()!;
      if (to.write) {
        explorer.fs.clipboardPaste(to.path);
      }
    }

    pasteTo() {
      const explorer = this.menu.explorer;
      const file = this.menu.getTargetFile();
      this.menu.close();

      if (file && file.directory && file.write) {
        explorer.fs.clipboardPaste(file.path);
      }
    }

    copy() {
      const explorer = this.menu.explorer;
      const file = this.menu.getTargetFile();
      const selectedFiles = this.menu.selectedFiles.get();
      this.menu.close();

      explorer.clipboard.put(
        file ? file : selectedFiles,
        "copy",
      );
    }

    cut() {
      const explorer = this.menu.explorer;
      const file = this.menu.getTargetFile();
      const selectedFiles = this.menu.selectedFiles.get();
      this.menu.close();

      explorer.clipboard.put(
        file ? file : selectedFiles,
        "move",
      );
    }

    delete() {
      const explorer = this.menu.explorer;
      const file = this.menu.getTargetFile();
      const selectedFiles = this.menu.selectedFiles.get();
      this.menu.close();

      if (file) {
        explorer.fs.remove(file);
      } else {
        for (const file of selectedFiles) {
          explorer.fs.remove(file);
        }
      }
    }

    rename() {
      const explorer = this.menu.explorer;
      const file = this.menu.getTargetFile();
      const selectedFiles = this.menu.selectedFiles.get();
      this.menu.close();

      if (file) {
        explorer.prompt.input({
          title: "Rename",
          message: "Enter new name:",
          initialValue: file.name,
          placeholder: "Filename",
          validate: this.menu.nameValidator(file.name),
        }).then((name) => {
          if (!name) return;
          const newPath = Path.from(file.path).base().joinSegment(
            name,
          );
          explorer.fs.move(file, newPath);
        });
      } else {
        explorer.overlay.display(
          <BulkRename explorer={explorer} files={selectedFiles} />,
        );
      }
    }

    showPreview() {
      const file = this.menu.triggerFile.get();
      this.menu.close();

      const explorer = this.menu.explorer;
      if (file) {
        explorer.previewPane.open(file);
      }
    }

    createShortcut() {
      const file = this.menu.getTargetFile();
      this.menu.close();

      if (!file || this.menu.explorer.places.findByPath(file.path)) return;
      const place: Place = {
        id: crypto.randomUUID(),
        label: file.name,
        path: file.path,
      };
      this.menu.explorer.addPlace(place);
    }

    removeShortcut() {
      const file = this.menu.getTargetFile();
      this.menu.close();

      if (!file) return;
      const place = this.menu.explorer.places.findByPath(file.path);
      if (place) {
        this.menu.explorer.removePlace(place.id);
      }
    }
  };

  public readonly isOpen = sig(false);
  public readonly selectedFiles = sig<readonly FStat[]>([]);
  public readonly triggerFile = sig<undefined | FStat>(undefined);
  public filesAllowedActions: Array<ActionType> = ALL_ALLOWED;
  public dirAllowedActions: Array<ActionType> = ALL_ALLOWED;

  protected btnAccessController: BtnAccessController;
  public readonly actions;

  constructor(
    protected explorer: Explorer,
  ) {
    this.btnAccessController = new BtnAccessController(explorer);
    this.actions = new ContextMenuController.ContextMenuActions(
      this,
      this.btnAccessController,
    );
  }

  nameValidator(originalName?: string) {
    return (name: string) => {
      const dir = this.explorer.directory;
      const existingFiles = dir.get().files.get()!.map(f => f.name);

      if (name.includes("/")) {
        return { msg: "Name cannot contain the '/' character." };
      }

      if (existingFiles.includes(name)) {
        if (!name) {
          return { msg: "Name cannot be empty." };
        }
        if (name !== originalName) {
          return {
            msg: "File with this name already exists.",
          };
        }
      }

      return "ok";
    };
  }

  getCustomActions() {
    const files = this.selectedFiles.get();
    const targetFile = this.triggerFile.get();

    const actionDefs = this.explorer.options.actions;
    if (!actionDefs) return [];

    if (files.length === 0 && targetFile) {
      return actionDefs.filter(def =>
        def.match([targetFile], { isCurrentDir: false })
      );
    }

    if (files.length > 0) {
      return actionDefs.filter(def =>
        def.match(files, { isCurrentDir: false })
      );
    }

    return [];
  }

  getCustomDirectoryActions() {
    const dirStat = this.explorer.directory.get().stat.get();

    const actionDefs = this.explorer.options.actions;
    if (!actionDefs) return [];

    return dirStat
      ? actionDefs.filter(a => a.match([dirStat], { isCurrentDir: true }))
      : [];
  }

  getTargetFile() {
    if (this.selectedFiles.get().length === 0) {
      return this.triggerFile.get();
    } else if (this.selectedFiles.get().length === 1) {
      return this.selectedFiles.get()[0];
    }
  }

  private afterClose() {
    sig.startBatch();
    this.isOpen.dispatch(false);
    this.selectedFiles.dispatch([]);
    this.triggerFile.dispatch(undefined);
    sig.commitBatch();
  }

  close() {
    this.explorer.overlay.close();
    this.afterClose();
  }

  private collectFilesAllowedActions(params: OpenMenuParams) {
    const matchedFiles = params.relatedFiles.length > 0
      ? params.relatedFiles
      : params.triggerFile
      ? [params.triggerFile]
      : undefined;
    const filesFilters = matchedFiles
      ? this.explorer.actionFilters.filter(af =>
        af.match(matchedFiles, { isCurrentDir: false })
      )
      : [];
    if (filesFilters.length > 0) {
      this.filesAllowedActions = Array.from(
        new Set(
          filesFilters.flatMap(af => af.allowed),
        ),
      );
    } else {
      this.filesAllowedActions = ALL_ALLOWED;
    }
  }

  private collectDirAllowedActions(params: OpenMenuParams) {
    const dir = this.explorer.directory.get().stat.get();
    if (dir) {
      const dirFilters = this.explorer.actionFilters.filter(af =>
        af.match([dir], { isCurrentDir: true })
      );
      if (dirFilters.length > 0) {
        this.dirAllowedActions = Array.from(
          new Set(
            dirFilters.flatMap(af => af.allowed),
          ),
        );
        return;
      }
    }
    this.dirAllowedActions = ALL_ALLOWED;
  }

  open(params: OpenMenuParams) {
    const isCurrentDir = !params.triggerFile
      && params.relatedFiles.length === 0;
    // check if, given the relatedFiles and the triggerFile,
    // any buttons will appear in the context menu, if not
    // do not open the context menu as it will be empty anyway
    if (isCurrentDir) {
      const currentDir = this.explorer.directory.get().stat.get();

      if (!currentDir) {
        return;
      }

      const canCreateFile = this.btnAccessController.canCreateNewFile(
        currentDir,
      );
      const canPaste = this.btnAccessController.canPaste(currentDir);
      if (!canCreateFile && !canPaste) {
        const actionDefs = this.explorer.options.actions;
        if (
          !actionDefs
          || actionDefs.every(def =>
            !def.match([currentDir], { isCurrentDir: true })
          )
        ) {
          return;
        }
      }
    }

    sig.startBatch();
    this.isOpen.dispatch(true);
    this.selectedFiles.dispatch(params.relatedFiles);
    if (params.triggerFile) {
      this.triggerFile.dispatch(params.triggerFile);
    }
    sig.commitBatch();

    this.collectDirAllowedActions(params);
    this.collectFilesAllowedActions(params);

    this.explorer.overlay.display(
      {
        onClose: () => this.afterClose(),
        dimBackground: false,
        closeOnBackgroundClick: true,
        position: {
          top: params.position.top,
          left: params.position.left,
          bottom: params.position.bottom,
          right: params.position.right,
        },
      },
      <ContextMenu
        explorer={this.explorer}
      />,
    );
  }
}
