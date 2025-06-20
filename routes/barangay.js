const express = require('express');
const router = express.Router();
const isProd = process.env.NODE_ENV === 'production';
//DB configuration
const { pool } = require('../db.js');

// Middleware to check if the request is authenticated
const authenticateToken = require('../middleware/auth.js');
//dummy authentication middleware use for testing purposes
// const authenticateToken = (req, res, next) => next();

//Get all barangays
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM barangay');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

//Get barangay by id
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM barangay WHERE id = $1', [req.params.id]);
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'Barangay not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

//Create new barangay
router.post('/', authenticateToken, async (req, res) => {
    const { name, code } = req.body;

    if (!name || typeof name !== 'string'
        || !code || typeof code !== 'number') {

        return res.status(400).json({ error: 'Invalid or missing name or code' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO barangay (name, code) VALUES ($1, $2) RETURNING *',
            [name, code]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

//Update barangay
router.put('/:id', authenticateToken, async (req, res) => {
    const { name, code } = req.body;

    if (!name || typeof name !== 'string'
        || !code || typeof code !== 'number') {

        return res.status(400).json({ error: 'Invalid or missing name or code' });
    }

    try {
        const result = await pool.query(
            'UPDATE barangay SET name = $1, code = $2 WHERE id = $3 RETURNING *',
            [name, code, req.params.id]
        );
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'Barangay not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

//Delete barangay
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM barangay WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length > 0) res.json({ message: 'Barangay deleted successfully' });
        else res.status(404).json({ error: 'Barangay not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

module.exports = router;