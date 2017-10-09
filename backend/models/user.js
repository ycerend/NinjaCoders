var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var Schema = mongoose.Schema;
var Code = require('./code');
var config = require('./../config.json');

var notificationSchema = new Schema({
  sender:{
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
  },
  subject: String,
  body: String,
  isRead: {
    type: Boolean,
    default:false
  }
},{timestamps: true});

var UserSchema = new Schema({
    username: {
        type: String,
        lowercase: true, unique: true,
        required: [true, "can't be blank"],
        match: [/^[a-zA-Z0-9]+$/, 'is invalid'],
        index: true
    },
    email: {
        type: String,
        lowercase: true,
        unique: true, required: [true, "can't be blank"],
        match: [/\S+@\S+\.\S+/, 'is invalid'],
        index: true
    },
    passwordHash: String,
    password: {
        type:String,
        required: [true, "can't be blank"]
    },
    notifications:[notificationSchema],
    age: Number,
    firstName: String,
    lastName: String,
    code:Schema.Types.Mixed,
    image: String,
    salt: String,
    type:String,
    courses:[{
        type: Schema.Types.ObjectId,
        ref: 'Course'
    }],
    tokens: [{
      access: {
        type: String,
        required: true
      },
      token: {
        type: String,
        required: true
      }
    }]
}, {timestamps: true});

UserSchema.methods.generateAuthToken = function () {
  var user = this;
  var access = 'auth';
  var token = jwt.sign({_id: user._id.toHexString(), access}, 'abc123').toString();

  user.tokens.push({access, token});

  return user.save().then(() => {
    return token;
  });
};

UserSchema.statics.findByToken = function (token) {
  var User = this;
  var decoded;

  try {
    decoded = jwt.verify(token, 'abc123');
  } catch (e) {
    return Promise.reject();
  }

  return User.findOne({
    '_id': decoded._id,
    'tokens.token': token,
    'tokens.access': 'auth'
  });
};

//create user
UserSchema.statics.createUser = function (userData, code, callback) {
    Code.findOne({code:code}).exec(function (err, code) {
            if (err) {
                return callback(err)
            } else if (!code) {
                var err = new Error('code Not Found.');
                err.status = 404;
                return callback(err);
            }

            if(code.isUsed === true){
              var err = new Error(code.code +' code was used.');
              err.status = 404;
              return callback(err);
            }

            notification = {
              sender: code.createdBy,
              subject: "merhaba " + userData.firstName,
              body: config.firstMessage
            }
            userData.code = code.code;
            userData.type = code.userType;
            userData.courses = code.courses;
            userData.notifications=[notification];

            return User.create(userData, function (error, user) {
                  if (error) {
                      callback(error);
                  } else {

                    code.isUsed = true;
                    code.usedBy = user.username;
                    return code.save(code, function (error, code) {
                        if (error) {
                            callback(error);
                        } else {
                            return callback (null, user);
                        }
                    });

                  }
            });
    });
}


//authenticate input against database
UserSchema.statics.authenticateUser = function (username, password, callback) {
    User.findOne({ username: username })
        .exec(function (err, user) {
            if (err) {
                return callback(err)
            } else if (!user) {
                var err = new Error('username is not found.');
                err.status = 404;
                return callback(err);
            }
            bcrypt.compare(password, user.passwordHash, function (err, result) {
                if (result === true) {
                    return callback(null, user);
                } else {
                  var err = new Error('password is wrong.');
                  err.status = 404;
                  return callback(err);
                }
            })
        });
}

//get a user from database
UserSchema.statics.getUser = function (userId, callback) {
    User.findOne({_id:userId})
        .exec(function (err, user) {
            if (err) {
                return callback(err)
            } else if (!user) {
                var err = new Error('User Not Found.');
                err.status = 404;
                return callback(err);
            }
            return callback(null,user);
        });
}

//get all user from database
UserSchema.statics.getAllUser = function (userId, callback) {
    User.findOne({_id:userId})
        .exec(function (err, user) {
            if (err) {
                return callback(err)
            } else if (!user) {
                var err = new Error('User Not Found.');
                err.status = 404;
                return callback(err);
            }
            var userType = user.type
            var isAuthorized = false

            if (userType == 'Admin'){
              isAuthorized = true;
            }

            if (isAuthorized) {
              User.find({}, function(error, users) {
                if (error) {
                    return callback(error);
                }
                var usersExceptsAdmin = users.filter(function(usercheck){
                  return usercheck.id != user.id && usercheck.type != user.type;
                });
                return callback(null,usersExceptsAdmin);
              });
            }else{
              var error = new Error('you are not authorized to pull users');
              error.status = 401;
              return callback(error);
            }
        });
}


//remove a user from database
UserSchema.statics.removeUser = function (userId,willRemoveUserId,callback) {
    User.findOne({_id:userId})
        .exec(function (err, user) {
            if (err) {
                return callback(err)
            } else if (!user) {
                var err = new Error('User Not Found.');
                err.status = 404;
                return callback(err);
            }
            var userType = user.type
            var isAuthorized = false

            if (userType == 'Admin'){
              isAuthorized = true;
            }

            if (isAuthorized) {
              User.remove({_id:willRemoveUserId}, function(error, removedUser) {
                if (error) {
                    return callback(error);
                }
                return callback(null,willRemoveUserId);
              });
            }else{
              var error = new Error('you are not authorized to remove a user');
              error.status = 401;
              return callback(error);
            }
        });
}


//update user
UserSchema.statics.updateUser = function (userId,updateJson,callback) {
    User.findOne({_id:userId})
        .exec(function (err, user) {
            if (err) {
                return callback(err)
            } else if (!user) {
                var err = new Error('User Not Found.');
                err.status = 404;
                return callback(err);
            }

            var keys = Object.keys(updateJson);
            for (var i = 0, l = keys.length; i < l; i++) {
              let value = updateJson[keys[i]];
              user[keys[i]] = value;
            }

            user.save(user, function (error, user) {
                if (error) {
                    callback(error);
                } else {
                    return callback (null, user);
                }
            });
        });
}


//send Notification User groups or
UserSchema.statics.sendNotificationGroup = function (userId,reqBody,callback) {
    User.findOne({_id:userId})
        .exec(function (err, user) {
            if (err) {
                return callback(err)
            } else if (!user) {
                var err = new Error('User Not Found.');
                err.status = 404;
                return callback(err);
            }
            var userType = user.type
            var isAuthorized = false

            if (userType == 'Admin'){
              isAuthorized = true;
            }

            if (isAuthorized) {

              notification = {
                sender: user._id,
                subject:reqBody.subject,
                body: reqBody.body
              }

              User.update({type:reqBody.group}, { "$push": { "notifications": notification } }, {new: true,multi: true}, function(error, doc){
                if(error){
                  return callback(error);
                }
                return callback(null,doc);
              });

            }else{
              var error = new Error('you are not authorized to remove a user');
              error.status = 401;
              return callback(error);
            }
        });
}


//send Notification to a peson
UserSchema.statics.sendNotificationPerson = function (userId,reqBody,callback) {
    User.findOne({_id:userId})
        .exec(function (err, user) {
            if (err) {
                return callback(err)
            } else if (!user) {
                var err = new Error('User Not Found.');
                err.status = 404;
                return callback(err);
            }
            var userType = user.type
            var isAuthorized = false

            if (userType == 'Admin'){
              isAuthorized = true;
            }

            if (isAuthorized) {

              notification = {
                sender: user._id,
                subject:reqBody.subject,
                body: reqBody.body
              }

              User.update({_id:reqBody.toUserId}, { "$push": { "notifications": notification } }, {new: true,multi: false}, function(error, doc){
                if(error){
                  return callback(error);
                }
                return callback(null,doc);
              });

            }else{
              var error = new Error('you are not authorized to send notification');
              error.status = 401;
              return callback(error);
            }
        });
}



//hashing a password before saving it to the database
UserSchema.pre('save', function (next) {
    var user = this;
    bcrypt.hash(user.password, 10, function (err, hash) {
        if (err) {
            return next(err);
        }
        user.passwordHash = hash;
        next();
    })
});


var User = mongoose.model('User', UserSchema);
module.exports = User;
