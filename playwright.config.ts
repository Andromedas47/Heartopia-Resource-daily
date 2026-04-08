import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  testDir: './tests',
  workers: 1, 
  reporter: 'list', // เปลี่ยนจาก html เป็น list เพื่อให้ดู Log ใน GitHub Actions ง่ายๆ คลีนๆ
  timeout: 120000, // ให้เวลา 2 นาที เผื่อ Apify ทำงานนาน
  
  // ❌ ลบ projects และ use (หน้าจอ/เบราว์เซอร์) ทิ้งเกลี้ยงเลยครับ เพราะเรายิง API ล้วนๆ แล้ว
});