import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Explorer } from "../../../explorer";
import { FStat } from "../../../filesystem-interface";
import { FileActionContext } from "../../../interfaces/file-action";
import { ADW } from "../../../utils/css";
import { Path } from "../../../utils/path";
import { trimTo } from "../../../utils/trim-to";

export type ContextMenuProps = {
  explorer: Explorer;
};

export function ContextMenu(props: ContextMenuProps) {
  const data = props.explorer.contextMenu;
  const isClosed = data.derive(d => !d.open);
  const left = data.derive(d => d.left ? `${d.left}px` : undefined);
  const top = data.derive(d => d.top ? `${d.top}px` : undefined);
  const bottom = data.derive(d => d.bottom ? `${d.bottom}px` : undefined);

  const handleBackdropClick = () => {
    props.explorer.contextMenu.dispatch({
      open: false,
      left: 0,
      top: 0,
    });
  };

  const handleMenuClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      class={{ ["context-backdrop"]: true, hidden: isClosed }}
      oncontextmenu={e => e.preventDefault()}
      onmousedown={handleBackdropClick}
    >
      <div
        class={{
          "context-menu": true,
        }}
        style={{ left, top, bottom }}
        onmousedown={handleMenuClick}
      >
        {data.derive(({ file, open }) => {
          if (!open) {
            return <span />;
          }

          if (file) {
            return (
              <FileMenuButtons
                explorer={props.explorer}
                files={file}
              />
            );
          }

          return (
            <DirMenuButtons
              explorer={props.explorer}
            />
          );
        })}
      </div>
    </div>
  );
}

function FileMenuButtons(props: {
  explorer: Explorer;
  files: FStat[];
}) {
  const { explorer, files } = props;
  const singleFile = files.length === 1 ? files[0]! : undefined;
  const cantPaste = explorer.clipboard.derive(c => c.file.length === 0);
  const cantWrite = explorer.currentDirStat.derive(f => !f?.write);

  const closeContextMenu = () => {
    explorer.contextMenu.dispatch({
      open: false,
    });
  };

  const createFile = createFileFactory(
    explorer,
    cantWrite.get(),
    closeContextMenu,
  );
  const createDir = createDirFactory(
    explorer,
    cantWrite.get(),
    closeContextMenu,
  );

  const openAction = singleFile
    ? explorer.options?.openAction?.(files[0]!.path)
    : undefined;
  const handleMainActionClick = () => {
    closeContextMenu();
    const ctx = new FileActionContext(
      props.explorer,
      singleFile!,
    );
    openAction!(singleFile!, ctx);
  };

  const customActions = singleFile
    ? props.explorer.options?.actions?.filter(a =>
      a.match.test(singleFile.path)
    )
      ?? []
    : [];

  return (
    <div class="dcontents">
      <button
        class={{
          [ADW.Button.button]: true,
          hidden: !openAction,
        }}
        onmousedown={handleMainActionClick}
      >
        Open
      </button>
      <button
        class={{
          [ADW.Button.button]: true,
          hidden: cantWrite,
        }}
        onmousedown={createFile}
      >
        New File
      </button>
      <button
        class={{
          [ADW.Button.button]: true,
          hidden: cantWrite,
        }}
        onmousedown={createDir}
      >
        New Directory
      </button>
      {customActions.length
        ? (
          <>
            <button
              class={ADW.Button.button}
              onmousedown={() => {}}
            >
              {"Actions >"}
            </button>
            <div class="custom-ctions">
              {customActions.map(action => {
                const handler = () => {
                  closeContextMenu();
                  action.run(singleFile!);
                };
                return (
                  <button
                    class={ADW.Button.button}
                    onmousedown={handler}
                  >
                    {action.label}
                  </button>
                );
              })}
            </div>
          </>
        )
        : <></>}
      <button
        class={{
          [ADW.Button.button]: true,
          [ADW.Button.disabled]: cantPaste,
          hidden: cantWrite,
        }}
        disabled={cantPaste}
        onmousedown={() => {
          closeContextMenu();
          const to = props.explorer.currentDirStat.get()!;
          if (to.write) {
            props.explorer.fs.clipboardPaste(to.path);
          }
        }}
      >
        Paste Here
      </button>
      <button
        class={{
          [ADW.Button.button]: true,
          [ADW.Button.disabled]: sig.or(cantPaste, !singleFile),
          hidden: !singleFile || !singleFile?.directory || !singleFile?.write,
        }}
        disabled={sig.or(cantPaste, !singleFile)}
        onmousedown={() => {
          closeContextMenu();
          if (singleFile && singleFile.directory && singleFile.write) {
            props.explorer.fs.clipboardPaste(singleFile.path);
          }
        }}
      >
        Paste To {!!singleFile && trimTo(singleFile.name, 12)}
      </button>
      <button
        class={{
          [ADW.Button.button]: true,
          hidden: files.some(f => !f.read),
        }}
        onmousedown={() => {
          closeContextMenu();
          props.explorer.clipboard.dispatch({
            file: files,
            cut: false,
          });
        }}
      >
        Copy
      </button>
      <button
        class={{
          [ADW.Button.button]: true,
          hidden: files.some(f => !f.read || !f.write),
        }}
        onmousedown={() => {
          closeContextMenu();
          props.explorer.clipboard.dispatch({
            file: files,
            cut: true,
          });
        }}
      >
        Cut
      </button>
      <button
        class={{
          [ADW.Button.button]: true,
          hidden: files.some(f => !f.write),
        }}
        onmousedown={() => {
          closeContextMenu();
          for (const file of files) {
            props.explorer.fs.remove(file);
          }
        }}
      >
        Delete
      </button>
      <button
        class={{
          [ADW.Button.button]: true,
          hidden: !singleFile || !singleFile.write,
        }}
        onmousedown={() => {
          if (!singleFile) return;
          closeContextMenu();
          explorer.promptModal.dispatch({
            open: true,
            prompt: "New name:",
            initialValue: singleFile.name,
            onConfirm: (name) => {
              const newPath = Path.from(singleFile.path).base().joinSegment(
                name,
              );
              explorer.fs.move(singleFile, newPath);
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
        }}
      >
        Rename
      </button>
    </div>
  );
}

function DirMenuButtons(props: {
  explorer: Explorer;
}) {
  const { explorer } = props;

  const cantWrite = explorer.currentDirStat.derive(f => !f?.write);
  const cantPaste = explorer.clipboard.derive(c => !c.file);

  const closeContextMenu = () => {
    explorer.contextMenu.dispatch({
      open: false,
    });
  };

  const createFile = createFileFactory(
    explorer,
    cantWrite.get(),
    closeContextMenu,
  );
  const createDir = createDirFactory(
    explorer,
    cantWrite.get(),
    closeContextMenu,
  );

  return (
    <div class="dcontents">
      <button
        class={{
          [ADW.Button.button]: true,
          hidden: cantWrite,
        }}
        onmousedown={createFile}
      >
        New File
      </button>
      <button
        class={{
          [ADW.Button.button]: true,
          hidden: cantWrite,
        }}
        onmousedown={createDir}
      >
        New Directory
      </button>
      <button
        class={{
          [ADW.Button.button]: true,
          [ADW.Button.disabled]: cantPaste,
          hidden: cantWrite,
        }}
        disabled={cantPaste}
        onmousedown={() => {
          closeContextMenu();
          const to = explorer.currentDirStat.get()!;
          if (to.write) {
            explorer.fs.clipboardPaste(to.path);
          }
        }}
      >
        Paste Here
      </button>
    </div>
  );
}

function createFileFactory(
  explorer: Explorer,
  cantWrite: boolean,
  closeContextMenu: () => void,
) {
  return () => {
    if (cantWrite) {
      return;
    }

    closeContextMenu();

    const existingFiles = explorer.currentDir.get()!.map(f => f.name);

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
        if (existingFiles.includes(name)) {
          return {
            msg: "File with this name already exists.",
          };
        }
        return "ok";
      },
    });
  };
}

function createDirFactory(
  explorer: Explorer,
  cantWrite: boolean,
  closeContextMenu: () => void,
) {
  return () => {
    if (cantWrite) {
      return;
    }

    closeContextMenu();

    const existingFiles = explorer.currentDir.get()!.map(f => f.name);

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
  };
}
