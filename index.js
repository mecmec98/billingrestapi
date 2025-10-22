//nodemon index.js to start with live reload

require('dotenv').config();
const express = require('express');

const app = express();
const port = 3002;

app.use(express.json());

//all routes
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

const sv_transactionRouter = require('./routes/sv_transactions.js');
app.use('/sv_transactions', sv_transactionRouter);

const barangay = require('./routes/barangay.js');
app.use('/barangay', barangay);

const rolesRouter = require('./routes/roles.js');
app.use('/roles', rolesRouter);

const meter_clusterRouter = require('./routes/meter_cluster.js');
app.use('/meter_cluster', meter_clusterRouter);

const discountpenaltyRouter = require('./routes/discounts.js');
app.use('/discountpenalty', discountpenaltyRouter);

const application_listRouter = require('./routes/application_list.js');
app.use('/application_list', application_listRouter);

const receiptsRouter = require('./routes/receipts.js');
app.use('/receipts', receiptsRouter);

const pos_machineRouter = require('./routes/pos_machine.js');
app.use('/pos_machine', pos_machineRouter);

const inspectionRouter = require('./routes/inspection.js');
app.use('/inspection', inspectionRouter);

const zone_bookRouter = require('./routes/zone_book.js');
app.use('/zone_book', zone_bookRouter);

const balance_old_tableRouter = require('./routes/balance_old_table.js');
app.use('/balance_old_table', balance_old_tableRouter);

const pay_listRouter = require('./routes/pay_list.js');
app.use('/pay_list', pay_listRouter);

const meter_readersRouter = require('./routes/meter_readers.js');
app.use('/meter_readers', meter_readersRouter);



//for migration
const migrate = require('./migrationscript/fbtops.js');
app.use('/testmigrate', migrate);





app.listen(port, () => {
  console.log(`REST API listening at http://${process.env.PGHOST}:${port}`);
});