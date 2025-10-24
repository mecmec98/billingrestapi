const express = require('express');
const router = express.Router();
const isProd = process.env.NODE_ENV === 'production';
//DB configuration
const { pool } = require('../db.js');

// Middleware to check if the request is authenticated
const authenticateToken = require('../middleware/auth.js').authenticateToken;
//dummy authentication middleware use for testing purposes
// const authenticateToken = (req, res, next) => next();


// GET all rates
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM rates');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

// GET rate by id
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM rates WHERE id = $1', [req.params.id]);
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'Rate not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

// POST create new rate
router.post('/', authenticateToken, async (req, res) => {
    const { code, type, metersize, minimum, rate1120, rate2130, rate3140, rate41up, rate_name } = req.body;

    if (code === undefined || typeof code !== 'number'
        || !type || typeof type !== 'string'
        || !metersize || typeof metersize !== 'string'
        || minimum  === undefined || typeof minimum !== 'number'
        || rate1120  === undefined || typeof rate1120 !== 'number'
        || rate2130  === undefined || typeof rate2130 !== 'number'
        || rate3140  === undefined || typeof rate3140 !== 'number'
        || rate41up  === undefined || typeof rate41up !== 'number'
        || !rate_name || typeof rate_name !== 'string') {

        return res.status(400).json({ error: 'Invalid input' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO rates (code, type, metersize, minimum, rate1120, rate2130, rate3140, rate41up, rate_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
            [code, type, metersize, minimum, rate1120, rate2130, rate3140, rate41up, rate_name]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

// PUT update rate
router.put('/:id', authenticateToken, async (req, res) => {
    const { code, type, metersize, minimum, rate1120, rate2130, rate3140, rate41up, rate_name } = req.body;

    if (code === undefined || typeof code !== 'number'
        || !type || typeof type !== 'string'
        || !metersize || typeof metersize !== 'string'
        || !minimum || typeof minimum !== 'number'
        || !rate1120 || typeof rate1120 !== 'number'
        || !rate2130 || typeof rate2130 !== 'number'
        || !rate3140 || typeof rate3140 !== 'number'
        || !rate41up || typeof rate41up !== 'number'
        || !rate_name || typeof rate_name !== 'string') {

        return res.status(400).json({ error: 'Invalid input' });
    }
    try {
        const result = await pool.query(
            'UPDATE rates SET code = $1, type = $2, metersize = $3, minimum = $4, rate1120 = $5, rate2130 = $6, rate3140 = $7, rate41up = $8, rate_name = $9 WHERE id = $10 RETURNING *',
            [code, type, metersize, minimum, rate1120, rate2130, rate3140, rate41up, rate_name, req.params.id]
        );
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'Rate not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

// DELETE rate
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM rates WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length > 0) res.json({ success: true, message: 'Rate deleted successfully' });
        else res.status(404).json({ error: 'Rate not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

module.exports = router;