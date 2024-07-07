import { Resolvable } from "./utils/immediate";

export interface FStat {
  readonly name: string;
  readonly basedir: string;
  readonly path: string;
  readonly size: number;
  readonly directory: boolean;

  readonly read: boolean;
  readonly write: boolean;

  /** Creation Time */
  readonly ctime: number;
  /** Last Modification Time */
  readonly mtime: number;
  /** Last Access Time */
  readonly atime: number;
}

export interface Filesystem {
  readdir(path: string): Resolvable<string[]>;
  readdirStat(path: string): Resolvable<FStat[]>;
  stat(path: string): Resolvable<FStat>;
  copy(from: string, to: string): Resolvable<void>;
  move(from: string, to: string): Resolvable<void>;
  remove(path: string): Resolvable<void>;
  mkdir(path: string): Resolvable<void>;
  touch(path: string): Resolvable<void>;
  exists(path: string): Resolvable<boolean>;
  dirExists(path: string): Resolvable<boolean>;
  onChange(callback: () => void): void;
  offChange(callback: () => void): void;
}
