import { ReadonlySignal, sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Explorer } from "../../../explorer";
import { ADW } from "../../../utils/css";

export interface DirStat {
  filecount: string;
  dircount: string;
  size: string;
}

export interface StatusbarProps {
  explorer: Explorer;
}

export function Statusbar(props: StatusbarProps) {
  const { explorer } = props;

  return sig.derive(
    explorer.activeTabGroup,
    explorer.tabGroups,
    (tabID, groups) => {
      const g = groups.find(t => t.id === tabID) ?? groups[0]!;
      return g.activeTab.derive(tab => {
        const dir = tab.directory;
        return (
          <div class="statusbar">
            <DirStat stat={dir.directoryInfo} />
            <DirStat
              prefix="Selection:"
              stat={dir.directoryInfo.derive(info => info.selection)}
            />
          </div>
        );
      });
    },
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
