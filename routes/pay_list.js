const express = require('express');
const router = express.Router();
const isProd = process.env.NODE_ENV === 'production';
//DB configuration
const { pool } = require('../db.js');

// Middleware to check if the request is authenticated
const authenticateToken = require('../middleware/auth.js').authenticateToken;

//GET ALL consumer pay list
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM consumer_pay_lst');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

//GET all by account_num
router.get('/account/:account_num', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM consumer_pay_lst WHERE account_num = $1', [req.params.account_num]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

//Get latest balance by account_num
router.get('/balance/:account_num', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT balance FROM consumer_pay_lst WHERE account_num = $1 ORDER BY id DESC LIMIT 1', 
            [req.params.account_num]
        );
        
        // Return single object instead of array if found
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'No records found for this account' });
        }
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

//Change Status by paylist id
router.put('/status/:id', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;
        
        const result = await pool.query('UPDATE consumer_pay_lst SET status = $1 WHERE id = $2', [status, id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

module.exports = router;
