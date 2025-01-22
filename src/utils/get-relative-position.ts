type RelativePosition = {
  top: number;
  left: number;
  right: number;
  bottom: number;
};

export function getRelativePosition(
  elem: Element,
  relativeTo: Element,
): RelativePosition {
  const rect = elem.getBoundingClientRect();
  const relativeRect = relativeTo.getBoundingClientRect();

  return {
    top: rect.top - relativeRect.top,
    left: rect.left - relativeRect.left,
    right: rect.right - relativeRect.right,
    bottom: rect.bottom - relativeRect.bottom,
  };
}
