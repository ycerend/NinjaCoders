var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');

var userApi = require('./userApi');
var codeApi = require('./codeApi');
var courseApi = require('./courseApi');
var fileApi = require('./fileApi');




/* log all request for login page*/
router.all('/', function (req, res, next) {
    console.log('Accessing to api');
    next() // pass control to the next handler
})

router.use('/user',userApi);
router.use('/code',codeApi);
router.use('/course',courseApi);
router.use('/file',fileApi);

module.exports = router;
