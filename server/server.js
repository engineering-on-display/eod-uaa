const express = require('express');
const bodyParser = require('body-parser');
const eibRouter = require('./routes/eib.router');
const { pool } = require('./db');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;


//loads the body parser middleware to read the body of a post
app.use(bodyParser.urlencoded({ extened: true })); //loads middleware for body parser url endoceing to the express
app.use(bodyParser.json()); //loads middleware for body parser json

//cors middleware
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

//load the router for eib
app.use('/api/eib', eibRouter(pool));

//load this if someone hit just /api
//todo: make an api help page.
app.get('/api', (req, res) => {
    res.send('welcome to my API');
});

app.use(express.static('dist'));

//use local redirection for the angular app
//must be last in middleware
app.get('/*', (req, res) => {
  console.log(path.join(__dirname, '../dist/index.html'));
  res.sendFile(path.join(__dirname, '../dist/index.html'));
})

app.listen(port, () => {
    console.log(`Running on PORT: ${port}`);
});
