import { ReadonlySignal } from "@ncpa0cpl/vanilla-jsx/signals";
import { Typography } from "adwavecss";
import { isLmb } from "../../../utils/events";
import { DirViewController } from "../../dir-view-controller";
import { SortMode } from "./sort-files";

export function FileViewHeader(props: {
  sorting: ReadonlySignal<{ mode: SortMode; reverse: boolean }>;
  dir: DirViewController;
}) {
  const handleNameClick = (event: MouseEvent) => {
    if (isLmb(event)) {
      props.dir.toggleSorting("name");
    }
  };

  const handleSizeClick = (event: MouseEvent) => {
    if (isLmb(event)) {
      props.dir.toggleSorting("size");
    }
  };

  const handleDateClick = (event: MouseEvent) => {
    if (isLmb(event)) {
      props.dir.toggleSorting("date");
    }
  };

  return (
    <div class="dirview-header">
      <span />
      <div
        class={["header-name", Typography.subtitle]}
        onmousedown={handleNameClick}
      >
        <span>Name</span>
      </div>
      <div
        class={["header-size", Typography.subtitle]}
        onmousedown={handleSizeClick}
      >
        <span>Size</span>
      </div>
      <div
        class={["header-date", Typography.subtitle]}
        onmousedown={handleDateClick}
      >
        <span>Date Modified</span>
      </div>
    </div>
  );
}
