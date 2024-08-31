import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Explorer } from "../../../explorer";
import { isLmb, isRmb } from "../../../utils/events";
import { LoadingIndicator } from "../_common/loader";
import { VirtualFileList } from "./virtual-file-list";

export type DirViewProps = {
  explorer: Explorer;
};

export function DirView(props: DirViewProps) {
  const { explorer } = props;
  const menu = explorer.contextMenu;
  const preview = explorer.previewPane;
  const dir = explorer.directory;

  const handleClick = (event: MouseEvent) => {
    if (isRmb(event)) {
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
      event.stopPropagation();
      event.preventDefault();
      return;
    }

    if (isLmb(event)) {
      dir.activeEntry.dispatch(null);
      return;
    }
  };

  const maxWidthSig = sig.literal`calc(100% - ${
    // 26.8em is the width with margin of the preview pane
    sig.when(preview.file, sig.as("26.8em"), sig.as("0em"))})`;

  return (
    <div
      class="dir-view-container"
      onmousedown={handleClick}
      oncontextmenu={e => e.preventDefault()}
      style={{
        maxWidth: maxWidthSig,
      }}
    >
      <LoadingIndicator visible={dir.loading} />
      <VirtualFileList
        explorer={props.explorer}
        selectedFiles={dir.selection}
        files={dir.filesView}
      />
    </div>
  );
}
