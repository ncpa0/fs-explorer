import { Resolvable } from "../utils/immediate";

const MAX_ID = Number.MAX_SAFE_INTEGER - 2;

type QueueItem = {
  id: number;
  cancel(): void;
};

export type QueueActionEffectResult<T> = {
  ok: false;
  error: any;
} | {
  ok: true;
  value: T;
};

export class RaceQueue {
  private prevItem: QueueItem | null = null;

  private nextId = 0;
  private getID() {
    const id = this.nextId;
    this.nextId = (this.nextId + 1) % MAX_ID;
    return id;
  }

  add<T>(
    action: Resolvable<T>,
    effect: (result: QueueActionEffectResult<T>) => void,
  ) {
    let prevItem = this.prevItem;
    const id = this.getID();
    let isCancelled = false;

    const item = this.prevItem = {
      id,
      cancel() {
        isCancelled = true;
        prevItem?.cancel();
        prevItem = null;
      },
    };

    action.then((value) => {
      if (isCancelled) return;
      prevItem?.cancel();
      effect({
        ok: true,
        value: value,
      });
    }).catch((error) => {
      if (isCancelled) return;
      effect({
        ok: false,
        error,
      });
    });

    return item;
  }
}
