import { memo } from "./decorators/memo";

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

  private _segments: string[] = [];
  private _type: "absolute" | "relative" = "absolute";

  constructor(path: string) {
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
    let result = this._type === "absolute" ? "/" : "";
    for (const segment of this._segments) {
      result += segment + "/";
    }
    if (this._segments.length > 0) {
      result = result.slice(0, -1);
    }
    return result;
  }

  join(path: Path): Path {
    const result = Object.create(Path.prototype) as Path;
    result._segments = this._segments.concat(path._segments);
    result._type = path._type;
    Object.freeze(result._segments);
    return result;
  }

  joinSegment(segment: string): Path {
    if (segment.includes("/")) {
      throw new Error("Invalid segment");
    }
    const result = Object.create(Path.prototype) as Path;
    result._segments = this._segments.slice();
    result._segments.push(segment);
    result._type = this._type;
    Object.freeze(result._segments);
    return result;
  }

  @memo
  base(): Path {
    const result = Object.create(Path.prototype) as Path;
    result._segments = this._segments.slice(0, -1);
    result._type = this._type;
    Object.freeze(result._segments);
    return result;
  }

  @memo
  normalize(): Path {
    const result = Object.create(Path.prototype) as Path;
    result._segments = [];
    result._type = this._type;
    for (let i = 0; i < this._segments.length; i++) {
      const segment = this._segments[i]!;
      if (segment === "..") {
        if (result._segments.length > 0) {
          result._segments.pop();
        } else {
          result._segments.push(segment);
        }
      } else if (segment === ".") {
        continue;
      } else {
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
}
