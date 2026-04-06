import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import reportsRouter from './routes/reports';
import locationMappingsRouter from './routes/locationMappings';

// โหลด .env จาก root project
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

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

// ── 404 fallback ───────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

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

main();
