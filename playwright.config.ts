import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1, // ยังต้องใช้ 1 เพื่อไม่ให้ Browser เปิดซ้อนกัน
  reporter: 'html',
  timeout: 120000, // ขยายเวลาเป็น 2 นาที (120,000 ms)
  use: {
    // ❌ ลบ userDataDir ออกจากตรงนี้
    headless: false,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 0,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});