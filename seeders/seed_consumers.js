require('dotenv').config();
const { pool } = require('../db.js');

async function seedConsumers() {
  const consumers = [];
  for (let i = 1; i <= 100; i++) {
    consumers.push([
      `Test User ${i}`,
      `Address ${i}`,
      1 + (i % 3), // ratetype
      1000 + i,    // metercode
      `MTR${1000 + i}`,
      i % 2, // senior
      '2023-01-01',
      '2028-01-01',
      1, // status
      '2023-01-01', // date_connected
      '2030-01-01', // date_disconnected
      '2024-01-01', // date_reconnected
      `ACC${1000 + i}`, // account_number
      `Zone${1 + (i % 5)}`, // zone
      `Book${1 + (i % 10)}`, // book
      `RC${1 + (i % 3)}`, // rate_class
      `${15 + (i % 3)}mm`, // metersize
      `SUF${i}`, // account_suffix
      1, // created_by_userid
      '2023-01-01' // date_created
    ]);
  }

  const query = `
    INSERT INTO consumer
      (fullname, address, ratetype, metercode, meternumber, senior, seniorstart, seniorexpiry, status, date_connected, date_disconnected, date_reconnected, account_number, zone, book, rate_class, metersize, account_suffix, created_by_userid, date_created)
    VALUES
      ${consumers.map((_, idx) => {
        const base = idx * 20;
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11}, $${base + 12}, $${base + 13}, $${base + 14}, $${base + 15}, $${base + 16}, $${base + 17}, $${base + 18}, $${base + 19}, $${base + 20})`;
      }).join(',\n')}
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
