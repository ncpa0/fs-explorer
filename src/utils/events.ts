export type ModKey = "ctrl" | "shift" | "alt";

export const isLmb = (event: MouseEvent, ...mods: ModKey[]) => {
  if (event.button !== 0) {
    return false;
  }
  if (mods.length === 0) {
    return !event.ctrlKey && !event.shiftKey && !event.altKey;
  }

  let expCtrl = false;
  let expShift = false;
  let expAlt = false;
  for (const mod of mods) {
    if (mod === "ctrl") {
      expCtrl = true;
    } else if (mod === "shift") {
      expShift = true;
    } else if (mod === "alt") {
      expAlt = true;
    }
  }

  return event.ctrlKey === expCtrl && event.shiftKey === expShift
    && event.altKey === expAlt;
};

export const isRmb = (event: MouseEvent, ...mods: ModKey[]) => {
  if (event.button !== 2) {
    return false;
  }
  if (mods.length === 0) {
    return !event.ctrlKey && !event.shiftKey && !event.altKey;
  }

  let expCtrl = false;
  let expShift = false;
  let expAlt = false;
  for (const mod of mods) {
    if (mod === "ctrl") {
      expCtrl = true;
    } else if (mod === "shift") {
      expShift = true;
    } else if (mod === "alt") {
      expAlt = true;
    }
  }

  return event.ctrlKey === expCtrl && event.shiftKey === expShift
    && event.altKey === expAlt;
};
