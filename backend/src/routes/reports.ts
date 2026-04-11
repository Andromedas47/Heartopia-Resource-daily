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
    // 1. ดึงรายงานฉบับล่าสุด (เพื่อเอาพิกัดแร่ของวันนี้) 
    // ใช้ .lean() เพื่อแปลงจาก Mongoose Object เป็น JSON Object ธรรมดา จะได้แก้ไขค่าง่ายๆ
    const latestReport = await DailyReport.findOne({ "resources.found": true }).sort({ date: -1 });

    if (!latestReport) {
      res.status(404).json({ success: false, error: 'No reports found' });
      return;
    }

    // 2. ดึงรายงานฉบับล่าสุด "ที่เคยเจอโค้ด" (ย้อนอดีตไปหาใบที่มีโค้ด)
    const latestCodeReport = await DailyReport.findOne({ "codes.found": true })
      .sort({ date: -1 })
      .lean();

    // 3. ประกอบร่างข้อมูล (Fusion Data)
    const fusionData = {
      ...latestReport, // เอาข้อมูลของวันนี้มากางไว้ก่อน (ได้แร่ของวันนี้มาแล้ว)
      
      // เขียนทับหมวด codes ด้วยข้อมูลจากวันที่มีโค้ดแจกล่าสุด
      codes: latestCodeReport ? latestCodeReport.codes : { found: false, items: [], rawText: '' },
      
      // ✨ เพิ่มตัวแปรใหม่ส่งไปให้หน้าเว็บ เพื่อบอกว่าโค้ดอัปเดตวันไหน
      codeLastUpdated: latestCodeReport ? latestCodeReport.date : null
    };

    // ส่งข้อมูลที่ฟิวชั่นแล้วกลับไปให้ Vercel
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