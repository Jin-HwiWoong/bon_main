export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function compact<T>(values: Array<T | null | undefined>): T[] {
  return values.filter(isDefined);
}
