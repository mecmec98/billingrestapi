const express = require('express');
const router = express.Router();
const isProd = process.env.NODE_ENV === 'production';
//DB configuration
const { pool } = require('../db.js');

// Middleware to check if the request is authenticated
const authenticateToken = require('../middleware/auth.js').authenticateToken;
//dummy authentication middleware use for testing purposes
// const authenticateToken = (req, res, next) => next();

// Get all consumers
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM consumer');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

// Search consumer by account number
router.get('/search', authenticateToken, async (req, res) => {
    try {
        const { account_number } = req.query;

        // Validate input
        if (!account_number || account_number.trim() === '') {
            return res.status(400).json({ error: 'account_number query parameter is required' });
        }

        const result = await pool.query(
            'SELECT * FROM consumer WHERE account_number = $1 LIMIT 1',
            [account_number.trim()]
        );

        if (result.rows.length > 0) {
            
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'Consumer not found' });
        }
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});


// Get consumer by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM consumer WHERE id = $1', [req.params.id]);
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'Consumer not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

// Create new consumer
router.post('/', authenticateToken, async (req, res) => {
    const { fullname,
        address,
        ratetype,
        metercode = 0,
        meternumber,
        senior = 0,
        seniorstart = '2000-01-01',
        seniorexpiry = '2000-01-01',
        status,
        date_connected,
        date_disconnected,
        date_reconnected,
        account_number,
        zone = '',
        book = '',
        rate_class = '',
        metersize = '',
        account_suffix = '',
        created_by_userid = 1 } = req.body;

    if (!fullname || typeof fullname !== 'string'
        || !address || typeof address !== 'string'
        || !ratetype || typeof ratetype !== 'number'
        || !metercode || typeof metercode !== 'number'
        || !meternumber || typeof meternumber !== 'string'
        || senior === undefined || typeof senior !== 'number'
        || !seniorstart || isNaN(Date.parse(seniorstart))
        || !seniorexpiry || isNaN(Date.parse(seniorexpiry))
        || status === undefined || typeof status !== 'number'
        || !date_connected || isNaN(Date.parse(date_connected))
        || !date_disconnected || isNaN(Date.parse(date_disconnected))
        || !date_reconnected || isNaN(Date.parse(date_reconnected))
        || !account_number || typeof account_number !== 'string'
        || typeof zone !== 'string'
        || typeof book !== 'string'
        || typeof rate_class !== 'string'
        || typeof metersize !== 'string'
        || typeof account_suffix !== 'string'
        || !created_by_userid
        || typeof created_by_userid !== 'number') {
        return res.status(400).json({ error: 'Invalid or missing fields' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO consumer (fullname, address, ratetype, metercode, meternumber, senior, seniorstart, seniorexpiry, status, date_connected, date_disconnected, date_reconnected, account_number, zone, book, rate_class, metersize, account_suffix, created_by_userid, date_created) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, CURRENT_DATE) RETURNING *',
            [fullname, address, ratetype, metercode, meternumber, senior, seniorstart, seniorexpiry, status, date_connected, date_disconnected, date_reconnected, account_number, zone, book, rate_class, metersize, account_suffix, created_by_userid]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

// Update consumer
router.put('/:id', authenticateToken, async (req, res) => {
    const { fullname,
        address,
        ratetype,
        metercode = 0,
        meternumber,
        senior = 0,
        seniorstart = '2000-01-01',
        seniorexpiry = '2000-01-01',
        status,
        date_connected,
        date_disconnected,
        date_reconnected,
        account_number,
        zone = '',
        book = '',
        rate_class = '',
        metersize = '',
        account_suffix = '' } = req.body;

    if (!fullname || typeof fullname !== 'string'
        || !address || typeof address !== 'string'
        || !ratetype || typeof ratetype !== 'number'
        || !metercode || typeof metercode !== 'number'
        || !meternumber || typeof meternumber !== 'string'
        || senior === undefined || typeof senior !== 'number'
        || !seniorstart || isNaN(Date.parse(seniorstart))
        || !seniorexpiry || isNaN(Date.parse(seniorexpiry))
        || status === undefined || typeof status !== 'number'
        || !date_connected || isNaN(Date.parse(date_connected))
        || !date_disconnected || isNaN(Date.parse(date_disconnected))
        || !date_reconnected || isNaN(Date.parse(date_reconnected))
        || !account_number || typeof account_number !== 'string'
        || typeof zone !== 'string'
        || typeof book !== 'string'
        || typeof rate_class !== 'string'
        || typeof metersize !== 'string'
        || typeof account_suffix !== 'string') {

        return res.status(400).json({ error: 'Invalid or missing fields' });
    }

    try {
        const result = await pool.query(
            'UPDATE consumer SET fullname = $1, address = $2, ratetype = $3, metercode = $4, meternumber = $5, senior = $6, seniorstart = $7, seniorexpiry = $8, status = $9, date_connected = $10, date_disconnected = $11, date_reconnected = $12, account_number = $13, zone = $14, book = $15, rate_class = $16, metersize = $17, account_suffix = $18 WHERE id = $19 RETURNING *',
            [fullname, address, ratetype, metercode, meternumber, senior, seniorstart, seniorexpiry, status, date_connected, date_disconnected, date_reconnected, account_number, zone, book, rate_class, metersize, account_suffix, req.params.id]
        );
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'Consumer not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }

});

// Delete consumer
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM consumer WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length > 0) res.json({ success: true, message: 'Consumer deleted successfully' });
        else res.status(404).json({ error: 'Consumer not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

// Export the router
module.exports = router; 