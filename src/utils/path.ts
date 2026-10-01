import { memo } from "./decorators/memo";

/**
 * Matches a scheme-rooted path prefix such as `trash:///` (the virtual trash
 * location used by host applications). Deliberately narrow: lowercase
 * scheme name followed by the empty-authority `://` form.
 */
const SCHEME_PREFIX_RE = /^([a-z]+):\/\//;

export class Path {
  static from(
    path: Path | string | string[],
    type?: "absolute" | "relative",
  ): Path {
    if (path instanceof Path) {
      return path;
    }

    if (Array.isArray(path)) {
      let result = Object.create(Path.prototype) as Path;
      result._segments = [];
      result._type = type ?? "absolute";
      for (const segment of path) {
        if (segment.includes("/")) {
          throw new Error("Invalid segment");
        }
        result._segments.push(segment);
      }
      Object.freeze(result._segments);
      return result;
    }

    return new Path(path);
  }

  static equal(p1: Path | string, p2: Path | string) {
    return Path.from(p1).equals(p2);
  }

  private _segments: string[] = [];
  private _type: "absolute" | "relative" = "absolute";
  /**
   * Scheme name for scheme-rooted paths (e.g. `"trash"` for `trash:///`),
   * `undefined` for plain filesystem paths. The segments/type below describe
   * the part after the `scheme://` prefix.
   */
  private _scheme: string | undefined;

  constructor(path: string) {
    const schemeMatch = SCHEME_PREFIX_RE.exec(path);
    if (schemeMatch) {
      this._scheme = schemeMatch[1];
      path = path.slice(schemeMatch[0].length);
    }
    this._type = path.startsWith("/") ? "absolute" : "relative";
    for (let i = 0; i < path.length; i++) {
      let segment = "";
      while (i < path.length && path[i] !== "/") {
        segment += path[i];
        i++;
      }
      if (segment.length === 0) {
        continue;
      }
      this._segments.push(segment);
    }
    Object.freeze(this._segments);
  }

  private concatSegments(): string {
    // Scheme paths are emitted in their canonical `scheme:///...` form (the
    // empty authority adds the extra slash for the absolute-root case).
    let result = this._scheme !== undefined
      ? `${this._scheme}://`
      : this._type === "absolute"
      ? "/"
      : "";
    if (this._scheme !== undefined && this._type === "absolute") {
      result += "/";
    }
    for (const segment of this._segments) {
      result += segment + "/";
    }
    if (this._segments.length > 0) {
      result = result.slice(0, -1);
    }
    return result;
  }

  /**
   * The scheme name for scheme-rooted paths (`"trash"` for `trash:///`),
   * `undefined` for plain filesystem paths.
   */
  scheme(): string | undefined {
    return this._scheme;
  }

  /**
   * Joins two paths together and returns a new Path object with the result.
   */
  join(path: Path): Path {
    const result = Object.create(Path.prototype) as Path;
    result._segments = this._segments.concat(path._segments);
    result._type = path._type;
    // A scheme-rooted argument marks the result as scheme-rooted too; keeping
    // `this._scheme` here would silently downgrade e.g. `Path.from("/a").join(
    // Path.from("trash:///x"))` to the plain filesystem path `/a/x`.
    result._scheme = path._scheme ?? this._scheme;
    Object.freeze(result._segments);
    return result;
  }

  /**
   * Joins a segment to the end of the path and returns a new Path object with the result.
   */
  joinSegment(segment: string): Path {
    if (segment.includes("/")) {
      throw new Error("Invalid segment");
    }
    const result = Object.create(Path.prototype) as Path;
    result._segments = this._segments.slice();
    result._segments.push(segment);
    result._type = this._type;
    result._scheme = this._scheme;
    Object.freeze(result._segments);
    return result;
  }

  slice(endIdx: number): Path {
    const result = Object.create(Path.prototype) as Path;
    result._segments = this._segments.slice(0, endIdx);
    result._type = this._type;
    result._scheme = this._scheme;
    Object.freeze(result._segments);
    return result;
  }

  /**
   * Removes the last segment from the path and returns a new Path object with the result.
   */
  @memo
  dir(): Path {
    const result = Object.create(Path.prototype) as Path;
    result._segments = this._segments.slice(0, -1);
    result._type = this._type;
    result._scheme = this._scheme;
    Object.freeze(result._segments);
    return result;
  }

  /**
   * Normalizes the path by removing "." and ".." segments.
   */
  @memo
  normalize(): Path {
    const result = Object.create(Path.prototype) as Path;
    result._segments = [];
    result._type = this._type;
    result._scheme = this._scheme;
    for (let i = 0; i < this._segments.length; i++) {
      const segment = this._segments[i]!;
      if (segment === "..") {
        if (result._segments.length > 0) {
          result._segments.pop();
        }
      } else if (segment !== ".") {
        result._segments.push(segment);
      }
    }
    Object.freeze(result._segments);
    return result;
  }

  @memo
  toString(): string {
    return this.normalize().concatSegments();
  }

  segments(): string[] {
    return this._segments.slice();
  }

  isAbsolute(): boolean {
    return this._type === "absolute";
  }

  isRelative(): boolean {
    return this._type === "relative";
  }

  equals(other: Path | string): boolean {
    const otherPath = Path.from(other).normalize();
    const selfNormal = this.normalize();

    if (otherPath._scheme !== selfNormal._scheme) {
      return false;
    }

    if (otherPath._segments.length !== selfNormal._segments.length) {
      return false;
    }

    for (let i = 0; i < selfNormal._segments.length; i++) {
      if (selfNormal._segments[i] !== otherPath._segments[i]) {
        return false;
      }
    }

    return true;
  }

  isInside(parent: Path | string): boolean {
    const parentPath = Path.from(parent).normalize();
    const self = this.normalize();

    // Paths from different roots are never related: a plain filesystem path is
    // not inside a scheme root (e.g. `/foo` is NOT inside `trash:///`), and
    // two different schemes are unrelated.
    if (parentPath._scheme !== self._scheme) {
      return false;
    }

    // A relative path can only be inside a relative parent (and vice versa).
    if (parentPath._type !== self._type) {
      return false;
    }

    if (parentPath._segments.length >= self._segments.length) return false;
    for (let i = 0; i < parentPath._segments.length; i++) {
      const selfSegment = self._segments[i];
      const parentSegment = parentPath._segments[i];
      if (selfSegment !== parentSegment) return false;
    }
    return true;
  }

  /**
   * Returns the extension of the file or undefined if there is none.
   */
  @memo
  ext(): string | undefined {
    const lastSegment = this._segments[this._segments.length - 1];
    if (lastSegment === undefined) {
      // Scheme roots (e.g. `trash:///`) have no segments.
      return undefined;
    }
    const idx = lastSegment.lastIndexOf(".");
    if (idx === -1) {
      return;
    }
    return lastSegment.slice(idx + 1);
  }

  /**
   * Returns the basename of the file. Can be passed a `false` argument to exclude the extension.
   */
  @memo
  basename(ext = true): string {
    const lastSegment = this._segments[this._segments.length - 1];
    if (lastSegment === undefined) {
      // Scheme roots (e.g. `trash:///`) have no segments; the scheme name
      // itself acts as the basename.
      return this._scheme ?? "";
    }
    if (!ext) {
      const idx = lastSegment.lastIndexOf(".");
      if (idx !== -1) {
        return lastSegment.slice(0, idx);
      }
    }
    return lastSegment;
  }
}
