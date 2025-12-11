export function hasModelField<T extends Record<string, any>>(obj: T, field: string): boolean {
  return Boolean(obj && Object.prototype.hasOwnProperty.call(obj, field));
}
