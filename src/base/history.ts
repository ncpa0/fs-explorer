import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Path } from "../utils/path";

export type ExplorerPopEventTrigger =
  | "push"
  | "replace"
  | "back"
  | "backpush"
  | "forward"
  | "go";

export class ExplorerPopEvent extends Event {
  static assertIs(event: unknown): asserts event is ExplorerPopEvent {
    if (!(event instanceof ExplorerPopEvent)) {
      throw new Error("not an ExplorerPopEvent");
    }
  }

  constructor(
    public readonly path: Path,
    public readonly historyEntry: HistoryEntry,
    public readonly trigger: ExplorerPopEventTrigger,
  ) {
    super("pop");
  }
}

export class ExplorerLocation {
  static set(location: ExplorerLocation, path: Path) {
    location._path.dispatch(path);
  }

  private _path = sig(new Path("/"));

  signal = this._path.readonly();

  get pathname() {
    return this._path.get().toString();
  }

  get path() {
    return this._path.get();
  }
}

export interface HistoryEntry {
  readonly path: Path;
  scrollPosition: number;
}

export class ExplorerTabHistory extends EventTarget {
  private location = new ExplorerLocation();

  private stack: HistoryEntry[] = [
    {
      path: this.location.path,
      scrollPosition: 0,
    },
  ];
  private stackPosition = 1;

  currentEntry() {
    return this.stack.at(this.stackPosition - 1);
  }

  push(p: string | Path, scrollPos = 0): void {
    if (this.stackPosition < this.stack.length) {
      this.stack.splice(
        this.stackPosition,
        this.stack.length - this.stackPosition,
      );
    }
    const path = Path.from(p);
    const entry = { path, scrollPosition: scrollPos };
    this.stack.push(entry);
    this.stackPosition = this.stack.length;
    ExplorerLocation.set(this.location, path);
    this.dispatchEvent(new ExplorerPopEvent(path, entry, "push"));
  }

  replace(p: string | Path, scrollPos = 0): void {
    const path = Path.from(p);
    if (this.stackPosition === 0) {
      this.stack.push({ path, scrollPosition: scrollPos });
    } else {
      this.stack[this.stackPosition - 1] = { path, scrollPosition: scrollPos };
    }
    this.stackPosition = this.stack.length;
    ExplorerLocation.set(this.location, path);
    const entry = this.stack[this.stackPosition - 1]!;
    this.dispatchEvent(new ExplorerPopEvent(path, entry, "replace"));
  }

  back(): HistoryEntry | undefined {
    const newState = this.stack[this.stackPosition - 2];
    if (newState) {
      this.stackPosition -= 1;
      ExplorerLocation.set(this.location, newState.path);
      const entry = this.stack[this.stackPosition - 1]!;
      this.dispatchEvent(new ExplorerPopEvent(newState.path, entry, "back"));
      return entry;
    }
  }

  backPush(): HistoryEntry | undefined {
    const currentPath = this.currentEntry()?.path;
    if (!currentPath) return;

    const dir = currentPath.dir();

    const prevEntry = this.stack.findLast(e => e.path.equals(dir));

    const entry: HistoryEntry = prevEntry
      ? {
        ...prevEntry,
      }
      : {
        path: dir,
        scrollPosition: 0,
      };

    this.stack.push(entry);
    this.stackPosition = this.stack.length;
    ExplorerLocation.set(this.location, entry.path);
    this.dispatchEvent(new ExplorerPopEvent(entry.path, entry, "backpush"));
    return entry;
  }

  forward(): HistoryEntry | undefined {
    const newState = this.stack[this.stackPosition];
    if (newState) {
      this.stackPosition += 1;
      ExplorerLocation.set(this.location, newState.path);
      const entry = this.stack[this.stackPosition - 1]!;
      this.dispatchEvent(new ExplorerPopEvent(newState.path, entry, "forward"));
      return entry;
    }
  }

  go(delta?: number): HistoryEntry | undefined {
    if (delta === undefined || delta === 0) {
      return;
    }

    const newState = this.stack[this.stackPosition + delta - 1];
    if (newState) {
      this.stackPosition += delta;
      ExplorerLocation.set(this.location, newState.path);
      const entry = this.stack[this.stackPosition - 1]!;
      this.dispatchEvent(new ExplorerPopEvent(newState.path, entry, "go"));
      return entry;
    }
  }

  canGoBack(): boolean {
    return this.stackPosition > 1;
  }

  setCurrentScrollPosition(scrollPosition: number): void {
    const currentEntry = this.stack[this.stackPosition - 1];
    if (currentEntry) {
      currentEntry.scrollPosition = scrollPosition;
    }
  }

  getEntry(delta = 0) {
    const entry = this.stack[this.stackPosition + delta - 1];
    return entry ? { ...entry } : undefined;
  }

  findEntry(path: Path | string) {
    path = Path.from(path);

    const idx = this.stack.findLastIndex(e => e.path.equals(path));
    if (idx !== -1) {
      return this.stack[idx];
    }
  }

  get length(): number {
    return this.stack.length;
  }
}
