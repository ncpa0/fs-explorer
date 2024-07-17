import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Explorer } from "../../..";
import { FileActionContext } from "../../../interfaces/file-action";
import { ACSS } from "../../../utils/css";

export type ContextMenuProps = {
  explorer: Explorer;
};

export function ContextMenu(props: ContextMenuProps) {
  const data = props.explorer.contextMenu;
  const posX = sig.literal`${data.derive(d => d.posX)}px`;
  const posY = sig.literal`${data.derive(d => d.posY)}px`;

  return (
    <div
      class={"context-menu"}
      style={{
        top: posY,
        left: posX,
      }}
    >
      {data.derive(({ file }) => {
        if (!file) {
          return <span />;
        }

        const contents: Element[] = [];

        const open = props.explorer.options?.openAction?.(file.path);
        if (open) {
          const handleClick = () => {
            const ctx = new FileActionContext(
              props.explorer,
              file,
            );
            open(file, ctx);
          };

          contents.push(
            <button
              class={ACSS.Button.button}
              onmousedown={handleClick}
            >
              Open
            </button>,
          );
        }

        const customActions = props.explorer.options?.actions?.filter(a =>
          a.match.test(file.path)
        ) ?? [];

        if (customActions.length) {
          const customActionsBtns = (
            <div class="custom-ctions">
              {customActions.map(action => {
                const handler = () => {
                  action.run(file);
                };
                return (
                  <button
                    class={ACSS.Button.button}
                    onmousedown={handler}
                  >
                    {action.label}
                  </button>
                );
              })}
            </div>
          );

          contents.push(
            <button
              class={ACSS.Button.button}
              onmousedown={() => {}}
            >
              {"Actions >"}
            </button>,
          );
          contents.push(customActionsBtns);
        }

        contents.push(
          <button
            class={ACSS.Button.button}
            onmousedown={() => {}}
          >
            Copy
          </button>,
        );

        if (file.write) {
          contents.push(
            <button
              class={ACSS.Button.button}
              onmousedown={() => {}}
            >
              Cut
            </button>,
          );
          contents.push(
            <button
              class={ACSS.Button.button}
              onmousedown={() => {}}
            >
              Delete
            </button>,
          );
          contents.push(
            <button
              class={ACSS.Button.button}
              onmousedown={() => {}}
            >
              Rename
            </button>,
          );
        }
      })}
    </div>
  );
}
