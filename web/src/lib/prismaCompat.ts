export function hasModelField(record: unknown, field: string): boolean {
  if (!record || typeof record !== "object") {
    return false;
  }
  return Object.prototype.hasOwnProperty.call(record, field);
}

