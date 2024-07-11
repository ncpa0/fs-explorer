import { Explorer } from "../../..";
import { ACSS } from "../../../utils/css";
import { DirView } from "../dir-view/dir-view";
import { LocationBar } from "../location-bar/location-bar";

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
        <DirView explorer={props.explorer} />
      </div>
    </div>
  );
}
