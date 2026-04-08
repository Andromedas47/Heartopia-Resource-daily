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
3. Verify health endpoint responds:
   - GET /api/health
4. Verify data endpoints:
   - GET /api/reports/latest
   - GET /api/location-mappings

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

## 6. Ongoing Operations

1. Rotate Facebook auth state regularly.
2. Rotate SMTP and DB credentials periodically.
3. Review failed runs weekly and clean old artifacts.
4. Keep Playwright and browser dependencies updated.

## 7. Done Criteria

You can consider production automation complete when:

1. Scheduled workflow runs without manual CLI usage.
2. Data freshness check passes consistently.
3. Email alert is received whenever scrape fails or data becomes stale.
4. Frontend always reads from production API + production database.
