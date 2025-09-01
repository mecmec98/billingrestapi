const express = require('express');
const router = express.Router();
const isProd = process.env.NODE_ENV === 'production';
//DB configuration
const { pool } = require('../db.js');

// Middleware to check if the request is authenticated
const authenticateToken = require('../middleware/auth.js');
//dummy authentication middleware use for testing purposes
// const authenticateToken = (req, res, next) => next();

//Get all application lists
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM application_list');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

//Get application list by id
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM application_list WHERE id = $1', [req.params.id]);
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'Application list not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

//Create new application list

router.post('/', authenticateToken, async (req, res) => {
    const { application_number,
        applicant_name = '',
        house_num = '',
        street = '',
        purok = '',
        barangay = '',
        city = '',
        province = '',
        contact_info = '',
        status = 0,
        by_user = '' } = req.body;
  if (!applicant_name || typeof applicant_name !== 'string'
        || typeof house_num !== 'string'
        || typeof street !== 'string'
        || typeof purok !== 'string'
        || typeof barangay !== 'string'
        || typeof city !== 'string'
        || typeof province !== 'string'
        || typeof contact_info !== 'string'
        || !by_user) {
        return res.status(400).json({ error: 'Invalid or missing fields' });
    }
    try {
        const result = await pool.query(
            `INSERT INTO application_list 
            (application_number, applicant_name, house_num, street, purok, barangay, city, province, contact_info, status, by_user) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
            [application_number, applicant_name, house_num, street, purok, barangay, city, province, contact_info, status, by_user]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});


//Update application list
router.put('/:id', authenticateToken, async (req, res) => {
    const { application_number,
        applicant_name = '',
        house_num = '',
        street = '',
        purok = '',
        barangay = '',
        city = '',
        province = '',
        contact_info = '',
        status = 0,
        by_user = '' } = req.body;
    if (!applicant_name || typeof applicant_name !== 'string'
        || typeof house_num !== 'string'
        || typeof street !== 'string'

        || typeof purok !== 'string'
        || typeof barangay !== 'string'
        || typeof city !== 'string'
        || typeof province !== 'string'
        || typeof contact_info !== 'string'
        || !by_user) {
        return res.status(400).json({ error: 'Invalid or missing fields' });
    }
    try {
        const result = await pool.query(
            `UPDATE application_list SET 
            application_number = $1, applicant_name = $2, house_num = $3, street = $4, purok = $5, barangay = $6, city = $7, province = $8, contact_info = $9, status = $10, by_user = $11
            WHERE id = $12 RETURNING *`,
            [application_number, applicant_name, house_num, street, purok, barangay, city, province, contact_info, status, by_user, req.params.id]
        );
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'Application list not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

//Delete application list
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const
            result = await pool.query('DELETE FROM application_list WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length > 0) res.json({ message: 'Application list deleted successfully' });
        else res.status(404).json({ error: 'Application list not found' });
    } catch (err) {
        res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
    }
});

module.exports = router;