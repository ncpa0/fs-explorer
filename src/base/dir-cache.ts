import { FStat } from "../filesystem-interface";

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

  get(path: string) {
    return this.caches.get(path);
  }

  add(path: string, files: readonly FStat[]) {
    const entry = this.caches.get(path);

    if (entry) {
      entry.update(files);
    } else {
      this.caches.set(path, new CacheEntry(files, new Date()));
    }
  }
}
