require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pool = require('./db/db');
const taskRoutes = require('./routes/tasks');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    service: 'task-service',
    status: 'running'
  });
});

app.use('/api/tasks', taskRoutes);

async function checkDB() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Task DB connected:', result.rows[0].now);
  } catch (err) {
    console.error('DB error:', err.message);
  }
}

checkDB();

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`Task Service running on port ${PORT}`);
});