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
}
