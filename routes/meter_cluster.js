const express = require('express');
const router = express.Router();
const isProd = process.env.NODE_ENV === 'production';
const { pool } = require('../db.js');
const authenticateToken = require('../middleware/auth.js').authenticateToken;

// Get all meter clusters
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM meter_cluster ORDER BY cluster_number');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

// Get cluster by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM meter_cluster WHERE id = $1', [req.params.id]);
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'Cluster not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

// Get cluster by cluster number
router.get('/number/:cluster_number', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM meter_cluster WHERE cluster_number = $1', [req.params.cluster_number]);
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'Cluster not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

// Create new cluster
router.post('/', authenticateToken, async (req, res) => {
    const { 
        cluster_number, 
        cluster_location, 
        cluster_coordinates, 
        meter_list = [] 
    } = req.body;

    if (!cluster_number || typeof cluster_number !== 'string'
        || !Array.isArray(meter_list)) {
        return res.status(400).json({ error: 'Cluster number and meter list array are required' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO meter_cluster (cluster_number, cluster_location, cluster_coordinates, meter_list, date_created, date_updated) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *',
            [
                cluster_number, 
                cluster_location, 
                cluster_coordinates ? JSON.stringify(cluster_coordinates) : null,
                JSON.stringify(meter_list)
            ]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Cluster number already exists' });
        }
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

// Update cluster
router.put('/:id', authenticateToken, async (req, res) => {
    const { 
        cluster_number, 
        cluster_location, 
        cluster_coordinates, 
        meter_list 
    } = req.body;

    if (!cluster_number || typeof cluster_number !== 'string'
        || !Array.isArray(meter_list)) {
        return res.status(400).json({ error: 'Cluster number and meter list array are required' });
    }

    try {
        const result = await pool.query(
            'UPDATE meter_cluster SET cluster_number = $1, cluster_location = $2, cluster_coordinates = $3, meter_list = $4, date_updated = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
            [
                cluster_number, 
                cluster_location, 
                cluster_coordinates ? JSON.stringify(cluster_coordinates) : null,
                JSON.stringify(meter_list),
                req.params.id
            ]
        );
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'Cluster not found' });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Cluster number already exists' });
        }
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

// Add meter to cluster
router.put('/:id/add-meter', authenticateToken, async (req, res) => {
    const { meter_id } = req.body;

    if (!meter_id) {
        return res.status(400).json({ error: 'Meter ID is required' });
    }

    try {
        const result = await pool.query(
            'UPDATE meter_cluster SET meter_list = meter_list || $1::jsonb, date_updated = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [JSON.stringify(meter_id), req.params.id]
        );
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'Cluster not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

// Remove meter from cluster
router.put('/:id/remove-meter', authenticateToken, async (req, res) => {
    const { meter_id } = req.body;

    if (!meter_id) {
        return res.status(400).json({ error: 'Meter ID is required' });
    }

    try {
        const result = await pool.query(
            'UPDATE meter_cluster SET meter_list = meter_list - $1::text, date_updated = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [meter_id.toString(), req.params.id]
        );
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'Cluster not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

// Delete cluster
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM meter_cluster WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length > 0) res.json({ success: true, message: 'Cluster deleted successfully' });
        else res.status(404).json({ error: 'Cluster not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

module.exports = router;
