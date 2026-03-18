const express  = require('express');
const bcrypt   = require('bcryptjs');
const { pool } = require('../db/db');
const { generateToken, verifyToken } = require('../middleware/jwtUtils');

const router = express.Router();

// Dummy hash สำหรับ timing-safe compare
const DUMMY_HASH = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8y0R6VQwWi4KFOeFHrgb3R04QLbL7a';

// ── Helper: ส่ง log ไปที่ Log Service ──────────────────────────────────
async function logEvent({ level, event, userId, ip, method, path, statusCode, message, meta }) {
  try {
    await fetch('http://log-service:3003/api/logs/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service: 'auth-service',
        level, event,
        user_id:    userId || null,
        ip_address: ip || null,
        method, path, status_code: statusCode || null,
        message: message || null,
        meta: meta || null
      })
    });
  } catch (_) {}
}

// ── Helper: บันทึก log ลง auth-db ──────────────────────────────────────
async function logToDB({ level, event, userId, ip, message, meta }) {
  try {
    await pool.query(
      `INSERT INTO logs (level, event, user_id, ip_address, message, meta)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [level, event, userId || null, ip || null, message || null, meta ? JSON.stringify(meta) : null]
    );
  } catch (e) { console.error('[auth-log]', e.message); }
}

// ── Helper: ส่ง activity event ไป Activity Service ─────────────────────
async function logActivity({ userId, username, eventType, entityType, entityId, summary, meta }) {
  const ACTIVITY_URL = process.env.ACTIVITY_SERVICE_URL || 'http://activity-service:3003';
  fetch(`${ACTIVITY_URL}/api/activity/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId, username, event_type: eventType,
      entity_type: entityType || null,
      entity_id: entityId || null,
      summary, meta: meta || null
    })
  }).catch(() => console.warn('[auth] activity-service unreachable — skipping event log'));
}

// ── POST /api/auth/register ────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.ip;

  if (!username || !email || !password)
    return res.status(400).json({ error: 'username, email, password are required' });
  if (password.length < 6)
    return res.status(400).json({ error: 'password ต้องมีอย่างน้อย 6 ตัวอักษร' });

  try {
    const exists = await pool.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($2)',
      [email.trim(), username.trim()]
    );
    if (exists.rows.length > 0)
      return res.status(409).json({ error: 'Email หรือ Username ถูกใช้งานแล้ว' });

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1,$2,$3,'member') RETURNING id, username, email, role, created_at`,
      [username.trim(), email.trim().toLowerCase(), hash]
    );
    const user = result.rows[0];

    // Log ทุกที่
    await Promise.all([
      logToDB({ level: 'INFO', event: 'REGISTER_SUCCESS', userId: user.id, ip, message: `New user registered: ${user.username}` }),
      logEvent({ level: 'INFO', event: 'REGISTER_SUCCESS', userId: user.id, ip, method: 'POST', path: '/api/auth/register', statusCode: 201, message: `New user registered: ${user.username}`, meta: { username: user.username } }),
      logActivity({ userId: user.id, username: user.username, eventType: 'USER_REGISTERED', entityType: 'user', entityId: user.id, summary: `${user.username} สมัครสมาชิกใหม่` })
    ]);

    res.status(201).json({
      message: 'สมัครสมาชิกสำเร็จ',
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('[auth] Register error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/auth/login ───────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const ip = req.headers['x-real-ip'] || req.ip;

  if (!email || !password)
    return res.status(400).json({ error: 'กรุณากรอก email และ password' });

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const result = await pool.query(
      'SELECT id, username, email, password_hash, role FROM users WHERE LOWER(email) = LOWER($1)',
      [normalizedEmail]
    );
    const user = result.rows[0] || null;
    const hash = user ? user.password_hash : DUMMY_HASH;
    const isValid = await bcrypt.compare(password, hash);

    if (!user || !isValid) {
      await Promise.all([
        logEvent({ level: 'WARN', event: 'LOGIN_FAILED', userId: user?.id || null, ip, method: 'POST', path: '/api/auth/login', statusCode: 401, message: `Login failed: ${normalizedEmail}`, meta: { email: normalizedEmail } }),
        logToDB({ level: 'WARN', event: 'LOGIN_FAILED', userId: user?.id || null, ip, message: `Login failed for email: ${normalizedEmail}`, meta: { email: normalizedEmail } }),
        logActivity({ userId: user?.id || null, username: user?.username || null, eventType: 'LOGIN_FAILED', summary: `Login failed for ${normalizedEmail}` })
      ]);
      return res.status(401).json({ error: 'Email หรือ Password ไม่ถูกต้อง' });
    }

    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
    const token = generateToken({ sub: user.id, email: user.email, role: user.role, username: user.username });

    await Promise.all([
      logEvent({ level: 'INFO', event: 'LOGIN_SUCCESS', userId: user.id, ip, method: 'POST', path: '/api/auth/login', statusCode: 200, message: `User ${user.username} logged in`, meta: { username: user.username, role: user.role } }),
      logToDB({ level: 'INFO', event: 'LOGIN_SUCCESS', userId: user.id, ip, message: `User ${user.username} logged in`, meta: { role: user.role } }),
      logActivity({ userId: user.id, username: user.username, eventType: 'LOGIN_SUCCESS', summary: `User ${user.username} logged in` })
    ]);

    res.json({ message: 'Login สำเร็จ', token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (err) {
    console.error('[auth] Login error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/auth/verify ───────────────────────────────────────────────
router.get('/verify', (req, res) => {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.status(401).json({ valid: false, error: 'No token' });
  try {
    const decoded = verifyToken(token);
    res.json({ valid: true, user: decoded });
  } catch (err) {
    res.status(401).json({ valid: false, error: err.message });
  }
});

// ── GET /api/auth/me ───────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = verifyToken(token);
    const result = await pool.query('SELECT id, username, email, role, created_at, last_login FROM users WHERE id = $1', [decoded.sub]);
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// ── GET /api/auth/health ───────────────────────────────────────────────
router.get('/health', (_, res) => res.json({ status: 'ok', service: 'auth-service', time: new Date() }));

module.exports = router;