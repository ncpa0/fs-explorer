import { Range } from "@ncpa0cpl/vanilla-jsx";
import { ReadonlySignal, sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Typography } from "adwavecss";
import { Explorer } from "../../../explorer";
import { FStat } from "../../../filesystem-interface";
import { FileActionContext } from "../../../interfaces/file-action";
import { ADW } from "../../../utils/css";
import { isLmb, isRmb } from "../../../utils/events";
import { Fmt } from "../../../utils/formatters";
import { getFileIcon } from "../../../utils/get-file-icon";
import { Path } from "../../../utils/path";
import { DirViewController } from "../../dir-view-controller";
import { SortMode } from "./sort-files";

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
          left: left,
          top: isBelowHalf ? undefined : top,
          bottom: isBelowHalf ? bottom : undefined,
        },
      });
      event.stopPropagation();
      event.preventDefault();
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
      <div
        class={{
          [ADW.Box.box]: true,
          [ADW.Box.bg2]: true,
          "dir-view": true,
          "empty": dir.filesView.derive(files => files.length === 0),
        }}
      >
        {dir.filesView.derive(files => {
          if (files.length === 0) {
            return (
              <div class="empty-dir-msg">
                <span class={[Typography.subtitle]}>
                  This directory is empty.
                </span>
              </div>
            );
          }

          return <FileViewHeader sorting={dir.sorting} dir={dir} />;
        })}
        <Gap />
        <Range data={dir.filesView} into={<div class="dcontents" />}>
          {(file) => (
            <FileEntry
              explorer={props.explorer}
              selectedFiles={dir.selection}
              file={file}
            />
          )}
        </Range>
        <Gap />
      </div>
    </div>
  );
}

function Gap() {
  return (
    <>
      <div class="gaper" />
      <div class="gaper" />
      <div class="gaper" />
      <div class="gaper" />
    </>
  );
}

function FileViewHeader(props: {
  sorting: ReadonlySignal<{ mode: SortMode; reverse: boolean }>;
  dir: DirViewController;
}) {
  const handleNameClick = () => {
    props.dir.toggleSorting("name");
  };

  const handleSizeClick = () => {
    props.dir.toggleSorting("size");
  };

  const handleDateClick = () => {
    props.dir.toggleSorting("date");
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

function FileEntry(
  props: {
    explorer: Explorer;
    file: FStat;
    selectedFiles: ReadonlySignal<readonly FStat[]>;
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
          left: left,
          top: isBelowHalf ? undefined : top,
          bottom: isBelowHalf ? bottom : undefined,
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
    event.stopPropagation();
  };

  const Icon = getFileIcon(file);

  return (
    <div
      class={{
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
        <span class={[Typography.text]}>{file.name}</span>
      </div>
      <div class="file-size">
        <span class={[Typography.text]}>{Fmt.size(file.size)}</span>
      </div>
      <div class="file-modified">
        <span class={[Typography.text]}>{Fmt.date(file.mtime)}</span>
      </div>
    </div>
  );
}
