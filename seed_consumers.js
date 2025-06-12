require('dotenv').config();
const { pool } = require('./db.js');

async function seedConsumers() {
  const consumers = [];
  for (let i = 1; i <= 100; i++) {
    consumers.push([
      `Test User ${i}`,
      `Address ${i}`,
      1 + (i % 3), // ratetype
      1000 + i,    // metercode
      `MTR${1000 + i}`,
      `CL${i}`,
      i % 2, // senior
      '2023-01-01',
      '2028-01-01',
      1, // status
      100 + i,
      120 + i
    ]);
  }

  const query = `
    INSERT INTO consumer
      (fullname, address, ratetype, metercode, meternumber, clusternumber, senior, seniorstart, seniorexpiry, status, prevreading, curreading)
    VALUES
      ${consumers.map((_, idx) =>
        `($${idx * 12 + 1}, $${idx * 12 + 2}, $${idx * 12 + 3}, $${idx * 12 + 4}, $${idx * 12 + 5}, $${idx * 12 + 6}, $${idx * 12 + 7}, $${idx * 12 + 8}, $${idx * 12 + 9}, $${idx * 12 + 10}, $${idx * 12 + 11}, $${idx * 12 + 12})`
      ).join(',\n')}
  `;

  const flatValues = consumers.flat();

  try {
    await pool.query(query, flatValues);
    console.log('Inserted 100 consumers!');
  } catch (err) {
    console.error('Error inserting consumers:', err.message);
  } finally {
    await pool.end();
  }
}

seedConsumers();