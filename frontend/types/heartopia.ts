export type LocationType = "oak" | "glowstone" | "unknown";

export interface Location {
  type: LocationType;
  name: string;
  cleanedLocationName?: string;
}

export interface CodeItem {
  code: string;
  detail: string;
  expiry: string;
}

export interface DailyReport {
  date: string;
  scrapedAt: string;
  resources: {
    found: boolean;
    rawText: string;
    locations: Location[];
  };
  codes: {
    found: boolean;
    items: CodeItem[];
  };
}

export interface LocationMapping {
  locationName: string;
  aliases: string[];
  normalizedName: string;
  normalizedAliases: string[];
  x: number;
  y: number;
}

export interface MappedLocation extends Location {
  normalizedName: string;
  x: number | null;
  y: number | null;
  source: "database" | "fallback" | "missing";
  mappedBy?: string;
}

export interface ReportMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: ReportMeta;
}

export interface InGameWeatherData {
  today: string[];
  forecast: string[];
}
