export function asCssValue(value?: number | string): string | undefined {
  switch (typeof value) {
    case "number":
      return value != null ? `${value}px` : undefined;
    case "string":
      return value;
  }
  return undefined;
}
