import type { ApiEnvelope, DailyReport, LocationMapping } from "../types/heartopia";

const API_BASE_URL = process.env.HEARTOPIA_API_URL ?? "http://127.0.0.1:4000";

export async function fetchApi<T>(path: string): Promise<ApiEnvelope<T>> {
  try {
    const response = await fetch(new URL(path, API_BASE_URL), { cache: "no-store" });

    if (!response.ok) {
      return {
        success: false,
        error: `API responded with ${response.status} ${response.statusText}`,
      };
    }

    return (await response.json()) as ApiEnvelope<T>;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export function fetchLatestReport(): Promise<ApiEnvelope<DailyReport>> {
  return fetchApi<DailyReport>("/api/reports/latest");
}

export function fetchLocationMappings(): Promise<ApiEnvelope<LocationMapping[]>> {
  return fetchApi<LocationMapping[]>("/api/location-mappings");
}
