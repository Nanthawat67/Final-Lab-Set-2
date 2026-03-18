-- ./db/init.sql

-- ── Database Creation (ถ้ายังไม่ได้สร้าง) ─────────────────────────────
-- ปกติ Docker Compose จะสร้าง DB ให้แล้วด้วย POSTGRES_DB
-- CREATE DATABASE taskboard;

-- ── Table: Users ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตัวอย่าง user
INSERT INTO users (username, password, role) VALUES
('admin', 'admin123', 'admin'),
('user1', 'password1', 'user');

-- ── Table: Tasks ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    assigned_to INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตัวอย่าง task
INSERT INTO tasks (title, description, status, assigned_to) VALUES
('Setup Project', 'Initial project setup and Docker configuration', 'done', 1),
('Create Frontend', 'Build basic HTML pages for frontend', 'pending', 2);

-- ── Table: Logs ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS logs (
    id SERIAL PRIMARY KEY,
    level VARCHAR(20) DEFAULT 'INFO',
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตัวอย่าง log
INSERT INTO logs (level, message) VALUES
('INFO', 'System initialized'),
('INFO', 'First user created');