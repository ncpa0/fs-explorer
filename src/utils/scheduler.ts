export class Scheduler {
  private isScheduled = false;
  private timeout?: number;

  constructor(
    private timeMs = 100,
  ) {}

  schedule(action: () => void, timeMsOverride?: number) {
    if (this.isScheduled) {
      return;
    }

    this.isScheduled = true;
    this.timeout = setTimeout(() => {
      this.isScheduled = false;
      this.timeout = undefined;
      action();
    }, timeMsOverride ?? this.timeMs);
  }

  cancelNext() {
    if (this.isScheduled) {
      clearTimeout(this.timeout);
      this.isScheduled = false;
    }
  }

  isQueued() {
    return this.isScheduled;
  }

  private keyed = new Map<string | symbol | number, Scheduler>();
  byKey(key: string | symbol | number) {
    let s = this.keyed.get(key);
    if (s) return s;

    s = new Scheduler(this.timeMs);
    this.keyed.set(key, s);
    return s;
  }
}
