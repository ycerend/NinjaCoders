var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var config = require('./config.json');
var mongoose = require('mongoose');
require('console-stamp')(console, { pattern: 'dd/mm/yyyy HH:MM:ss.l' });

//asdas
var api = require('./routes/api');
var app = express();

// view engine setup
//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'ejs');


//--------------------------------------------------- Database Coonection ----------------------------------------------
//connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || config.connectionStringLocal);
var db = mongoose.connection;

//handle mongo error
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    // we're connected!
    console.log('DB connection is ok.')
});

mongoose.Promise = global.Promise;


//-----------------------------------------------  Express App MiddleWares ---------------------------------------------

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api',api)

// catch 404 and forward to error handler

app.use(function(req, res, next) {
  console.log("this route is not found")
  return res.status(404).json({
        status: 404,
        desc: "not found"
    });
});


// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  console.error("last error: " + err)
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({
    status:(err.status || 500),
    desc:err.message
  });
});

module.exports = app;
