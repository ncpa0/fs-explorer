import { StorageInterface } from "../explorer";

export class Stored<T extends object | string | number> {
  constructor(
    private storage: StorageInterface,
    private key: string,
    private initial: T,
  ) {
    if (!storage.getItem(key) && initial != null) {
      storage.setItem(key, JSON.stringify(initial));
    }
  }

  set(value: T | ((current: T) => T)) {
    const newValue = typeof value === "function" ? value(this.get()) : value;
    this.storage.setItem(this.key, JSON.stringify(newValue));
  }

  get(): T {
    const persisted = this.storage.getItem(this.key);
    if (persisted) {
      return JSON.parse(persisted);
    }
    return this.initial;
  }
}
