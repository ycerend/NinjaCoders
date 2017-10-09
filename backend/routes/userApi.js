var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var config = require('./../config.json');
var User = require('./../models/user');





/* GET api listing. */
router.get('/', function(req, res, next) {
    res.send('userApi starts here');
});

/* POST authanticate user. */
router.post('/', function(req, res, next) {
    console.log("authanticate user");
    if (req.body.username && req.body.password ) {
        User.authenticateUser(req.body.username, req.body.password, function(error, user){
          console.log(error);
          if (error || !user) {
              console.log('error: '+ error.message)
              return res.status(401).json({
                status:401,
                desc:error.message
              });
            } else {
                // create a token
                var token = jwt.sign({ id: user._id }, config.secret, {
                    expiresIn: 86400 // expires in 24 hours
                });
                return res.status(202).json({
                    status: 202,
                    desc: "user authanticated",
                    token: token,
                    user: user
                });
            }
        });
    }else{
        return res.status(411).json({
            status: 411,
            desc: "length required"
        });
    }

});

/* POST create user */
router.post('/createuser', function(req, res, next) {
    console.log('creating new user');
    if (req.body.firstName &&req.body.lastName &&req.body.username && req.body.password && req.body.code) {

        User.createUser(req.body,req.body.code, function(error, user){
          if (error || !user) {
              console.log('error: '+error.message)
              return res.status(400).json({
                status:400,
                desc:error.message
              });
            } else {
              var token = jwt.sign({ id: user._id }, config.secret, {
                  expiresIn: 86400 // expires in 24 hours
              });
              return res.status(201).json({
                  status: 202,
                  desc: "user created",
                  token: token
              });
            }
        });
    }else{
        return res.status(411).json({
            status: 411,
            desc: "length required"
        });
    }
});

//----------------------------- now check authantication time -----------------------------
// catch tokens and forward to user api

router.use(function(req, res, next) {
  console.log('check authentication for all userApi');
  var token = req.headers['x-api-key'];
  if (!token) {
      return res.status(401).send({
          auth: false,
          message: 'No token provided.'
      });
  }

  jwt.verify(token, config.secret, function(err, decoded) {
      if (err) return res.status(500).send({
          auth: false,
          message: 'Failed to authenticate token.'
      });
      return next();
  });
});


/* GET user. */
router.get('/getuser', function(req, res, next) {
    console.log(req.query.userId + ' wants to get userdata.');
    var userId=req.query.userId;
    if(userId){
      var response = User.getUser(userId,function(error,user){
        if (error) {
             console.log('error: '+error.message);
             return res.status(400).json({
                status: 400,
                desc: error.message
            });
          }
          console.log(user._id+" is pulled");
          return res.status(200).json({
              status: 200,
              desc: user._id+" is pulled",
              user: user
          });
      });
      return response;
    }else{
      console.log('error: user id required');
      return res.status(400).json({
          status: 400,
          desc: "userId required"
      });
    }

});

/* GET all users. */
router.get('/getuserlist', function(req, res, next) {
  var decodedToken = jwt.decode(req.headers['x-api-key']);
  console.log(decodedToken.id + ' wants to get all users.');
  var userId=decodedToken.id;

  if(userId){
    var response = User.getAllUser(userId,function(error,users){
      if (error) {
           console.log('error: '+error.message);
           return res.status(400).json({
              status: 400,
              desc: error.message
          });
        }
        console.log(users.length+" users are pulled");
        return res.status(200).json({
            status: 200,
            desc: users.length+" users are pulled",
            users: users
        });
    });
    return response;
  }else{
    console.log('error: user id required');
    return res.status(400).json({
        status: 400,
        desc: "userId required"
    });
  }

});

/* remove user  */
router.delete('/removeuser', function(req, res, next) {
    console.log(req.query.userId + ' wants to remove ' + req.query.removeUserId);
    var userId=req.query.userId;
    var removeUserId=req.query.removeUserId;

    if(userId === removeUserId){
      console.log("two ids can not be equal.");
      return res.status(400).json({
        status:400,
        desc: 'two ids can not be equal'
      });
    }
    if(userId && removeUserId){
      var response = User.removeUser(userId,removeUserId,function(error,willRemoveUserId){
        if (error) {
             console.log('error: '+error.message);
             return res.status(400).json({
                status: 400,
                desc: error.message
            });
          }
          console.log(willRemoveUserId +" was removed");
          return res.status(200).json({
              status: 200,
              desc: willRemoveUserId + " was removed",
          });
      });
      return response;
    }else{
      console.log('error: user id and removeUserId required');
      return res.status(400).json({
          status: 400,
          desc: "userId required"
      });
    }

});


/* update user  */
router.post('/updateuser', function(req, res, next) {
    console.log(req.query.userId + ' wants to update ' + req.body);
    var userId=req.query.userId;
    var bodyKeys = Object.keys(req.body);
    if(bodyKeys.length === 0){
      console.log("error: request body cannot be null");
      return res.status(400).json({
        status:400,
        desc: 'request body cannot be null'
      });
    }else{
      var response = User.updateUser(userId,req.body,function(error,user){
        if (error) {
             console.log('error: '+error.message);
             return res.status(400).json({
                status: 400,
                desc: error.message
            });
          }
          console.log(user._id +" was updated");
          return res.status(200).json({
              status: 200,
              desc: user._id + " were updated",
          });
      });
      return response;


    }
});


/* send group notificaiton  */
router.post('/sendgroupnotification', function(req, res, next) {
  var decodedToken = jwt.decode(req.headers['x-api-key']);
  var userId=decodedToken.id;
  if (req.body.subject &&req.body.body && req.body.group) {
    console.log(decodedToken.id + ' wants to send notification to '+req.body.group+ ' with subject '+req.body.subject);
    var response = User.sendNotificationGroup(userId,req.body,function(error,doc){
      if (error) {
           console.log('error: '+error.message);
           return res.status(400).json({
              status: 400,
              desc: error.message
          });
        }

        if(doc.n === 0){
          return res.status(400).json({
              status: 400,
              desc: req.body.group +" is not founded.",
          });
        }

        console.log(doc.n + " person is finded." +doc.nModified+ " notification is sent");
        return res.status(200).json({
            status: 200,
            desc: doc.n + " person is finded." +doc.nModified+ " notification is sent",
            notification: req.body
        });
    });

  }else{
      return res.status(411).json({
          status: 411,
          desc: "length required"
      });
  }
});


/* send person notificaiton  */
router.post('/sendpersonnotification', function(req, res, next) {
  var decodedToken = jwt.decode(req.headers['x-api-key']);
  var userId=decodedToken.id;
  if (req.body.subject &&req.body.body && req.body.toUserId) {
    console.log(decodedToken.id + ' wants to send notification to '+req.body.toUserId+ ' with subject '+req.body.subject);
    var response = User.sendNotificationPerson(userId,req.body,function(error,doc){
      if (error) {
           console.log('error: '+error.message);
           return res.status(400).json({
              status: 400,
              desc: error.message
          });
        }
        if(doc.n === 0){
          return res.status(400).json({
              status: 400,
              desc: req.body.toUserId +" is not founded.",
          });
        }
        console.log(doc.n + " person is finded." +doc.nModified+ " notification is sent");
        return res.status(200).json({
            status: 200,
            desc: doc.n + " person is finded." +doc.nModified+ " notification is sent",
            notification: req.body
        });
    });

  }else{
      return res.status(411).json({
          status: 411,
          desc: "length required"
      });
  }
});


module.exports = router;
