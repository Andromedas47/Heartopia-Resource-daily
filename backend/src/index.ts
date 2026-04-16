import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import helmet from 'helmet';
import reportsRouter from './routes/reports';
import locationMappingsRouter from './routes/locationMappings';

// โหลด .env จาก root project
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const PORT = process.env.PORT || 4000;

const trustedOrigins = (
  process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://127.0.0.1:3000'
)
  .split(',')
  .map((value) => value.trim())
  .filter((value) => value.length > 0);

const jsonBodyLimit = process.env.JSON_BODY_LIMIT ?? '64kb';
const trustProxy = process.env.TRUST_PROXY ?? 'false';

function parseTrustProxySetting(value: string): boolean | number {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;

  const numericValue = Number(normalized);
  if (Number.isInteger(numericValue) && numericValue >= 0) {
    return numericValue;
  }

  return false;
}

export function createApp() {
  const app = express();

  app.set('trust proxy', parseTrustProxySetting(trustProxy));

  // ── Middleware ─────────────────────────────────────────────────────────────
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        // Allow server-side and same-origin calls with no Origin header.
        if (!origin) {
          callback(null, true);
          return;
        }

        if (trustedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error('CORS origin is not allowed'));
      },
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    })
  );
  app.use(express.json({ limit: jsonBodyLimit }));

  // ── Routes ─────────────────────────────────────────────────────────────────
  app.get('/api/health', (_req, res) => {
    const dbState = mongoose.connection.readyState;
    const states: Record<number, string> = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    res.json({
      status: 'ok',
      db: states[dbState] ?? 'unknown',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api/reports', reportsRouter);
  app.use('/api/location-mappings', locationMappingsRouter);

  app.use((err: Error, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err.message === 'CORS origin is not allowed') {
      res.status(403).json({ success: false, error: 'CORS origin is not allowed' });
      return;
    }

    next(err);
  });

  // ── 404 fallback ───────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
  });

  return app;
}

const app = createApp();

// ── Connect DB → Start Server ──────────────────────────────────────────────
async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not set in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, { dbName: 'heartopia' });
    console.log('✅ Connected to MongoDB Atlas');

    app.listen(PORT, () => {
      console.log(`🚀 Heartopia API listening on http://localhost:${PORT}`);
      console.log(`   GET /api/health`);
      console.log(`   GET /api/reports`);
      console.log(`   GET /api/reports/latest`);
      console.log(`   GET /api/reports/:date`);
      console.log(`   GET /api/location-mappings`);
    });
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  void main();
}
