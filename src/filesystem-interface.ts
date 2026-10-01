import { Resolvable } from "./utils/immediate";

export interface FStat {
  readonly name: string;
  readonly basedir: string;
  readonly path: string;
  readonly size: number;
  readonly directory: boolean;
  readonly hidden: boolean;

  readonly read: boolean;
  readonly write: boolean;

  /** Last Modification Time */
  readonly mtime: number;
  /** Creation Time */
  readonly ctime?: number;
  /** Last Access Time */
  readonly atime?: number;

  readonly mimetype?: string;

  /**
   * Present for every trash-derived entry: items listed from a virtual trash
   * location (e.g. `trash:///`) AND items browsed inside OS trash storage
   * (e.g. within a trashed directory). Host applications use this to detect
   * trash items in actions — item `path`s are real filesystem paths, so path
   * prefix checks cannot identify them. `originalPath`/`deletionTime` are
   * null when the original location is unknown (OS limitations, or a nested
   * entry inside a trashed directory — restore the trashed parent instead).
   */
  readonly trash?: {
    readonly originalPath: string | null;
    readonly deletionTime: number | null;
  };
}

export interface Filesystem {
  readdir(path: string): Resolvable<string[]>;
  readdirStat(path: string): Resolvable<FStat[]>;
  stat(path: string): Resolvable<FStat>;
  copy(from: string, to: string): Resolvable<void>;
  move(
    from: string,
    to: string,
    options?: { overwrite?: boolean },
  ): Resolvable<void>;
  remove(path: string): Resolvable<void>;
  mkdir(path: string): Resolvable<void>;
  touch(path: string): Resolvable<void>;
  exists(path: string): Resolvable<boolean>;
  dirExists(path: string): Resolvable<boolean>;
  onChange(callback: (dirPath?: string) => void): void;
  offChange(callback: (dirPath?: string) => void): void;
  /** Returns the size of all files within the directory in bytes */
  dirSize?(path: string): Resolvable<number>;
  /** If a file can have a thumbnail, this function should return the src for the image html element. */
  thumbnail?(path: string): Resolvable<string | null>;
}
