var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var config = require('./../config.json');
var Course = require('./../models/course');


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
        })};
        return next();
    });
})


/* GET api listing. */
router.get('/', function(req, res, next) {
    res.send('courseApi starts here');
});


/* POST create course */
router.post('/create', function(req, res, next) {
    console.log('creating new course');
    //courseName, description, lectures, instructorDesc,traineeMaterial,instructorMaterial
    if (req.body.courseName&& req.body.description&& req.body.lectures&&
      req.body.instructorDesc&& req.body.traineeMaterial&& req.body.instructorMaterial ) {
        console.log("length is OK");
        var response = Course.createCourse(req.body.courseName,req.body.description,req.body.lectures,req.body.instructorDesc,req.body.traineeMaterial,req.body.instructorMaterial, function(error, course){
            if (error || !course) {
                console.log('error: '+ error.message);
                return res.status(401).json({
                  status:401,
                  desc:error.message
                });
            } else {
                console.log('created: ' + course.courseName);
                return res.status(201).json({
                    status: 202,
                    desc: "course created"
                });
            }
        });
        return response;
    }else{
      console.log('error: length required');
      return res.status(411).json({
          status: 411,
          desc: "length required"
      });
    }


});


/* POST create lecture in course */
router.post('/addlecture/', function(req, res, next) {
    console.log('adding new lecture to courseId: '+ req.query.courseId);
    var courseId=req.query.courseId;
    if(courseId){
        //courseId,description,video,instructorDesc,traineeMaterial,instructorMaterial,comments,callback
        if (req.body.lectureName,req.body.description,req.body.video,req.body.instructorDesc, req.body.traineeMaterial,req.body.instructorMaterial,req.body.comments ) {
            var response = Course.addLecture(courseId,req.body.lectureName,req.body.description,req.body.video,req.body.instructorDesc, req.body.traineeMaterial,req.body.instructorMaterial,req.body.comments, function(error, course){
                if (error || !course) {
                     console.log('error: '+error.message)
                     return res.status(400).json({
                        status: 400,
                        desc: error.message
                    });
                } else {
                    console.log('added to: ' + course.courseName);
                    return res.status(200).json({
                        status: 200,
                        desc: "lecture added"
                    });
                }
            });
            return response;
        }else{
            console.log('error: length required');
            return res.status(411).json({
                status: 411,
                desc: "length required"
            });
        }
    }else{
        console.log('error: course id required');
        return res.status(424).json({
            status: 424,
            desc: "courseId required"
        });
    }
});


/* GET all courses. */
router.get('/getcourselist', function(req, res, next) {
  var decodedToken = jwt.decode(req.headers['x-api-key']);
  var userId=decodedToken.id;
  if(userId){
    var response = Course.getAllCourse(userId,function(error,courses){
      if (error) {
           console.log('error: '+error.message);
           return res.status(400).json({
              status: 400,
              desc: error.message
          });
        }
        console.log(courses.length+" courses are pulled");
        return res.status(200).json({
            status: 200,
            desc: courses.length+" courses are pulled",
            courses: courses
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


/* GET a  course. */
router.get('/getcourse', function(req, res, next) {
  console.log(req.query.courseId + ' will be pulled.');
  var courseId=req.query.courseId;
  if(courseId){
    var response = Course.getCourse(courseId,function(error,course){
      if (error) {
           console.log('error: '+error.message);
           return res.status(400).json({
              status: 400,
              desc: error.message
          });
        }
        console.log(course._id+" is pulled");
        return res.status(200).json({
            status: 200,
            desc: course._id+" is pulled",
            course: course
        });
    });
    return response;
  }else{
    console.log('error: courseId id required');
    return res.status(400).json({
        status: 400,
        desc: "courseId required"
    });
  }
});


/* ask a  question. */
router.post('/askquestion', function(req, res, next) {
  var decodedToken = jwt.decode(req.headers['x-api-key']);
  var userId=decodedToken.id;
  if (req.body.courseId && req.body.questionBody) {
    console.log(decodedToken.id + ' wants to ask question with text '+req.body.questionBody);
    Course.askQuestion(userId,req.body,function(error,course){
      if (error) {
           console.log('error: '+error.message);
           return res.status(400).json({
              status: 400,
              desc: error.message
          });
        }

          return res.status(200).json({
            status: 200,
            desc: course._id + " is updated with question " +req.body.questionBody,

          });
    });

  }else{
      return res.status(411).json({
          status: 411,
          desc: "length required"
      });
  }
});


// ask a  question.
router.post('/answerquestion', function(req, res, next) {
  var decodedToken = jwt.decode(req.headers['x-api-key']);
  var userId=decodedToken.id;
  if (req.body.courseId && req.body.answerBody && req.body.questionId) {
    console.log(decodedToken.id + ' wants to answer question('+req.body.questionId+') with text '+req.body.answerBody);
    Course.answerQuestion(userId,req.body,function(error,course){
      if (error) {
           console.log('error: '+error.message);
           return res.status(400).json({
              status: 400,
              desc: error.message
          });
        }

          return res.status(200).json({
            status: 200,
            desc: course._id + " is updated with answer " +req.body.answerBody + "for question "+req.body.questionId
          });
    });

  }else{
      return res.status(411).json({
          status: 411,
          desc: "length required"
      });
  }
});


// ask a  question.
router.post('/sendcomment', function(req, res, next) {
  var decodedToken = jwt.decode(req.headers['x-api-key']);
  var userId=decodedToken.id;
  if (req.body.courseId && req.body.commentBody && req.body.lectureId) {
    console.log(decodedToken.id + ' wants to send comment to lecture('+req.body.lectureId+') with text '+req.body.commentBody);
    Course.sendComment(userId,req.body,function(error,course){
      if (error) {
           console.log('error: '+error.message);
           return res.status(400).json({
              status: 400,
              desc: error.message
          });
        }
        return res.status(200).json({
          status: 200,
          desc: course._id + " is updated with comment " +req.body.commentBody 
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

/*

*/
