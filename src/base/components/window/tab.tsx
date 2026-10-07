import { Typography } from "adwavecss";
import CloseIcon from "../../../assets/main-theme/icons/close.svg";
import { Explorer } from "../../../explorer";
import { Path } from "../../../utils/path";
import { useFileDrop } from "../../../utils/use-file-drop";
import { TabController } from "../../tab-controller";
import { TabGroup } from "../../tab-group";
import { DirView } from "../dir-view/dir-view";

export type TabProps = {
  explorer: Explorer;
  group: TabGroup;
  tab: TabController;
};

export function Tab({ explorer, tab, group }: TabProps) {
  const { onmouseup, onmouseenter, onmouseleave, targetClassName } =
    useFileDrop(
      explorer,
      () => tab.directory.stat.get()?.path,
      tab.directory,
    );

  const handleSegmentClick = (path: Path, segmentIdx: number) => () => {
    const newPath = path.slice(segmentIdx + 1);
    if (newPath.equals(path)) return;
    tab.history.push(newPath);
  };

  return (
    <div
      class={{
        "explorer-tab": true,
        active: group.activeTabID.derive(id => id === tab.id),
      }}
      onmousedown={() => {
        group.focusTab(tab.id);
      }}
    >
      <div
        class={["explorer-tab-header", targetClassName]}
        onmouseup={onmouseup}
        onmouseenter={onmouseenter}
        onmouseleave={onmouseleave}
      >
        <span class={Typography.subtitle} dir="rtl">
          <span class="invs_placeholder">i</span>
          {tab.location.signal.derive(l => {
            const segments = l.segments();
            return segments.flatMap((segment, idx) => {
              return [
                <span class="path-separator">{"/"}</span>,
                <span
                  class="tab-location-segment"
                  onclick={handleSegmentClick(l, idx)}
                >
                  {segment}
                </span>,
              ];
            });
          })}
        </span>
        <button
          onclick={(e) => {
            explorer.closeTab(tab.id);
            e.stopPropagation();
          }}
          class="close-tab-button btn square flat"
        >
          <CloseIcon />
        </button>
      </div>
      <DirView tab={tab} explorer={explorer} />
    </div>
  );
}
