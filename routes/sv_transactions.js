const express = require('express');
const router = express.Router();
const isProd = process.env.NODE_ENV === 'production';
//DB configuration
const { pool } = require('../db.js');


// Middleware to check if the request is authenticated
const authenticateToken = require('../middleware/auth.js');
//dummy authentication middleware use for testing purposes
// const authenticateToken = (req, res, next) => next();

//get all sv_transactions
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM sv_transactions');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
}   );

//get sv_transaction by consumer_id
router.get('/consumer/:consumerid', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM sv_transactions WHERE consumer_id = $1', [req.params.consumerid]);
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'Transaction not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

//get sv_transaction by id
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM sv_transactions WHERE id = $1', [req.params.id]);
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'Transaction not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

//create new sv_transaction
router.post('/', authenticateToken, async (req, res) => {
    const { consumer_id, service, value, status, datepaid, or_number } = req.body;

    if (!consumer_id || typeof consumer_id !== 'number'
        || !service || typeof service !== 'string'
        || !value || typeof value !== 'number'
        || !status || typeof status !== 'number'
        || !datepaid || isNaN(Date.parse(datepaid))
        || !or_number || typeof or_number !== 'string') {

        return res.status(400).json({ error: 'Invalid or missing fields' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO sv_transactions (consumer_id, service, value, status, datepaid, or_number) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [consumer_id, service, value, status, datepaid, or_number]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

//update sv_transaction on successful payment
router.put('/payment/:id', authenticateToken, async (req, res) => {
    const { status, datepaid, or_number } = req.body;

    if (!status || typeof status !== 'number'
        || !datepaid || isNaN(Date.parse(datepaid))
        || !or_number || typeof or_number !== 'string') {
        return res.status(400).json({ error: 'Invalid or missing fields' });
    }

    try {
        const result = await pool.query(
            'UPDATE sv_transactions SET status = $1, datepaid = $2, or_number = $3 WHERE id = $4 RETURNING *',
            [status, datepaid, or_number, req.params.id]
        );
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'Transaction not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

//update sv_transaction
router.put('/:id', authenticateToken, async (req, res) => {
    const { consumer_id, service, value, status, datepaid, or_number } = req.body;

    if (!consumer_id || typeof consumer_id !== 'number'
        || !service || typeof service !== 'string'
        || !value || typeof value !== 'number'
        || !status || typeof status !== 'number'
        || !datepaid || isNaN(Date.parse(datepaid))
        || !or_number || typeof or_number !== 'string') {

        return res.status(400).json({ error: 'Invalid or missing fields' });
    }

    try {
        const result = await pool.query(
            'UPDATE sv_transactions SET consumer_id = $1, service = $2, value = $3, status = $4, datepaid = $5, or_number = $6 WHERE id = $7 RETURNING *',
            [consumer_id, service, value, status, datepaid, or_number, req.params.id]
        );
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'Transaction not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

//delete sv_transaction
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM sv_transactions WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length > 0) res.json({ message: 'Transaction deleted successfully' });
        else res.status(404).json({ error: 'Transaction not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});