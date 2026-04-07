import { test, chromium, devices } from '@playwright/test'; // 👈 นำเข้า devices มาปลอมตัว
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { DailyReport, ILocation, ICode } from '../src/models/DailyReport';
import { connectDB, disconnectDB } from '../src/db';
import { cleanLocationName } from '../backend/src/utils/cleanLocationName';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ── Helper: แปลง text เป็น ILocation[] ────────────────────────────────────
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

// ── Helper: แปลง text เป็น ICode[] ────────────────────────────────────────
function parseCodes(text: string): ICode[] {
  const codes: ICode[] = [];
  const seen = new Set<string>();
  const lines = text.split('\n');

  const codePattern = /(?:^|[\s:•·*\-])([a-zA-Z0-9][a-zA-Z0-9_-]{5,23})(?=$|[\s),.])/g;
  const sectionHint = /โค้ดที่ยังใช้งานได้|รวมโค้ดทั้งหมด|โค้ดใหม่|redeem|code|keepsmiling/i;
  const skipLine = /\[IMG ALT\]|วิธีเติม|TAB|คอมเมนต์|#DailyHeartopia|#Heartopia|#แจกโค้ด/i;
  const noiseToken = /^(heartopia|dailyheartopia|facebook|reels|photo|photos|img|alt|www|http|check)$/i;
  const noiseTailMarkers = ['ความรู้สึกทั้งหมด', 'ความคิดเห็น', 'แชร์', 'ถูกใจ', 'แสดงความคิดเห็น', 'ดู '];

  const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const normalizeDetail = (value: string): string => {
    let detail = value
      .replace(/[•·*:\-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const markerIndex = noiseTailMarkers
      .map((marker) => detail.indexOf(marker))
      .filter((index) => index >= 0)
      .sort((a, b) => a - b)[0];
    if (markerIndex !== undefined) {
      detail = detail.slice(0, markerIndex).trim();
    }

    if (detail.includes('>')) {
      detail = detail.split('>')[0].trim();
    }

    detail = detail.replace(/\s\d+(?:\s*\/\s*\d+)?(?:\s+\d+){2,}\s*$/g, '').trim();

    if (detail.startsWith('(') && detail.endsWith(')')) {
      detail = detail.slice(1, -1).trim();
    }

    if (/^(โค้ดที่ยังใช้งานได้|รวมโค้ดทั้งหมด|โค้ดเพิ่งค้นพบ.*|โค้ดใหม่.*)$/i.test(detail)) {
      return '';
    }

    return detail;
  };
  const normalizeExpiry = (value: string): string => {
    let expiry = value.replace(/\s+/g, ' ').trim();
    expiry = expiry.replace(/มิ\.\s*\.ย\./g, 'มิ.ย.');

    const markerIndex = noiseTailMarkers
      .map((marker) => expiry.indexOf(marker))
      .filter((index) => index >= 0)
      .sort((a, b) => a - b)[0];
    if (markerIndex !== undefined) {
      expiry = expiry.slice(0, markerIndex).trim();
    }

    return expiry;
  };

  let enteredCodeSection = false;
  let lastCodeItem: ICode | null = null;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\u00a0/g, ' ').trim();
    if (!line) continue;

    if (sectionHint.test(line)) enteredCodeSection = true;
    if (skipLine.test(line)) continue;
    if (/^#/.test(line)) break;
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

      if (code.length < 6) continue;
      if (!/\d/.test(code)) continue;
      if (/^x\d+$/i.test(code)) continue;
      if (noiseToken.test(code)) continue;
      if (seen.has(codeKey)) continue;

      seen.add(codeKey);

      const detailRaw = line
        .replace(new RegExp(`(^|\\s)${escapeRegExp(rawCode)}(?=\\s|$)`, 'i'), ' ')
        .replace(expiry, ' ');

      const codeItem: ICode = {
        code,
        detail: normalizeDetail(detailRaw),
        expiry,
      };

      codes.push(codeItem);
      lastCodeItem = codeItem;
    }
  }

  return codes;
}

// ── Helper: วันที่ YYYY-MM-DD (Bangkok time) ───────────────────────────────
function getTodayDateString(): string {
  return new Date()
    .toLocaleDateString('fr-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' });
}

function resolveHeadlessMode(): boolean {
  const raw = process.env.SCRAPE_HEADLESS;
  if (!raw) return process.env.CI === 'true';
  return !['0', 'false', 'no', 'off'].includes(raw.toLowerCase());
}

// ══════════════════════════════════════════════════════════════════════════════
test('Heartopia Daily: ตามล่าพิกัดแร่ + โค้ด → บันทึกลง MongoDB', async () => {
  test.setTimeout(0);
  const headless = resolveHeadlessMode();

  console.log('🚀 เริ่มรันบอท (โหมดปลอมตัวเป็น iPhone)...');
  
  // ── ปลอมตัวเป็น iPhone 13 ───────────────────────────────────────────────
  const browser = await chromium.launch({ headless });
  const iPhone = devices['iPhone 13'];

  const context = await browser.newContext({
    ...iPhone, // ยัดสเปกมือถือลงไป
    locale: 'th-TH',
  });

  const page = await context.newPage();

  try {
    // ── ไปหน้าเพจเวอร์ชันมือถือ ──────────────────────────────────────────────
    console.log('\n📱 เปิดเพจ DailyHeartopia (m.facebook.com)...');
    await page.goto('https://m.facebook.com/DailyHeartopia', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.waitForTimeout(4000);

    // ปิด Popup กวนใจ "เปิดในแอปไหม?" (ถ้ามี)
    try {
      await page.click('i[data-sigil="m-cancel-button"]', { timeout: 3000 });
      console.log('✨ ปิดแบนเนอร์กวนใจสำเร็จ!');
    } catch (e) {
      // ไม่มีก็ผ่านไป
    }

    const orePostTriggers  = ['สรุปข้อมูลสำคัญ', 'ตำแหน่ง', 'ไม้โอ๊ก', 'ไม้โอ๊ค', 'หินเรืองแสง', 'ต้นไม้โอ๊ก', 'ประจำวัน'];
    const codePostTriggers = ['โค้ดใหม่', 'โค้ด', 'มาแล้วค่าา', 'code', 'แจก', 'keepsmiling', 'redeem', 'เคลม', 'โค้ดที่ยังใช้งานได้'];

    let foundResourcePost = '';
    let foundCodePost     = '';
    let bestCodeScore = -1;
    const seenFingerprints = new Set<string>();

    // 📌 Selector สำหรับหาโพสต์ในหน้ามือถือ
    const postSelector = 'div[data-sigil="story-div"], article';

    // ── PHASE 1: Scroll โหลดโพสต์ ──────────────────────────────────────────
    for (let round = 0; round < 10; round++) {
      const countBefore = await page.locator(postSelector).count();
      await page.evaluate(() => window.scrollBy({ top: 1500, behavior: 'smooth' }));
      await page.waitForTimeout(2000);
      const countAfter = await page.locator(postSelector).count();
      if (countAfter >= 15 && countAfter === countBefore) break;
    }

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await page.waitForTimeout(1500);

    const articles = await page.locator(postSelector).all();

    // ── PHASE 2: กด "ดูเพิ่มเติม" + อ่านเนื้อหา ──────────────────────────
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];

      await article.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'smooth' }));
      await page.waitForTimeout(600);

      // กด "ดูเพิ่มเติม" (รองรับทั้งภาษาไทยและอังกฤษ)
      const expanded = await article.evaluate((el: Element) => {
        const TARGET = ['ดูเพิ่มเติม', 'See more', 'อ่านเพิ่มเติม'];
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT);
        let node = walker.nextNode() as Element | null;
        while (node) {
          const txt = (node.textContent || '').trim();
          if (txt.length <= 25 && TARGET.some(t => txt === t || txt.endsWith(t))) {
            (node as HTMLElement).click();
            return true;
          }
          node = walker.nextNode() as Element | null;
        }
        return false;
      });

      if (expanded) await page.waitForTimeout(1200);

      const fullText = await article.innerText().catch(() => '');
      if (fullText.length < 30) continue;

      const fingerprint = fullText.substring(0, 120).replace(/\s/g, '');
      if (seenFingerprints.has(fingerprint)) continue;
      seenFingerprints.add(fingerprint);

      const isOrePost  = orePostTriggers.some(kw => fullText.includes(kw));
      const isCodePost = codePostTriggers.some(kw => fullText.toLowerCase().includes(kw.toLowerCase()));
      const parsedCodes = parseCodes(fullText);

      if (isOrePost && !foundResourcePost) {
        foundResourcePost = fullText;
        const imgAlts = await article.evaluate((el: Element) =>
          Array.from(el.querySelectorAll('img[alt]'))
            .map(img => img.getAttribute('alt') || '')
            .filter(alt => alt.length > 5)
        );
        if (imgAlts.length > 0) foundResourcePost += '\n[IMG ALT]: ' + imgAlts.join(' | ');
      }

      if (isCodePost) {
        const codeSectionBoost = /โค้ดที่ยังใช้งานได้|รวมโค้ดทั้งหมด/i.test(fullText) ? 2 : 0;
        const expiryBoost = /หมดเขต/i.test(fullText) ? 1 : 0;
        const score = parsedCodes.length + codeSectionBoost + expiryBoost;

        if (score > bestCodeScore) {
          bestCodeScore = score;
          foundCodePost = fullText;
        }

        const imgAlts = await article.evaluate((el: Element) =>
          Array.from(el.querySelectorAll('img[alt]'))
            .map(img => img.getAttribute('alt') || '')
            .filter(alt => alt.length > 5)
        );
        if (imgAlts.length > 0 && score <= 0 && bestCodeScore <= 0) {
          foundCodePost += '\n[IMG ALT]: ' + imgAlts.join(' | ');
        }
      }
    }

    // ── แสดงผลลัพธ์ Console ─────────────────────────────────────────────────
    const now    = new Date();
    const thDate = now.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    console.log(`\n📅 รายงานประจำวัน Heartopia — ${thDate}\n`);

    if (foundResourcePost) {
      console.log('🪨 ไม้โอ๊กและหินเรืองแสง');
      foundResourcePost.split('\n').forEach((line: string) => {
        const t = line.trim();
        if (!t || t.length > 150) return;
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
      else console.log('   ⚠️  โค้ดอยู่ในรูปภาพ — ดูจากหน้าจอ Browser ได้เลยครับ');
    } else {
      console.log('🎁 โค้ด Redeem\n   ❌ ไม่พบโพสต์วันนี้');
    }

    if (!foundResourcePost && !foundCodePost) {
      console.log('🔍 DEBUG — ข้อความ 5 โพสต์แรก:');
      const debugArticles = await page.locator(postSelector).all();
      for (let i = 0; i < Math.min(debugArticles.length, 5); i++) {
        const txt = await debugArticles[i].innerText().catch(() => '');
        console.log(`\n--- โพสต์ ${i + 1} ---\n${txt.substring(0, 400).trim()}`);
      }
    }

    // ── Step 3: บันทึกลง MongoDB Atlas ──────────────────────────────────────
    console.log('\n💾 กำลังเชื่อมต่อ MongoDB Atlas...');
    await connectDB();

    const todayDate = getTodayDateString();
    const locations = parseLocations(foundResourcePost);
    const codes     = parseCodes(foundCodePost);

    const report = await DailyReport.findOneAndUpdate(
      { date: todayDate },
      {
        $set: {
          date: todayDate,
          scrapedAt: new Date(),
          resources: {
            found: !!foundResourcePost,
            rawText: foundResourcePost,
            locations,
          },
          codes: {
            found: !!foundCodePost,
            rawText: foundCodePost,
            items: codes,
          },
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`✅ บันทึกลง MongoDB สำเร็จ! (date: ${report?.date})`);
    console.log(`   📍 พิกัดแร่: ${locations.length} แห่ง`);
    console.log(`   🔑 โค้ด: ${codes.length} โค้ด`);

  } finally {
    await context.close();
    await browser.close(); // ปิด Browser ตรงๆ เลย
    await disconnectDB();
  }
});