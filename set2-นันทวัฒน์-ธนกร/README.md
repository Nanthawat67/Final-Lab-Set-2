# ENGSE207 Software Architecture

# Final Lab — Set 1: Microservices + HTTPS + Lightweight Logging

**วิชา:** ENGSE207 Software Architecture  
**มหาวิทยาลัย:** มหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา

## สมาชิกในกลุ่ม

| Student ID    | ชื่อ-นามสกุล           | หน้าที่                                      |
| ------------- | -------------------- | -------------------------------------------- |
| 67543210034-4 | นายนันทวัฒน์ แซ่ย่าง     | Backend (Auth, Task, Log Service, Nginx, DB) |
| 66543210030-2 | นายธนกร ผดุงศิลป์       | Frontend (index.html, logs.html)             |

---

## ภาพรวมของระบบ

Task Board Microservices ระบบจัดการงาน (Task) แบบ **ไม่มี Register** ใช้ Seed Users เท่านั้น พร้อม HTTPS, JWT Authentication และ Lightweight Logging เก็บลงฐานข้อมูล PostgreSQL

---

## Architecture Diagram

```
[ Browser ] --(HTTPS :443)--> [ Nginx (API Gateway) ]
                                      |
            -----------------------------------------------------
            |                 |                 |               |
      [ Frontend ]     [ Auth-Service ]  [ Task-Service ] [ Log-Service ]
      (Static HTML)      (Port: 3001)      (Port: 3002)     (Port: 3003)
                               |                 |               |
                               -----------------------------------
                                               |
                                        [ PostgreSQL DB ]
```

---

## โครงสร้าง Repository

```
final-lab-set1/
├── auth-service/     # บริการจัดการผู้ใช้และการเข้าสู่ระบบ (Node.js)
├── task-service/     # บริการจัดการรายการงาน (Node.js)
├── log-service/      # บริการบันทึกประวัติการใช้งาน (Node.js)
├── frontend/         # ส่วนติดต่อผู้ใช้งาน (Static HTML/JS)
├── nginx/            # การตั้งค่า Reverse Proxy และ SSL Certificate
│   ├── certs/        # ที่เก็บไฟล์ SSL (.crt, .key)
│   └── nginx.conf    # ไฟล์กำหนดเส้นทางการส่งต่อ Request
├── db/               # สคริปต์ SQL สำหรับสร้างฐานข้อมูลเริ่มต้น (init.sql)
├── docker-compose.yml # ไฟล์หลักสำหรับควบคุมการรัน Container ทั้งหมด
└── .env              # ไฟล์เก็บตัวแปรสภาพแวดล้อมและความลับของระบบ
```

---

## วิธีสร้าง Certificate และรันระบบด้วย Docker Compose

### 1. Clone Repository

```bash
git clone <repo-url>
cd final-lab-set1
```

### 2. สร้าง .env

```bash
cp .env.example .env
```

### 3. สร้าง Self-Signed Certificate

```bash
chmod +x scripts/gen-certs.sh
./scripts/gen-certs.sh
```

### 4. รันระบบ

```bash
docker compose up --build
```

### 5. Reset ฐานข้อมูล (ถ้าต้องการเริ่มใหม่)

```bash
docker compose down -v
docker compose up --build
```

---

## Seed Users สำหรับทดสอบ

| Username | Email           | Password  | Role   |
| -------- | --------------- | --------- | ------ |
| alice    | alice@lab.local | alice123  | member |
| bob      | bob@lab.local   | bob456    | member |
| admin    | admin@lab.local | adminpass | admin  |

**วิธีสร้าง bcrypt hash:**

```bash
npm install bcryptjs
node -e "const b=require('bcryptjs'); console.log(b.hashSync('alice123',10))"
node -e "const b=require('bcryptjs'); console.log(b.hashSync('bob456',10))"
node -e "const b=require('bcryptjs'); console.log(b.hashSync('adminpass',10))"
```

นำ hash ที่ได้แทนค่าใน `db/init.sql` ก่อน `docker compose up`

---

## วิธีทดสอบ API

```bash
BASE="https://localhost"

# Login
TOKEN=$(curl -sk -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@lab.local","password":"alice123"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# Create Task
curl -sk -X POST $BASE/api/tasks/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test task","priority":"high"}'

# Get Tasks
curl -sk $BASE/api/tasks/ -H "Authorization: Bearer $TOKEN"

# No JWT → 401
curl -sk $BASE/api/tasks/

# Admin logs
ADMIN_TOKEN=$(curl -sk -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lab.local","password":"adminpass"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
curl -sk $BASE/api/logs/ -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## คำอธิบาย HTTPS, JWT และ Logging

### HTTPS

- Nginx รับ request บน port 443 ด้วย Self-Signed Certificate
- HTTP port 80 จะ redirect → HTTPS ทั้งหมด
- TLS ใช้ protocol TLSv1.2 และ TLSv1.3
- Certificate สร้างด้วย `openssl` ผ่าน `scripts/gen-certs.sh`

### JWT

- Auth Service ออก JWT เมื่อ login สำเร็จ
- Token ฝัง `sub` (user id), `email`, `role`, `username`
- Task Service และ Log Service ตรวจ JWT ทุก request ผ่าน `authMiddleware`
- Frontend เก็บ token ใน `localStorage` key `jwt_token`

### Logging

- Auth Service และ Task Service ส่ง log ไปที่ Log Service ผ่าน `POST /api/logs/internal` ภายใน Docker network
- Log Service เก็บลง PostgreSQL ตาราง `logs`
- `GET /api/logs/` เปิดให้เฉพาะ role `admin` เท่านั้น
- Log events ที่บันทึก: `LOGIN_SUCCESS`, `LOGIN_FAILED`, `JWT_INVALID`, `TASK_CREATED`, `TASK_DELETED`

---

## Known Limitations

- Certificate เป็น Self-Signed ใช้ได้เฉพาะ development (browser แจ้งเตือน)
- ไม่มีระบบ Register ใช้ Seed Users เท่านั้น
- ใช้ Shared Database 1 ฐานข้อมูลสำหรับทุก Service
- JWT ไม่มีระบบ Refresh Token
