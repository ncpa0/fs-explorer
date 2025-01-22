import { Range } from "@ncpa0cpl/vanilla-jsx";
import { Typography } from "adwavecss";
import CloseIcon from "../../../assets/main-theme/icons/close.svg";
import { Explorer } from "../../../explorer";
import { ADW } from "../../../utils/css";
import { TabController } from "../../tab-controller";
import { ContextMenu } from "../context-menu/context-menu";
import { DirView } from "../dir-view/dir-view";
import { LeftPane } from "../left-pane/left-pane";
import { LocationBar } from "../location-bar/location-bar";
import { Overlay } from "../overlay/overlay";
import { PreviewPane } from "../preview-pane/preview-pane";
import { Statusbar } from "../statusbar/statusbar";
import { Tab } from "./tab";

export type ExplorerWindowProps = {
  explorer: Explorer;
};

export function ExplorerWindow(props: ExplorerWindowProps) {
  const { explorer } = props;

  const mainViewMaxWidth = explorer.hideLeftPane.derive(hide => {
    return hide ? "100%" : "calc(100% - 16em)";
  });

  const viewMode = explorer.tabs.derive(t =>
    t.length === 1 ? "single" : "multi"
  );

  return (
    <div
      class={{
        [ADW.Box.box]: true,
        "explorer-window": true,
        "drag-pointer": explorer.drag.isDragging(),
      }}
      onmouseleave={() => explorer.drag.endDrag()}
      onmouseup={() => explorer.drag.endDrag()}
    >
      <div class={[ADW.Box.className({ bg: 2 }), "explorer-content"]}>
        <LeftPane explorer={explorer} />
        <div class="main-view-container" style={{ maxWidth: mainViewMaxWidth }}>
          {LocationBar({ explorer })}
          {viewMode.derive(mode => {
            if (mode === "single") {
              return (
                <div class="dir-view-wrapper">
                  <DirView tab={explorer.tabs.get()[0]!} explorer={explorer} />
                  <PreviewPane explorer={explorer} />
                </div>
              );
            } else {
              return (
                <div class="explorer-tabs-container">
                  <Range<TabController>
                    data={explorer.tabs}
                    into={<div class="dcontents" />}
                  >
                    {tab => <Tab explorer={explorer} tab={tab} />}
                  </Range>
                  <PreviewPane explorer={explorer} />
                </div>
              );
            }
          })}
        </div>
      </div>
      {Statusbar({ explorer })}
      <Overlay explorer={explorer} />
    </div>
  );
}
