import { Explorer } from "../../..";
import { ACSS } from "../../../utils/css";
import { DirView } from "../dir-view/dir-view";
import { LeftPane } from "../left-pane/left-pane";
import { LocationBar } from "../location-bar/location-bar";
import { PreviewPane } from "../preview-pane/preview-pane";

export type ExplorerWindowProps = {
  explorer: Explorer;
};

export function ExplorerWindow(props: ExplorerWindowProps) {
  return (
    <div
      class={[
        ACSS.Box.box,
        "explorer-window",
      ]}
    >
      <LocationBar explorer={props.explorer} />
      <div class={[ACSS.Box.className({ bg: 2 }), "explorer-content"]}>
        <LeftPane explorer={props.explorer} />
        <DirView explorer={props.explorer} />
        <PreviewPane explorer={props.explorer} />
      </div>
    </div>
  );
}
