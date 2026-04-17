import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { MapSection } from "@/components/map-section";
import { RedeemCodes } from "@/components/redeem-codes";
import { ResourceLocations } from "@/components/resource-locations";
import { WeatherSection } from "@/components/weather-section";
import {
  dedupeCodeItems,
  dedupeMappedLocations,
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
  const uniqueLocations = dedupeMappedLocations(mappedLocations);
  const missingLocationNames = uniqueLocations
    .filter((location) => location.source === "missing")
    .map((location) => location.name);

  const inGameWeather = parseInGameWeather(latestReport?.resources?.rawText ?? "");
  const reportDate = latestReport ? formatReportDate(latestReport.date) : "No report found";
  const codeLastUpdated = latestReport?.codeLastUpdated ? formatReportDate(latestReport.codeLastUpdated) : undefined;
  const scrapedAt = latestReport ? formatDateTime(latestReport.scrapedAt) : "Waiting for data";

  const resourceItems = uniqueLocations.map((location) => ({
    name: location.name,
    type: location.type,
    source: location.source,
    mappedBy: location.mappedBy,
  }));

  const codeItems = dedupeCodeItems(normalizedCodes).map((item, index) => ({
    code: item.code,
    rewards: item.detail || "No reward details",
    expires: item.expiry || "No expiry info",
    isNew: index < 2,
  }));

  const mapMarkers = uniqueLocations
    .filter((location) => location.x !== null && location.y !== null)
    .map((location, index) => ({
      id: `${location.normalizedName}-${index}`,
      name: location.name,
      x: location.x ?? 0,
      y: location.y ?? 0,
      type: location.type,
    }));

  const summaryStats = [
    { label: "Codes", value: String(codeItems.length) },
    { label: "Locations", value: String(resourceItems.length) },
    { label: "Weather lines", value: String(inGameWeather.today.length + inGameWeather.forecast.length) },
  ];

  const dataError = latestReport === null ? latestResult.error ?? "Unable to load dashboard data." : null;

  return (
    <div className="min-h-screen bg-background">
      <Header reportDate={reportDate} lastScraped={scrapedAt} stats={summaryStats} />

      <main className="container mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-8 lg:py-10">
        {dataError ? (
          <div className="rounded-3xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive shadow-sm backdrop-blur">
            <p className="font-semibold text-lg">Dashboard data is unavailable</p>
            <p>{dataError}</p>
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <WeatherSection today={inGameWeather.today} forecast={inGameWeather.forecast} />
          <RedeemCodes items={codeItems} lastUpdated={codeLastUpdated} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <ResourceLocations items={resourceItems} />
          <MapSection
            id="world-map"
            markers={mapMarkers}
            missingLocationNames={missingLocationNames}
            mapImageSrc={MAP_IMAGE_SRC}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}