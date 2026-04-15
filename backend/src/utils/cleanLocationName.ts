const LEADING_SYMBOL_PATTERN = /^[:\s\-–—•·*🌳💎✨🌤🌦🌠☀️☁️❄️🌈🔮]+/u;

export function cleanLocationName(value: string): string {
  return (value ?? "")
    .replace(LEADING_SYMBOL_PATTERN, "")
    .replace(/^[:\s\-–—•·*]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}
