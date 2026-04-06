import mongoose, { Document, Schema } from 'mongoose';

export interface ILocationMapping extends Document {
  locationName: string;
  aliases: string[];
  normalizedName: string;
  normalizedAliases: string[];
  x: number;
  y: number;
  createdAt: Date;
  updatedAt: Date;
}

const LocationMappingSchema = new Schema<ILocationMapping>(
  {
    locationName: { type: String, required: true, trim: true },
    aliases: { type: [String], default: [] },
    normalizedName: { type: String, required: true, unique: true, index: true },
    normalizedAliases: { type: [String], default: [], index: true },
    x: { type: Number, required: true, min: 0, max: 100 },
    y: { type: Number, required: true, min: 0, max: 100 },
  },
  {
    collection: 'location_mapping',
    timestamps: true,
  }
);

export const LocationMapping =
  (mongoose.models.LocationMapping as mongoose.Model<ILocationMapping>) ||
  mongoose.model<ILocationMapping>('LocationMapping', LocationMappingSchema);
