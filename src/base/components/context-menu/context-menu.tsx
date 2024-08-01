import { ReadonlySignal, sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Explorer } from "../../../explorer";
import { FStat } from "../../../filesystem-interface";
import { ADW } from "../../../utils/css";
import { isLmb } from "../../../utils/events";
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
        {sig.derive(
          menu.isOpen,
          menu.selectedFiles,
          menu.triggerFile,
          (open, files, target) => {
            if (!open) {
              return <span />;
            }

            if (files.length > 0) {
              return (
                <FileMenuButtons
                  explorer={props.explorer}
                  files={files}
                />
              );
            }

            if (target) {
              return (
                <FileMenuButtons
                  explorer={props.explorer}
                  files={[target]}
                />
              );
            }

            return (
              <DirMenuButtons
                explorer={props.explorer}
              />
            );
          },
        )}
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
      <MenuButton
        hidden={!menu.actions.isPossibleTo.open()}
        action={() => menu.actions.open()}
        title="Open"
      />
      <MenuButton
        hidden={!menu.actions.isPossibleTo.createFile()}
        action={() => menu.actions.createFile()}
        title="New File"
      />
      <MenuButton
        hidden={!menu.actions.isPossibleTo.createDirectory()}
        action={() => menu.actions.createDirectory()}
        title="New Directory"
      />
      {customActions.derive(customActions => {
        if (customActions.length === 0) {
          return <span />;
        }

        return (
          <>
            <MenuButton
              action={() => {}}
              title="Action >"
            />
            <div class="custom-ctions">
              {customActions.map(action => {
                const handler = () => {
                  menu.close();
                  action.run(singleFile!);
                };
                return (
                  <MenuButton
                    action={handler}
                    title={action.label}
                  />
                );
              })}
            </div>
          </>
        );
      })}
      <MenuButton
        hidden={!canPaste}
        disabled={!canPaste}
        action={() => menu.actions.paste()}
        title={"Paste Here"}
      />
      <MenuButton
        hidden={!menu.actions.isPossibleTo.pasteTo()}
        disabled={!menu.actions.isPossibleTo.pasteTo() || !singleFile}
        action={() => menu.actions.pasteTo()}
        title={`Paste To ${!!singleFile && trimTo(singleFile.name, 12)}`}
      />
      <MenuButton
        hidden={!menu.actions.isPossibleTo.copy()}
        action={() => menu.actions.copy()}
        title="Copy"
      />
      <MenuButton
        hidden={!menu.actions.isPossibleTo.cut()}
        action={() => menu.actions.cut()}
        title="Cut"
      />
      <MenuButton
        hidden={!menu.actions.isPossibleTo.delete()}
        action={() => menu.actions.delete()}
        title="Delete"
      />
      <MenuButton
        hidden={!menu.actions.isPossibleTo.rename()}
        action={() => menu.actions.rename()}
        title="Rename"
      />
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

function MenuButton(
  props: {
    action(ev: MouseEvent): void;
    hidden?: boolean | ReadonlySignal<boolean>;
    disabled?: boolean | ReadonlySignal<boolean>;
    title: string | ReadonlySignal<string>;
  },
) {
  return (
    <button
      class={{
        [ADW.Button.button]: true,
        [ADW.Button.flat]: true,
        [ADW.Button.adaptive]: true,
        [ADW.Button.disabled]: props.disabled,
        hidden: props.hidden,
      }}
      onmousedown={(event) => {
        if (isLmb(event)) {
          props.action(event);
        }
      }}
      disabled={props.disabled}
    >
      {props.title}
    </button>
  );
}
