export const isLmb = (event: MouseEvent) =>
  event.button === 0 && !event.ctrlKey && !event.shiftKey && !event.altKey;

export const isRmb = (event: MouseEvent) =>
  event.button === 2 && !event.ctrlKey && !event.shiftKey && !event.altKey;
