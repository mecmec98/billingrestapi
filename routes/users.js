const express = require('express');
const router = express.Router();
const isProd = process.env.NODE_ENV === 'production';
//DB configuration
const { pool } = require('../db.js');


// /users/login
router.post('/login', async (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) {
    return res.status(400).json({ error: 'Missing username or password' });
  }
  try {
    // Replace with your actual password check logic!
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [name]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = result.rows[0];
    // Example: compare plaintext (not secure, use bcrypt in production!)
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    // On success, return user info or a JWT token
    res.json({ success: true, message: 'Login successful', user: { id: user.id, name: user.name } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET all users
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
  }
});

// GET user by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (result.rows.length > 0) res.json(result.rows[0]);
    else res.status(404).json({ error: 'User not found' });
  } catch (err) {
    res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
  }
});

// POST create new user
router.post('/', async (req, res) => {
  const { name, password } = req.body;
  if (!name || typeof name !== 'string' || name.trim() === ''
      || !password || typeof password !== 'string' || password.trim() === '') {
    return res.status(400).json({ error: 'Invalid or missing name' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO users (name, password) VALUES ($1, $2) RETURNING *',
      [name.trim(), password.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
  }
});

// PUT update user
router.put('/:id', async (req, res) => {
  const { name } = req.body;
  try {
    const result = await pool.query(
      'UPDATE users SET name = $1 WHERE id = $2 RETURNING *',
      [name, req.params.id]
    );
    if (result.rows.length > 0) res.json(result.rows[0]);
    else res.status(404).json({ error: 'User not found' });
  } catch (err) {
    res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
  }
});

// DELETE user
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length > 0) res.json(result.rows[0]);
    else res.status(404).json({ error: 'User not found' });
  } catch (err) {
    res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
  }
});

module.exports = router;