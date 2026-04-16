import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { MapSection } from "@/components/map-section";
import { RedeemCodes } from "@/components/redeem-codes";
import { ResourceLocations } from "@/components/resource-locations";
import { WeatherSection } from "@/components/weather-section";
import {
  buildLocationMappingLookup,
  buildStaticMappingLookup,
  formatDateTime,
  formatReportDate,
  mapLocationsToCoordinates,
  parseInGameWeather,
  sanitizeLocationName,
} from "../lib/heartopiaData";
import { fetchLatestReport, fetchLocationMappings } from "../services/api";

const MAP_IMAGE_SRC = process.env.HEARTOPIA_MAP_IMAGE_SRC ?? "/maps/image_0.png";

export default async function Home() {
  const [latestResult, mappingResult] = await Promise.all([
    fetchLatestReport(),
    fetchLocationMappings(),
  ]);

  const latestReport = latestResult.success ? (latestResult.data ?? null) : null;
  const locationMappings = mappingResult.success ? (mappingResult.data ?? []) : [];

  const normalizedLocations =
    latestReport?.resources?.locations
      ?.map((location) => ({
        ...location,
        name: sanitizeLocationName(location.cleanedLocationName || location.name),
      }))
      .filter((location) => location.name.length > 0 && !location.name.includes('#')) ?? [];

  const normalizedCodes =
    latestReport?.codes?.items?.filter((item) => item.code.trim().length > 0) ?? [];

  const locationLookup = buildLocationMappingLookup(locationMappings);
  const staticLookup = buildStaticMappingLookup();
  const mappedLocations = mapLocationsToCoordinates(normalizedLocations, locationLookup, staticLookup);
  const missingLocationNames = mappedLocations
    .filter((location) => location.source === "missing")
    .map((location) => location.name);

  const inGameWeather = parseInGameWeather(latestReport?.resources?.rawText ?? "");
  const reportDate = latestReport ? formatReportDate(latestReport.date) : "No report found";
  const codeLastUpdated = latestReport?.codeLastUpdated ? formatReportDate(latestReport.codeLastUpdated) : undefined;
  const scrapedAt = latestReport ? formatDateTime(latestReport.scrapedAt) : "Waiting for data";

  const resourceItems = mappedLocations.map((location) => ({
    name: location.name,
    type: location.type,
    source: location.source,
    mappedBy: location.mappedBy,
  }));

  const codeItems = normalizedCodes.map((item, index) => ({
    code: item.code,
    rewards: item.detail || "No reward details",
    expires: item.expiry || "No expiry info",
    isNew: index < 2,
  }));

  const mapMarkers = mappedLocations
    .filter((location) => location.x !== null && location.y !== null)
    .map((location, index) => ({
      id: `${location.normalizedName}-${index}`,
      name: location.name,
      x: location.x ?? 0,
      y: location.y ?? 0,
      type: location.type,
    }));

  const dataError = latestReport === null ? latestResult.error ?? "Unable to load dashboard data." : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-10 -left-20 h-40 w-40 rounded-full bg-primary/5 blur-3xl sm:h-64 sm:w-64" />
        <div className="absolute top-20 -right-32 h-64 w-64 rounded-full bg-accent/10 blur-3xl sm:h-96 sm:w-96" />
        <div className="absolute -bottom-20 left-1/4 h-48 w-48 rounded-full bg-chart-3/5 blur-3xl sm:h-80 sm:w-80" />
      </div>

      <Header reportDate={reportDate} lastScraped={scrapedAt} />

      <main className="container mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:gap-10 sm:px-6 sm:py-10 md:gap-12">
        {dataError ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
            <p className="font-semibold text-lg">Dashboard data is unavailable</p>
            <p>{dataError}</p>
          </div>
        ) : null}

        <div className="grid gap-6 sm:gap-8 md:grid-cols-2">
          <WeatherSection today={inGameWeather.today} forecast={inGameWeather.forecast} />
          <ResourceLocations items={resourceItems} />
        </div>

        <RedeemCodes items={codeItems} lastUpdated={codeLastUpdated} />

        <MapSection
          markers={mapMarkers}
          missingLocationNames={missingLocationNames}
          mapImageSrc={MAP_IMAGE_SRC}
        />
      </main>

      <Footer />
    </div>
  );
}