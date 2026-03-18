require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const activityRoutes = require('./routes/activity');

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL
    ? { rejectUnauthorized: false }
    : false
});

app.set('db', pool);

app.get('/', (req, res) => {
  res.json({
    service: 'activity-service',
    status: 'running'
  });
});

app.use('/api/activity', activityRoutes);

async function checkDB() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Activity DB connected:', result.rows[0].now);
  } catch (err) {
    console.error('DB error:', err.message);
  }
}

checkDB();

const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
  console.log(`Activity Service running on port ${PORT}`);
});