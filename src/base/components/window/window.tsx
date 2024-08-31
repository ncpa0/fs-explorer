import { Explorer } from "../../../explorer";
import { ADW } from "../../../utils/css";
import { ContextMenu } from "../context-menu/context-menu";
import { DirView } from "../dir-view/dir-view";
import { LeftPane } from "../left-pane/left-pane";
import { LocationBar } from "../location-bar/location-bar";
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
          <LocationBar explorer={explorer} />
          <div class="dir-view-wrapper">
            <DirView explorer={explorer} />
            <PreviewPane explorer={explorer} />
          </div>
        </div>
      </div>
      <Statusbar explorer={explorer} />
      <ContextMenu explorer={explorer} />
      <Prompt explorer={explorer} />
    </div>
  );
}
