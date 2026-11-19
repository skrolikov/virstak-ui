function recordText(value: unknown, depth: number): string {
  if (value == null || depth > 4) return "";
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => recordText(item, depth + 1)).join(" ");
  }
  if (typeof value === "object") {
    return Object.values(value)
      .map((item) => recordText(item, depth + 1))
      .join(" ");
  }
  return "";
}

export function matchesQuery(value: unknown, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return recordText(value, 0).toLowerCase().includes(needle);
}
