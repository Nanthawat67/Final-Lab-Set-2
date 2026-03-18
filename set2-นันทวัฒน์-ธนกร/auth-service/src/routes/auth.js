const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db/db');
const { generateToken } = require('../middleware/jwtUtils');

const router = express.Router();

//
// REGISTER
//
router.post('/register', async (req, res) => {

  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      error: 'username, email, password required'
    });
  }

  try {

    const hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1,$2,$3)
       RETURNING id, username, email, role`,
      [username, email, hash]
    );

    res.json({
      message: 'user created',
      user: result.rows[0]
    });

  } catch (err) {

    console.error(err);

    if (err.code === '23505') {
      return res.status(400).json({
        error: 'username or email already exists'
      });
    }

    res.status(500).json({
      error: 'registration failed'
    });

  }

});

//
// LOGIN
//
router.post('/login', async (req, res) => {

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: 'username and password required'
    });
  }

  try {

    const result = await pool.query(
      `SELECT * FROM users WHERE username=$1`,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'invalid credentials'
      });
    }

    const user = result.rows[0];

    const match = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!match) {
      return res.status(401).json({
        error: 'invalid credentials'
      });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: 'login failed'
    });

  }

});

module.exports = router;