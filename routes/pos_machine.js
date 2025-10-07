const express = require('express');
const router = express.Router();
const isProd = process.env.NODE_ENV === 'production';
//DB configuration
const { pool } = require('../db.js');

// Middleware to check if the request is authenticated
const authenticateToken = require('../middleware/auth.js').authenticateToken;
//dummy authentication middleware use for testing purposes
// const authenticateToken = (req, res, next) => next();


// Public Get all pos_machines
router.get('/public', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, pos_name, serial_num, model FROM pos_machine');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

//Get all pos_machines
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM pos_machine');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

// Get pos_machines by id
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM pos_machine WHERE id = $1', [req.params.id]);
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'POS not found' });
    } catch (err) {
        res.status(500).json({ erro: isProd ? 'Internal server error' : err.message });
    }
});


// POST create new pos_machine
router.post('/', authenticateToken, async (req, res) => {
    const { pos_name, serial_num, model } = req.body;

    if (!pos_name || !serial_num || !model) {
        return res.status(400).json({ error: 'Invalid or missing fields' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO pos_machine ( pos_name, serial_num, model ) VALUES ($1, $2, $3) RETURNING *',
            [pos_name, serial_num, model]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

//PUT update pos_machine
router.put('/:id', authenticateToken, async (req, res) => {
    const { pos_name, serial_num, model } = req.body;

    if (!pos_name || !serial_num || !model) {
        return res.status(400).json({ error: 'Invalid or missing fields' });
    }
    try {
        const result = await pool.query(
            'UPDATE pos_machine SET pos_name = $2, serial_num = $3, model = $4 WHERE id = $1 RETURNING *',
            [req.params.id, pos_name, serial_num, model]
        );
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'POS Machine not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal Server error' : err.message });
    }
});

// DELETE pos_machine
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ error: 'Invalid or missing fields' });
    }
    try {
        const result = await pool.query(
            'DELETE FROM pos_machine WHERE id = $1 RETURNING *',
            [id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'pos_machine not found' });
        }
        res.json({
            success: true,
            message: 'pos_machine deleted successfully',
            deleted: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

//SELECT current series
router.get('/peek/:serial_num', authenticateToken, async (req, res) => {
    const { serial_num } = req.params;

    if (!serial_num) {
        return res.status(400).json({ error: 'Invalid machine serial nummber' });
    }
    try {
        const result = await pool.query(
            'SELECT serial_num, batch, series_current, LPAD(series_current::TEXT,7, \'0\') as formatted_current FROM pos_machine WHERE serial_num=$1',
            [serial_num]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'POS machine not found' });
        }

        res.json(result.rows[0]);

    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

//SELECT to forward the series
router.get('/forward/:serial_num', authenticateToken, async (req, res) => {
    const { serial_num } = req.params;

    if (!serial_num) {
        return res.status(400).json({ error: 'POS machine not found' });
    }
    try {
        const result = await pool.query('SELECT * FROM get_next_or_number($1)', [serial_num]);

        if (result.rows.length === 0) {  // Additional check
            return res.status(404).json({ error: 'POS machine not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });

    }
});

module.exports = router;