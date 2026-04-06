import { Request, Response, Router } from 'express';
import { LocationMapping } from '../models/LocationMapping';
import {
  dedupeNormalizedNames,
  normalizeLocationName,
  sanitizeLocationName,
} from '../utils/locationName';

const router = Router();

interface MappingInput {
  locationName: string;
  aliases?: string[];
  x: number;
  y: number;
}

const DEFAULT_ZONE_MAPPINGS: MappingInput[] = [
  { locationName: 'หน้าบ้านหมายเลข 01', aliases: ['บ้านหมายเลข 01', 'หมายเลข 01', 'เขต 01', 'โซน 01'], x: 29, y: 69 },
  { locationName: 'หน้าบ้านหมายเลข 02', aliases: ['บ้านหมายเลข 02', 'หมายเลข 02', 'เขต 02', 'โซน 02'], x: 27, y: 58 },
  { locationName: 'หน้าบ้านหมายเลข 03', aliases: ['บ้านหมายเลข 03', 'หมายเลข 03', 'เขต 03', 'โซน 03'], x: 25, y: 46 },
  { locationName: 'หน้าบ้านหมายเลข 04', aliases: ['บ้านหมายเลข 04', 'หมายเลข 04', 'เขต 04', 'โซน 04'], x: 24, y: 35 },
  { locationName: 'หน้าบ้านหมายเลข 05', aliases: ['บ้านหมายเลข 05', 'หมายเลข 05', 'เขต 05', 'โซน 05'], x: 38, y: 24 },
  { locationName: 'หน้าบ้านหมายเลข 06', aliases: ['บ้านหมายเลข 06', 'หมายเลข 06', 'เขต 06', 'โซน 06'], x: 48, y: 24 },
  { locationName: 'หน้าบ้านหมายเลข 07', aliases: ['บ้านหมายเลข 07', 'หมายเลข 07', 'เขต 07', 'โซน 07'], x: 58, y: 24 },
  { locationName: 'หน้าบ้านหมายเลข 08', aliases: ['บ้านหมายเลข 08', 'หมายเลข 08', 'เขต 08', 'โซน 08'], x: 67, y: 24 },
  { locationName: 'หน้าบ้านหมายเลข 09', aliases: ['บ้านหมายเลข 09', 'หมายเลข 09', 'เขต 09', 'โซน 09'], x: 75, y: 35 },
  { locationName: 'หน้าบ้านหมายเลข 10', aliases: ['บ้านหมายเลข 10', 'หมายเลข 10', 'เขต 10', 'โซน 10'], x: 74, y: 47 },
  { locationName: 'หน้าบ้านหมายเลข 11', aliases: ['บ้านหมายเลข 11', 'หมายเลข 11', 'เขต 11', 'โซน 11'], x: 72, y: 58 },
  { locationName: 'หน้าบ้านหมายเลข 12', aliases: ['บ้านหมายเลข 12', 'หมายเลข 12', 'เขต 12', 'โซน 12'], x: 71, y: 69 },
];

function toPercentCoordinate(value: number, field: 'x' | 'y'): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${field} must be a number`);
  }
  if (parsed < 0 || parsed > 100) {
    throw new Error(`${field} must be between 0 and 100`);
  }
  return Number(parsed.toFixed(2));
}

function buildMappingPayload(input: MappingInput) {
  const locationName = sanitizeLocationName(input.locationName ?? '');
  if (!locationName) {
    throw new Error('locationName is required');
  }

  const aliases = dedupeNormalizedNames(input.aliases ?? []);
  const normalizedName = normalizeLocationName(locationName);
  const normalizedAliases = dedupeNormalizedNames(aliases).map((alias) => normalizeLocationName(alias));

  if (!normalizedName) {
    throw new Error('locationName is invalid after normalization');
  }

  return {
    locationName,
    aliases,
    normalizedName,
    normalizedAliases: Array.from(new Set(normalizedAliases.filter((value) => value !== normalizedName))),
    x: toPercentCoordinate(input.x, 'x'),
    y: toPercentCoordinate(input.y, 'y'),
  };
}

// GET /api/location-mappings
router.get('/', async (_req: Request, res: Response) => {
  try {
    const mappings = await LocationMapping.find()
      .sort({ locationName: 1 })
      .select('-__v')
      .lean();

    res.json({ success: true, data: mappings });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

// POST /api/location-mappings/upsert
router.post('/upsert', async (req: Request, res: Response) => {
  try {
    const payload = buildMappingPayload(req.body as MappingInput);

    const mapping = await LocationMapping.findOneAndUpdate(
      { normalizedName: payload.normalizedName },
      { $set: payload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).select('-__v');

    res.status(201).json({ success: true, data: mapping });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ success: false, error: message });
  }
});

// POST /api/location-mappings/upsert-many
router.post('/upsert-many', async (req: Request, res: Response) => {
  try {
    const rawItems = Array.isArray(req.body) ? req.body : (req.body?.items as MappingInput[] | undefined);
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      res.status(400).json({ success: false, error: 'Request body must be a non-empty array or { items: [...] }' });
      return;
    }

    const payloads = rawItems.map((item, index) => {
      try {
        return buildMappingPayload(item);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`items[${index}]: ${message}`);
      }
    });

    const result = await LocationMapping.bulkWrite(
      payloads.map((payload) => ({
        updateOne: {
          filter: { normalizedName: payload.normalizedName },
          update: { $set: payload },
          upsert: true,
        },
      }))
    );

    res.status(201).json({
      success: true,
      data: {
        total: payloads.length,
        inserted: result.upsertedCount,
        updated: result.modifiedCount,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ success: false, error: message });
  }
});

// POST /api/location-mappings/seed-defaults
router.post('/seed-defaults', async (_req: Request, res: Response) => {
  try {
    const payloads = DEFAULT_ZONE_MAPPINGS.map((item) => buildMappingPayload(item));
    const result = await LocationMapping.bulkWrite(
      payloads.map((payload) => ({
        updateOne: {
          filter: { normalizedName: payload.normalizedName },
          update: { $set: payload },
          upsert: true,
        },
      }))
    );

    res.status(201).json({
      success: true,
      data: {
        total: payloads.length,
        inserted: result.upsertedCount,
        updated: result.modifiedCount,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;
