require('dotenv').config();
const express = require('express');

const app = express();
const port = 3002;

app.use(express.json());


const userRouter = require('./routes/users.js');
app.use('/users', userRouter);

const meterRouter = require('./routes/meters.js');
app.use('/meters', meterRouter);

const rateRouter = require('./routes/rates.js');
app.use('/rates', rateRouter);

const wb_transactionRouter = require('./routes/wb_transactions.js');
app.use('/wb_transactions', wb_transactionRouter);

const consumerRouter = require('./routes/consumer.js');
app.use('/consumers', consumerRouter);


app.listen(port, () => {
  console.log(`REST API listening at http://${process.env.PGHOST}:${port}`);
});