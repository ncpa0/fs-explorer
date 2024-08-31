const memory = new Map<string, JSX.Element>();
export function Memo(props: {
  cacheKey: string;
  children: JSX.Element;
}) {
  const memoed = memory.get(props.cacheKey);
  if (memoed) {
    return memoed;
  }
  memory.set(props.cacheKey, props.children);
  return props.children;
}
