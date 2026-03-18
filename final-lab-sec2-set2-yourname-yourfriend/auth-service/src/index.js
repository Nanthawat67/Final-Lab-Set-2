require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pool = require('./db/db');
const authRoutes = require('./routes/auth');

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// health check
app.get('/', (req, res) => {
  res.json({
    service: 'auth-service',
    status: 'running'
  });
});

// routes
app.use('/api/auth', authRoutes);

// test database connection
async function checkDB() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Database connected:', result.rows[0].now);
  } catch (err) {
    console.error('Database connection failed:', err.message);
  }
}

checkDB();

// start server
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
});