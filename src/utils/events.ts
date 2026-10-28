export type ModKey =
  | "ctrl"
  | "shift"
  | "alt"
  | "cmd"
  | "lmb"
  | "rmb"
  | "mouse-middle"
  | "mouse-4"
  | "mouse-5"
  | "any";

export const isLmb = (event: MouseEvent, ...mods: ModKey[]) => {
  if (event.button !== 0) {
    return false;
  }
  if (mods.length === 0) {
    return !event.ctrlKey && !event.shiftKey && !event.altKey;
  }

  if (mods.some(m => m === "any")) {
    return true;
  }

  let expCtrl = false;
  let expShift = false;
  let expAlt = false;
  let expMeta = false;
  const expBtns: number[] = [];
  for (const mod of mods) {
    switch (mod) {
      case ("ctrl"): {
        expCtrl = true;
        break;
      }
      case ("shift"): {
        expShift = true;
        break;
      }
      case ("alt"): {
        expAlt = true;
        break;
      }
      case ("cmd"): {
        expMeta = true;
        break;
      }
      case ("rmb"): {
        expBtns.push(2);
        break;
      }
      case ("mouse-middle"): {
        expBtns.push(4);
        break;
      }
      case ("mouse-4"): {
        expBtns.push(8);
        break;
      }
      case ("mouse-5"): {
        expBtns.push(16);
        break;
      }
    }
  }

  return event.ctrlKey === expCtrl && event.shiftKey === expShift
    && event.altKey === expAlt && event.metaKey === expMeta
    && expBtns.every(eb => (event.buttons & eb) === eb);
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
  let expMeta = false;
  const expBtns: number[] = [];
  for (const mod of mods) {
    switch (mod) {
      case ("ctrl"): {
        expCtrl = true;
        break;
      }
      case ("shift"): {
        expShift = true;
        break;
      }
      case ("alt"): {
        expAlt = true;
        break;
      }
      case ("cmd"): {
        expMeta = true;
        break;
      }
      case ("lmb"): {
        expBtns.push(1);
        break;
      }
      case ("mouse-middle"): {
        expBtns.push(4);
        break;
      }
      case ("mouse-4"): {
        expBtns.push(8);
        break;
      }
      case ("mouse-5"): {
        expBtns.push(16);
        break;
      }
    }
  }

  return event.ctrlKey === expCtrl && event.shiftKey === expShift
    && event.altKey === expAlt && event.metaKey === expMeta
    && expBtns.every(eb => (event.buttons & eb) === eb);
};
