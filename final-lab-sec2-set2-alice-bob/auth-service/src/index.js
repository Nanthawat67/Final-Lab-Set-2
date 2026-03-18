require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool } = require('./db/db');  // ถ้า src/index.js อยู่ใน src/
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRouter);

async function start() {
  let retries = 10;
  while (retries > 0) {
    try {
      await pool.query('SELECT 1'); 
      console.log('[auth] Database connected!');
      break;
    } catch (e) {
      console.error(`[auth] Waiting DB... (${retries} left)`, e.message);
      retries--;
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  if (retries === 0) {
    console.error('[auth] Could not connect to database. Exiting...');
    process.exit(1);
  }

  app.listen(PORT, () => console.log(`[auth-service] Running on port ${PORT}`));
}

start();