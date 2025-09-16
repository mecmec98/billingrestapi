const express = require('express');
const router = express.Router();
const isProd = process.env.NODE_ENV === 'production';
//DB configuration
const { pool } = require('../db.js');

// Middleware to check if the request is authenticated
const authenticateToken = require('../middleware/auth.js').authenticateToken;
//dummy authentication middleware use for testing purposes
// const authenticateToken = (req, res, next) => next();

//GET all receipts
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM receipts');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

//GET receipt by id
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM receipts WHERE id = $1', [req.params.id]);
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'Receipt not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

//POST create new receipt
router.post('/', authenticateToken, async (req, res) => {
    const {or_number,machine_sn,items,to_customer,by_user,total_amount} = req.body;
    if (!or_number || !machine_sn || !items || !to_customer || !by_user || !total_amount) {
        return res.status(400).json({ error: 'Invalid or missing fields' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO receipts ( or_number, machine_sn, items, to_customer, by_user, total_amount) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [or_number, machine_sn, items, to_customer, by_user, total_amount]
        );
        res.json(result.rows[0]);
    } catch (err) { 
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

//PUT update receipt

router.put('/:id', authenticateToken, async (req, res) => {
    const {or_number,machine_sn,items,to_customer,by_user,total_amount} = req.body;
    if (!or_number || !machine_sn || !items || !to_customer || !by_user || !total_amount) {
        return res.status(400).json({ error: 'Invalid or missing fields' });
    }
    try {
        const result = await pool.query(
            'UPDATE receipts SET or_number = $2, machine_sn = $3, items = $4, to_customer = $5, by_user = $6, total_amount = $7 WHERE id = $1 RETURNING *',
            [req.params.id, or_number, machine_sn, items, to_customer, by_user, total_amount]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

//DELETE receipt
router.delete('/:id', authenticateToken, async (req, res) => {
    const {id} = req.params;
    if (!id) {
        return res.status(400).json({ error: 'Invalid or missing fields' });
    }
    try {
        const result = await pool.query('DELETE FROM receipts WHERE id = $1', [id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

module.exports = router;