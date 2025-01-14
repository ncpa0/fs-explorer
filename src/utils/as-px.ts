export function asPx(value?: number | string): string | undefined {
  return value != null ? `${value}px` : undefined;
}
