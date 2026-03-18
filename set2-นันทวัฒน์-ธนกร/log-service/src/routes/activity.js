const express = require('express');

const router = express.Router();

//
// INTERNAL EVENT (จาก services อื่น)
//
router.post('/internal', async (req, res) => {

  const db = req.app.get('db');

  const {
    user_id,
    username,
    event_type,
    entity_type,
    entity_id,
    summary,
    meta
  } = req.body;

  try {

    await db.query(
      `INSERT INTO activity_logs
      (user_id, username, event_type, entity_type,
       entity_id, summary, meta)
      VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        user_id,
        username,
        event_type,
        entity_type,
        entity_id,
        summary,
        meta ? JSON.stringify(meta) : null
      ]
    );

    res.json({ status: 'logged' });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: 'activity log failed'
    });

  }

});

//
// GET ACTIVITY FEED
//
router.get('/', async (req, res) => {

  const db = req.app.get('db');

  try {

    const result = await db.query(
      `SELECT *
       FROM activity_logs
       ORDER BY created_at DESC
       LIMIT 50`
    );

    res.json(result.rows);

  } catch (err) {

    res.status(500).json({
      error: 'cannot fetch activity'
    });

  }

});

module.exports = router;