import { Router, Request, Response } from 'express';
import { DailyReport } from '../models/DailyReport';

const router = Router();

// ── GET /api/reports ───────────────────────────────────────────────────────
// รายการรายงานทั้งหมด (ล่าสุดก่อน, page/limit support)
router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const page  = Math.max(Number(req.query.page)  || 1, 1);
    const skip  = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      DailyReport.find()
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .select('-resources.rawText -codes.rawText'), // ไม่ส่ง rawText เพื่อลดขนาด
      DailyReport.countDocuments(),
    ]);

    res.json({
      success: true,
      data: reports,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

// ── GET /api/reports/latest ────────────────────────────────────────────────
// รายงานล่าสุด (แร่วันนี้ + โค้ดล่าสุดที่มีการแจก)
router.get('/latest', async (_req: Request, res: Response) => {
  try {
    const weatherPattern = /(สภาพอากาศวันนี้|พยากรณ์อากาศ|อากาศวันนี้|weather)/i;

    const [latestAnyReport, latestResourceReport, latestWeatherCandidates, latestCodeReport] = await Promise.all([
      DailyReport.findOne({
        $or: [
          { 'resources.found': true },
          { 'codes.found': true },
        ],
      })
        .sort({ date: -1 })
        .lean(),
      DailyReport.findOne({ 'resources.locations.0': { $exists: true } })
        .sort({ date: -1 })
        .lean(),
      DailyReport.find({
        'resources.rawText': { $type: 'string', $ne: '' },
      })
        .sort({ date: -1 })
        .limit(60)
        .select('date resources')
        .lean(),
      DailyReport.findOne({ 'codes.items.0': { $exists: true } })
        .sort({ date: -1 })
        .lean(),
    ]);

    const latestWeatherReport =
      latestWeatherCandidates.find((report) => weatherPattern.test(report.resources?.rawText ?? '')) ?? null;

    const baseReport = latestAnyReport ?? latestResourceReport ?? latestWeatherReport ?? latestCodeReport;

    if (!baseReport) {
      res.status(404).json({ success: false, error: 'No reports found' });
      return;
    }

    const resourceSource = latestResourceReport ?? latestWeatherReport ?? baseReport;
    const weatherSource = latestWeatherReport ?? latestResourceReport ?? baseReport;
    const codeSource = latestCodeReport ?? baseReport;

    const fusionData = {
      ...baseReport,
      resources: {
        found: Boolean(
          resourceSource?.resources?.found ||
          weatherSource?.resources?.found,
        ),
        rawText: weatherSource?.resources?.rawText ?? '',
        locations: resourceSource?.resources?.locations ?? [],
      },
      codes: codeSource?.codes ?? { found: false, items: [], rawText: '' },
      codeLastUpdated: latestCodeReport?.date ?? null,
      resourceLastUpdated: latestResourceReport?.date ?? null,
      weatherLastUpdated: latestWeatherReport?.date ?? null,
    };

    res.json({ success: true, data: fusionData });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

// ── GET /api/reports/:date ─────────────────────────────────────────────────
// รายงานวันที่ระบุ เช่น /api/reports/2026-04-02
router.get('/:date', async (req: Request, res: Response) => {
  try {
    const { date } = req.params as { date: string };

    // validate format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ success: false, error: 'Invalid date format. Use YYYY-MM-DD' });
      return;
    }

    const report = await DailyReport.findOne({ date });
    if (!report) {
      res.status(404).json({ success: false, error: `No report for date: ${date}` });
      return;
    }

    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;