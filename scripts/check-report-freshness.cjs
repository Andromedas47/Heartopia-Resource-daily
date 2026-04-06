const fs = require("fs");
const { MongoClient } = require("mongodb");

function writeOutput(key, value) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) return;

  const normalized = String(value ?? "").replace(/\r?\n/g, " ");
  fs.appendFileSync(outputPath, `${key}=${normalized}\n`, "utf8");
}

function flushOutputs(result) {
  writeOutput("status", result.status);
  writeOutput("latest_date", result.latestDate);
  writeOutput("latest_scraped_at", result.latestScrapedAt);
  writeOutput("age_hours", result.ageHours);
  writeOutput("threshold_hours", result.thresholdHours);
}

async function main() {
  const result = {
    status: "error",
    latestDate: "",
    latestScrapedAt: "",
    ageHours: "",
    thresholdHours: "",
  };

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || "heartopia";
  const collectionName = process.env.REPORT_COLLECTION || "daily_reports";
  const thresholdRaw = process.env.REPORT_STALE_HOURS || "8";
  const thresholdHours = Number(thresholdRaw);
  result.thresholdHours = thresholdRaw;

  let client;

  try {
    if (!uri) {
      throw new Error("MONGODB_URI is missing");
    }

    if (!Number.isFinite(thresholdHours) || thresholdHours <= 0) {
      throw new Error(`REPORT_STALE_HOURS must be a positive number, got: ${thresholdRaw}`);
    }

    result.thresholdHours = thresholdHours.toString();
    client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });
    await client.connect();

    const latestReport = await client
      .db(dbName)
      .collection(collectionName)
      .find({}, { projection: { date: 1, scrapedAt: 1 } })
      .sort({ scrapedAt: -1, date: -1 })
      .limit(1)
      .next();

    if (!latestReport) {
      result.status = "missing";
      throw new Error(`No documents found in ${dbName}.${collectionName}`);
    }

    const scrapedAt = new Date(latestReport.scrapedAt);
    if (Number.isNaN(scrapedAt.getTime())) {
      result.status = "error";
      result.latestDate = String(latestReport.date ?? "");
      result.latestScrapedAt = String(latestReport.scrapedAt ?? "");
      throw new Error("Latest report has invalid scrapedAt value");
    }

    const ageHours = Number(((Date.now() - scrapedAt.getTime()) / (1000 * 60 * 60)).toFixed(2));

    result.latestDate = String(latestReport.date ?? "");
    result.latestScrapedAt = scrapedAt.toISOString();
    result.ageHours = ageHours.toFixed(2);

    if (ageHours > thresholdHours) {
      result.status = "stale";
      throw new Error(`Latest report is stale (${result.ageHours}h old, threshold ${thresholdHours}h)`);
    }

    result.status = "fresh";
    flushOutputs(result);
    console.log(
      `[freshness] OK - latest date ${result.latestDate}, scrapedAt ${result.latestScrapedAt}, age ${result.ageHours}h`
    );
  } catch (error) {
    flushOutputs(result);
    console.error(`[freshness] FAILED - ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  } finally {
    if (client) {
      await client.close();
    }
  }
}

main().catch(() => {
  process.exit(1);
});
