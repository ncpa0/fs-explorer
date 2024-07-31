import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Explorer } from "../explorer";
import { FStat } from "../filesystem-interface";
import { FileActionContext } from "../interfaces/file-action";
import { Path } from "../utils/path";

export interface ContextMenuPosition {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
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
        return this.canWrite.get();
      },
      pasteTo: () => {
        const target = this.menu.getTargetFile();
        return target && target.directory && target.write;
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

    createFile() {
      const explorer = this.menu.explorer;
      const dir = explorer.directory;

      this.menu.close();
      explorer.promptModal.dispatch({
        open: true,
        prompt: "Name of the new file:",
        confirmBtnLabel: "Create",
        initialValue: "New File",
        onConfirm(name) {
          const filepath = explorer.location.path.joinSegment(name);
          explorer.fs.touch(filepath);
        },
        validate(name) {
          if (!name) {
            return { msg: "Name cannot be empty" };
          }

          const existingFiles = dir.files.get()!.map(f => f.name);
          if (existingFiles.includes(name)) {
            return {
              msg: "File with this name already exists.",
            };
          }

          return "ok";
        },
      });
    }

    createDirectory() {
      const explorer = this.menu.explorer;
      const dir = explorer.directory;

      this.menu.close();
      explorer.promptModal.dispatch({
        open: true,
        prompt: "Name of the new directory:",
        confirmBtnLabel: "Create",
        initialValue: "New Directory",
        onConfirm(name) {
          const filepath = explorer.location.path.joinSegment(name);
          explorer.fs.mkdir(filepath);
        },
        validate(name) {
          const existingFiles = dir.files.get()!.map(f => f.name);
          if (existingFiles.includes(name)) {
            if (!name) {
              return { msg: "Name cannot be empty" };
            }
            return {
              msg: "File with this name already exists.",
            };
          }

          return "ok";
        },
      });
    }

    paste() {
      const explorer = this.menu.explorer;
      const dir = explorer.directory;

      this.menu.close();
      const to = dir.stat.get()!;
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

      this.menu.close();
      explorer.clipboard.put(
        file ? file : this.menu.selectedFiles.get(),
        "copy",
      );
    }

    cut() {
      const explorer = this.menu.explorer;
      const file = this.menu.getTargetFile();

      this.menu.close();
      explorer.clipboard.put(
        file ? file : this.menu.selectedFiles.get(),
        "move",
      );
    }

    delete() {
      const explorer = this.menu.explorer;
      const file = this.menu.getTargetFile();

      this.menu.close();
      if (file) {
        explorer.fs.remove(file);
      } else {
        for (const file of this.menu.selectedFiles.get()) {
          explorer.fs.remove(file);
        }
      }
    }

    rename() {
      const explorer = this.menu.explorer;
      const file = this.menu.getTargetFile();

      this.menu.close();
      if (!file) return;
      explorer.promptModal.dispatch({
        open: true,
        prompt: "New name:",
        initialValue: file.name,
        onConfirm: (name) => {
          const newPath = Path.from(file.path).base().joinSegment(
            name,
          );
          explorer.fs.move(file, newPath);
        },
        validate: (name) => {
          if (!name) {
            return { msg: "Name cannot be empty" };
          }
          if (name.includes("/")) {
            return { msg: "Name cannot contain '/' character" };
          }
          return "ok";
        },
      });
    }
  };

  public readonly actions = new ContextMenuController.ContextMenuActions(this);

  public readonly isOpen = sig(false);
  public readonly selectedFiles = sig<readonly FStat[]>([]);
  public readonly triggerFile = sig<undefined | FStat>(undefined);
  public readonly position = sig<ContextMenuPosition>({});

  public readonly customActions = this.deriveCustomActions();

  constructor(
    protected explorer: Explorer,
  ) {}

  private deriveCustomActions() {
    const actionDefs = this.explorer.options.actions;

    return sig.derive(
      this.selectedFiles,
      this.triggerFile,
      (files, targetFile) => {
        if (!actionDefs) return [];

        if (files.length === 0 && targetFile) {
          return actionDefs.filter(def => def.match(targetFile));
        }

        if (files.length === 1) {
          const file = files[0]!;
          return actionDefs.filter(def => def.match(file));
        }

        return [];
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
