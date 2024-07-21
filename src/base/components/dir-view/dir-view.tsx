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
import { ExplorerLocation } from "../../history";
import { DirStat } from "../statusbar/statusbar";
import { sortFiles, SortMode } from "./sort-files";

export type DirViewProps = {
  explorer: Explorer;
  selectedFilesStat: Signal<DirStat | undefined>;
};

export function DirView(props: DirViewProps) {
  const { explorer, selectedFilesStat } = props;
  const files = explorer.currentDir;
  const previewOpen = explorer.preview;

  const selectedFiles = sig<FStat[]>([]);
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

  visibleFiles.add((visible) => {
    const selected = selectedFiles.get();
    const visibleSelected: FStat[] = [];
    for (let i = 0; i < selected.length; i++) {
      const sfile = selected[i]!;
      const isVisible = visible.some(f => f.path === sfile.path);
      if (isVisible) {
        visibleSelected.push(sfile);
      }
    }
    if (visibleSelected.length !== selected.length) {
      selectedFiles.dispatch(visibleSelected);
    }
  });

  explorer.onEscapePress(() => {
    selectedFiles.dispatch([]);
  });

  ExplorerLocation.signal(explorer.location).add(() => {
    selectedFiles.dispatch([]);
  });

  selectedFiles.add((selected) => {
    if (selected.length === 0) {
      selectedFilesStat.dispatch(undefined);
      return;
    }
    const nonDirs = selected.filter(f => !f.directory);
    const sizeTotal = nonDirs.reduce((acc, f) => acc + f.size, 0);
    selectedFilesStat.dispatch({
      size: Fmt.size(sizeTotal),
      filecount: String(nonDirs.length),
      dircount: String(selected.length - nonDirs.length),
    });
  });

  const handleClick = (event: MouseEvent) => {
    if (isRmb(event)) {
      const windowRect = props.explorer.window!.getBoundingClientRect();
      const left = event.clientX - windowRect.left;
      const top = event.clientY - windowRect.top;
      const bottom = windowRect.height - top;

      const halfPoint = windowRect.height / 2;
      const isBelowHalf = top > halfPoint;

      const selected = selectedFiles.get();
      props.explorer.contextMenu.dispatch({
        open: true,
        file: selected.length > 0 ? selected : undefined,
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
        <Gap />
        <Range data={visibleFiles} into={<div class="dcontents" />}>
          {(file) => (
            <FileEntry
              explorer={props.explorer}
              selectedFiles={selectedFiles}
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

function FileEntry(
  props: { explorer: Explorer; file: FStat; selectedFiles: Signal<FStat[]> },
) {
  const { explorer, file, selectedFiles } = props;

  const isSelected = selectedFiles.derive(selected =>
    selected.some(f => f.path === file.path)
  );

  const toggleSelect = () => {
    const fpath = file.path;
    selectedFiles.dispatch(selected => {
      const idx = selected.findIndex(f => f.path === fpath);
      if (idx === -1) {
        return [...selected, file];
      }
      const copy = selected.slice();
      copy.splice(idx, 1);
      return copy;
    });
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
      explorer.contextMenu.dispatch({
        open: true,
        file: selected.length ? selected : [file],
        left: left,
        top: isBelowHalf ? undefined : top,
        bottom: isBelowHalf ? bottom : undefined,
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
      const action = explorer.options?.openAction?.(file.path);
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
