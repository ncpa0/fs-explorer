import { ReadonlySignal, sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Typography } from "adwavecss";
import { Explorer } from "../../../explorer";
import { FStat } from "../../../filesystem-interface";
import { Fmt } from "../../../utils/formatters";
import { getFileIcon } from "../../../utils/get-file-icon";
import { TabController } from "../../tab-controller";
import { useFileEntry } from "./file-entry-common";
import { LIST_COLUMNS, ListColumn } from "./list-columns";
import { fileTypeLabel } from "./sort-files";

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
  const { explorer } = props;
  const entry = useFileEntry(props);
  const { file } = entry;
  const { dateTimeFormat, showDirSizes } = explorer.userSettings;

  const renderCell = (col: ListColumn, f: FStat): unknown => {
    switch (col.id) {
      case "size": {
        const dirSizeRefresh = sig(0);
        return sig.derive(showDirSizes, dirSizeRefresh, (showDirSize) => {
          let text = "";
          if (!f.directory) {
            text = Fmt.size(f.size);
          } else if (showDirSize && explorer.filesystem.dirSize) {
            const cached = explorer.cache.getDirSize(f.path);
            if (cached != null) {
              text = Fmt.size(cached);
            } else {
              explorer.cache
                .fetchDirSize(
                  f.path,
                  () => explorer.filesystem.dirSize!(f.path),
                )
                .then(() => dirSizeRefresh.dispatch(v => v + 1))
                // failed fetches leave the cell blank instead of caching a value
                .catch(() => {});
            }
          }
          return (
            <div class={col.cellClass}>
              <span class={Typography.text}>{text}</span>
            </div>
          );
        });
      }
      case "type":
        return (
          <div class={col.cellClass}>
            <span class={Typography.text}>{fileTypeLabel(f)}</span>
          </div>
        );
      case "modified":
        return sig.derive(
          dateTimeFormat,
          (format) => (
            <div class={col.cellClass}>
              <span class={Typography.text}>{Fmt.date(f.mtime, format)}</span>
            </div>
          ),
        );
    }
  };

  return (
    <div
      class={{
        "file-entry": true,
        "active-entry": entry.isActiveEntry,
        selected: entry.isSelected,
        "file-cut": entry.isFileCut,
      }}
      onmouseup={entry.handleMouseUp}
      onmousedown={entry.handleMouseDown}
      onmouseleave={entry.handleMouseLeave}
      oncontextmenu={entry.handleContextMenu}
    >
      <div class={{ "file-icon": true, directory: file.$prop("directory") }}>
        {file
          .derive(file => getFileIcon(file))
          .derive(Svg => <Svg />)}
      </div>
      <div class="filename">
        <span class={Typography.text}>{file.$prop("name")}</span>
      </div>
      {LIST_COLUMNS.map(col =>
        sig.derive(file, col.visibility(explorer), (f, show) =>
          show ? renderCell(col, f) : null)
      )}
    </div>
  );
}
