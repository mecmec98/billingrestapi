const express = require('express');

const app = express();
const port = 3002;

app.use(express.json());


const userRouter = require('./routes/users.js');
app.use('/users', userRouter);


app.listen(port, () => {
  console.log(`REST API listening at http://localhost:${port}`);
});