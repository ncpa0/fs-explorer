import { ReadonlySignal, sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Typography } from "adwavecss";
import { Explorer } from "../../../explorer";
import { FStat } from "../../../filesystem-interface";
import { Fmt } from "../../../utils/formatters";
import { getFileIcon } from "../../../utils/get-file-icon";
import { TabController } from "../../tab-controller";
import { useFileEntry } from "./file-entry-common";

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

  const dirSizeRefresh = sig(0);

  const sizeText = sig.derive(
    file,
    showDirSizes,
    dirSizeRefresh,
    (f, showDirSize) => {
      if (!f.directory) {
        return Fmt.size(f.size);
      }
      if (!showDirSize || !explorer.filesystem.dirSize) {
        return "";
      }
      const cached = explorer.cache.getDirSize(f.path);
      if (cached != null) {
        return Fmt.size(cached);
      }
      explorer.cache
        .fetchDirSize(f.path, () => explorer.filesystem.dirSize!(f.path))
        .then(() => dirSizeRefresh.dispatch(v => v + 1))
        // failed fetches leave the cell blank instead of caching a value
        .catch(() => {});
      return "";
    },
  );

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
      <div class="file-size">
        <span class={Typography.text}>
          {sizeText}
        </span>
      </div>
      <div class="file-modified">
        <span class={Typography.text}>
          {sig.derive(
            file,
            dateTimeFormat,
            (f, format) => Fmt.date(f.mtime, format),
          )}
        </span>
      </div>
    </div>
  );
}
