const express = require('express');
const router = express.Router();
const isProd = process.env.NODE_ENV === 'production';
//DB configuration
const { pool } = require('../db.js');

// Get all consumers
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM consumers');
        res.json(result.rows);
    } catch (err) {
         res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

// Get consumer by ID
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM consumers WHERE id = $1', [req.params.id]);
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'Consumer not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

// Create new consumer
router.post('/', async (req, res) => {
    const { fullname, address, ratetype, metercode, meternumber, clusternumber, senior, seniorstart, seniorexpiry, status, prevreading, curreading } = req.body;

    if (!fullname || typeof fullname !== 'string'
        || !address || typeof address !== 'string'
        || !ratetype || typeof ratetype !== 'integer'
        || !metercode || typeof metercode !== 'number'
        || !meternumber || typeof meternumber !== 'string'
        || !clusternumber || typeof clusternumber !== 'string'
        || !senior || typeof senior !== 'number'
        || !seniorstart || isNaN(Date.parse(seniorstart))
        || !seniorexpiry || isNaN(Date.parse(seniorexpiry))
        || !status || typeof status !== 'number'
        || !prevreading || typeof prevreading !== 'number'
        || !curreading || typeof curreading !== 'number') {
        return res.status(400).json({ error: 'Invalid or missing fields' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO consumers (name, address, ratetype, metercode, meternumber, clusternumber, senior, seniorstart, seniorexpiry, status, prevreading, curreading) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
            [fullname, address, ratetype, metercode, meternumber, clusternumber, senior, seniorstart, seniorexpiry, status, prevreading, curreading]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

// Update consumer
router.put('/:id', async (req, res) => {
    const { fullname, address, ratetype, metercode, meternumber, clusternumber, senior, seniorstart, seniorexpiry, status, prevreading, curreading } = req.body;

    if (!fullname || typeof fullname !== 'string'
        || !address || typeof address !== 'string'
        || !ratetype || typeof ratetype !== 'integer'
        || !metercode || typeof metercode !== 'number'
        || !meternumber || typeof meternumber !== 'string'
        || !clusternumber || typeof clusternumber !== 'string'
        || !senior || typeof senior !== 'number'
        || !seniorstart || isNaN(Date.parse(seniorstart))
        || !seniorexpiry || isNaN(Date.parse(seniorexpiry))
        || !status || typeof status !== 'number'
        || !prevreading || typeof prevreading !== 'number'
        || !curreading || typeof curreading !== 'number') {

        return res.status(400).json({ error: 'Invalid or missing fields' });
    }

    try {
        const result = await pool.query(
            'UPDATE consumers SET name = $1, address = $2, ratetype = $3, metercode = $4, meternumber = $5, clusternumber = $6, senior = $7, seniorstart = $8, seniorexpiry = $9, status = $10, prevreading = $11, curreading = $12 WHERE id = $13 RETURNING *',
            [fullname, address, ratetype, metercode, meternumber, clusternumber, senior, seniorstart, seniorexpiry, status, prevreading, curreading, req.params.id]
        );
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'Consumer not found' });
    } catch (err) {
         res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

// Delete consumer
router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM consumers WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length > 0) res.json({ message: 'Consumer deleted successfully' });
        else res.status(404).json({ error: 'Consumer not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

// Export the router
module.exports = router;