import { LOCATION_ALIAS_MAP, LOCATION_COORDINATE_MAP } from "../app/locationMapping";
import type {
  CodeItem,
  InGameWeatherData,
  Location,
  LocationMapping,
  MappedLocation,
} from "../types/heartopia";

export function sanitizeLocationName(value: string): string {
  const cleaned = value
    .replace(/\u00a0/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/^[:\s\-–—•·]+/, "")
    .replace(/\s+/g, " ")
    .replace(/โ\s+โอ๊ก/g, "โอ๊ก")
    .replace(/วิญญาน/g, "วิญญาณ")
    .trim();

  // Some bad imports stored Thai as question marks, e.g. "??????????????? 08".
  // Recover to a stable zone label so mapping and display remain usable.
  if (cleaned.includes("?")) {
    const zoneMatch = cleaned.match(/(\d{1,2})\s*$/);
    if (zoneMatch) {
      return `หน้าบ้านหมายเลข ${zoneMatch[1].padStart(2, "0")}`;
    }
  }

  return cleaned;
}

export function normalizeLocationName(value: string): string {
  return sanitizeLocationName(value)
    .toLowerCase()
    .replace(/[()'"`]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

export function extractZoneNumber(value: string): string | null {
  const normalized = sanitizeLocationName(value);
  const zoneMatch =
    normalized.match(/(?:หมายเลข|โซน|เขต|บ้านเลขที่|บ้าน)\s*0?(\d{1,2})/i) ??
    normalized.match(/\b0?(\d{1,2})\b/);

  if (!zoneMatch) return null;

  const zone = Number(zoneMatch[1]);
  if (!Number.isInteger(zone) || zone < 1 || zone > 12) {
    return null;
  }

  return zone.toString().padStart(2, "0");
}

export function buildLocationMappingLookup(mappings: LocationMapping[]): Map<string, LocationMapping> {
  const lookup = new Map<string, LocationMapping>();

  for (const mapping of mappings) {
    const keys = [
      mapping.normalizedName,
      mapping.locationName,
      ...(mapping.normalizedAliases ?? []),
      ...(mapping.aliases ?? []),
    ];

    for (const key of keys) {
      const normalizedKey = normalizeLocationName(key);
      if (!normalizedKey) continue;
      if (!lookup.has(normalizedKey)) {
        lookup.set(normalizedKey, mapping);
      }
    }
  }

  return lookup;
}

export function buildStaticMappingLookup(): Map<string, { x: number; y: number; locationName: string }> {
  const lookup = new Map<string, { x: number; y: number; locationName: string }>();

  for (const [locationName, coordinate] of Object.entries(LOCATION_COORDINATE_MAP)) {
    const keys = [locationName, ...(LOCATION_ALIAS_MAP[locationName] ?? [])];

    for (const key of keys) {
      const normalized = normalizeLocationName(key);
      if (!normalized || lookup.has(normalized)) continue;

      lookup.set(normalized, {
        x: coordinate.xPercent,
        y: coordinate.yPercent,
        locationName,
      });
    }
  }

  return lookup;
}

export function mapLocationsToCoordinates(
  locations: Location[],
  mappingLookup: Map<string, LocationMapping>,
  staticLookup: Map<string, { x: number; y: number; locationName: string }>,
): MappedLocation[] {
  return locations.map((location) => {
    const normalizedName = normalizeLocationName(location.name);
    const staticMapping = staticLookup.get(normalizedName);
    if (staticMapping) {
      return {
        ...location,
        normalizedName,
        x: staticMapping.x,
        y: staticMapping.y,
        source: "fallback",
        mappedBy: staticMapping.locationName,
      };
    }

    const mapping = mappingLookup.get(normalizedName);
    if (mapping) {
      return {
        ...location,
        normalizedName,
        x: mapping.x,
        y: mapping.y,
        source: "database",
        mappedBy: mapping.locationName,
      };
    }

    const zoneNumber = extractZoneNumber(location.name);
    const zoneMapping = zoneNumber
      ? staticLookup.get(normalizeLocationName(`หน้าบ้านหมายเลข ${zoneNumber}`))
      : null;

    if (zoneMapping) {
      return {
        ...location,
        normalizedName,
        x: zoneMapping.x,
        y: zoneMapping.y,
        source: "fallback",
        mappedBy: `Zone ${zoneNumber}`,
      };
    }

    return {
      ...location,
      normalizedName,
      x: null,
      y: null,
      source: "missing",
    };
  });
}

export function dedupeMappedLocations(locations: MappedLocation[]): MappedLocation[] {
  const seen = new Set<string>();

  return locations.filter((location) => {
    const key = `${location.normalizedName}|${location.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function dedupeCodeItems(items: CodeItem[]): CodeItem[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = item.code.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function formatReportDate(value: string): string {
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

// Ensure consistent timezone formatting for Thailand
export function formatDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok", // Thailand timezone
  }).format(parsed);
}

function normalizeWeatherLine(value: string): string {
  return value
    .replace(/^[\s:•·\-☀️🌤️⛅🌥️☁️🌦️🌧️⛈️❄️🌈✨🕒⏰🔮⭐️]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseInGameWeather(rawText: string): InGameWeatherData {
  if (!rawText) {
    return { today: [], forecast: [] };
  }

  const today: string[] = [];
  const forecast: string[] = [];
  const lines = rawText
    .split("\n")
    .map((line) => normalizeWeatherLine(line))
    .filter((line) => line.length > 0);

  const stopPattern = /(เวลาวาร์ป|สนับสนุนความน่ารัก|#|พิกัดทรัพยากร|โค้ด|redeem)/i;

  let mode: "none" | "today" | "forecast" = "none";

  for (const line of lines) {
    if (stopPattern.test(line)) {
      if (mode !== "none") break;
      continue;
    }

    if (/สภาพอากาศวันนี้|อากาศวันนี้/i.test(line)) {
      mode = "today";
      const detail = line.split(":").slice(1).join(":").trim();
      if (detail) today.push(detail);
      continue;
    }

    if (/พยากรณ์อากาศล่วงหน้า|อากาศล่วงหน้า|พยากรณ์อากาศ/i.test(line)) {
      mode = "forecast";
      const detail = line.split(":").slice(1).join(":").trim();
      if (detail) forecast.push(detail);
      continue;
    }

    if (mode === "today") {
      if (/^(วัน|คืนนี้|พรุ่งนี้)/.test(line)) {
        forecast.push(line);
      } else {
        today.push(line);
      }
      continue;
    }

    if (mode === "forecast") {
      forecast.push(line);
    }
  }

  const dedupe = (items: string[]): string[] =>
    Array.from(new Set(items.map((item) => item.trim()).filter((item) => item.length > 0)));

  return {
    today: dedupe(today).slice(0, 4),
    forecast: dedupe(forecast).slice(0, 5),
  };
}
