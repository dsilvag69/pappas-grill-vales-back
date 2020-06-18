require('./config/config');
const cors = require('cors')
const express = require('express');
const mongoose = require('mongoose');


const app = express();


const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(cors({
  origin: function(origin, callback){
    return callback(null, true);
  }
}));

app.use(require('./routes/login'));
app.use(require('./routes/vale'));


mongoose.connect(process.env.URLDB, { useNewUrlParser: true ,useUnifiedTopology: true}, (err, res) => {
    if (err) throw err;
    console.log("db online");
});

app.listen(process.env.PORT,() => {
    console.log("app online");
});