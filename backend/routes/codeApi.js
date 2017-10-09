var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var config = require('./../config.json');
var Code = require('./../models/code');

/* log all request for login page*/
router.all('*', function (req, res, next) {
    console.log('check authentication for all userApi');

    var token = req.headers['x-api-key'];
    if (!token) {
        console.error('No token provided.');
        return res.status(401).send({
            auth: false,
            message: 'No token provided.'
        });
    }

    jwt.verify(token, config.secret, function(err, decoded) {
        if (err){
           console.error('Failed to authenticate token.');
           return res.status(500).send({
            auth: false,
            message: 'Failed to authenticate token.'
          });
        }
        return next();
    });
})


/* POST create user */
router.post('/create', function(req, res, next) {
    console.log('creating new code');
    console.log(req.query.userId + ' wants to create a code.');
    var userId = req.query.userId;
    if(userId){
      if (req.body.courses && req.body.userType) {
        var response = Code.createCode(userId, req.body.courses, req.body.userType, function(error, code){
              if (error || !code) {
                console.log('error: '+error.message)
                return res.status(401).json({
                  status:401,
                  desc:error.message
                });
              } else {
                  return res.status(201).json({
                      status: 202,
                      desc: "code created: "+code.code,
                      code: code
                  });
              }
          });

          return response;
      }else{
          return res.status(411).json({
              status: 411,
              desc: "length required"
          });
      }
    }else{
      console.log('error: user id required');
      return res.status(400).json({
          status: 400,
          desc: "userId required"
      });
    }

});

/* GET api listing. */
router.get('/', function(req, res, next) {
    res.send('userApi starts here');
});

module.exports = router;
