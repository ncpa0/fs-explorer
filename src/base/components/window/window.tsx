import { Range } from "@ncpa0cpl/vanilla-jsx";
import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Explorer } from "../../../explorer";
import { ADW } from "../../../utils/css";
import { TabController } from "../../tab-controller";
import { TabGroup } from "../../tab-group";
import { DirView } from "../dir-view/dir-view";
import { LeftPane } from "../left-pane/left-pane";
import { LocationBar } from "../location-bar/location-bar";
import { Overlay } from "../overlay/overlay";
import { PreviewPane } from "../preview-pane/preview-pane";
import { Statusbar } from "../statusbar/statusbar";
import { TabsBar } from "../tabs-bar/tabs-bar";
import { Tab } from "./tab";

export type ExplorerWindowProps = {
  explorer: Explorer;
};

export function ExplorerWindow(props: ExplorerWindowProps) {
  const { explorer } = props;

  const mainViewMaxWidth = explorer.hideLeftPane.derive(hide => {
    return hide ? "100%" : "calc(100% - 16em)";
  });

  const tabBarHiddden = explorer.tabGroups.derive(g => g.length <= 1);

  return (
    <div
      class={{
        [ADW.Box.box]: true,
        "explorer-window": true,
        "drag-pointer": explorer.drag.dragging,
        "tab-bar-hidden": tabBarHiddden,
      }}
      onmouseleave={() => explorer.drag.mouseLeave()}
      onmouseup={() => explorer.drag.endDrag()}
    >
      <div class={[ADW.Box.className({ bg: 2 }), "explorer-content"]}>
        <LeftPane explorer={explorer} />
        <div class="main-view-container" style={{ maxWidth: mainViewMaxWidth }}>
          <LocationBar explorer={explorer} />
          <TabsBar explorer={explorer} hidden={tabBarHiddden} />
          {explorer.tabGroups.$map(g => (
            <TabGroupView group={g} explorer={explorer} />
          ))}
        </div>
      </div>
      {Statusbar({ explorer })}
      <Overlay explorer={explorer} />
    </div>
  );
}

function TabGroupView(props: {
  group: TabGroup;
  explorer: Explorer;
}) {
  const { group, explorer } = props;
  const { tabs } = group;

  const viewMode = tabs.derive(t => t.length === 1 ? "single" : "multi");

  const isActiveGroup = sig.eq(explorer.activeTabGroup, group.id);

  return (
    <div
      class={{
        "tab-group-view": true,
        "active-group": isActiveGroup,
      }}
    >
      {viewMode.derive(mode => {
        if (mode === "single") {
          return (
            <div class="dir-view-wrapper">
              <DirView tab={tabs.get()[0]!} explorer={explorer} />
              <PreviewPane explorer={explorer} />
            </div>
          );
        } else {
          return (
            <div class="explorer-tabs-container">
              <Range<TabController>
                data={tabs}
                into={<div class="dcontents" />}
              >
                {tab => <Tab explorer={explorer} group={group} tab={tab} />}
              </Range>
              <PreviewPane explorer={explorer} />
            </div>
          );
        }
      })}
    </div>
  );
}
