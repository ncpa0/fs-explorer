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
import { Prompt } from "../prompt/prompt";
import { Statusbar } from "../statusbar/statusbar";

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
      class={[
        ADW.Box.box,
        "explorer-window",
      ]}
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
                    {tab => (
                      <div
                        class={{
                          "explorer-tab": true,
                          active: explorer.activeTab.derive(tabID =>
                            tabID === tab.id
                          ),
                        }}
                        onmousedown={() => {
                          explorer.focusTab(tab.id);
                        }}
                      >
                        <div class="explorer-tab-header">
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
                    )}
                  </Range>
                  <PreviewPane explorer={explorer} />
                </div>
              );
            }
          })}
        </div>
      </div>
      {Statusbar({ explorer })}
      <ContextMenu explorer={explorer} />
      <Prompt explorer={explorer} />
      <Overlay explorer={explorer} />
    </div>
  );
}
