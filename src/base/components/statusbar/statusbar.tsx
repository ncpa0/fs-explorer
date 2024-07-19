import { ReadonlySignal, Signal } from "@ncpa0cpl/vanilla-jsx/signals";
import { Explorer } from "../../../explorer";
import { ADW } from "../../../utils/css";
import { Fmt } from "../../../utils/formatters";

export interface DirStat {
  filecount: string;
  dircount: string;
  size: string;
}

export interface StatusbarProps {
  explorer: Explorer;
  selectedFilesStat: Signal<DirStat | undefined>;
}

export function Statusbar(props: StatusbarProps) {
  const { explorer, selectedFilesStat } = props;

  const dirStat = explorer.currentDir.derive((files): DirStat => {
    files = files.filter(f => !f.hidden);
    const nonDirs = files.filter(f => !f.directory);
    const totalSize = nonDirs.reduce(
      (totalSize, f) => totalSize + f.size,
      0,
    );
    return {
      size: Fmt.size(totalSize),
      filecount: String(nonDirs.length),
      dircount: String(files.length - nonDirs.length),
    };
  });

  return (
    <div class="statusbar">
      <DirStat stat={dirStat} />
      <DirStat prefix="Selection:" stat={selectedFilesStat} />
    </div>
  );
}

function DirStat(props: {
  prefix?: string;
  stat: ReadonlySignal<DirStat | undefined>;
}) {
  const { stat, prefix } = props;

  return (
    <span class={[ADW.Typography.text, "stats"]}>
      {stat.derive(s => {
        if (!s) return "";

        let text = "";
        if (prefix) {
          text += `${prefix} `;
        }

        if (s.dircount !== "0") {
          text += `${s.dircount} dir(s)`;
          if (s.filecount !== "0") {
            text += " | ";
          }
        }
        if (s.filecount !== "0") {
          text += `${s.filecount} file(s)`;
        }
        text += `: ${s.size} total size`;
        return text;
      })}
    </span>
  );
}
