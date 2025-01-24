const memory = new Map<string, [elem: JSX.Element, deps?: any[]]>();
export function Memo(props: {
  cacheKey: string;
  dependencies?: any[];
  children: () => JSX.Element;
}): JSX.Element {
  const [memoed, deps] = memory.get(props.cacheKey) ?? [];
  if (memoed) {
    if (props.dependencies) {
      const depsChanged = !deps || !cmpArrays(deps, props.dependencies);
      if (!depsChanged) {
        return memoed;
      }
    }
  }
  const result = props.children();
  memory.set(props.cacheKey, [result, props.dependencies]);
  return result;
}

function cmpArrays(a: any[], b: any[]) {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}
