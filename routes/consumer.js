const express = require('express');
const router = express.Router();
//DB configuration
const { pool } = require('../db.js');

// POST /