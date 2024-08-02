export type Resolvable<T> = {
  then<U = void>(cb: (val: T) => U): Resolvable<U>;
  catch<U = void>(cb?: (err: any) => U): Resolvable<T | U>;
};

type ImmediateType<T> = T extends Resolvable<infer U> ? U : T;

type MapImmediates<T extends Resolvable<any>[]> = T extends
  [infer First, ...infer Rest extends Resolvable<any>[]]
  ? [ImmediateType<First>, ...MapImmediates<Rest>]
  : [];

export class Immediate<T = void> implements Resolvable<T> {
  static all<const T extends Resolvable<any>[]>(
    ...resolvables: T
  ): Resolvable<MapImmediates<T>> {
    const promises: Promise<[idx: number, value: unknown]>[] = [];
    const results = [] as MapImmediates<T>;

    for (let i = 0; i < resolvables.length; i++) {
      const imm = resolvables[i];
      if (imm instanceof Immediate) {
        if (imm.error) {
          return Immediate.reject(imm.error);
        } else {
          results[i] = imm.value;
        }
      } else {
        const placeholder = Symbol("promise_placeholder");
        results[i] = placeholder;

        const promise = imm as Promise<unknown>;
        promises.push(promise.then((v) => [i, v]));
      }
    }

    if (promises.length > 0) {
      return Promise.all(promises).then(presults => {
        for (const [idx, value] of presults) {
          results[idx] = value;
        }
        return results;
      });
    }

    return Immediate.resolve(results);
  }

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
