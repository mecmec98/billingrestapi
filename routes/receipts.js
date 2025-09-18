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
    const { or_number, machine_sn, items, to_customer, by_user, total_amount, payment_mode, or_status, series_batch } = req.body;

    const itemsJson = typeof items === 'string' ? items : JSON.stringify(items);

    if (!or_number || !machine_sn || !itemsJson || !to_customer || !by_user || !total_amount || !payment_mode || !or_status || !series_batch) {
        return res.status(400).json({ error: 'Invalid or missing fields' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO receipts ( or_number, machine_sn, items, to_customer, by_user, total_amount, payment_mode, or_status, series_batch) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
            [or_number, machine_sn, itemsJson, to_customer, by_user, total_amount, payment_mode, or_status, series_batch]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

//PUT update receipt
router.put('/:id', authenticateToken, async (req, res) => {
    const { items, to_customer, by_user, total_amount, payment_mode, or_status } = req.body;
    const itemsJson = typeof items === 'string' ? items : JSON.stringify(items);

    if (!itemsJson || !to_customer || !by_user || !total_amount || !payment_mode || !or_status) {
        return res.status(400).json({ error: 'Invalid or missing fields' });
    }
    try {
        const result = await pool.query(
            'UPDATE receipts SET items = $2, to_customer = $3, by_user = $4, total_amount = $5, payment_mode = $6, or_status = $7 WHERE id = $1 RETURNING *',
            [req.params.id, itemsJson, to_customer, by_user, total_amount, payment_mode, or_status]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

//DELETE receipt
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
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


// Endpoint to remit receipts by machine (update status from 1 to 2)
router.post('/api/receipts/remit', async (req, res) => {
    const { machine_sn } = req.body;

    // Validate required fields
    if (!machine_sn) {
        return res.status(400).json({
            success: false,
            message: 'machine_sn is required'
        });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Get the latest remit_batch from all machines
        const batchQuery = `
            SELECT COALESCE(MAX(remit_batch), 0) as max_remit_batch 
            FROM receipts 
            WHERE status = 2
        `;
        const batchResult = await client.query(batchQuery);
        const nextRemitBatch = batchResult.rows[0].max_remit_batch + 1;

        // Check if there are any receipts to remit for this machine
        const checkQuery = `
            SELECT COUNT(*) as count 
            FROM receipts 
            WHERE machine_sn = $1 AND status = 1
        `;
        const checkResult = await client.query(checkQuery, [machine_sn]);

        if (checkResult.rows[0].count == 0) {
            await client.query('ROLLBACK');
            return res.json({
                success: false,
                message: `No receipts found to remit for machine ${machine_sn}`
            });
        }

        // Update receipts with status = 1 for the specific machine
        const updateQuery = `
            UPDATE receipts 
            SET 
                status = 2,
                remit_batch = $1,
                date_remitted = NOW()
            WHERE machine_sn = $2 AND status = 1
            RETURNING id, or_number, batch_prefix, total_amount, machine_sn
        `;

        const result = await client.query(updateQuery, [nextRemitBatch, machine_sn]);

        // Calculate total amount remitted
        const totalAmount = result.rows.reduce((sum, row) => sum + parseFloat(row.total_amount), 0);

        await client.query('COMMIT');

        res.json({
            success: true,
            message: `Successfully remitted ${result.rows.length} receipts for machine ${machine_sn}`,
            machine_sn: machine_sn,
            remittedReceipts: result.rows.length,
            remitBatch: nextRemitBatch,
            totalAmount: totalAmount.toFixed(2),
            updatedReceipts: result.rows
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error remitting receipts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remit receipts',
            error: error.message
        });
    } finally {
        client.release();
    }
});

router.get('/api/receipts/remit-summary/:machine_sn', async (req, res) => {
    const { machine_sn } = req.params;
    
    try {
        const query = `
            SELECT 
                machine_sn,
                remit_batch,
                COUNT(*) as receipt_count,
                SUM(total_amount) as total_amount,
                MIN(date_updated) as remit_date
            FROM receipts 
            WHERE machine_sn = $1 AND status = 2 AND remit_batch IS NOT NULL
            GROUP BY machine_sn, remit_batch
            ORDER BY remit_batch DESC
        `;
        
        const result = await pool.query(query, [machine_sn]);
        
        res.json({
            success: true,
            machine_sn: machine_sn,
            remitHistory: result.rows
        });
        
    } catch (error) {
        console.error('Error fetching remit summary:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch remit summary',
            error: error.message
        });
    }
});

router.get('/api/receipts/remit-summary', async (req, res) => {
    try {
        const query = `
            SELECT 
                machine_sn,
                remit_batch,
                COUNT(*) as receipt_count,
                SUM(total_amount) as total_amount,
                MIN(date_updated) as remit_date
            FROM receipts 
            WHERE status = 2 AND remit_batch IS NOT NULL
            GROUP BY machine_sn, remit_batch
            ORDER BY machine_sn, remit_batch DESC
        `;
        
        const result = await pool.query(query);
        
        res.json({
            success: true,
            remitHistory: result.rows
        });
        
    } catch (error) {
        console.error('Error fetching remit summary:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch remit summary',
            error: error.message
        });
    }
});


module.exports = router;