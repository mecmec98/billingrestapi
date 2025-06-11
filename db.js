// PostgreSQL connection config
const { Pool } = require('pg');

const pool = new Pool({
  user: 'dapcwd_mec',
  host: '192.168.1.128',
  database: 'dapcwd_billing',
  password: '1981',
  port: 5432,
});

module.exports = { pool };