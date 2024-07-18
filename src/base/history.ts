import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Path } from "../utils/path";

export class ExplorerPopEvent extends Event {
  constructor(public readonly path: Path) {
    super("pop");
  }
}

export class ExplorerLocation {
  static set(location: ExplorerLocation, path: Path) {
    location._path.dispatch(path);
  }

  static signal(location: ExplorerLocation) {
    return location._path.readonly();
  }

  static pathOf(location: ExplorerLocation) {
    return location._path.get();
  }

  private _path = sig(new Path("/"));

  get pathname() {
    return this._path.get().toString();
  }

  get path() {
    return this._path.get();
  }
}

export class ExplorerHistory {
  private emitter = new EventTarget();
  private location = new ExplorerLocation();

  private stack: { path: Path }[] = [
    { path: this.location.path },
  ];
  private stackPosition = 1;

  push(p: string | Path): void {
    if (this.stackPosition < this.stack.length) {
      this.stack.splice(
        this.stackPosition,
        this.stack.length - this.stackPosition,
      );
    }
    const path = Path.from(p);
    this.stack.push({ path });
    this.stackPosition = this.stack.length;
    ExplorerLocation.set(this.location, path);
    this.emitter.dispatchEvent(new ExplorerPopEvent(path));
  }

  replace(p: string | Path): void {
    const path = Path.from(p);
    if (this.stackPosition === 0) {
      this.stack.push({ path });
    } else {
      this.stack[this.stackPosition - 1] = { path };
    }
    this.stackPosition = this.stack.length;
    ExplorerLocation.set(this.location, path);
    this.emitter.dispatchEvent(new ExplorerPopEvent(path));
  }

  back(): void {
    const newState = this.stack[this.stackPosition - 2];
    if (newState) {
      this.stackPosition -= 1;
      ExplorerLocation.set(this.location, newState.path);
      this.emitter.dispatchEvent(new ExplorerPopEvent(newState.path));
    }
  }

  forward(): void {
    const newState = this.stack[this.stackPosition];
    if (newState) {
      this.stackPosition += 1;
      ExplorerLocation.set(this.location, newState.path);
      this.emitter.dispatchEvent(new ExplorerPopEvent(newState.path));
    }
  }

  go(delta?: number): void {
    if (delta === undefined || delta === 0) {
      return;
    }

    const newState = this.stack[this.stackPosition + delta - 1];
    if (newState) {
      this.stackPosition += delta;
      ExplorerLocation.set(this.location, newState.path);
      this.emitter.dispatchEvent(new ExplorerPopEvent(newState.path));
    }
  }

  canGoBack(): boolean {
    return this.stackPosition > 1;
  }

  get length(): number {
    return this.stack.length;
  }
}
