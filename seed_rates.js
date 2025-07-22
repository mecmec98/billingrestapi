require('dotenv').config();
const { pool } = require('./db.js');

async function seedRates() {
  const rates = [
    [1, 'Residential', '1/2"', 252.00, 26.50, 28.20, 30.20, 32.90],
    [2, 'Residential', '3/4"', 403.20, 26.50, 28.20, 30.20, 32.90],
    [3, 'Residential', '1"', 806.40, 26.50, 28.20, 30.20, 32.90],
    [4, 'Residential', '1 1/2"', 2016.00, 26.50, 28.20, 30.20, 32.90],
    [5, 'Residential', '2"', 5040.00, 26.50, 28.20, 30.20, 32.90],
    [6, 'Residential', '3"', 9072.00, 26.50, 28.20, 30.20, 32.90],
    [7, 'Residential', '4"', 18144.00, 26.50, 28.20, 30.20, 32.90]
  ];

  try {
    let successCount = 0;
    
    for (const rate of rates) {
      const result = await pool.query(
        'INSERT INTO rates (code, type, metersize, minimum, rate1120, rate2130, rate3140, rate41up) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        rate
      );
      console.log(`Inserted rate ${rate[0]}: ${rate[2]} - ₱${rate[3]}`);
      successCount++;
    }
    
    console.log(`\nSuccessfully inserted ${successCount} residential rates!`);
  } catch (err) {
    console.error('Error inserting rates:', err.message);
  } finally {
    await pool.end();
  }
}

seedRates();
