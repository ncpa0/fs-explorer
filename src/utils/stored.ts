export class Stored<T extends object | string | number> {
  constructor(private key: string, private initial: T) {
    if (!localStorage.getItem(key) && initial != null) {
      localStorage.setItem(key, JSON.stringify(initial));
    }
  }

  set(value: T | ((current: T) => T)) {
    const newValue = typeof value === "function" ? value(this.get()) : value;
    localStorage.setItem(this.key, JSON.stringify(newValue));
  }

  get(): T {
    const persisted = localStorage.getItem(this.key);
    if (persisted) {
      return JSON.parse(persisted);
    }
    return this.initial;
  }
}
