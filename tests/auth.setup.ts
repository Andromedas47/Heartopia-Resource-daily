import { test as setup } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate facebook', async ({ page }) => {
    // เพิ่มเวลา Timeout ของทั้ง Test เป็น 5 นาที
    setup.setTimeout(300000);

    await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded' });

    await page.locator('input[name="email"]').fill(process.env.FB_EMAIL!);
    await page.locator('input[name="pass"]').fill(process.env.FB_PASSWORD!);
    await page.getByRole('button', { name: /Log In|เข้าสู่ระบบ/i }).first().click();

    console.log('\n--------------------------------------------------');
    console.log('⚠️ ตรวจพบด่าน Puzzle: คุณพิชญ์มีเวลา 5 นาทีในการแก้ครับ');
    console.log('⏳ ค่อยๆ กดครับ ไม่ต้องรีบ บอทจะนั่งรอจนกว่าคุณจะเข้าหน้า Feed');
    console.log('--------------------------------------------------\n');

    try {
        // ปรับ Timeout ตรงนี้เป็น 300,000 ms (5 นาที)
        await Promise.race([
            page.waitForSelector('[role="navigation"]', { timeout: 300000 }),
            page.waitForSelector('[aria-label*="คุณกำลังคิดอะไรอยู่"]', { timeout: 300000 }),
            page.waitForSelector('[aria-label*="What\'s on your mind"]', { timeout: 300000 })
        ]);

        console.log('🎊 เยี่ยมมากครับ! เข้าหน้าหลักได้แล้ว กำลังเก็บกุญแจ...');

        await page.context().storageState({ path: authFile });
        await page.screenshot({ path: 'debug-login-success.png' });

        console.log('🚀 เซฟกุญแจเรียบร้อย! คราวนี้ใช้งานยาวๆ เลยครับ');

    } catch (e) {
        console.error('❌ 5 นาทีก็ยังไม่พอเหรอเนี่ย! หรือว่า Facebook มันเด้งไปหน้าอื่น?');
        await page.screenshot({ path: 'login-timeout-debug.png' });
        throw e;
    }
});