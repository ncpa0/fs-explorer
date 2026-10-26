import { ReadonlySignal, sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Typography } from "adwavecss";
import { Explorer } from "../../../explorer";
import { isLmb } from "../../../utils/events";
import { DirViewController } from "../../dir-view-controller";
import { LIST_COLUMNS } from "./list-columns";
import { SortMode } from "./sort-files";

export function FileViewHeader(props: {
  explorer: Explorer;
  sorting: ReadonlySignal<{ mode: SortMode; reverse: boolean }>;
  dir: DirViewController;
}) {
  return (
    <div class="dirview-header">
      <span />
      <div
        class={["header-name", Typography.subtitle]}
        onmousedown={(event: MouseEvent) => {
          if (isLmb(event)) {
            props.dir.toggleSorting("name");
          }
        }}
      >
        <span>Name</span>
      </div>
      {LIST_COLUMNS.map(col =>
        sig.derive(col.visibility(props.explorer), (show) =>
          show
            ? (
              <div
                class={[col.headerClass, Typography.subtitle]}
                onmousedown={(event: MouseEvent) => {
                  if (isLmb(event)) {
                    props.dir.toggleSorting(col.sortBy);
                  }
                }}
              >
                <span>{col.headerLabel}</span>
              </div>
            )
            : null)
      )}
    </div>
  );
}
