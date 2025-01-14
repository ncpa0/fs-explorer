import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Explorer, Place } from "../explorer";
import { FStat } from "../filesystem-interface";
import { FileActionContext } from "../interfaces/file-action";
import { Path } from "../utils/path";

export interface ElementPosition {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
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

  canOpen(file?: FStat) {
    if (!file) {
      return false;
    }

    if (file.directory) {
      return true;
    }

    const action = this.explorer.options.openAction?.(file);
    return !!action;
  }

  canCreateNewFile(parentFile?: FStat) {
    if (!parentFile) {
      return false;
    }

    if (parentFile.directory) {
      return parentFile.write;
    }

    return false;
  }

  canPaste(to?: FStat) {
    const clipboard = this.explorer.clipboard;
    return to && to.directory && to.write && clipboard.data.get().files.length;
  }

  canCopy(...files: FStat[]) {
    return files.every(f => f.read);
  }

  canCut(...files: FStat[]) {
    return files.every(f => f.read && f.write);
  }

  canDelete(...files: FStat[]) {
    return files.every(f => f.write);
  }

  canRename(...files: FStat[]) {
    return files.every(f => f.write);
  }
}

export class ContextMenuController {
  static ContextMenuActions = class ContextMenuActions {
    constructor(
      public menu: ContextMenuController,
      public btnAccessController: BtnAccessController,
    ) {
    }

    get currentDir() {
      return this.menu.explorer.directory.stat;
    }

    isPossibleTo = {
      open: () => {
        const file = this.menu.triggerFile.get();
        return this.btnAccessController.canOpen(file);
      },
      createFile: () => {
        return this.btnAccessController.canCreateNewFile(
          this.currentDir.get(),
        );
      },
      paste: () => {
        return this.btnAccessController.canPaste(
          this.currentDir.get(),
        );
      },
      pasteTo: () => {
        const target = this.menu.getTargetFile();
        return this.btnAccessController.canPaste(
          target,
        );
      },
      copy: () => {
        const target = this.menu.getTargetFile();
        return this.btnAccessController.canCopy(
          ...(target ? [target] : this.menu.selectedFiles.get()),
        );
      },
      cut: () => {
        const target = this.menu.getTargetFile();
        return this.btnAccessController.canCut(
          ...(target ? [target] : this.menu.selectedFiles.get()),
        );
      },
      delete: () => {
        const target = this.menu.getTargetFile();
        return this.btnAccessController.canDelete(
          ...(target ? [target] : this.menu.selectedFiles.get()),
        );
      },
      rename: () => {
        const target = this.menu.getTargetFile();
        return this.btnAccessController.canRename(
          ...(target ? [target] : this.menu.selectedFiles.get()),
        );
      },
      createShortcut: () => {
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

      this.menu.close();
    }

    createFile() {
      const explorer = this.menu.explorer;

      explorer.prompt.input({
        title: "Create File",
        message: "Name of the new file:",
        initialValue: "New File",
        placeholder: "File name",
        validate: this.menu.nameValidator(),
      }).then(name => {
        const filepath = explorer.location.path.joinSegment(name);
        explorer.fs.touch(filepath);
      });

      this.menu.close();
    }

    createDirectory() {
      const explorer = this.menu.explorer;

      explorer.prompt.input({
        title: "Create Directory",
        message: "Name of the new directory:",
        initialValue: "New Directory",
        placeholder: "Directory name",
        validate: this.menu.nameValidator(),
      }).then(name => {
        const filepath = explorer.location.path.joinSegment(name);
        explorer.fs.mkdir(filepath);
      });

      this.menu.close();
    }

    paste() {
      const explorer = this.menu.explorer;
      const dir = explorer.directory;

      const to = dir.stat.get()!;
      if (to.write) {
        explorer.fs.clipboardPaste(to.path);
      }

      this.menu.close();
    }

    pasteTo() {
      const explorer = this.menu.explorer;
      const file = this.menu.getTargetFile();

      if (file && file.directory && file.write) {
        explorer.fs.clipboardPaste(file.path);
      }

      this.menu.close();
    }

    copy() {
      const explorer = this.menu.explorer;
      const file = this.menu.getTargetFile();

      explorer.clipboard.put(
        file ? file : this.menu.selectedFiles.get(),
        "copy",
      );

      this.menu.close();
    }

    cut() {
      const explorer = this.menu.explorer;
      const file = this.menu.getTargetFile();

      explorer.clipboard.put(
        file ? file : this.menu.selectedFiles.get(),
        "move",
      );

      this.menu.close();
    }

    delete() {
      const explorer = this.menu.explorer;
      const file = this.menu.getTargetFile();

      if (file) {
        explorer.fs.remove(file);
      } else {
        for (const file of this.menu.selectedFiles.get()) {
          explorer.fs.remove(file);
        }
      }

      this.menu.close();
    }

    rename() {
      const explorer = this.menu.explorer;
      const file = this.menu.getTargetFile();

      if (!file) {
        this.menu.close();
      } else {
        explorer.prompt.input({
          title: "Rename",
          message: "Enter new name:",
          initialValue: file.name,
          placeholder: "Filename",
          validate: this.menu.nameValidator(file.name),
        }).then((name) => {
          const newPath = Path.from(file.path).base().joinSegment(
            name,
          );
          explorer.fs.move(file, newPath);
        });
      }

      this.menu.close();
    }

    showPreview() {
      const explorer = this.menu.explorer;
      const file = this.menu.triggerFile.get();
      if (file) {
        explorer.previewPane.open(file);
      }

      this.menu.close();
    }

    createShortcut() {
      const file = this.menu.getTargetFile();
      if (!file || this.menu.explorer.places.findByPath(file.path)) return;
      const place: Place = {
        id: crypto.randomUUID(),
        label: file.name,
        path: file.path,
      };
      this.menu.explorer.addPlace(place);
      this.menu.close();
    }

    removeShortcut() {
      const file = this.menu.getTargetFile();
      if (!file) return;
      const place = this.menu.explorer.places.findByPath(file.path);
      if (place) {
        this.menu.explorer.removePlace(place.id);
      }
      this.menu.close();
    }
  };

  public readonly isOpen = sig(false);
  public readonly selectedFiles = sig<readonly FStat[]>([]);
  public readonly triggerFile = sig<undefined | FStat>(undefined);
  public readonly position = sig<ElementPosition>({});

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
      const existingFiles = dir.files.get()!.map(f => f.name);

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
    const dirStat = this.explorer.directory.stat.get();

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

  close() {
    sig.startBatch();
    this.isOpen.dispatch(false);
    this.position.dispatch({});
    this.selectedFiles.dispatch([]);
    this.triggerFile.dispatch(undefined);
    sig.commitBatch();
  }

  open(params: OpenMenuParams) {
    // check if, given the relatedFiles and the triggerFile,
    // any buttons will appear in the context menu, if not
    // do not open the context menu as it will be empty anyway
    if (!params.triggerFile && params.relatedFiles.length === 0) {
      const currentDir = this.explorer.directory.stat.get();

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
    this.position.dispatch(params.position);
    this.selectedFiles.dispatch(params.relatedFiles);
    if (params.triggerFile) {
      this.triggerFile.dispatch(params.triggerFile);
    }
    sig.commitBatch();
  }
}
