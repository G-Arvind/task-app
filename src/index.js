const express = require('express');
const mongoose = require('./db/mongoose');
const userRouter = require('./routes/user');
const taskRouter = require('./routes/task');

const port = process.env.PORT;
const app = express();

// Request as JSON Object
app.use(express.json());

// Route handlers
app.use(userRouter);
app.use(taskRouter);

app.listen(port, () => {
    console.log('listening on port ', port);
});
