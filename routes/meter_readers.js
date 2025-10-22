const express = require('express');
const router = express.Router();
const isProd = process.env.NODE_ENV === 'production';

//JWT Token configuration
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'defaultsecretkey';

// Middleware to check if the request is authenticated
const authenticateToken = require('../middleware/auth.js').authenticateToken;
//dummy authentication middleware use for testing purposes
//const authenticateToken = (req, res, next) => next();

//bcrypt configuration for password hashing
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

//DB configuration
const { pool } = require('../db.js');

// /meter_reader/login
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
        return res.json({ success: true, message: 'Login successful', user: { id: user.id, username: user.username, fullname: user.fullname, role_id: user.role_id }, token });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

//meter_reader/login-pin
router.post('/login-pin', async (req, res) => {
    const { username, pin } = req.body;
    if (!username || !pin) {
        return res.status(400).json({ error: 'Missing username or password' });
    }
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const user = result.rows[0];
        const pinMatch = await bcrypt.compare(pin, user.pin);
        if (!pinMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // On success, return user info and a JWT token
        const token = jwt.sign(
            { id: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '12h' } // Token expires in 12 hour
        );
        return res.json({ success: true, message: 'Login successful', user: { id: user.id, username: user.username, fullname: user.fullname, role_id: user.role_id }, token });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

//Get all meter readers
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM meter_reader');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

//Get meter reader by id
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM meter_reader WHERE id = $1', [req.params.id]);
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'User not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

// POST create new meter_reader
router.post('/', authenticateToken, async (req, res) => {
    const { username, password, mr_name, pin } = req.body;
    if (!username || typeof username !== 'string' || username.trim() === ''
        || !password || typeof password !== 'string' || password.trim() === ''
        || !mr_name || typeof mr_name !== 'string' || mr_name.trim() === ''
        || pin === undefined || typeof pin !== 'number') {
        return res.status(400).json({ error: 'Invalid or missing name' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password.trim(), SALT_ROUNDS);
        const hashedPin = await bcrypt.hash(pin.toString(), SALT_ROUNDS);
        const result = await pool.query(
            'INSERT INTO meter_reader (username,password,mr_name,pin) VALUES ($1,$2,$3,$4) RETURNING *',
            [username.trim(), hashedPassword, mr_name, hashedPin]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});


module.exports = router;
