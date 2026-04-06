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
  const [query, setQuery] = useState("");

  const filteredToday = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return today;
    return today.filter((item) => item.toLowerCase().includes(keyword));
  }, [today, query]);

  const filteredForecast = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return forecast;
    return forecast.filter((item) => item.toLowerCase().includes(keyword));
  }, [forecast, query]);

  const totalEntries = today.length + forecast.length;

  return (
    <div className={styles.weatherCard}>
      <header className={styles.weatherHeader}>
        <h3>🌦️ In-Game Weather</h3>
        <span>{totalEntries} notes</span>
      </header>

      <div className={styles.weatherSearchRow}>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search weather notes"
          aria-label="Search in-game weather notes"
        />
      </div>

      {totalEntries === 0 ? (
        <p className={styles.weatherEmpty}>No weather details found in latest post.</p>
      ) : (
        <div className={styles.weatherColumns}>
          <section>
            <h4>Today</h4>
            {filteredToday.length > 0 ? (
              <ul>
                {filteredToday.map((item, index) => (
                  <li key={`today-${index}`}>
                    <span aria-hidden>{weatherIcon(item)}</span>
                    <p>{item}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.weatherSmallEmpty}>No today result for this keyword.</p>
            )}
          </section>

          <section>
            <h4>Forecast</h4>
            {filteredForecast.length > 0 ? (
              <ul>
                {filteredForecast.map((item, index) => (
                  <li key={`forecast-${index}`}>
                    <span aria-hidden>{weatherIcon(item)}</span>
                    <p>{item}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.weatherSmallEmpty}>No forecast result for this keyword.</p>
            )}
          </section>
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
            <div className={styles.codeRow}>
              <strong>{item.code}</strong>
              <button
                type="button"
                className={styles.copyButton}
                onClick={() => void copyToClipboard(item.code, `Copied ${item.code}`)}
              >
                Copy
              </button>
            </div>

            {item.detail || item.expiry ? (
              <p className={styles.meta}>
                {item.detail ? item.detail : null}
                {item.detail && item.expiry ? " | " : null}
                {item.expiry ? `Expiry ${item.expiry}` : null}
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
