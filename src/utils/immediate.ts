export type Resolvable<T> = {
  then<U = void>(cb: (val: T) => U): Resolvable<U>;
  catch<U = void>(cb?: (err: any) => U): Resolvable<T | U>;
};

export class Immediate<T = void> implements Resolvable<T> {
  static unpack<T>(v: T | Immediate<T>): T {
    if (v instanceof Immediate) {
      if (!v.success) {
        throw v.error;
      }
      return Immediate.unpack(v.value!);
    }
    return v;
  }
  static resolve(): Immediate<void>;
  static resolve<T = void>(v: T): Immediate<T>;
  static resolve(v?: any): Immediate<any> {
    if (v instanceof Immediate) {
      return v;
    }

    const r = Object.create(Immediate.prototype);
    r.value = v;
    r.success = true;
    return r;
  }

  static reject(e: any): Immediate<any> {
    const r = Object.create(Immediate.prototype);
    r.error = e;
    r.success = false;
    return r;
  }

  private value?: T;
  private error?: Error;
  private success?: boolean;

  public constructor(cb: () => Immediate<T> | T = () => void 0 as any) {
    try {
      this.value = Immediate.unpack(cb());
      this.success = true;
    } catch (e) {
      this.error = e as Error;
      this.success = false;
    }
  }

  public then<U>(cb: (val: T) => U): Immediate<U> {
    if (this.success) {
      return new Immediate<U>(() => {
        return cb(this.value!);
      });
    }
    return this as any as Immediate<U>;
  }

  public catch<U>(cb: (err: Error) => U): Immediate<T | U> {
    if (!this.success) {
      return new Immediate<U>(() => {
        return cb(this.error!);
      });
    }
    return this;
  }
}
