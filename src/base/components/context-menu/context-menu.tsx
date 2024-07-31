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
  const { explorer } = props;
  const menu = explorer.contextMenu;

  const canPaste = menu.actions.isPossibleTo.paste();

  let singleFile = menu.getTargetFile();

  const customActions = menu.customActions;

  return (
    <div class="dcontents">
      <button
        class={{
          [ADW.Button.button]: true,
          hidden: !menu.actions.isPossibleTo.open(),
        }}
        onmousedown={() => menu.actions.open()}
      >
        Open
      </button>
      <button
        class={{
          [ADW.Button.button]: true,
          hidden: !menu.actions.isPossibleTo.createFile(),
        }}
        onmousedown={() => menu.actions.createFile()}
      >
        New File
      </button>
      <button
        class={{
          [ADW.Button.button]: true,
          hidden: !menu.actions.isPossibleTo.createDirectory(),
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
          [ADW.Button.disabled]: !canPaste,
          hidden: !canPaste,
        }}
        disabled={!canPaste}
        onmousedown={() => menu.actions.paste()}
      >
        Paste Here
      </button>
      <button
        class={{
          [ADW.Button.button]: true,
          [ADW.Button.disabled]: !menu.actions.isPossibleTo.pasteTo()
            || !singleFile,
          hidden: !menu.actions.isPossibleTo.pasteTo(),
        }}
        disabled={!menu.actions.isPossibleTo.pasteTo() || !singleFile}
        onmousedown={() => menu.actions.pasteTo()}
      >
        Paste To {!!singleFile && trimTo(singleFile.name, 12)}
      </button>
      <button
        class={{
          [ADW.Button.button]: true,
          hidden: !menu.actions.isPossibleTo.copy(),
        }}
        onmousedown={() => menu.actions.copy()}
      >
        Copy
      </button>
      <button
        class={{
          [ADW.Button.button]: true,
          hidden: !menu.actions.isPossibleTo.cut(),
        }}
        onmousedown={() => menu.actions.cut()}
      >
        Cut
      </button>
      <button
        class={{
          [ADW.Button.button]: true,
          hidden: !menu.actions.isPossibleTo.delete(),
        }}
        onmousedown={() => menu.actions.delete()}
      >
        Delete
      </button>
      <button
        class={{
          [ADW.Button.button]: true,
          hidden: !menu.actions.isPossibleTo.rename(),
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
  const menu = explorer.contextMenu;

  const canPaste = menu.actions.isPossibleTo.paste();

  return (
    <div class="dcontents">
      <button
        class={{
          [ADW.Button.button]: true,
          hidden: menu.actions.isPossibleTo.createFile(),
        }}
        onmousedown={() => menu.actions.createFile()}
      >
        New File
      </button>
      <button
        class={{
          [ADW.Button.button]: true,
          hidden: menu.actions.isPossibleTo.createDirectory(),
        }}
        onmousedown={() => menu.actions.createDirectory()}
      >
        New Directory
      </button>
      <button
        class={{
          [ADW.Button.button]: true,
          [ADW.Button.disabled]: !canPaste,
          hidden: !canPaste,
        }}
        disabled={!canPaste}
        onmousedown={() => menu.actions.paste()}
      >
        Paste Here
      </button>
    </div>
  );
}
