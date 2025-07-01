require('dotenv').config();
const Firebird = require('node-firebird');

const firebirdConfig = {
  host: process.env.FBHOST,
  port: parseInt(process.env.FBPORT) || 3050,
  database: process.env.FBPATH,
  user: process.env.FBUSER,
  password: process.env.FBPASSWORD,
  lowercase_keys: false,
  role: null,
  pageSize: 4096
};

// Create connection pool
const pool = Firebird.pool(5, firebirdConfig); // 5 connections

module.exports = { firebirdConfig, pool };