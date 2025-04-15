import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Typography } from "adwavecss";
import { Explorer } from "../../../explorer";
import { isLmb } from "../../../utils/events";
import { Path } from "../../../utils/path";
import { TabController } from "../../tab-controller";
import { LoadingIndicator } from "../_common/loader";
import { VirtualFileList } from "./virtual-file-list";

export type DirViewProps = {
  explorer: Explorer;
  tab: TabController;
};

export function DirView(props: DirViewProps) {
  const { explorer, tab } = props;
  const menu = explorer.contextMenu;
  const dir = tab.directory;

  const dragEnterCount = sig(0);

  const handleContextMenu = (event: MouseEvent) => {
    const windowRect = props.explorer.window!.getBoundingClientRect();
    const left = event.clientX - windowRect.left;
    const top = event.clientY - windowRect.top;
    const bottom = windowRect.height - top;

    const halfPoint = windowRect.height / 2;
    const isBelowHalf = top > halfPoint;

    const selected = dir.selection.get();
    menu.open({
      relatedFiles: selected,
      position: {
        left: `min(${left}px, calc(${windowRect.width}px - 13em))`,
        top: isBelowHalf ? undefined : `${top}px`,
        bottom: isBelowHalf ? `${bottom}px` : undefined,
      },
    });
    event.preventDefault();
    event.stopPropagation();
  };

  const handleClick = (event: MouseEvent) => {
    if (isLmb(event)) {
      dir.activeEntry.dispatch(null);
      return;
    }
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const { fileDropHandler } = explorer.options;
    const dirstat = dir.stat.get();
    if (event.dataTransfer && fileDropHandler && dirstat) {
      fileDropHandler(event.dataTransfer, dirstat);
    }

    dragEnterCount.dispatch(0);
  };

  const handleDragEnter = () => {
    dragEnterCount.dispatch(c => c + 1);
  };

  const handleDragLeave = () => {
    dragEnterCount.dispatch(c => c - 1);
  };

  const handleMouseUp = (event: MouseEvent) => {
    if (!explorer.drag.isDragging()) {
      return;
    }

    const files = explorer.drag.getDraggedFiles();
    explorer.drag.endDrag();

    if (!files || !files.length) {
      return;
    }

    const moveTo = tab.directory.stat.get();
    if (moveTo) {
      const currentFileLocation = Path.from(files.at(0)!.path).base();
      if (currentFileLocation.equals(moveTo.path)) {
        return;
      }
      explorer.fs.move(files, moveTo.path);
    }
  };

  return (
    <div
      class={{
        "dir-view-container": true,
        "file-drag-over": sig.when(dragEnterCount, true, false),
      }}
      onmousedown={handleClick}
      oncontextmenu={handleContextMenu}
      ondrop={handleDrop}
      ondragover={e => e.preventDefault()}
      ondragenter={handleDragEnter}
      ondragleave={handleDragLeave}
      onmouseup={handleMouseUp}
    >
      {sig.derive(dir.loading, dir.error, (loading, err) => {
        if (loading) {
          return <LoadingIndicator />;
        } else if (err) {
          return <OpenDirErrorMessage />;
        } else {
          return (
            <VirtualFileList
              explorer={explorer}
              tab={tab}
            />
          );
        }
      })}
      <div class="dir-view-drop-overlay" />
    </div>
  );
}

function OpenDirErrorMessage() {
  return (
    <div class="error-dir-msg">
      <span class={[Typography.subtitle]}>
        Unable to open this directory.
      </span>
    </div>
  );
}
