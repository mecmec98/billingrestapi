const express = require('express');
const router = express.Router();
const isProd = process.env.NODE_ENV === 'production';
//DB configuration
const { pool } = require('../db.js');

// Middleware to check if the request is authenticated
const authenticateToken = require('../middleware/auth.js').authenticateToken;
//dummy authentication middleware use for testing purposes
// const authenticateToken = (req, res, next) => next();


//Get all prefs
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM prefs');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

//Create prefs
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { key, value, uom, prefs } = req.body;

        // Validate input
        if (!key || key.trim() === '') {
            return res.status(400).json({ error: 'key is required' });
        }

        const result = await pool.query(
            'INSERT INTO prefs (key, value) VALUES ($1, $2) RETURNING *',
            [key.trim(), value]
        );

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});


//Get prefs by key
router.get('/key', authenticateToken, async (req, res) => {
    try {
        const { key } = req.query;

        // Validate input
        if (!key || key.trim() === '') {
            return res.status(400).json({ error: 'key query parameter is required' });
        }

        const result = await pool.query(
            'SELECT * FROM prefs WHERE key = $1 LIMIT 1',
            [key.trim()]
        );

        if (result.rows.length > 0) {
            const prefs = result.rows[0];
            res.json(prefs);
        } else {
            res.status(404).json({ error: 'Prefs not found' });
        }
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});


//Update prefs by key
router.put('/key', authenticateToken, async (req, res) => {
    try {
        const { key } = req.query;
        const { value } = req.body;

        // Validate input
        if (!key || key.trim() === '') {
            return res.status(400).json({ error: 'key query parameter is required' });
        }

        const result = await pool.query(
            'UPDATE prefs SET value = $1 WHERE key = $2',
            [value, key.trim()]
        );

        if (result.rows.length > 0) {
            const prefs = result.rows[0];
            res.json(prefs);
        } else {
            res.status(404).json({ error: 'Prefs not found' });
        }
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

module.exports = router;