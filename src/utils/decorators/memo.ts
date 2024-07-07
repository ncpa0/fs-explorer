export function memo<R>(
  impl: (...args: any[]) => R,
  context: ClassMethodDecoratorContext<any, (...args: any[]) => R>
) {
  const memoKey = Symbol(context.name as string);
  return function (this: any, ...args: any[]) {
    if (args.length > 0) return impl.apply(this, args);
    if (this[memoKey] === undefined) {
      this[memoKey] = impl.apply(this);
    }
    return this[memoKey];
  };
}
