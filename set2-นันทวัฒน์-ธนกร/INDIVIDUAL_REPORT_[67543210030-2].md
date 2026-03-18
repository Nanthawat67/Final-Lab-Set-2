# INDIVIDUAL_REPORT_665432100113

## 1. ข้อมูลผู้จัดทำ
- **ชื่อ-นามสกุล:** นายธนกร ผดุงศิลป์
- **รหัสนักศึกษา:** 67543210030-2
- **วิชา:** ENGSE207 Software Architecture
- **งาน:** Final Lab — Set 1: Microservices + HTTPS + Lightweight Logging

---

## 2. ส่วนที่รับผิดชอบ
- Frontend ทั้งหมด (`frontend/index.html` และ `frontend/logs.html`)
- Task Board UI — หน้าหลักสำหรับ Login และจัดการ Tasks
- Log Dashboard UI — หน้าสำหรับ admin ดู logs
- `frontend/Dockerfile` สำหรับ serve static files ด้วย Nginx

---

## 3. สิ่งที่ได้ลงมือพัฒนาด้วยตนเอง

### Task Board UI (`index.html`)
- ออกแบบและเขียนหน้า Login ที่รองรับเฉพาะ Seed Users (ลบ Register tab ออกจาก Week 12)
- เขียน JWT Inspector แสดง Header / Payload / Signature แยกสี และแสดงเวลาหมดอายุของ Token
- เขียนระบบ Auto-login ตรวจสอบ token เดิมใน localStorage ผ่าน `GET /api/auth/verify`
- ออกแบบ UI ให้ admin เห็น Tasks ของทุกคน และ member เห็นเฉพาะ Tasks ของตัวเอง
- เพิ่มลิงก์ไปยัง Log Dashboard (`logs.html`) ใน sidebar

### Log Dashboard (`logs.html`)
- ออกแบบและเขียนหน้า Log Dashboard สำหรับ admin เท่านั้น
- เขียน Login overlay ที่ตรวจสอบ role ก่อนเข้าถึงหน้า — ถ้าเป็น member จะถูกปฏิเสธทันที
- เขียนฟังก์ชัน `loadStats()` ดึงสถิติ logs จาก `GET /api/logs/stats` แสดงจำนวน INFO / WARN / ERROR
- เขียนฟังก์ชัน `loadLogs()` ดึง logs จาก `GET /api/logs/` พร้อม query params สำหรับ filter
- เขียนระบบ filter ตาม service, level และ client-side search ตาม event/message
- เขียนฟังก์ชัน Auto Refresh ทุก 5 วินาที พร้อมปุ่ม toggle เปิด/ปิด
- จัดการ error response ครบ — 401 แสดง login overlay, 403 แสดงข้อความ admin only
- เขียนระบบ Auto-login ตรวจสอบ token เดิมใน localStorage และ verify role ก่อนเข้าหน้า

### Dockerfile
- เขียน `frontend/Dockerfile` ใช้ `nginx:1.25-alpine` serve static files


---

## 4. ปัญหาที่พบและวิธีการแก้ไข

**ปัญหา 1: Token หมดอายุแล้วแต่หน้าไม่ redirect กลับ Login**
- อาการ: กด refresh แล้วหน้าค้างไม่โหลด Tasks เพราะ token หมดอายุแต่ยังอยู่ใน localStorage
- แก้: เพิ่มการตรวจสอบ `api/auth/verify` ตอนโหลดหน้า ถ้า `valid: false` ให้ลบ token และแสดงหน้า Login

**ปัญหา 2: renderTasks() แสดง username ไม่ขึ้น**
- อาการ: ช่อง owner แสดงเป็น `?` ทุก Task
- แก้: เปลี่ยนจาก `t.owner_id` เป็น `t.username` ให้ตรงกับ field ที่ Task Service ส่งมาจาก JOIN query

---

## 5. สิ่งที่ได้เรียนรู้จากงานนี้

- **HTTPS กับ Frontend:** เข้าใจว่าทำไม browser ถึงบล็อก mixed content และการใช้ relative URL แก้ปัญหาได้อย่างไร
- **JWT ในฝั่ง Frontend:** เข้าใจโครงสร้าง JWT ว่า Payload อ่านได้โดยไม่ต้อง secret เพราะ encode ด้วย Base64 ไม่ใช่การเข้ารหัส จึงห้ามเก็บข้อมูลสำคัญใน Payload
- **Role-based Access Control:** เข้าใจว่าการตรวจสอบ role ที่ Frontend เป็นแค่ UX เท่านั้น ต้องตรวจที่ Backend ด้วยเสมอ ซึ่งเห็นได้จาก API `/api/logs/` ที่ตอบ 403 ถ้า role ไม่ใช่ admin
- **Microservices จากมุมมอง Frontend:** Frontend ไม่รู้ว่า Backend มีกี่ service เพราะ Nginx รวม endpoint ให้หมดแล้ว ทำให้เขียน fetch ได้ง่ายขึ้น
- **Error Handling:** เรียนรู้ความสำคัญของการจัดการ status code แต่ละตัวให้ถูกต้อง เช่น 401 ต้อง redirect login, 403 ต้องแจ้งสิทธิ์ไม่พอ

---

## 6. แนวทางที่ต้องการพัฒนาต่อใน Set 2

- เพิ่ม Refresh Token flow เพื่อให้ผู้ใช้ไม่ต้อง login ใหม่บ่อยเมื่อ token หมดอายุ
- ปรับ Log Dashboard ให้รองรับ pagination แทนการโหลดครั้งละ 200 รายการ
- เพิ่มกราฟสถิติ (เช่น bar chart) แสดงจำนวน log แยกตาม event ใน Log Dashboard
- Deploy Frontend บน Railway หรือ Vercel และเชื่อมกับ Backend จริง
- เพิ่ม loading skeleton แทน spinner เพื่อ UX ที่ดีขึ้น