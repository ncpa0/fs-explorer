import { ReadonlySignal } from "@ncpa0cpl/vanilla-jsx/signals";
import { Typography } from "adwavecss";
import { Explorer } from "../../../explorer";
import { FStat } from "../../../filesystem-interface";
import { FileActionContext } from "../../../interfaces/file-action";
import { isLmb } from "../../../utils/events";
import { Fmt } from "../../../utils/formatters";
import { getFileIcon } from "../../../utils/get-file-icon";
import { Path } from "../../../utils/path";
import { TabController } from "../../tab-controller";

export function FileListEntry(
  props: {
    explorer: Explorer;
    tab: TabController;
    file: FStat;
    selectedFiles: ReadonlySignal<readonly FStat[]>;
    activeEntry: ReadonlySignal<FStat | null>;
    setActiveEntry: (entry: FStat | null) => void;
  },
) {
  const { explorer, tab, file, selectedFiles } = props;
  const dir = tab.directory;
  const menu = explorer.contextMenu;
  let isPressed = false;

  const isSelected = selectedFiles.derive(selected =>
    selected.some(f => f.path === file.path)
  );

  const toggleSelect = () => {
    dir.toggleSelectFile(file);
  };

  const handleInternalDrop = () => {
    if (!file.directory) return;

    const files = explorer.drag.getDraggedFiles();
    explorer.drag.endDrag();

    if (!files || !files.length) return;
    explorer.fs.move(files, file.path);
  };

  const handleContextMenu = (event: MouseEvent) => {
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
  };

  const handleMouseUp = (event: MouseEvent) => {
    explorer.focusTab(
      tab.id,
    );
    if (!isPressed) {
      if (explorer.drag.isDragging()) {
        handleInternalDrop();
      }
      return;
    }
    isPressed = false;

    if (isLmb(event, "ctrl")) {
      toggleSelect();
      return;
    }

    if (!isLmb(event)) return;

    if (file.directory) {
      const path = new Path(file.path);
      tab.open(path);
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

  const handleMouseDown = (event: MouseEvent) => {
    if (isLmb(event, "any")) {
      isPressed = true;
    }
  };

  const handleMouseLeave = () => {
    if (isPressed) {
      const selected = selectedFiles.get();
      explorer.drag.startDrag(selected.length != 0 ? selected : [file]);
    }
    isPressed = false;
  };

  const Icon = getFileIcon(file);

  const element = (
    <div
      class={{
        "active-entry": props.activeEntry.derive(ae => ae === file),
        "file-entry": true,
        selected: isSelected,
        "file-cut": explorer.clipboard.data.derive(data => {
          if (data.files.length === 0 || data.mode === "copy") return false;
          return data.files.some(f => f.path === file.path);
        }),
      }}
      onmouseup={handleMouseUp}
      onmousedown={handleMouseDown}
      onmouseleave={handleMouseLeave}
      oncontextmenu={handleContextMenu}
    >
      <div class={{ "file-icon": true, directory: file.directory }}>
        <Icon />
      </div>
      <div class="filename">
        <span class={Typography.text}>{file.name}</span>
      </div>
      <div class="file-size">
        <span class={Typography.text}>
          {file.directory ? "" : Fmt.size(file.size)}
        </span>
      </div>
      <div class="file-modified">
        <span class={Typography.text}>{Fmt.date(file.mtime)}</span>
      </div>
    </div>
  );

  return element;
}
