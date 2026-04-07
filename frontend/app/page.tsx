import CodesGrid, { InGameWeather } from "./components/CodesGrid";
import ResourceMap, { type ResourceMarker } from "./components/ResourceMap";
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
import type { LocationType } from "../types/heartopia";
import styles from "./page.module.css";
const MAP_IMAGE_SRC = process.env.HEARTOPIA_MAP_IMAGE_SRC ?? "/maps/image_0.png";
const ENABLE_COORD_PICKER = process.env.NEXT_PUBLIC_MAP_COORD_PICKER !== "0";

const OAK_ICON_SRC = process.env.NEXT_PUBLIC_MAP_OAK_ICON_SRC ?? "/icons/Roaming%20Oak%20Tree.png";
const GLOW_ICON_SRC = process.env.NEXT_PUBLIC_MAP_GLOWSTONE_ICON_SRC ?? "/icons/Glowstone.png";
const UNKNOWN_ICON_SRC = process.env.NEXT_PUBLIC_MAP_UNKNOWN_ICON_SRC;

function locationTypeLabel(type: LocationType): string {
  if (type === "oak") return "Oak";
  if (type === "glowstone") return "Glowstone";
  return "Unknown";
}

function locationTypeIcon(type: LocationType): string {
  if (type === "oak") return "🌳";
  if (type === "glowstone") return "✨";
  return "📍";
}

export default async function Home() {
  const [latestResult, mappingResult] = await Promise.all([
    fetchLatestReport(),
    fetchLocationMappings(),
  ]);

  const latestReport = latestResult.success ? (latestResult.data ?? null) : null;
  const locationMappings = mappingResult.success ? (mappingResult.data ?? []) : [];

  const dataError = latestReport === null ? latestResult.error ?? "Unable to load dashboard data." : null;

  const normalizedLocations =
    latestReport?.resources.locations
      .map((location) => ({
        ...location,
        name: sanitizeLocationName(location.cleanedLocationName || location.name),
      }))
      .filter((location) => location.name.length > 0 && !location.name.includes('#')) ?? [];

  const normalizedCodes =
    latestReport?.codes.items.filter((item) => item.code.trim().length > 0) ?? [];

  const locationLookup = buildLocationMappingLookup(locationMappings);
  const staticLookup = buildStaticMappingLookup();
  const mappedLocations = mapLocationsToCoordinates(normalizedLocations, locationLookup, staticLookup);
  const missingLocationNames = mappedLocations
    .filter((location) => location.source === "missing")
    .map((location) => location.name);

  const mapMarkers: ResourceMarker[] = mappedLocations
    .filter((location) => location.x !== null && location.y !== null)
    .map((location, index) => ({
      id: `${location.normalizedName}-${index}`,
      name: location.name,
      type: location.type,
      x: location.x ?? 0,
      y: location.y ?? 0,
      source: location.source === "database" ? "database" : "fallback",
      mappedBy: location.mappedBy,
    }));

  const markerIconAssets: Partial<Record<ResourceMarker["type"], string>> = {
    ...(OAK_ICON_SRC ? { oak: OAK_ICON_SRC } : {}),
    ...(GLOW_ICON_SRC ? { glowstone: GLOW_ICON_SRC } : {}),
    ...(UNKNOWN_ICON_SRC ? { unknown: UNKNOWN_ICON_SRC } : {}),
  };

  const inGameWeather = parseInGameWeather(latestReport?.resources.rawText ?? "");

  const resourcesCount = mappedLocations.length;
  const codesCount = normalizedCodes.length;
  const reportDate = latestReport ? formatReportDate(latestReport.date) : "No report found";
  const scrapedAt = latestReport ? formatDateTime(latestReport.scrapedAt) : "Waiting for data";
  const healthLabel = latestReport
    ? latestReport.resources.found || latestReport.codes.found
      ? "Ready"
      : "Empty"
    : "Offline";

  return (
    <div className={styles.page}>
      <main className={styles.dashboard}>
        <section className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>Heartopia Daily</p>
            <h1>Result Dashboard</h1>
          </div>
          <div className={styles.heroTagWrap}>
            <span className={styles.heroTag}>{healthLabel}</span>
          </div>
        </section>

        {dataError ? (
          <div className={styles.errorBanner}>
            <h2>Dashboard data is unavailable</h2>
            <p>{dataError}</p>
          </div>
        ) : null}

        <section className={styles.weatherArea}>
          <InGameWeather today={inGameWeather.today} forecast={inGameWeather.forecast} />
        </section>

        <section className={styles.kpiGrid} aria-label="Dashboard summary">
          <article className={styles.kpiCard}>
            <div className={styles.kpiHeading}>
              <span className={styles.kpiIcon} aria-hidden>
                🗓️
              </span>
              <p>Latest Report Date</p>
            </div>
            <h2>{reportDate}</h2>
            <small>Most recent report in database</small>
          </article>
          <article className={styles.kpiCard}>
            <div className={styles.kpiHeading}>
              <span className={styles.kpiIcon} aria-hidden>
                🪨
              </span>
              <p>Resource Locations</p>
            </div>
            <h2>{resourcesCount}</h2>
            <small>Found in latest scrape</small>
          </article>
          <article className={styles.kpiCard}>
            <div className={styles.kpiHeading}>
              <span className={styles.kpiIcon} aria-hidden>
                🎁
              </span>
              <p>Redeem Codes</p>
            </div>
            <h2>{codesCount}</h2>
            <small>Available in latest scrape</small>
          </article>
          <article className={styles.kpiCard}>
            <div className={styles.kpiHeading}>
              <span className={styles.kpiIcon} aria-hidden>
                ⏱️
              </span>
              <p>Last Scraped At</p>
            </div>
            <h2>{scrapedAt}</h2>
            <small>Status: {healthLabel}</small>
          </article>
        </section>

        <section className={styles.contentGrid}>
          <article className={styles.panel}>
            <header className={styles.panelHeader}>
              <h3>Resource Locations</h3>
              <span>{resourcesCount} entries</span>
            </header>
            {resourcesCount > 0 ? (
              <ul className={styles.locationList}>
                {mappedLocations.map((location, index) => {
                  const typeClassName =
                    location.type === "oak"
                      ? styles.typePillOak
                      : location.type === "glowstone"
                        ? styles.typePillGlowstone
                        : styles.typePillUnknown;

                  return (
                    <li key={`${location.name}-${index}`}>
                      <span className={styles.locationName}>
                        <span className={styles.locationIcon} aria-hidden>
                          {locationTypeIcon(location.type)}
                        </span>
                        {location.name}
                      </span>
                      <div className={styles.locationMeta}>
                        <span className={`${styles.typePill} ${typeClassName}`}>
                          {locationTypeLabel(location.type)}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className={styles.emptyState}>No locations available in the latest report.</p>
            )}
          </article>

          <article className={styles.panel}>
            <header className={styles.panelHeader}>
              <h3>Redeem Codes</h3>
              <span>{codesCount} entries</span>
            </header>
            <CodesGrid items={normalizedCodes} />
          </article>
        </section>

        <section className={styles.mapSection}>
          <ResourceMap
            markers={mapMarkers}
            missingLocationNames={missingLocationNames}
            mapImageSrc={MAP_IMAGE_SRC}
            mapNaturalSize={{ width: 1024, height: 1024 }}
            iconAssets={markerIconAssets}
            enableCoordinatePicker={ENABLE_COORD_PICKER}
          />
        </section>
      </main>
    </div>
  );
}
