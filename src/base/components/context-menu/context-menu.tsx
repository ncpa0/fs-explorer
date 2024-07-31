import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Explorer } from "../../../explorer";
import { FStat } from "../../../filesystem-interface";
import { ADW } from "../../../utils/css";
import { trimTo } from "../../../utils/trim-to";

export type ContextMenuProps = {
  explorer: Explorer;
};

export function ContextMenu(props: ContextMenuProps) {
  const menu = props.explorer.contextMenu;
  const isClosed = menu.isOpen.derive(v => !v);
  const top = menu.position.derive(d => d.top ? `${d.top}px` : undefined);
  const right = menu.position.derive(d => d.right ? `${d.right}px` : undefined);
  const bottom = menu.position.derive(d =>
    d.bottom ? `${d.bottom}px` : undefined
  );
  const left = menu.position.derive(d => d.left ? `${d.left}px` : undefined);

  const handleBackdropClick = () => {
    menu.close();
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
        class="context-menu"
        style={{ left, top, bottom, right }}
        onmousedown={handleMenuClick}
      >
        {sig.derive(menu.isOpen, menu.selectedFiles, (open, files) => {
          if (!open) {
            return <span />;
          }

          if (files.length) {
            return (
              <FileMenuButtons
                explorer={props.explorer}
                files={files}
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
  files: readonly FStat[];
}) {
  const { explorer, files } = props;
  const dir = explorer.directory;
  const menu = explorer.contextMenu;

  const cantPaste = explorer.clipboard.files.derive(f => f.length === 0);
  const cantWrite = dir.stat.derive(f => !f?.write);

  let singleFile = menu.getTargetFile();

  const customActions = menu.customActions;

  return (
    <div class="dcontents">
      <button
        class={{
          [ADW.Button.button]: true,
          hidden: !menu.actions.canOpen(),
        }}
        onmousedown={() => menu.actions.open()}
      >
        Open
      </button>
      <button
        class={{
          [ADW.Button.button]: true,
          hidden: cantWrite,
        }}
        onmousedown={() => menu.actions.createFile()}
      >
        New File
      </button>
      <button
        class={{
          [ADW.Button.button]: true,
          hidden: cantWrite,
        }}
        onmousedown={() => menu.actions.createDirectory()}
      >
        New Directory
      </button>
      {customActions.derive(customActions => {
        if (customActions.length === 0) {
          return <span />;
        }

        return (
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
                  menu.close();
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
        );
      })}
      <button
        class={{
          [ADW.Button.button]: true,
          [ADW.Button.disabled]: cantPaste,
          hidden: cantWrite,
        }}
        disabled={cantPaste}
        onmousedown={() => menu.actions.paste()}
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
        onmousedown={() => menu.actions.pasteTo()}
      >
        Paste To {!!singleFile && trimTo(singleFile.name, 12)}
      </button>
      <button
        class={{
          [ADW.Button.button]: true,
          hidden: files.some(f => !f.read),
        }}
        onmousedown={() => menu.actions.copy()}
      >
        Copy
      </button>
      <button
        class={{
          [ADW.Button.button]: true,
          hidden: files.some(f => !f.read || !f.write),
        }}
        onmousedown={() => menu.actions.cut()}
      >
        Cut
      </button>
      <button
        class={{
          [ADW.Button.button]: true,
          hidden: files.some(f => !f.write),
        }}
        onmousedown={() => menu.actions.delete()}
      >
        Delete
      </button>
      <button
        class={{
          [ADW.Button.button]: true,
          hidden: !singleFile || !singleFile.write,
        }}
        onmousedown={() => menu.actions.rename()}
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
  const dir = explorer.directory;
  const menu = explorer.contextMenu;

  const cantWrite = dir.stat.derive(f => !f?.write);
  const cantPaste = explorer.clipboard.files.derive(f => !f.length);

  return (
    <div class="dcontents">
      <button
        class={{
          [ADW.Button.button]: true,
          hidden: cantWrite,
        }}
        onmousedown={() => menu.actions.createFile()}
      >
        New File
      </button>
      <button
        class={{
          [ADW.Button.button]: true,
          hidden: cantWrite,
        }}
        onmousedown={() => menu.actions.createDirectory()}
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
        onmousedown={() => menu.actions.paste()}
      >
        Paste Here
      </button>
    </div>
  );
}
