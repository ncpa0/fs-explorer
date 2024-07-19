import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Explorer } from "../../../explorer";
import { ADW } from "../../../utils/css";
import { ContextMenu } from "../context-menu/context-menu";
import { DirView } from "../dir-view/dir-view";
import { LeftPane } from "../left-pane/left-pane";
import { LocationBar } from "../location-bar/location-bar";
import { PreviewPane } from "../preview-pane/preview-pane";
import { Prompt } from "../prompt/prompt";
import { DirStat, Statusbar } from "../statusbar/statusbar";

export type ExplorerWindowProps = {
  explorer: Explorer;
};

export function ExplorerWindow(props: ExplorerWindowProps) {
  const { explorer } = props;
  const selectedFilesStat = sig<DirStat | undefined>(undefined);

  return (
    <div
      class={[
        ADW.Box.box,
        "explorer-window",
      ]}
    >
      <LocationBar explorer={explorer} />
      <div class={[ADW.Box.className({ bg: 2 }), "explorer-content"]}>
        <LeftPane explorer={explorer} />
        <DirView explorer={explorer} selectedFilesStat={selectedFilesStat} />
        <PreviewPane explorer={explorer} />
      </div>
      <Statusbar explorer={explorer} selectedFilesStat={selectedFilesStat} />
      <ContextMenu explorer={explorer} />
      <Prompt explorer={explorer} />
    </div>
  );
}
