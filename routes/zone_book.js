const express = require('express');
const router = express.Router();
const isProd = process.env.NODE_ENV === 'production';
//DB configuration
const { pool } = require('../db.js');

// Middleware to check if the request is authenticated
const authenticateToken = require('../middleware/auth.js').authenticateToken;
//dummy authentication middleware use for testing purposes
// const authenticateToken = (req, res, next) => next();

//Get all zone books
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM zone_book');
        res.json(result.rows);
    } catch (err) {
         res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

//Get zone book by id
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM zone_book WHERE id = $1', [req.params.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

//Create new zone book body: zone, book, barangay
router.post('/', authenticateToken, async (req, res) => {
    const { zone, book, barangay } = req.body;
    if (!zone || !book || !barangay) {
        return res.status(400).json({ error: 'Invalid input' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO zone_book (zone, book, barangay) VALUES ($1, $2, $3) RETURNING *', 
            [zone, book, barangay]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
         res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

//Update zone book by id body: zone, book, barangay
router.put('/:id', authenticateToken, async (req, res) => {
    const { zone, book, barangay } = req.body;
    if (!zone || !book || !barangay) {
        return res.status(400).json({ error: 'Invalid input' });
    }
    try {
        const [rows] = await pool.query(
            'UPDATE zone_book SET zone = $1, book = $2, barangay = $3 WHERE id = $4 RETURNING *', 
            [zone, book, barangay, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
         res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

//Delete zone book by id
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query('DELETE FROM zone_book WHERE id = $1', [req.params.id]);
        if (rows.rows.length > 0) res.json({success:true, message: 'Zone book deleted successfully' });
        else res.status(404).json({ error: 'Zone book not found' });
    } catch (err) {
         res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

module.exports = router;