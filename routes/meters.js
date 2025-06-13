const express = require('express');
const router = express.Router();
const isProd = process.env.NODE_ENV === 'production';
//DB configuration
const { pool } = require('../db.js');

// Middleware to check if the request is authenticated
const authenticateToken = require('../middleware/auth.js');
//dummy authentication middleware use for testing purposes
// const authenticateToken = (req, res, next) => next();

// GET all meters
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM meters');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

// GET meter by id
router.get('/:id', authenticateToken,  async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM meters WHERE id = $1', [req.params.id]);
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'Meter not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

// POST create new meter
router.post('/', authenticateToken, async (req, res) => {
    const { code, brand } = req.body;

    if (!code || typeof code !== 'number'
        || !brand || typeof brand !== 'string') {

        return res.status(400).json({ error: 'Invalid or missing name or value' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO meters (code, brand) VALUES ($1, $2) RETURNING *',
            [code, brand]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

// PUT update meter
router.put('/:id', authenticateToken, async (req, res) => {
    const { code, brand } = req.body;

    if (!code || typeof code !== 'number'
        || !brand || typeof brand !== 'string') {

        return res.status(400).json({ error: 'Invalid or missing name or value' });
    }
    try {
        const result = await pool.query(
            'UPDATE meters SET code = $1, brand = $2 WHERE id = $3 RETURNING *',
            [code, brand, req.params.id]
        );
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'Meter not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

// DELETE meter
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM meters WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length > 0) res.json({ message: 'Meter deleted successfully' });
        else res.status(404).json({ error: 'Meter not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

module.exports = router;