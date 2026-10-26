import { Queue } from "async-await-queue";
import { FStat } from "../filesystem-interface";
import { Resolvable } from "../utils/immediate";
import { Path } from "../utils/path";

class CacheEntry {
  constructor(
    public files: readonly FStat[],
    public lastUpdatedAt: Date,
  ) {}

  update(files: readonly FStat[]) {
    this.files = files;
    this.lastUpdatedAt = new Date();
  }
}

export class DirCache {
  private caches = new Map<string, CacheEntry>();
  private dirSizes = new Map<string, number>();
  private dirSizeFetches = new Map<string, Promise<number>>();
  private dirSizeQueue = new Queue(1);

  get(path: string) {
    return this.caches.get(path);
  }

  getDirSize(path: string) {
    return this.dirSizes.get(path);
  }

  /**
   * Fetches the recursive size of a directory, deduplicating concurrent
   * requests for the same path and serializing the traversals so that many
   * rows requesting their size at once don't flood the filesystem.
   */
  fetchDirSize(
    path: string,
    fetch: () => Resolvable<number>,
  ): Promise<number> {
    const cached = this.dirSizes.get(path);
    if (cached != null) {
      return Promise.resolve(cached);
    }

    let pending = this.dirSizeFetches.get(path);
    if (!pending) {
      pending = this.dirSizeQueue.run(() => Promise.resolve(fetch()))
        .then(size => {
          this.dirSizes.set(path, size);
          return size;
        })
        .finally(() => {
          this.dirSizeFetches.delete(path);
        });
      this.dirSizeFetches.set(path, pending);
    }
    return pending;
  }

  /**
   * Drops the cached size of the directory and of every ancestor - a change
   * inside a directory changes all of their recursive sizes.
   */
  invalidateDirSize(path: string | Path) {
    let dir = Path.from(path);
    for (;;) {
      this.dirSizes.delete(dir.toString());
      if (dir.segments().length === 0) {
        break;
      }
      dir = dir.dir();
    }
  }

  add(path: string, files: readonly FStat[]) {
    this.invalidateDirSize(path);

    const entry = this.caches.get(path);

    if (entry) {
      entry.update(files);
    } else {
      this.caches.set(path, new CacheEntry(files, new Date()));
    }
  }
}
