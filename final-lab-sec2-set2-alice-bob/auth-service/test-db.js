const { pool } = require('./db/db');

pool.query('SELECT 1')
  .then(() => console.log('✅ DB connected!'))
  .catch(err => console.error('❌ DB error', err.message))
  .finally(() => pool.end());