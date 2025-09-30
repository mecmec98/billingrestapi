const express = require('express');
const router = express.Router();
const isProd = process.env.NODE_ENV === 'production';
//DB configuration
const { pool } = require('../db.js');

// Middleware to check if the request is authenticated
const authenticateToken = require('../middleware/auth.js').authenticateToken;
//dummy authentication middleware use for testing purposes
// const authenticateToken = (req, res, next) => next();


//GET all discounts
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM discounts');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

//GET discount by id
router.get('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM discounts WHERE id = $1', [id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

//POST new discount (cols : disc_name, disc_value, created_by)
router.post('/', authenticateToken, async (req, res) => {
    const { disc_name, disc_value, created_by } = req.body;
    if (!disc_name || !disc_value || !created_by) {
        return res.status(400).json({ error: 'Invalid or missing fields' });
    }
    try {
        const result = await pool.query('INSERT INTO discounts (disc_name, disc_value, created_by) VALUES ($1, $2, $3) RETURNING *', [disc_name, disc_value, created_by]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

//PUT update discount by id (cols : disc_name, disc_value, created_by)
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { disc_name, disc_value, created_by } = req.body;
    if (!disc_name || !disc_value || !created_by) {
        return res.status(400).json({ error: 'Invalid or missing fields' });
    }
    try {
        const result = await pool.query('UPDATE discounts SET disc_name = $1, disc_value = $2, created_by = $3 WHERE id = $4 RETURNING *', [disc_name, disc_value, created_by, id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});


//DELETE discount by id
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ error: 'Invalid discount id' });
    }
    try {
        const result = await pool.query('DELETE FROM discounts WHERE id = $1', [id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});
    
module.exports = router;