# Heartopia Production Deploy Checklist

Use this checklist to deploy an always-on setup where data is updated automatically even when your local machine is off.

## 1. Deploy Data Layer (MongoDB Atlas)

1. Create a MongoDB Atlas cluster.
2. Create a database user with read/write access for the Heartopia database.
3. Add network access (allow GitHub Actions and backend host access).
4. Save the connection string as MONGODB_URI.
5. Optional: decide your production DB name (default in code is `heartopia`).

## 2. Deploy Backend API (Render / Railway / Fly.io)

1. Deploy the backend folder as a Node service.
2. Set environment variables on the backend host:
   - MONGODB_URI
   - PORT (if host requires a fixed port)
   - LOCATION_MAPPINGS_WRITE_API_KEY (required for write endpoints)
   - CORS_ORIGINS (comma-separated trusted frontend origins)
   - JSON_BODY_LIMIT (optional, default `64kb`)
   - LOCATION_BULK_MAX_ITEMS (optional, default `200`)
   - LOCATION_WRITE_RATE_LIMIT_MAX (optional, default `60` per 15 minutes)
   - TRUST_PROXY (set `1` for one reverse proxy hop, `true` for full proxy trust if required by your platform)
3. Verify health endpoint responds:
   - GET /api/health
4. Verify data endpoints:
   - GET /api/reports/latest
   - GET /api/location-mappings
5. Verify protected write endpoints require API key:
   - POST /api/location-mappings/upsert
   - POST /api/location-mappings/upsert-many
   - POST /api/location-mappings/seed-defaults

## 3. Deploy Frontend (Vercel)

1. Deploy the frontend folder as a Next.js app.
2. Set HEARTOPIA_API_URL to the deployed backend URL.
3. Validate dashboard loads production data.

## 4. Configure GitHub Actions for Scheduled Scraping

Set these repository secrets:

- MONGODB_URI
- ALERT_EMAIL_TO
- ALERT_EMAIL_FROM
- SMTP_HOST
- SMTP_PORT
- SMTP_USERNAME
- SMTP_PASSWORD
- SMTP_SECURE (optional, use `true` for SMTPS)

Set these repository variables (optional, defaults exist):

- MONGODB_DB_NAME (default: heartopia)
- REPORT_STALE_HOURS (default: 8)
- SCRAPE_MAX_ATTEMPTS (default: 3)
- SCRAPE_TIMEOUT_MINUTES (default: 25)

## 5. Verify Automation End-to-End

1. Manually trigger the workflow once (`workflow_dispatch`).
2. Confirm logs show scrape success.
3. Confirm latest report timestamp in DB is updated.
4. Confirm frontend displays updated report.
5. Trigger a controlled failure and confirm alert email is received.
6. Confirm APIFY token is never present in query strings or logs.

## 6. Ongoing Operations

1. Rotate SMTP and DB credentials periodically.
2. Rotate `LOCATION_MAPPINGS_WRITE_API_KEY` periodically and after any suspected leak.
3. Review failed runs weekly and clean old artifacts.
4. Keep Playwright and browser dependencies updated.

## 7. Security Regression Checklist

1. Unauthenticated write calls return `401`/`403`.
2. CORS rejects unknown origins.
3. Oversized request bodies and bulk payloads above cap are rejected.
4. API responses return generic errors only (no stack/error internals).
5. Security headers from `helmet` are present.
6. Write route rate limiting is active.
7. `TRUST_PROXY` is set correctly for your hosting infrastructure.

## 8. Key Rotation Policy

1. Rotate `LOCATION_MAPPINGS_WRITE_API_KEY` at least every 30 days.
2. Rotate immediately on suspected leak, staff change, or CI secret exposure.
3. Keep overlap window short: publish new key, deploy clients, revoke old key within 24 hours.
4. Validate failed-key traffic drops after revocation.
5. Track all key rotations in `docs/security/key-rotation-log.md`.

## 9. Long-term Auth Migration (Shared Key -> Signed/JWT)

1. Add key identifier (`kid`) support to allow safe key versioning.
2. Move from static shared key to signed tokens with expiry (`exp`) and issuer (`iss`) claims.
3. Scope write permissions by route/action in token claims.
4. Enforce short-lived tokens and automatic key rollover.
5. Keep shared key fallback only during migration, then remove.

## 10. Done Criteria

You can consider production automation complete when:

1. Scheduled workflow runs without manual CLI usage.
2. Data freshness check passes consistently.
3. Email alert is received whenever scrape fails or data becomes stale.
4. Frontend always reads from production API + production database.
