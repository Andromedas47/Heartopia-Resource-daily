const LEADING_SYMBOL_PATTERN = /^[:\s\-–—•·]+/;

export function cleanLocationName(value: string): string {
  return (value ?? "")
    .replace(LEADING_SYMBOL_PATTERN, "")
    .replace(/\s+/g, " ")
    .trim();
}
