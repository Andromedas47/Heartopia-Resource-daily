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
// รายงานล่าสุด (วันนี้ หรือวันล่าสุดที่มีข้อมูล)
router.get('/latest', async (_req: Request, res: Response) => {
  try {
    const report = await DailyReport.findOne().sort({ date: -1 });
    if (!report) {
      res.status(404).json({ success: false, error: 'No reports found' });
      return;
    }
    res.json({ success: true, data: report });
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
