import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Explorer } from "../explorer";
import { FStat } from "../filesystem-interface";
import { FileActionContext } from "../interfaces/file-action";
import { Path } from "../utils/path";

export interface ContextMenuPosition {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
}

export interface OpenMenuParams {
  position: ContextMenuPosition;
  relatedFiles: readonly FStat[];
  triggerFile?: FStat;
}

export class ContextMenuController {
  static ContextMenuActions = class ContextMenuActions {
    canWrite;

    constructor(
      public menu: ContextMenuController,
    ) {
      this.canWrite = this.menu.explorer.directory.stat.derive(f =>
        f && f.write
      );
    }

    isPossibleTo = {
      open: () => {
        const explorer = this.menu.explorer;
        const file = this.menu.triggerFile.get();

        if (!file) {
          return false;
        }

        if (file.directory) {
          return true;
        }

        const action = explorer.options.openAction?.(file);
        return !!action;
      },
      createFile: () => {
        return this.canWrite.get();
      },
      createDirectory: () => {
        return this.canWrite.get();
      },
      paste: () => {
        const clipboard = this.menu.explorer.clipboard;
        return clipboard.files.get().length && this.canWrite.get();
      },
      pasteTo: () => {
        const clipboard = this.menu.explorer.clipboard;
        const target = this.menu.getTargetFile();
        return clipboard.files.get().length && target && target.directory
          && target.write;
      },
      copy: () => {
        const target = this.menu.getTargetFile();
        if (target) {
          return target.read;
        }
        return this.menu.selectedFiles.get().every(f => f.read);
      },
      cut: () => {
        const target = this.menu.getTargetFile();
        if (target) {
          return this.canWrite.get() && target.read && target.write;
        }
        return this.canWrite.get()
          && this.menu.selectedFiles.get().every(f => f.read && f.write);
      },
      delete: () => {
        const target = this.menu.getTargetFile();
        if (target) {
          return this.canWrite.get() && target.write;
        }
        return this.canWrite.get()
          && this.menu.selectedFiles.get().every(f => f.write);
      },
      rename: () => {
        const target = this.menu.getTargetFile();
        if (target) {
          return this.canWrite.get() && target.write;
        }
        return this.canWrite.get()
          && this.menu.selectedFiles.get().every(f => f.write);
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
  };

  public readonly isOpen = sig(false);
  public readonly selectedFiles = sig<readonly FStat[]>([]);
  public readonly triggerFile = sig<undefined | FStat>(undefined);
  public readonly position = sig<ContextMenuPosition>({});

  public readonly actions;
  public readonly customActions;
  public readonly customDirActions;

  constructor(
    protected explorer: Explorer,
  ) {
    this.actions = new ContextMenuController.ContextMenuActions(this);
    this.customActions = this.deriveCustomActions();
    this.customDirActions = this.deriveCustomDirectoryActions();
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

  private deriveCustomActions() {
    return sig.derive(
      this.selectedFiles,
      this.triggerFile,
      (files, targetFile) => {
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
      },
    );
  }

  private deriveCustomDirectoryActions() {
    return sig.derive(
      this.explorer.directory.stat,
      (dirStat) => {
        const actionDefs = this.explorer.options.actions;
        if (!actionDefs) return [];

        return dirStat
          ? actionDefs.filter(a => a.match([dirStat], { isCurrentDir: true }))
          : [];
      },
    );
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
