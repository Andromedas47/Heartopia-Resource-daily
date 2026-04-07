import { chromium } from 'playwright';

(async () => {
  // 1. เปิดเบราว์เซอร์แบบ "มองเห็นได้" (ไม่ซ่อนหน้าจอ)
  const browser = await chromium.launch({ 
    headless: false,
    channel: 'chrome' 
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🌐 กำลังเปิด Facebook...');
  await page.goto('https://www.facebook.com/');

  console.log('⏳ กรุณาล็อกอิน Facebook ในหน้าต่างเบราว์เซอร์ให้เรียบร้อย');
  console.log('⏳ (ถ้าติด 2FA ก็กดยืนยันให้เสร็จจนกว่าจะเข้าหน้าฟีดข่าวได้)');

  // 2. ให้เวลารอคุณพิชญ์ล็อกอิน 2 นาที (120000 ms) 
  // มันจะรอจนกว่าจะเจอไอคอน "สร้างโพสต์" ซึ่งแปลว่าเข้าหน้าฟีดสำเร็จแล้ว
  try {
    await page.waitForSelector('div[role="main"]', { timeout: 120000 });
    console.log('✅ ล็อกอินสำเร็จ! กำลังดูดคุกกี้...');
    
    // 3. เซฟ state ออกมาเป็นไฟล์ state.json
    await context.storageState({ path: 'state.json' });
    console.log('💾 บันทึกไฟล์ state.json เสร็จสมบูรณ์!');
  } catch (error) {
    console.log('❌ หมดเวลาล็อกอิน หรือหาหน้าฟีดไม่เจอ ลองรันใหม่นะครับ');
  }

  await browser.close();
})();