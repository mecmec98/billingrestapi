const express = require('express');
const router = express.Router();
const isProd = process.env.NODE_ENV === 'production';

//JWT Token configuration
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET  || 'defaultsecretkey';

// Middleware to check if the request is authenticated
const authenticateToken = require('../middleware/auth.js');
//dummy authentication middleware use for testing purposes
//const authenticateToken = (req, res, next) => next();

//bcrypt configuration for password hashing
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

//DB configuration
const { pool } = require('../db.js');


// /users/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing username or password' });
  }
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = result.rows[0];
     const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    // On success, return user info and a JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '12h' } // Token expires in 12 hour
    );
    return res.json({ success: true, message: 'Login successful', user: { id: user.id, username: user.username }, token });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET all users
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
  }
});

// GET user by id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (result.rows.length > 0) res.json(result.rows[0]);
    else res.status(404).json({ error: 'User not found' });
  } catch (err) {
    res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
  }
});

// POST create new user
router.post('/', authenticateToken, async (req, res) => {
  const { username, password } = req.body;
  if (!username || typeof username !== 'string' || username.trim() === ''
      || !password || typeof password !== 'string' || password.trim() === '') {
    return res.status(400).json({ error: 'Invalid or missing name' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password.trim(), SALT_ROUNDS);
    const result = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *',
      [username.trim(), hashedPassword]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
  }
});

// PUT update username
router.put('/username/:id', authenticateToken, async (req, res) => {
  const { username } = req.body;
  try {
    const result = await pool.query(
      'UPDATE users SET username = $1 WHERE id = $2 RETURNING *',
      [username, req.params.id]
    );
    if (result.rows.length > 0) res.json(result.rows[0]);
    else res.status(404).json({ error: 'User not found' });
  } catch (err) {
     if (err.code === '23505') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
  }
});

// PUT update password
router.put('/password/:id', authenticateToken, async (req, res) => {
  const { password } = req.body;
  if (!password || typeof password !== 'string' || password.trim() === '') {
    return res.status(400).json({ error: 'Invalid or missing password' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password.trim(), SALT_ROUNDS);
    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2 RETURNING *',
      [hashedPassword, req.params.id]
    );
    if (result.rows.length > 0) res.json(result.rows[0]);
    else res.status(404).json({ error: 'User not found' });
  } catch (err) {
    res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
  }
});

// DELETE user
router.delete('/:id', authenticateToken, async (req, res) => {
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