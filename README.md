# 🌟 Heartopia Daily Resource Tracker
**"หมดปัญหาขี้เกียจหาต้นโอ๊กและแร่เรืองแสง! เว็บเดียวจบ อัปเดตพิกัดรายวันอัตโนมัติ"**

🔗 **[ดูเว็บไซต์จริงได้ที่นี่ (Live Demo) -> ใส่ลิงก์ Vercel ของคุณ]**

โปรเจกต์นี้สร้างขึ้นมาเพื่อแก้ Pain Point ของผู้เล่นเกม Heartopia ที่ต้องคอยไถหน้าฟีดโซเชียลมีเดียทุกวันเพื่อหาว่าวันนี้ทรัพยากรสำคัญอย่าง **ต้น Oak** และ **Glowstone** เกิดที่พิกัดไหน ผมจึงนำทักษะด้าน Software Development มาสร้างเป็น Automated Pipeline เพื่อดูดข้อมูล คัดกรอง และปักหมุดลงบนแผนที่แบบ Interactive ให้ผู้เล่นเข้ามาดูได้ง่ายๆ ในที่เดียวจบ

---

## 🎯 The Problem & Solution (ทำไมถึงสร้างโปรเจกต์นี้?)
* **Problem:** ข้อมูลพิกัดไอเทมในแต่ละวันมักจะถูกโพสต์บน Facebook Fanpage เป็นรูปแบบข้อความยาวๆ (Unstructured Text) ซึ่งอ่านยาก ไม่เห็นภาพ และบางครั้งก็มีการสะกดชื่อสถานที่ผิดเพี้ยน
* **Solution:** สร้างบอทอัตโนมัติไปดึงข้อมูลเหล่านั้นทุกเช้า นำข้อความมาสกัดหาชื่อสถานที่ แปลงเป็นพิกัด X,Y และนำไปพล็อตลงบนแผนที่เกมแบบ Visualized Dashboard ทันที

## ⚙️ How It Works (ระบบทำงานอย่างไร?)
ระบบถูกออกแบบให้ทำงานเอง 100% (Fully Automated) โดยไม่ต้องมีคนคอยป้อนข้อมูล:

1. **Scraping (Playwright + GitHub Actions):** บอทจะทำงานตามเวลาที่ตั้งไว้ (Cron Job) วิ่งเข้าไปดึงข้อมูลจากโพสต์ล่าสุดของ Fanpage 
2. **Data Pipeline & Storage (MongoDB):** นำข้อความดิบมาผ่านฟังก์ชัน Regex เพื่อทำความสะอาดข้อมูล (Sanitize) และบันทึกลงฐานข้อมูล พร้อมระบบเช็กความสดใหม่ (Freshness Check) ถ้าระบบดึงข้อมูลพลาดหรือข้อมูลเก่าเกินไป จะมีการยิง Email Alert แจ้งเตือนผู้ดูแลทันที
3. **Data Visualization (Next.js):** นำข้อมูลพิกัดมาเทียบกับ Data Dictionary ที่สร้างไว้ (Location Mapping Logic) เพื่อแปลงชื่อโซนต่างๆ เป็นตำแหน่ง % บนหน้าจอ และนำไปแสดงผลคู่กับไอเทมโค้ดประจำวัน

## 🛠️ Tech Stack & Tools
* **Frontend:** Next.js (App Router), TypeScript, CSS Modules
* **Backend & Automation:** Node.js, Playwright (Headless Scraping)
* **Database:** MongoDB Atlas
* **CI/CD & Operations:** GitHub Actions, Vercel

## 🗺️ Highlight Feature: ระบบชดเชยข้อมูล (Fallback Strategy)
หนึ่งในความท้าทายคือ "ชื่อสถานที่ใหม่ๆ" ที่ไม่เคยมีในฐานข้อมูล ระบบถูกเขียนมารองรับเหตุการณ์นี้โดยเฉพาะ หากบอทเจอสถานที่ที่ไม่มีพิกัดแนบ ระบบแผนที่จะไม่พัง แต่จะแสดงสถานะ "Awaiting x,y mapping" เพื่อรอการอัปเดต โดยที่ข้อมูลส่วนอื่นยังแสดงผลได้ตามปกติ (Graceful Degradation)
