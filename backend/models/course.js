var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var User = require('./user');


var QuestionSchema = new Schema({
    sender:{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    questionBody: String,
    isAnswered:{
        type:Boolean,
        default: false
    }
}, {timestamps: true});

var AnswerSchema = new Schema({
    sender:{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    questionId:{
        type: Schema.Types.ObjectId,
        ref: 'Question',
        required: true
    },
    answerBody: String,
}, {timestamps: true});

var CommentSchema = new Schema({
    sender:{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    commentBody: String,
}, {timestamps: true});

var LectureSchema = new Schema({
    lectureName:{
        type: String,
        required: true,
        unique: true
    },
    description: String,
    video:String,
    instructorDesc: String,
    traineeMaterial:[],
    instructorMaterial:[],
    comments:[CommentSchema]
}, {timestamps: true});


var CourseSchema = new Schema({
    courseName:{
        type: String,
        required: true,
        unique: true
    },
    description: String,
    lectures:[LectureSchema],
    instructorDesc: String,
    traineeMaterial:[],
    instructorMaterial:[],
    traineeQ:[QuestionSchema],
    traineeA:[AnswerSchema],
    instructorQ:[QuestionSchema],
    instructorA:[AnswerSchema],
}, {timestamps: true});




//createCourse
CourseSchema.statics.createCourse = function (courseName, description, lectures, instructorDesc,traineeMaterial,instructorMaterial,callback) {
    var courseData = {
        courseName: courseName,
        description: description,
        lectures:lectures,
        instructorDesc: instructorDesc,
        traineeMaterial:traineeMaterial,
        instructorMaterial:instructorMaterial
    };

    Course.create(courseData, function (error, course) {
        if (error) {
            return callback(error);
        } else {
            return callback (null, course);
        }
    });
};

//add lecture

CourseSchema.statics.addLecture = function (courseId,lectureName,description,video,instructorDesc,traineeMaterial,instructorMaterial,comments,callback) {
    var lectureData = {
        lectureName: lectureName,
        description: description,
        video:video,
        instructorDesc: instructorDesc,
        traineeMaterial:traineeMaterial,
        instructorMaterial:instructorMaterial,
        comments:comments
    };


    Course.findById(courseId).exec(function (error, course) {
            if (error) {
                return callback(error);
            } else {
                if (course === null) {
                    return callback(new Error('There is no course with that id'));
                } else {
                    console.log(JSON.stringify(lectureData));
                    console.log('checking Uniqueness for other lectures by name');

                    for (var i = 0, l = course.lectures.length; i < l; i++) {
                      let lectureName = course.lectures[i].lectureName;
                      if (lectureName === lectureData.lectureName) {
                        return callback(new Error('Duplicated sub lectures by name!'));
                      }
                    }

                    course.lectures.push(lectureData);
                    var response = course.save(function (err, updatedCourse) {
                        if (err){
                            console.log(err.message)
                            return callback(err);
                        }else{
                            return callback(null,updatedCourse);
                        }
                    });
                    return response;
                }
            }
        });
};


//get all course from database
CourseSchema.statics.getAllCourse = function (userId, callback) {
    User.findOne({_id:userId})
        .exec(function (err, user) {
            if (err) {
                return callback(err)
            } else if (!user) {
                var err = new Error('User Not Found.');
                err.status = 404;
                return callback(err);
            }
            console.log(user.username + ' wants to get all users.');

            var userType = user.type
            var isAuthorized = false

            if (userType == 'Admin'){
              isAuthorized = true;
            }

            if (isAuthorized) {
              var response = Course.find({}, function(error, courses) {
                if (error) {
                    return callback(error);
                }
                return callback(null,courses);
              });
              return response;
            }else{
              var error = new Error('you are not authorized to pull users');
              error.status = 401;
              return callback(error);
            }
        });
  }


//get a course from database
CourseSchema.statics.getCourse = function (courseId, callback) {
    Course.findOne({_id:courseId})
        .exec(function (err, course) {
            if (err) {
                return callback(err)
            } else if (!course) {
                var err = new Error('course Not Found.');
                err.status = 404;
                return callback(err);
            }
            return callback(null,course);
        });
}

//ask question
CourseSchema.statics.askQuestion = function (userId,questionData ,callback) {
    Course.findOne({_id:questionData.courseId})
        .exec(function (err, course) {
            if (err) {
                return callback(err)
            } else if (!course) {
                var err = new Error('course Not Found.');
                err.status = 404;
                return callback(err);
            }

            question = {
              sender:userId,
              questionBody: questionData.questionBody
            }

            return User.findOne({_id:userId})
                .exec(function (err, user) {
                    if (err) {
                        return callback(err)
                    } else if (!user) {
                        var err = new Error('User Not Found.');
                        err.status = 404;
                        return callback(err);
                    }
                    var userType = user.type
                    if (userType === 'trainee'){
                      course.traineeQ.push(question);
                      return course.save(function (err, updatedCourse) {
                          if (error) {
                              callback(error);
                          } else {
                              return callback (null, updatedCourse);
                          }
                      });
                    }else if (userType === 'instructor'){
                      course.instructorQ.push(question);
                      return course.save(function (err, updatedCourse) {
                          if (error) {
                              callback(error);
                          } else {
                              return callback (null, updatedCourse);
                          }
                      });
                    }else{
                      var error = new Error("you are not authorized to ask question");
                      return callback(error)
                    }


        });
        });
}

//answer question
CourseSchema.statics.answerQuestion = function (userId,answerData ,callback) {
    Course.findOne({_id:answerData.courseId})
        .exec(function (err, course) {
            if (err) {
                return callback(err)
            } else if (!course) {
                var err = new Error('course Not Found.');
                err.status = 404;
                return callback(err);
            }

            answer = {
              questionId: answerData.questionId,
              sender:userId,
              answerBody: answerData.answerBody
            }

            return User.findOne({_id:userId})
                .exec(function (err, user) {
                    if (err) {
                        return callback(err)
                    } else if (!user) {
                        var err = new Error('User Not Found.');
                        err.status = 404;
                        return callback(err);
                    }
                    var userType = user.type
                    if (userType === 'trainee'){
                        var question = course.traineeQ.id(answerData.questionId);
                        if(question){
                          question.isAnswered = true;
                          course.traineeA.push(answer);
                          return course.save(function (err, updatedCourse) {
                              if (error) {
                                  callback(error);
                              } else {
                                // notification
                                notification = {
                                  sender: user._id,
                                  subject:"merhaba",
                                  body: "sorunuz cevaplandı."
                                }
                                return User.update({_id:question.sender}, { "$push": { "notifications": notification } }, {new: true,multi: false}, function(error, doc){
                                  if(error){
                                    return callback(error);
                                  }
                                  return callback (null, updatedCourse);
                                });
                              }
                          });

                        }else{
                          var error = new Error("question is not finded.");
                          return callback(error);
                        }

                    }else if (userType === 'instructor'){
                      var question = course.instructorQ.id(answerData.questionId);
                      if(question){
                        question.isAnswered = true;
                        course.instructorA.push(answer);
                        return course.save(function (error, updatedCourse) {
                            if (error) {
                                callback(error);
                            } else {
                              // notification
                              notification = {
                                sender: user._id,
                                subject:"merhaba",
                                body: "sorunuz cevaplandı."
                              }
                              return User.update({_id:question.sender}, { "$push": { "notifications": notification } }, {new: true,multi: false}, function(error, doc){
                                if(error){
                                  return callback(error);
                                }
                                return callback (null, updatedCourse);
                              });

                            }
                        });

                      }else{
                        var error = new Error("question is not finded.");
                        return callback(error)
                      }
                    }else{
                      var error = new Error("you are not authorized to ask question");
                      return callback(error)
                    }


        });
        });
}



//send Comment
CourseSchema.statics.sendComment = function (userId,commentData,callback) {
    Course.findOne({_id:commentData.courseId})
        .exec(function (err, course) {
            if (err) {
                return callback(err)
            } else if (!course) {
                var err = new Error('course Not Found.');
                err.status = 404;
                return callback(err);
            }
            comment = {
              sender:userId,
              commentBody: commentData.commentBody
            }
            var lecture = course.lectures.id(commentData.lectureId);
            if(lecture){
              lecture.comments.push(comment);
              return course.save(function (error, updatedCourse) {
                  if (error) {
                      callback(error);
                  } else {
                    // notification
                    return callback (null, updatedCourse);
                  }
              });
            }else{
              var error = new Error("lecture is not found.");
              return callback(error);
            }

        });
}


var Course = mongoose.model('Course', CourseSchema);
module.exports = Course;
