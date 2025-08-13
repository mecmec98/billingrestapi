const express = require('express');
const router = express.Router();
const isProd = process.env.NODE_ENV === 'production';
const { pool } = require('../db.js');
const authenticateToken = require('../middleware/auth.js');

// Get all roles
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM roles ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

// Get role by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM roles WHERE id = $1', [req.params.id]);
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'Role not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

// Create new role
router.post('/', authenticateToken, async (req, res) => {
    const { name, description, permissions, is_active = true } = req.body;

    if (!name || typeof name !== 'string'
        || !Array.isArray(permissions)
        || permissions.length === 0) {
        return res.status(400).json({ error: 'Name and permissions array are required' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO roles (name, description, permissions, is_active) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, description, JSON.stringify(permissions), is_active]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Role name already exists' });
        }
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

// Update role
router.put('/:id', authenticateToken, async (req, res) => {
    const { name, description, permissions, is_active } = req.body;

    if (!name || typeof name !== 'string'
        || !Array.isArray(permissions)
        || permissions.length === 0) {
        return res.status(400).json({ error: 'Name and permissions array are required' });
    }

    try {
        const result = await pool.query(
            'UPDATE roles SET name = $1, description = $2, permissions = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
            [name, description, JSON.stringify(permissions), is_active, req.params.id]
        );
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'Role not found' });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Role name already exists' });
        }
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

// Delete role
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM roles WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length > 0) res.json({ success: true, message: 'Role deleted successfully' });
        else res.status(404).json({ error: 'Role not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

// Check if user has permission
router.get('/check/:userId/:permission', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT r.permissions 
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.id = $1 AND r.is_active = true
        `, [req.params.userId]);
        
        if (result.rows.length > 0) {
            const permissions = result.rows[0].permissions;
            const hasPermission = permissions.includes(req.params.permission);
            res.json({ hasPermission, permissions });
        } else {
            res.status(404).json({ error: 'User or role not found' });
        }
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

module.exports = router;