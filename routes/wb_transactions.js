const express = require('express');
const router = express.Router();
const isProd = process.env.NODE_ENV === 'production';
//DB configuration
const { pool } = require('../db.js');

// Middleware to check if the request is authenticated
const authenticateToken = require('../middleware/auth.js');
//dummy authentication middleware use for testing purposes
// const authenticateToken = (req, res, next) => next();

// GET all wb_transactions
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM wb_transactions');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

// GET wb_transaction by consumerid
router.get('/consumer/:consumerid', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM wb_transactions WHERE consumerid = $1', [req.params.consumerid]);
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'Transaction not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

// POST create new wb_transaction
router.post('/', authenticateToken, async (req, res) => {
    const { consumerid, prevreading, curreading, value, status, dateposted, datedue } = req.body;

    if (!consumerid || typeof consumerid !== 'number'
        || !prevreading || typeof prevreading !== 'number'
        || !curreading || typeof curreading !== 'number'
        || !value || typeof value !== 'number'
        || !status || typeof status !== 'number'
        || !dateposted || isNaN(Date.parse(dateposted))
        || !datedue || isNaN(Date.parse(datedue))) {

        return res.status(400).json({ error: 'Invalid or missing fields' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO wb_transactions (consumer_id, prevreading, curreading, value, status, dateposted, datedue) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [consumerid, prevreading, curreading, value, status, dateposted, datedue]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

// PUT update wb_transaction on successful payment
router.put('/payment/:id', authenticateToken, async (req, res) => {
    const { status, datepaid, or_number } = req.body;

    if (!status || typeof status !== 'number'
        || !datepaid || isNaN(Date.parse(datepaid))
        || !or_number || typeof or_number !== 'string') {
        return res.status(400).json({ error: 'Invalid or missing fields' });
    }

    try {
        const result = await pool.query(
            'UPDATE wb_transactions SET status = $1, datepaid = $2, or_number = $3 WHERE id = $4 RETURNING *',
            [status, datepaid, or_number, req.params.id]
        );
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'Transaction not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

// PUT update wb_transaction
router.put('/:id', authenticateToken, async (req, res) => {
    const { consumerid, prevreading, curreading, value, status, datepaid, or_number, dateposted, datedue } = req.body;
    if (!consumerid || typeof consumerid !== 'number'
        || !prevreading || typeof prevreading !== 'number'
        || !curreading || typeof curreading !== 'number'
        || !value || typeof value !== 'number'
        || !status || typeof status !== 'number'
        || !datepaid || isNaN(Date.parse(datepaid))
        || !or_number || typeof or_number !== 'string'
        || !dateposted || isNaN(Date.parse(dateposted))
        || !datedue || isNaN(Date.parse(datedue))) {
        return res.status(400).json({ error: 'Invalid or missing fields' });
    }

    try {
        const result = await pool.query(
            'UPDATE wb_transactions SET consumer_id = $1, prevreading = $2, curreading = $3, value = $4, status = $5, datepaid = $6, or_number = $7 WHERE id = $8 RETURNING *',
            [consumerid, prevreading, curreading, value, status, datepaid, or_number, req.params.id]
        );
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'Transaction not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

// DELETE wb_transaction
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM wb_transactions WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length > 0) res.json({ success: true, message: 'Transaction deleted successfully' });
        else res.status(404).json({ error: 'Transaction not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

module.exports = router;