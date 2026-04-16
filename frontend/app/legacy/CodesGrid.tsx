"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./CodesGrid.module.css";

interface CodeItem {
  code: string;
  detail: string;
  expiry: string;
}

interface InGameWeatherProps {
  today: string[];
  forecast: string[];
}

interface ToastState {
  key: number;
  message: string;
}

function normalizeOptionalText(value: string): string {
  const cleaned = value.trim();
  if (!cleaned || cleaned === "-" || cleaned.toLowerCase() === "n/a") {
    return "";
  }
  return cleaned;
}

function weatherIcon(text: string): string {
  if (/ฝน|rain|storm|พายุ/i.test(text)) return "🌧️";
  if (/หิมะ|snow/i.test(text)) return "❄️";
  if (/สายรุ้ง|rainbow/i.test(text)) return "🌈";
  if (/แดด|sun|clear/i.test(text)) return "☀️";
  if (/เมฆ|cloud/i.test(text)) return "☁️";
  return "✨";
}

export function InGameWeather({ today, forecast }: InGameWeatherProps) {
  const totalEntries = today.length + forecast.length;
  const allEntries = [...today, ...forecast].filter((entry) => entry.trim().length > 0);
  const primary = allEntries[0] ?? "No weather data";
  const secondaryA = allEntries[1] ?? "Humidity data unavailable";
  const secondaryB = allEntries[2] ?? "Wind data unavailable";
  const forecastSlots = allEntries.slice(0, 3);

  const slotLabels = ["Morning", "Afternoon", "Evening"];

  return (
    <div className={styles.weatherCard}>
      {totalEntries === 0 ? (
        <p className={styles.weatherEmpty}>No weather details found in latest post.</p>
      ) : (
        <div className={styles.weatherLayout}>
          <div className={styles.weatherMain}>
            <div className={styles.weatherMainIcon} aria-hidden>
              {weatherIcon(primary)}
            </div>

            <div className={styles.weatherMainText}>
              <p className={styles.weatherPrimary}>{primary}</p>
              <p>Live game weather note</p>
            </div>

            <div className={styles.weatherMeta}>
              <span>{secondaryA}</span>
              <span>{secondaryB}</span>
            </div>
          </div>

          <div className={styles.weatherSlots}>
            {slotLabels.map((label, index) => {
              const slotValue = forecastSlots[index] ?? "-";
              return (
                <article key={label} className={styles.weatherSlot}>
                  <span>{label}</span>
                  <strong aria-hidden>{weatherIcon(slotValue)}</strong>
                  <p>{slotValue}</p>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CodesGrid({ items }: { items: CodeItem[] }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const cleanItems = useMemo(
    () =>
      items
        .map((item) => ({
          code: normalizeOptionalText(item.code),
          detail: normalizeOptionalText(item.detail),
          expiry: normalizeOptionalText(item.expiry),
        }))
        .filter((item) => item.code.length > 0),
    [items],
  );

  const allCodes = useMemo(() => cleanItems.map((item) => item.code).join("\n"), [cleanItems]);

  useEffect(() => {
    if (!toast) return;

    const timerId = window.setTimeout(() => {
      setToast(null);
    }, 1300);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [toast]);

  async function copyToClipboard(value: string, successMessage: string): Promise<void> {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setToast({ key: Date.now(), message: successMessage });
    } catch {
      setToast({ key: Date.now(), message: "Copy failed" });
    }
  }

  if (cleanItems.length === 0) {
    return <p className={styles.emptyState}>No redeem codes available in the latest report.</p>;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.copyAllButton}
          onClick={() => void copyToClipboard(allCodes, "Copied all codes!")}
        >
          Copy All Codes
        </button>
      </div>

      <ul className={styles.grid}>
        {cleanItems.map((item, index) => (
          <li key={`${item.code}-${index}`} className={styles.card}>
            {index < 2 ? <span className={styles.newBadge}>New</span> : null}
            <div className={styles.codeRow}>
              <strong>{item.code}</strong>
              <button
                type="button"
                className={styles.copyButton}
                onClick={() => void copyToClipboard(item.code, `Copied ${item.code}`)}
                aria-label={`Copy ${item.code}`}
              >
                ⧉
              </button>
            </div>

            {item.detail || item.expiry ? (
              <p className={styles.meta}>
                {item.detail ? item.detail : null}
                {item.detail && item.expiry ? " · " : null}
                {item.expiry ? `Expires ${item.expiry}` : null}
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      {toast ? (
        <p className={styles.toast} role="status" aria-live="polite" key={toast.key}>
          {toast.message}
        </p>
      ) : null}
    </div>
  );
}
