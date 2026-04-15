import { test } from '@playwright/test'; // 👈 นำเข้าแค่ test ก็พอ ไม่ต้องใช้ chromium แล้ว
import path from 'path';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import { DailyReport, ILocation, ICode } from '../src/models/DailyReport';
import { connectDB, disconnectDB } from '../src/db';
import { cleanLocationName } from '../backend/src/utils/cleanLocationName';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const RESOURCE_LINE_PATTERNS: Array<{ type: ILocation['type']; regex: RegExp }> = [
  {
    type: 'oak',
    regex: /^[\s:*\-\u2022\u00b7]*?(?:ต้นไม้โอ๊ก|ไม้โอ๊ก|ไม้โอ๊ค)\s*(?:[:\-*•·]?\s*)?(.*)$/i,
  },
  {
    type: 'glowstone',
    regex: /^[\s:*\-\u2022\u00b7]*?หินเรืองแสง\s*(?:[:\-*•·]?\s*)?(.*)$/i,
  },
];

// ── Helper: ของคุณพิชญ์ (เหมือนเดิม 100%) ────────────────────────────────────
function parseLocations(text: string): ILocation[] {
  const locations: ILocation[] = [];
  const lines = text.split('\n');
  const seen = new Set<string>();

  const pushLocation = (type: ILocation['type'], value: string): void => {
    const cleanedLocationName = cleanLocationName(value);
    if (!cleanedLocationName) return;

    const key = `${type}:${cleanedLocationName.toLowerCase()}`;
    if (seen.has(key)) return;

    seen.add(key);
    locations.push({ type, name: cleanedLocationName, cleanedLocationName });
  };

  for (const line of lines) {
    const t = line.trim();
    if (!t || t.length > 150) continue;

    if (t.startsWith('#')) continue;

    let matchedFlexiblePattern = false;
    for (const pattern of RESOURCE_LINE_PATTERNS) {
      const match = t.match(pattern.regex);
      if (!match) continue;

      matchedFlexiblePattern = true;
      const candidateLocation = match[1]?.trim() ?? '';
      if (candidateLocation) {
        pushLocation(pattern.type, candidateLocation);
      }
      break;
    }
    if (matchedFlexiblePattern) continue;

    if (/ต้นไม้โอ๊ก|ไม้โอ๊ก|ไม้โอ๊ค/.test(t)) {
      const cleaned = t.replace(/ต้นไม้โอ๊ก|ไม้โอ๊ก|ไม้โอ๊ค/g, '');
      pushLocation('oak', cleaned || t);
    } else if (/หินเรืองแสง/.test(t)) {
      const cleaned = t.replace(/หินเรืองแสง/g, '');
      pushLocation('glowstone', cleaned || t);
    }
  }
  return locations;
}

test('parseLocations supports flexible resource line formats', () => {
  const rawText = [
    'ไม้โอ๊ก: หน้าบ้านหมายเลข 02',
    'ไม้โอ๊ก - หน้าบ้านหมายเลข 02',
    'ต้นไม้โอ๊ก หน้าบ้านหมายเลข 03',
    'ไม้โอ๊ค หน้าบ้านหมายเลข 04',
    'หินเรืองแสง: หน้าบ้านหมายเลข 08',
    '• ไม้โอ๊ก: หน้าบ้านหมายเลข 05',
    '#ไม้โอ๊ก: หน้าบ้านหมายเลข 06',
    'ไม้โอ๊ก:',
    'หินเรืองแสง - ',
    'หินเรืองแสง หน้าบ้านหมายเลข 08',
  ].join('\n');

  assert.deepStrictEqual(parseLocations(rawText), [
    { type: 'oak', name: 'หน้าบ้านหมายเลข 02', cleanedLocationName: 'หน้าบ้านหมายเลข 02' },
    { type: 'oak', name: 'หน้าบ้านหมายเลข 03', cleanedLocationName: 'หน้าบ้านหมายเลข 03' },
    { type: 'oak', name: 'หน้าบ้านหมายเลข 04', cleanedLocationName: 'หน้าบ้านหมายเลข 04' },
    { type: 'glowstone', name: 'หน้าบ้านหมายเลข 08', cleanedLocationName: 'หน้าบ้านหมายเลข 08' },
    { type: 'oak', name: 'หน้าบ้านหมายเลข 05', cleanedLocationName: 'หน้าบ้านหมายเลข 05' },
  ]);
});

function parseCodes(text: string): ICode[] {
  const codes: ICode[] = [];
  const seen = new Set<string>();
  const lines = text.split('\n');

  const codePattern = /(?:^|[\s:•·*\-])([a-zA-Z0-9][a-zA-Z0-9_-]{5,23})(?=$|[\s),.])/g;
  const sectionHint = /รวมโค้ดทั้งหมด|โค้ดเพิ่งค้นพบ|มาใหม่ล่าสุด|โค้ดที่ยังใช้งานได้|อัปเดตโค้ด/i;
  const skipLine = /\[IMG ALT\]|วิธีเติม|TAB|คอมเมนต์|#DailyHeartopia|#Heartopia|#แจกโค้ด/i;
  const noiseToken = /^(heartopia|dailyheartopia|facebook|reels|photo|photos|img|alt|www|http|check)$/i;
  const noiseTailMarkers = ['ความรู้สึกทั้งหมด', 'ความคิดเห็น', 'แชร์', 'ถูกใจ', 'แสดงความคิดเห็น', 'ดู '];

  const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const normalizeDetail = (value: string): string => {
    let detail = value.replace(/[•·*:\-]+/g, ' ').replace(/\s+/g, ' ').trim();
    const markerIndex = noiseTailMarkers.map((marker) => detail.indexOf(marker)).filter((index) => index >= 0).sort((a, b) => a - b)[0];
    if (markerIndex !== undefined) detail = detail.slice(0, markerIndex).trim();
    if (detail.includes('>')) detail = detail.split('>')[0].trim();
    detail = detail.replace(/\s\d+(?:\s*\/\s*\d+)?(?:\s+\d+){2,}\s*$/g, '').trim();
    if (detail.startsWith('(') && detail.endsWith(')')) detail = detail.slice(1, -1).trim();
    if (/^(โค้ดที่ยังใช้งานได้|รวมโค้ดทั้งหมด|โค้ดเพิ่งค้นพบ.*|โค้ดใหม่.*)$/i.test(detail)) return '';
    return detail;
  };

  const normalizeExpiry = (value: string): string => {
    let expiry = value.replace(/\s+/g, ' ').trim();
    expiry = expiry.replace(/มิ\.\s*\.ย\./g, 'มิ.ย.');
    const markerIndex = noiseTailMarkers.map((marker) => expiry.indexOf(marker)).filter((index) => index >= 0).sort((a, b) => a - b)[0];
    if (markerIndex !== undefined) expiry = expiry.slice(0, markerIndex).trim();
    return expiry;
  };

  let enteredCodeSection = false;
  let lastCodeItem: ICode | null = null;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\u00a0/g, ' ').trim();
    if (!line) continue;
    if (sectionHint.test(line)) enteredCodeSection = true;
    if (skipLine.test(line)) continue;
    if (/^#/.test(line)) continue;
    if (!enteredCodeSection && !/\d/.test(line)) continue;

    const expiryMatch = line.match(/หมดเขต[^\n]*/i);
    const expiry = expiryMatch ? normalizeExpiry(expiryMatch[0]) : '';
    const matches = [...line.matchAll(codePattern)];

    if (matches.length === 0) {
      if (!lastCodeItem) continue;
      const continuationExpiryMatch = line.match(/หมดเขต[^\n]*/i);
      if (continuationExpiryMatch && !lastCodeItem.expiry) {
        lastCodeItem.expiry = normalizeExpiry(continuationExpiryMatch[0]);
      }
      const continuationDetailRaw = line.replace(continuationExpiryMatch?.[0] ?? '', ' ');
      const continuationDetail = normalizeDetail(continuationDetailRaw);
      if (continuationDetail) {
        lastCodeItem.detail = normalizeDetail(`${lastCodeItem.detail} ${continuationDetail}`);
      }
      continue;
    }

    for (const m of matches) {
      const rawCode = m[1];
      const code = rawCode.replace(/[^a-zA-Z0-9_-]/g, '');
      const codeKey = code.toLowerCase();
      if (code.length < 6 || !/\d/.test(code) || /^x\d+$/i.test(code) || noiseToken.test(code) || seen.has(codeKey)) continue;

      seen.add(codeKey);
      const detailRaw = line.replace(new RegExp(`(^|\\s)${escapeRegExp(rawCode)}(?=\\s|$)`, 'i'), ' ').replace(expiry, ' ');
      const codeItem: ICode = { code, detail: normalizeDetail(detailRaw), expiry };
      codes.push(codeItem);
      lastCodeItem = codeItem;
    }
  }
  return codes;
}

function getTodayDateString(): string {
  return new Date().toLocaleDateString('fr-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' });
}

// ══════════════════════════════════════════════════════════════════════════════
test('Heartopia Daily: ตามล่าพิกัดแร่ + โค้ด (ผ่าน Apify) → บันทึกลง MongoDB', async () => {
  test.setTimeout(120000); // ให้เวลาบอท Apify วิ่งสัก 2 นาที

  console.log('🚀 เริ่มรันระบบดึงข้อมูลผ่าน Apify...');

  // 🔴 ต้องเอา API Token จากเว็บ Apify มาใส่ในไฟล์ .env (หรือ GitHub Secrets) ชื่อ APIFY_TOKEN นะครับ
  const APIFY_TOKEN = process.env.APIFY_TOKEN;
  // รหัสของบอท Facebook Pages Scraper (ถ้าใช้ตัวอื่นต้องเปลี่ยนชื่อตรงนี้นะครับ)
  const ACTOR_ID = 'apify~facebook-posts-scraper';

  if (!APIFY_TOKEN) {
    console.log('❌ ไม่พบ APIFY_TOKEN กรุณาตั้งค่าใน .env หรือ GitHub Secrets');
    return;
  }

  let posts: any[] = [];

  try {
    console.log('⏳ กำลังสั่งให้ Apify บุก Facebook (รอประมาณ 30-60 วินาที)...');
    
    // ยิง API สั่งรันบอทและรอรับผลลัพธ์ (Dataset) กลับมาทันที
    const response = await fetch(`https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        "captionText": false,
        "resultsLimit": 10,
        "startUrls": [
          { "url": "https://www.facebook.com/DailyHeartopia/" }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Apify Error: ${response.status} ${response.statusText}`);
    }

    posts = await response.json();
    console.log(`✅ ดึงข้อมูลสำเร็จ! ได้มา ${posts.length} โพสต์`);

  } catch (error) {
    console.log('❌ การเชื่อมต่อกับ Apify ล้มเหลว:', error);
    return;
  }

  // ── นำข้อความที่ได้มาเข้าเครื่องกรองของคุณพิชญ์ ─────────────────────────
  const orePostTriggers  = ['สรุปข้อมูลสำคัญ', 'ตำแหน่ง', 'ไม้โอ๊ก', 'ไม้โอ๊ค', 'หินเรืองแสง', 'ต้นไม้โอ๊ก', 'ประจำวัน', 'แร่', 'พิกัด'];
  const codePostTriggers = [
      'อัปเดตโค้ด', 
      'รวมโค้ดทั้งหมด', 
      'โค้ดที่ยังใช้งานได้', 
      'โค้ดเพิ่งค้นพบ', 
      'รหัสแลก', 
      'แจกโค้ด'
    ];

  let foundResourcePost = '';
  let foundCodePost     = '';

  for (const post of posts) {
    const fullText = post.text || ''; // ดึงข้อความออกมาจาก JSON

    const isOrePost  = orePostTriggers.some(kw => fullText.includes(kw));
    const isCodePost = codePostTriggers.some(kw => fullText.toLowerCase().includes(kw.toLowerCase()));

    if (isOrePost && !foundResourcePost) foundResourcePost = fullText;
    if (isCodePost && !foundCodePost) foundCodePost = fullText;
  }

  // ── แสดงผลลัพธ์ Console ─────────────────────────────────────────────────
  const thDate = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  console.log(`\n📅 รายงานประจำวัน Heartopia — ${thDate}\n`);

  if (foundResourcePost) {
    console.log('🪨 ไม้โอ๊กและหินเรืองแสง');
    foundResourcePost.split('\n').forEach((line: string) => {
      const t = line.trim();
      if (!t || t.length > 150) return;
      if (t.startsWith('#')) return;
      if (/ไม้โอ๊ก|ไม้โอ๊ค|หินเรืองแสง/.test(t)) console.log(`   ${t}`);
    });
  } else {
    console.log('🪨 ไม้โอ๊กและหินเรืองแสง\n   ❌ ไม่พบโพสต์วันนี้');
  }

  console.log('');
  if (foundCodePost) {
    console.log('🎁 โค้ด Redeem');
    const rawCodes = parseCodes(foundCodePost);
    if (rawCodes.length > 0) rawCodes.forEach(c => console.log(`   🔑 ${[c.code, c.detail, c.expiry].filter(Boolean).join(' ')}`));
    else console.log('   ⚠️  โค้ดอยู่ในรูปภาพ');
  } else {
    console.log('🎁 โค้ด Redeem\n   ❌ ไม่พบโพสต์วันนี้');
  }

  // ── Step 3: บันทึกลง MongoDB Atlas ──────────────────────────────────────
  console.log('\n💾 กำลังเชื่อมต่อ MongoDB Atlas...');
  await connectDB();

  try {
    const todayDate = getTodayDateString();
    const locations = parseLocations(foundResourcePost);
    const codes     = parseCodes(foundCodePost);

    const report = await DailyReport.findOneAndUpdate(
      { date: todayDate },
      {
        $set: {
          date: todayDate,
          scrapedAt: new Date(),
          resources: { found: !!foundResourcePost, rawText: foundResourcePost, locations },
          codes: { found: !!foundCodePost, rawText: foundCodePost, items: codes },
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`✅ บันทึกลง MongoDB สำเร็จ! (date: ${report?.date})`);
    console.log(`   📍 พิกัดแร่: ${locations.length} แห่ง`);
    console.log(`   🔑 โค้ด: ${codes.length} โค้ด`);
  } finally {
    await disconnectDB();
  }
});
