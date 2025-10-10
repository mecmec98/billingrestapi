const express = require('express');
const router = express.Router();
const isProd = process.env.NODE_ENV === 'production';
//DB configuration
const { pool } = require('../db.js');

// Middleware to check if the request is authenticated
const authenticateToken = require('../middleware/auth.js').authenticateToken;
//dummy authentication middleware use for testing purposes
// const authenticateToken = (req, res, next) => next();

//Get all from balance_old_table
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM balance_old_table');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

//Get balance_old_table by id
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM balance_old_table WHERE id = $1', [req.params.id]);
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'Balance not found' });
    } catch (err) {
        res.status(500).json({ erro: isProd ? 'Internal server error' : err.message });
    }
});

//POST create new balance
router.post('/', authenticateToken, async (req, res) => {
    const { mascode, balance, issuedateofbalancem, refno, created_at } = req.body;

    if (!mascode || !balance || !issuedateofbalancem || !refno || !created_at) {
        return res.status(400).json({ error: 'Invalid or missing fields' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO balance_old_table ( mascode, balance, issuedateofbalancem, refno, created_at ) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [mascode, balance, issuedateofbalancem, refno, created_at]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});


//PUT update balance_old_table
router.put('/:id', authenticateToken, async (req, res) => {
    const { mascode, balance, issuedateofbalancem, refno, created_at } = req.body;

    if (!mascode || !balance || !issuedateofbalancem || !refno || !created_at) {
        return res.status(400).json({ error: 'Invalid or missing fields' });
    }
    try {
        const result = await pool.query(
            'UPDATE balance_old_table SET mascode = $2, balance = $3, issuedateofbalancem = $4, refno = $5, created_at = $6 WHERE id = $1 RETURNING *',
            [req.params.id, mascode, balance, issuedateofbalancem, refno, created_at]
        );
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'Balance not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

//Delete balance
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ error: 'Invalid or missing fields' });
    }
    try {
        const result = await pool.query(
            'DELETE FROM balance_old_table WHERE id = $1 RETURNING *',
            [id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'balance not found' });
        }
        res.json({
            success: true,
            message: 'Balance deleted successfully',
            deleted: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

//Get by mascode
router.get('/mascode/:mascode', authenticateToken, async (req, res) => {
    const { mascode } = req.params;

    // Validate mascode is a number
    if (!mascode || isNaN(mascode)) {
        return res.status(400).json({ error: 'Invalid mascode parameter' });
    }
    try {
        const result = await pool.query(
            'SELECT * FROM balance_old_table WHERE mascode = $1',
            [mascode]
        );
        // Always return an array (empty if no results)
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching old balance:', err);
        res.status(500).json({
            error: isProd ? 'Internal server error' : err.message
        });
    }
});

module.exports = router;