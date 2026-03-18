# TEAM_SPLIT.md

## Team Members
- 67543210034-4 นาย นันทวัฒน์ แซ่ย่าง
- 67543210030-2 นาย ธนกร ผดุงศิลป์

## Work Allocation

### Student 1: นาย นันทวัฒน์ แซ่ย่าง (67543210034-4) Backend
- Auth Service (login, JWT, logEvent)
- Task Service (CRUD, authMiddleware, logEvent)
- Log Service (internal endpoint, GET logs, stats)
- Database Schema (init.sql, bcrypt hash)
- Nginx (nginx.conf, HTTPS, rate limit, gen-certs.sh)
- Docker Compose (docker-compose.yml, .env.example, Dockerfiles)

### Student 2: นาย ธนกร ผดุงศิลป์ (67543210030-2) Frontend
- Task Board UI (frontend/index.html)
- Log Dashboard (frontend/logs.html)
- Frontend Dockerfile
- README.md (ร่วมกัน)
- Screenshots (ร่วมกัน)

## Shared Responsibilities
- ออกแบบ Architecture diagram 
- ทดสอบ end-to-end 
- จัดทำ README.md และ screenshots 
- เขียน TEAM_SPLIT.md และ INDIVIDUAL_REPORT 

## Integration Notes
- Frontend เรียก API ผ่าน relative URL (`/api/auth/`, `/api/tasks/`, `/api/logs/`) โดย Nginx เป็นตัวกลาง
- JWT_SECRET ใช้ค่าเดียวกันทั้ง Auth Service, Task Service และ Log Service
- Frontend เก็บ JWT ใน `localStorage` key `jwt_token` แล้วส่งผ่าน `Authorization: Bearer <token>` ทุก request
- Log Service รับ log จาก Auth Service และ Task Service ผ่าน `POST /api/logs/internal` ภายใน Docker network เท่านั้น