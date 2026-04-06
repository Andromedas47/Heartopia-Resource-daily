"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import styles from "./ResourceMap.module.css";

type MarkerType = "oak" | "glowstone" | "unknown";

export interface ResourceMarker {
  id: string;
  name: string;
  type: MarkerType;
  x: number;
  y: number;
  source: "database" | "fallback";
  mappedBy?: string;
  iconSrc?: string;
}

export interface CoordinatePickPayload {
  xPercent: number;
  yPercent: number;
  pixelX: number;
  pixelY: number;
  renderedWidth: number;
  renderedHeight: number;
}

interface ResourceMapProps {
  markers: ResourceMarker[];
  missingLocationNames?: string[];
  mapImageSrc?: string;
  mapNaturalSize?: {
    width: number;
    height: number;
  };
  iconAssets?: Partial<Record<MarkerType, string>>;
  enableCoordinatePicker?: boolean;
  onCoordinatePick?: (payload: CoordinatePickPayload) => void;
}

function markerIcon(type: MarkerType): string {
  if (type === "oak") return "🌳";
  if (type === "glowstone") return "✨";
  return "📍";
}

function markerLabel(type: MarkerType): string {
  if (type === "oak") return "Oak";
  if (type === "glowstone") return "Glowstone";
  return "Unknown";
}

export default function ResourceMap({
  markers,
  missingLocationNames = [],
  mapImageSrc = "/maps/heartopia-base-map.png",
  mapNaturalSize = { width: 1024, height: 1024 },
  iconAssets,
  enableCoordinatePicker = false,
  onCoordinatePick,
}: ResourceMapProps) {
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(markers[0]?.id ?? null);
  const [lastPicked, setLastPicked] = useState<CoordinatePickPayload | null>(null);

  const activeMarker = useMemo(
    () => markers.find((marker) => marker.id === activeMarkerId) ?? null,
    [activeMarkerId, markers],
  );

  useEffect(() => {
    if (missingLocationNames.length === 0) return;

    for (const name of missingLocationNames) {
      console.warn(`[HeartopiaMap] Missing coordinate mapping for location: ${name}`);
    }
  }, [missingLocationNames]);

  function handleMapClick(event: React.MouseEvent<HTMLDivElement>): void {
    if (!enableCoordinatePicker) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const rawX = event.clientX - rect.left;
    const rawY = event.clientY - rect.top;

    const xPercent = Number(((rawX / rect.width) * 100).toFixed(3));
    const yPercent = Number(((rawY / rect.height) * 100).toFixed(3));

    const payload: CoordinatePickPayload = {
      xPercent: Math.max(0, Math.min(100, xPercent)),
      yPercent: Math.max(0, Math.min(100, yPercent)),
      pixelX: Math.round(rawX),
      pixelY: Math.round(rawY),
      renderedWidth: Math.round(rect.width),
      renderedHeight: Math.round(rect.height),
    };

    console.log("[HeartopiaMapPicker]", payload);
    setLastPicked(payload);
    onCoordinatePick?.(payload);
  }

  return (
    <div className={styles.mapCard}>
      <header className={styles.mapHeader}>
        <div>
          <p className={styles.mapEyebrow}>Interactive Overlay</p>
          <h3>Resource Spawn Map</h3>
        </div>
        <div className={styles.headerPills}>
          <span>{markers.length} markers</span>
          {enableCoordinatePicker ? <span className={styles.pickerOn}>Admin Picker ON</span> : null}
        </div>
      </header>

      <div className={styles.mapShell}>
        <div
          className={styles.mapCanvas}
          style={{ aspectRatio: `${mapNaturalSize.width} / ${mapNaturalSize.height}` }}
          onClick={handleMapClick}
          role={enableCoordinatePicker ? "application" : undefined}
          aria-label={
            enableCoordinatePicker
              ? "Heartopia map with coordinate picker enabled"
              : "Heartopia map with daily resource markers"
          }
        >
          <Image
            src={mapImageSrc}
            alt="Heartopia world map with resource markers"
            fill
            priority
            sizes="(max-width: 900px) 100vw, 720px"
            className={styles.mapImage}
          />

          {markers.map((marker) => {
            const isActive = marker.id === activeMarker?.id;
            const iconSrc = marker.iconSrc ?? iconAssets?.[marker.type];

            return (
              <button
                key={marker.id}
                type="button"
                className={`${styles.marker} ${isActive ? styles.markerActive : ""}`}
                style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                onMouseEnter={() => setActiveMarkerId(marker.id)}
                onFocus={() => setActiveMarkerId(marker.id)}
                onClick={(event) => {
                  event.stopPropagation();
                  setActiveMarkerId(marker.id);
                }}
                aria-label={`${markerLabel(marker.type)} at ${marker.name} (${marker.x}%, ${marker.y}%)`}
              >
                <span className={styles.markerFrame}>
                  <span className={styles.markerIconWrap}>
                    {iconSrc ? (
                      <Image
                        src={iconSrc}
                        alt=""
                        width={32}
                        height={32}
                        className={styles.markerIconAsset}
                        aria-hidden
                      />
                    ) : (
                      <span className={styles.markerEmoji} aria-hidden>
                        {markerIcon(marker.type)}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            );
          })}

          {enableCoordinatePicker && lastPicked ? (
            <span
              className={styles.pickedDot}
              style={{ left: `${lastPicked.xPercent}%`, top: `${lastPicked.yPercent}%` }}
              aria-hidden
            />
          ) : null}
        </div>
      </div>

      {activeMarker ? null : <p className={styles.emptyHint}>No mapped markers in the latest report.</p>}
    </div>
  );
}
