import mongoose, { Document, Schema } from 'mongoose';

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

export interface IDailyReport extends Document {
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
    date: { type: String, required: true, unique: true, index: true },
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
