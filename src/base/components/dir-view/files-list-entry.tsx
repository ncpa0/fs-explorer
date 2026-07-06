import { ReadonlySignal, sig } from "@ncpa0cpl/vanilla-jsx/signals";
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
    file: ReadonlySignal<FStat>;
    selectedFiles: ReadonlySignal<readonly FStat[]>;
    activeEntry: ReadonlySignal<string | null>;
    setActiveEntry: (entry: string | null) => void;
  },
) {
  const { explorer, tab, file, selectedFiles } = props;
  const dir = tab.directory;
  const menu = explorer.contextMenu;
  let isPressed = false;

  const isSelected = sig.derive(
    selectedFiles,
    file,
    (selected, file) => selected.some(f => f.path === file.path),
  );

  const toggleSelect = () => {
    dir.toggleSelectFile(file.get());
  };

  const handleInternalDrop = () => {
    if (!file.get().directory) return;

    const files = explorer.drag.getDraggedFiles();
    explorer.drag.endDrag();

    if (!files || !files.length) return;
    explorer.fs.move(files, file.get().path);
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
      triggerFile: file.get(),
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

    if (file.get().directory) {
      const path = new Path(file.get().path);
      tab.open(path);
    } else {
      const actionCtx = new FileActionContext(
        explorer,
        file.get(),
      );
      const action = explorer.options?.openAction?.(file.get());
      if (action) {
        action(file.get(), actionCtx);
      } else if (explorer.noPreview.get() === false) {
        actionCtx.openPreview();
      }
    }

    props.setActiveEntry(file.get().path);

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
      explorer.drag.startDrag(selected.length != 0 ? selected : [file.get()]);
    }
    isPressed = false;
  };

  return (
    <div
      class={{
        "active-entry": sig.derive(props.activeEntry, file, (ae, file) =>
          ae && Path.equal(ae, file.path)),
        "file-entry": true,
        selected: isSelected,
        "file-cut": sig.derive(
          file,
          explorer.clipboard.data,
          (file, clipboard) => {
            if (clipboard.mode === "copy") {
              return false;
            }
            return clipboard.files.some(f =>
              Path.equal(f.path, file.path)
            );
          },
        ),
      }}
      onmouseup={handleMouseUp}
      onmousedown={handleMouseDown}
      onmouseleave={handleMouseLeave}
      oncontextmenu={handleContextMenu}
    >
      <div class={{ "file-icon": true, directory: file.$prop("directory") }}>
        {file
          .derive(file => getFileIcon(file))
          .derive(Svg => <Svg />)}
      </div>
      <div class="filename">
        <span class={Typography.text}>{file.$prop("name")}</span>
      </div>
      <div class="file-size">
        <span class={Typography.text}>
          {file.derive(file => file.directory ? "" : Fmt.size(file.size))}
        </span>
      </div>
      <div class="file-modified">
        <span class={Typography.text}>
          {file.derive(file => Fmt.date(file.mtime))}
        </span>
      </div>
    </div>
  );
}
