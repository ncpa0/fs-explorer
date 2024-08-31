import { ReadonlySignal } from "@ncpa0cpl/vanilla-jsx/signals";
import { Typography } from "adwavecss";
import { Explorer } from "../../../explorer";
import { FStat } from "../../../filesystem-interface";
import { FileActionContext } from "../../../interfaces/file-action";
import { isLmb, isRmb } from "../../../utils/events";
import { Fmt } from "../../../utils/formatters";
import { getFileIcon } from "../../../utils/get-file-icon";
import { Path } from "../../../utils/path";

export function FileListEntry(
  props: {
    explorer: Explorer;
    file: FStat;
    selectedFiles: ReadonlySignal<readonly FStat[]>;
    activeEntry: ReadonlySignal<FStat | null>;
    setActiveEntry: (entry: FStat | null) => void;
  },
) {
  const { explorer, file, selectedFiles } = props;
  const dir = explorer.directory;
  const menu = explorer.contextMenu;

  const isSelected = selectedFiles.derive(selected =>
    selected.some(f => f.path === file.path)
  );

  const toggleSelect = () => {
    dir.toggleSelectFile(file);
  };

  const handleClick = (event: MouseEvent) => {
    if (isLmb(event, "ctrl")) {
      toggleSelect();
      return;
    }

    if (isRmb(event)) {
      const windowRect = explorer.window!.getBoundingClientRect();
      const left = event.clientX - windowRect.left;
      const top = event.clientY - windowRect.top;
      const bottom = windowRect.height - top;

      const halfPoint = windowRect.height / 2;
      const isBelowHalf = top > halfPoint;

      const selected = selectedFiles.get();
      menu.open({
        triggerFile: file,
        relatedFiles: selected,
        position: {
          left: `min(${left}px, calc(${windowRect.width}px - 13em))`,
          top: isBelowHalf ? undefined : `${top}px`,
          bottom: isBelowHalf ? `${bottom}px` : undefined,
        },
      });
      event.stopPropagation();
      event.preventDefault();
      return;
    }

    if (!isLmb(event)) return;

    if (file.directory) {
      const path = new Path(file.path);
      explorer.open(path);
    } else {
      const actionCtx = new FileActionContext(
        explorer,
        file,
      );
      const action = explorer.options?.openAction?.(file);
      if (action) {
        action(file, actionCtx);
      } else {
        actionCtx.openPreview();
      }
    }

    props.setActiveEntry(file);

    event.stopPropagation();
  };

  const Icon = getFileIcon(file);

  const element = (
    <div
      class={{
        "active-entry": props.activeEntry.derive(ae => ae === file),
        "file-entry": true,
        selected: isSelected,
      }}
      onmousedown={handleClick}
      oncontextmenu={e => e.preventDefault()}
    >
      <div class={{ "file-icon": true, directory: file.directory }}>
        <Icon />
      </div>
      <div class="filename">
        <span class={Typography.text}>{file.name}</span>
      </div>
      <div class="file-size">
        <span class={Typography.text}>{Fmt.size(file.size)}</span>
      </div>
      <div class="file-modified">
        <span class={Typography.text}>{Fmt.date(file.mtime)}</span>
      </div>
    </div>
  );

  return element;
}
