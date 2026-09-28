import { ReadonlySignal } from "@ncpa0cpl/vanilla-jsx/signals";
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
  const entry = useFileEntry(props);
  const { file } = entry;

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
