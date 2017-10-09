var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var randomize = require('randomatic');



var CodeSchema = new Schema({
    courses: [{
        type: Schema.Types.ObjectId,
        ref: 'Course'
    }],
    code: { type: String, unique:true, index: true },
    userType: String,
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    isUsed: {
        type: Boolean,
        default: false
    },
    usedBy: String
}, {timestamps: true});

//createCode
CodeSchema.statics.createCode = function (userId, courses, userType, callback) {
    var codeData = {
        courses: courses,
        userType: userType
    }
    // because circular dependency, you cannot require User ar starts
    var User = require('./user');
    User.findOne({_id:userId}).exec(function (err, user) {
            if (err) {
                return callback(err)
            } else if (!user) {
                var err = new Error('User Not Found.');
                err.status = 404;
                return callback(err);
            }
            var userType = user.type
            var isAuthorized = false

            if (userType == 'Admin' || userType == 'instructor'){
              isAuthorized = true;
            }

            if (isAuthorized) {
              codeData.code = randomize('A0', 5);
              codeData.createdBy = user._id
              Code.create(codeData, function (error, code) {
                  if (error) {
                      return calback(error);
                  } else {
                      return callback (null, code);
                  }
              });

            }else{
              var error = new Error('you are not authorized to creta code');
              error.status = 401;
              return callback(error);
            }
        });
}


var Code = mongoose.model('Code', CodeSchema);
module.exports = Code;
