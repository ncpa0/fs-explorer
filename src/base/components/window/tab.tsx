import { Typography } from "adwavecss";
import CloseIcon from "../../../assets/main-theme/icons/close.svg";
import { Explorer } from "../../../explorer";
import { Path } from "../../../utils/path";
import { TabController } from "../../tab-controller";
import { DirView } from "../dir-view/dir-view";

export type TabProps = {
  explorer: Explorer;
  tab: TabController;
};

export function Tab({ explorer, tab }: TabProps) {
  const handleHeaderMouseUp = (e: MouseEvent) => {
    if (!explorer.drag.isDragging()) return;
    const files = explorer.drag.getDraggedFiles();
    explorer.drag.endDrag();

    if (!files || files.length === 0) return;

    const moveTo = tab.directory.stat.get();
    if (moveTo) {
      const currentFileLocation = Path.from(files.at(0)!.path).base();
      if (currentFileLocation.equals(moveTo.path)) {
        return;
      }
      explorer.fs.move(files, moveTo.path);
    }
  };

  return (
    <div
      class={{
        "explorer-tab": true,
        active: explorer.activeTab.derive(id => id === tab.id),
      }}
      onmousedown={() => {
        explorer.focusTab(tab.id);
      }}
    >
      <div class="explorer-tab-header" onmouseup={handleHeaderMouseUp}>
        <span class={Typography.subtitle}>
          {tab.location.signal.derive(l => l.toString())}
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
