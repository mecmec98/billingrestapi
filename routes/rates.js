const express = require('express');
const router = express.Router();
//DB configuration
const { pool } = require('../db.js');

// GET all rates
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM rates');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET rate by id
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM rates WHERE id = $1', [req.params.id]);
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'Rate not found' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create new rate
router.post('/', async (req, res) => {
    const { code, type, metersize, minimum, rate1120, rate2130, rate3140, rate41up } = req.body;

    if (!code || typeof code !== 'string'
     || !type || typeof type !== 'string'
     || !metersize || typeof metersize !== 'string'
     || !minimum || typeof minimum !== 'number'
     || !rate1120 || typeof rate1120 !== 'number'
     || !rate2130 || typeof rate2130 !== 'number'
     || !rate3140 || typeof rate3140 !== 'number'
     || !rate41up || typeof rate41up !== 'number') {

        return res.status(400).json({ error: 'Invalid or missing name or value' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO rates (code, type, metersize, minimum, rate1120, rate2130, rate3140, rate41up) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [code, type, metersize, minimum, rate1120, rate2130, rate3140, rate41up]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update rate
router.put('/:id', async (req, res) => {
    const { code, type, metersize, minimum, rate1120, rate2130, rate3140, rate41up } = req.body;
    try {
        const result = await pool.query(
            'UPDATE rates SET code = $1, type = $2, metersize = $3, minimum = $4, rate1120 = $5, rate2130 = $6, rate3140 = $7, rate41up = $8 WHERE id = $9 RETURNING *',
            [code, type, metersize, minimum, rate1120, rate2130, rate3140, rate41up, req.params.id]
      );
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'Rate not found' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE rate
router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM rates WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length > 0) res.json({ message: 'Rate deleted successfully' });
        else res.status(404).json({ error: 'Rate not found' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});