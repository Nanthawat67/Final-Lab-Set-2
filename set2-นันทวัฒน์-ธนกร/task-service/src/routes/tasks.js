const express = require('express');
const pool = require('../db/db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

async function logActivity(data) {

  const ACTIVITY_URL =
    process.env.ACTIVITY_SERVICE_URL ||
    'http://activity-service:3003';

  fetch(`${ACTIVITY_URL}/api/activity/internal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  }).catch(() => {
    console.warn('activity service unreachable');
  });

}

router.post('/', async (req, res) => {

  const { title, description, priority } = req.body;

  try {

    const result = await pool.query(
      `INSERT INTO tasks
       (title, description, priority, user_id)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [
        title,
        description,
        priority || 'medium',
        req.user.sub
      ]
    );

    const task = result.rows[0];

    logActivity({
      user_id: req.user.sub,
      username: req.user.username,
      event_type: 'TASK_CREATED',
      entity_type: 'task',
      entity_id: task.id,
      summary: `${req.user.username} created task`
    });

    res.json(task);

  } catch (err) {

    console.error(err);

    res.status(500).json({ error: 'create task failed' });

  }

});

router.get('/', async (req, res) => {

  try {

    const result = await pool.query(
      `SELECT * FROM tasks
       WHERE user_id=$1
       ORDER BY created_at DESC`,
      [req.user.sub]
    );

    res.json(result.rows);

  } catch (err) {

    res.status(500).json({ error: 'cannot fetch tasks' });

  }

});

router.delete('/:id', async (req, res) => {

  const { id } = req.params;

  try {

    await pool.query(
      `DELETE FROM tasks
       WHERE id=$1 AND user_id=$2`,
      [id, req.user.sub]
    );

    logActivity({
      user_id: req.user.sub,
      username: req.user.username,
      event_type: 'TASK_DELETED',
      entity_type: 'task',
      entity_id: parseInt(id),
      summary: `${req.user.username} deleted task`
    });

    res.json({ message: 'task deleted' });

  } catch (err) {

    res.status(500).json({ error: 'delete failed' });

  }

});

module.exports = router;