const LEADING_SYMBOL_PATTERN = /^[:\s\-–—•·]+/;

export function sanitizeLocationName(value: string): string {
  return value.replace(LEADING_SYMBOL_PATTERN, '').replace(/\s+/g, ' ').trim();
}

export function normalizeLocationName(value: string): string {
  return sanitizeLocationName(value)
    .toLowerCase()
    .replace(/[()'"`]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

export function dedupeNormalizedNames(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => sanitizeLocationName(value))
        .filter((value) => value.length > 0)
    )
  );
}
