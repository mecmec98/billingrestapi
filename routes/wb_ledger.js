const express = require('express');
const router = express.Router();
const isProd = process.env.NODE_ENV === 'production';
//DB configuration
const { pool } = require('../db.js');

// Middleware to check if the request is authenticated
const authenticateToken = require('../middleware/auth.js').authenticateToken;
//dummy authentication middleware use for testing purposes
// const authenticateToken = (req, res, next) => next();

// GET all wb_transactions
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM wb_ledger');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

// GET wb_transaction by consumerid
router.get('/consumer/:consumerid', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM wb_ledger WHERE consumer_id = $1', [req.params.consumerid]);
        if (result.rows.length > 0) res.json(result.rows);
        else res.status(404).json({ error: 'Transaction not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

//status guide 0 = unpaid, 1 = paid, 2 = partially paid, 3 = overdue, 4 = discounted
// POST create new wb_ledger
router.post('/', authenticateToken, async (req, res) => {
    const { consumerid, ref_no, reading_date, particulars, reading, wbusage, debit, credit, balance, by_user, status, amount } = req.body;
    const date_entered = new Date();
    if (consumerid === undefined
        || ref_no === undefined
        || !particulars
        || reading === undefined
        || wbusage === undefined
        || debit === undefined
        || credit === undefined
        || balance === undefined
        || !by_user
        || status === undefined
        || amount === undefined || amount === null) {

        return res.status(400).json({ error: 'Invalid or missing fields' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO wb_ledger (consumer_id, ref_no, reading_date, date_entered, particulars, reading, wbusage, debit, credit, balance, by_user, status, amount) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *',
            [consumerid, ref_no, reading_date, date_entered, particulars, reading, wbusage, debit, credit, balance, by_user, status, amount]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

// POST /wb_ledger/transaction for new transaction s
router.post('/transaction', authenticateToken, async (req, res) => {
    const {
        consumerid,
        ref_no,
        reading_date,
        particulars,
        debit = 0, //add toi their balance by
        credit = 0, //recuce their balance by
        by_user,
        status,
        amount = 0
    } = req.body;

    if (consumerid == undefined || !ref_no || !particulars || !by_user || status == undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const latestResult = await client.query(
            'SELECT balance FROM wb_ledger WHERE consumer_id = $1 ORDER BY id DESC LIMIT 1',
            [consumerid]
        );

        let latestBalance = 0;
        if (latestResult.rows.length > 0) {
            latestBalance = parseFloat(latestResult.rows[0].balance);
        }
        const newBalance = latestBalance + parseFloat(debit) - parseFloat(credit);
        const date_entered = new Date();

        let finalStatus = status;
        let finalParticulars = particulars;

        if (finalParticulars.includes('payment')) {
            if (newBalance < 0) {
                finalStatus = 4; // Advance
                finalParticulars = 'Advance Payment';
            } else if (newBalance > 0) {
                finalStatus = 2; // Partial
                finalParticulars = 'Partial Payment';
            } else if (newBalance === 0) {
                finalStatus = 1; // Paid
                finalParticulars = 'Full Payment';
            }
        }

        const insertResult = await client.query(
            `INSERT INTO wb_ledger 
        (consumer_id, ref_no, reading_date, date_entered, particulars, debit, credit, balance, by_user, status, amount)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
            [
                consumerid,
                ref_no,
                reading_date,
                date_entered,
                finalParticulars,
                debit,
                credit,
                newBalance,
                by_user,
                finalStatus,
                amount
            ]
        );

        await client.query('COMMIT');
        const row = insertResult.rows[0];

        // Optional: make dates ISO format for Flutter safety
        if (row.reading_date) row.reading_date = new Date(row.reading_date).toISOString();
        if (row.date_entered) row.date_entered = new Date(row.date_entered).toISOString();

        res.status(201).json(row);
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({
            error: process.env.NODE_ENV === 'production'
                ? 'Internal server error'
                : err.message
        });
    } finally {
        client.release();
    }
});

// PUT update wb_transaction status
router.put('/status/:id', authenticateToken, async (req, res) => {
    const { status } = req.body;

    if (!status || typeof status !== 'number') {
        return res.status(400).json({ error: 'Status is required and must be a number' });
    }
    try {
        const result = await pool.query(
            'UPDATE wb_ledger SET status = $1 WHERE id = $2 RETURNING *',
            [status, req.params.id]
        );

        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'Transaction not found' });
        }
    } catch (err) {
        res.status(500).json({
            error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
        });
    }
});

//Get latest balance by account_num
router.get('/balance/:consumer_id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT balance FROM wb_ledger WHERE consumer_id = $1 ORDER BY id DESC LIMIT 1',
            [req.params.consumer_id]
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

//update ledger status

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
            'UPDATE wb_ledger SET consumer_id = $1, prevreading = $2, curreading = $3, value = $4, status = $5, datepaid = $6, or_number = $7 WHERE id = $8 RETURNING *',
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
        const result = await pool.query('DELETE FROM wb_ledger WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length > 0) res.json({ success: true, message: 'Transaction deleted successfully' });
        else res.status(404).json({ error: 'Transaction not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

module.exports = router;