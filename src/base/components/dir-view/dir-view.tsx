import { Range } from "@ncpa0cpl/vanilla-jsx";
import { sig, Signal } from "@ncpa0cpl/vanilla-jsx/signals";
import { Typography } from "adwavecss";
import { Explorer } from "../../../explorer";
import { FStat } from "../../../filesystem-interface";
import { FileActionContext } from "../../../interfaces/file-action";
import { ADW } from "../../../utils/css";
import { isLmb, isRmb } from "../../../utils/events";
import { Fmt } from "../../../utils/formatters";
import { getFileIcon } from "../../../utils/get-file-icon";
import { Path } from "../../../utils/path";
import { sortFiles, SortMode } from "./sort-files";

export type DirViewProps = {
  explorer: Explorer;
};

export function DirView(props: DirViewProps) {
  const files = props.explorer.currentDir;
  const previewOpen = props.explorer.preview;

  const sorting = sig({ mode: SortMode.Alpha, reverse: false });

  const visibleFiles = sig.derive(
    files,
    sorting,
    (fs, sorting) =>
      sortFiles(
        fs.filter(f => !f.hidden),
        sorting.mode,
        sorting.reverse,
      ),
  );

  const handleClick = (event: MouseEvent) => {
    if (isRmb(event)) {
      const windowRect = props.explorer.window!.getBoundingClientRect();
      const left = event.clientX - windowRect.left;
      const top = event.clientY - windowRect.top;
      const bottom = windowRect.height - top;

      const halfPoint = windowRect.height / 2;
      const isBelowHalf = top > halfPoint;

      props.explorer.contextMenu.dispatch({
        open: true,
        left: left,
        top: isBelowHalf ? undefined : top,
        bottom: isBelowHalf ? bottom : undefined,
      });
      event.stopPropagation();
      event.preventDefault();
    }
  };

  const maxWidthSig = sig.literal`calc(100% - ${
    sig.when(previewOpen, sig.as("32em"), sig.as("16em"))
  })`;

  return (
    <div
      class="dir-view-container"
      onmousedown={handleClick}
      oncontextmenu={e => e.preventDefault()}
      style={{
        maxWidth: maxWidthSig,
      }}
    >
      <div
        class={{
          [ADW.Box.box]: true,
          [ADW.Box.bg2]: true,
          "dir-view": true,
          "empty": visibleFiles.derive(files => files.length === 0),
        }}
      >
        {visibleFiles.derive(visibleFiles => {
          if (visibleFiles.length === 0) {
            return (
              <div class="empty-dir-msg">
                <span class={[Typography.subtitle]}>
                  This directory is empty.
                </span>
              </div>
            );
          }

          return <FileViewHeader sorting={sorting} />;
        })}
        <Range data={visibleFiles} into={<div class="dcontents" />}>
          {(file) => <FileEntry explorer={props.explorer} file={file} />}
        </Range>
        <div class="gaper" />
      </div>
    </div>
  );
}

function FileViewHeader(props: {
  sorting: Signal<{ mode: SortMode; reverse: boolean }>;
}) {
  const handleNameClick = () => {
    props.sorting.dispatch(s => {
      if (s.mode === SortMode.Alpha) {
        return { mode: SortMode.Alpha, reverse: !s.reverse };
      }
      return { mode: SortMode.Alpha, reverse: false };
    });
  };

  const handleSizeClick = () => {
    props.sorting.dispatch(s => {
      if (s.mode === SortMode.Size) {
        return { mode: SortMode.Size, reverse: !s.reverse };
      }
      return { mode: SortMode.Size, reverse: false };
    });
  };

  const handleDateClick = () => {
    props.sorting.dispatch(s => {
      if (s.mode === SortMode.Date) {
        return { mode: SortMode.Date, reverse: !s.reverse };
      }
      return { mode: SortMode.Date, reverse: false };
    });
  };

  return (
    <div class="dcontents dirview-header">
      <span></span>
      <div
        class={["header-name", Typography.subtitle]}
        onmousedown={handleNameClick}
      >
        <span>Name</span>
      </div>
      <div
        class={["header-size", Typography.subtitle]}
        onmousedown={handleSizeClick}
      >
        <span>Size</span>
      </div>
      <div
        class={["header-date", Typography.subtitle]}
        onmousedown={handleDateClick}
      >
        <span>Date Modified</span>
      </div>
    </div>
  );
}

function FileEntry(props: { explorer: Explorer; file: FStat }) {
  const handleClick = (event: MouseEvent) => {
    if (isRmb(event)) {
      const windowRect = props.explorer.window!.getBoundingClientRect();
      const left = event.clientX - windowRect.left;
      const top = event.clientY - windowRect.top;
      const bottom = windowRect.height - top;

      const halfPoint = windowRect.height / 2;
      const isBelowHalf = top > halfPoint;

      props.explorer.contextMenu.dispatch({
        open: true,
        file: props.file,
        left: left,
        top: isBelowHalf ? undefined : top,
        bottom: isBelowHalf ? bottom : undefined,
      });
      event.stopPropagation();
      event.preventDefault();
      return;
    }

    if (!isLmb(event)) return;

    if (props.file.directory) {
      const path = new Path(props.file.path);
      props.explorer.open(path);
    } else {
      const actionCtx = new FileActionContext(
        props.explorer,
        props.file,
      );
      const action = props.explorer.options?.openAction?.(props.file.path);
      if (action) {
        action(props.file, actionCtx);
      } else {
        actionCtx.openPreview();
      }
    }
    event.stopPropagation();
  };

  const Icon = getFileIcon(props.file);

  return (
    <div
      class={["file-entry"]}
      onmousedown={handleClick}
      oncontextmenu={e => e.preventDefault()}
    >
      <div class={{ "file-icon": true, directory: props.file.directory }}>
        <Icon />
      </div>
      <div class="filename">
        <span class={[Typography.text]}>{props.file.name}</span>
      </div>
      <div class="file-size">
        <span class={[Typography.text]}>{Fmt.size(props.file.size)}</span>
      </div>
      <div class="file-modified">
        <span class={[Typography.text]}>{Fmt.date(props.file.mtime)}</span>
      </div>
    </div>
  );
}
