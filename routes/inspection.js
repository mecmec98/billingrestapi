const express = require('express');
const router = express.Router();
const isProd = process.env.NODE_ENV === 'production';
//DB configuration
const { pool } = require('../db.js');

// Middleware to check if the request is authenticated
const authenticateToken = require('../middleware/auth.js').authenticateToken;
//dummy authentication middleware use for testing purposes
// const authenticateToken = (req, res, next) => next();

//GET all inspection
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM inspection');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});


//GET inspection by id
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM inspection WHERE id = $1', [req.params.id]);
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'Inspection not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

//POST new inspection (cols : application_id, plumber, engineer, date_inspected,remarks, status)
router.post('/', authenticateToken, async (req, res) => {
    const { application_id, plumber, engineer, date_inspected, remarks, status } = req.body;
    if (!application_id || !plumber || !engineer || !date_inspected || !remarks || !status) {
        return res.status(400).json({ error: 'Invalid or missing fields' });
    }
    try {
        const result = await pool.query('INSERT INTO inspection (application_id, plumber, engineer, date_inspected, remarks, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [application_id, plumber, engineer, date_inspected, remarks, status]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

//PUT update inspection by id (cols : application_id, plumber, engineer, date_inspected,remarks, status)
router.put('/:id', authenticateToken, async (req, res) => {
    const { application_id, plumber, engineer, date_inspected, remarks, status } = req.body;
    if (!application_id || !plumber || !engineer || !date_inspected || !remarks || !status) {
        return res.status(400).json({ error: 'Invalid or missing fields' });
    }
    try {
        const result = await pool.query('UPDATE inspection SET application_id = $1, plumber = $2, engineer = $3, date_inspected = $4, remarks = $5, status = $6 WHERE id = $7 RETURNING *', [application_id, plumber, engineer, date_inspected, remarks, status, req.params.id]);
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'Inspection not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

//DELETE inspection by id
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM inspection WHERE id = $1', [req.params.id]);
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'Inspection not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

module.exports = router;
