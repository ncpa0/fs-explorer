import { ReadonlySignal } from "@ncpa0cpl/vanilla-jsx/signals";

export function useDoubleClick(
  callback: (ev: MouseEvent) => void,
  maxinterval: ReadonlySignal<number>,
) {
  let lastClickTs = 0;
  return (ev: MouseEvent) => {
    const now = Date.now();
    if (now - lastClickTs < maxinterval.get()) {
      callback(ev);
      lastClickTs = 0;
    } else {
      lastClickTs = now;
    }
  };
}
