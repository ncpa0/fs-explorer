import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Explorer } from "../explorer";
import { Path } from "./path";

export function useFileDrop(
  explorer: Explorer,
  getDestination: () => Path | string | undefined,
) {
  const classNames = sig("");

  const handleMouseEnter = (e: Event) => {
    if (!explorer.drag.isDragging()) {
      classNames.dispatch("");
      return;
    }

    classNames.dispatch("dnd-target-active");
    e.preventDefault();
    e.stopPropagation();
  };

  const handleMouseLeave = (e: Event) => {
    if (explorer.drag.isDragging()) {
      e.preventDefault();
      e.stopPropagation();
    }
    classNames.dispatch("");
  };

  const handleHeaderMouseUp = (e: Event) => {
    if (!explorer.drag.isDragging()) return;

    e.preventDefault();
    e.stopPropagation();

    const files = explorer.drag.getDraggedFiles();
    explorer.drag.endDrag();

    if (!files || files.length === 0) return;

    const moveTo = getDestination();
    if (moveTo) {
      const currentFileLocation = Path.from(files.at(0)!.path).dir();
      if (currentFileLocation.equals(moveTo)) {
        return;
      }
      explorer.fs.move(files, moveTo);
    }

    classNames.dispatch("");
  };

  return {
    targetClassName: classNames,
    onmouseup: handleHeaderMouseUp,
    onmouseenter: handleMouseEnter,
    onmouseleave: handleMouseLeave,
  };
}
