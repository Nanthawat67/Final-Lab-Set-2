# INDIVIDUAL REPORT

## ข้อมูลผู้จัดทำ

ชื่อ: นันทวัฒน์ แซ่ย่าง
รหัสนักศึกษา: 67543210034-4 

## ส่วนที่รับผิดชอบ

* Auth Service (login + JWT)
* Task Service (CRUD)
* Log Service integration
* Database (PostgreSQL)

## สิ่งที่พัฒนาด้วยตนเอง

* เขียน API สำหรับ login และตรวจสอบ password ด้วย bcrypt
* สร้าง JWT token และ implement middleware สำหรับ verify
* พัฒนา CRUD operations สำหรับ task
* เชื่อมต่อระบบ logging ระหว่าง services
* ออกแบบ schema และใช้งาน PostgreSQL

## ปัญหาที่พบและวิธีแก้ไข

* ปัญหา JWT ไม่ถูกส่งใน header → แก้โดยตรวจสอบ Authorization header
* ปัญหา login ไม่ผ่าน → ตรวจสอบ seed users ใน database
* ปัญหา container connect กันไม่ได้ → แก้ docker-compose network

## สิ่งที่ได้เรียนรู้

* การใช้ JWT สำหรับ authentication และ authorization
* การใช้ Docker Compose สำหรับ microservices
* การออกแบบ REST API
* การทำ logging แบบ centralized

## แนวทางพัฒนาใน Set 2

* แยก database ต่อ service
* deploy บน cloud (AWS / GCP)
* ใช้ HTTPS certificate จริง (Let's Encrypt)
* เพิ่ม monitoring และ security
