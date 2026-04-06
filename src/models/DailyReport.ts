import mongoose, { Document, Schema } from 'mongoose';

// ─── Sub-types ──────────────────────────────────────────────────────────────

export interface ILocation {
  type: 'oak' | 'glowstone' | 'unknown';
  name: string;
  cleanedLocationName?: string;
}

export interface ICode {
  code: string;
  detail: string;
  expiry: string;
}

// ─── Main Interface ──────────────────────────────────────────────────────────

export interface IDailyReport extends Document {
  /** YYYY-MM-DD — unique key per day */
  date: string;
  scrapedAt: Date;
  resources: {
    found: boolean;
    rawText: string;
    locations: ILocation[];
  };
  codes: {
    found: boolean;
    rawText: string;
    items: ICode[];
  };
}

// ─── Schema ─────────────────────────────────────────────────────────────────

const LocationSchema = new Schema<ILocation>(
  {
    type: { type: String, enum: ['oak', 'glowstone', 'unknown'], default: 'unknown' },
    name: { type: String, required: true },
    cleanedLocationName: { type: String, default: '' },
  },
  { _id: false }
);

const CodeSchema = new Schema<ICode>(
  {
    code: { type: String, required: true },
    detail: { type: String, default: '' },
    expiry: { type: String, default: '' },
  },
  { _id: false }
);

const DailyReportSchema = new Schema<IDailyReport>(
  {
    date: { type: String, required: true, unique: true, index: true }, // "2026-04-02"
    scrapedAt: { type: Date, default: () => new Date() },
    resources: {
      found: { type: Boolean, default: false },
      rawText: { type: String, default: '' },
      locations: { type: [LocationSchema], default: [] },
    },
    codes: {
      found: { type: Boolean, default: false },
      rawText: { type: String, default: '' },
      items: { type: [CodeSchema], default: [] },
    },
  },
  {
    collection: 'daily_reports',
    timestamps: true,
  }
);

export const DailyReport = mongoose.model<IDailyReport>('DailyReport', DailyReportSchema);
