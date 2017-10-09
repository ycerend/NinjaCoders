var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
const fileUpload = require('express-fileupload');
var config = require('./../config.json');


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


router.use(fileUpload({
  limits: { fileSize: 150*1024,
  safeFileNames: /\\/g,
  preserveExtension:true }, // 1mb
}));

router.post('/upload', function(req, res) {
  var decodedToken = jwt.decode(req.headers['x-api-key']);
  var userId=decodedToken.id;
  console.log(userId + ' wants to upload image');
  if (!req.files.image){
    console.log('error: no image file');
    return res.status(400).json({
       status: 400,
       desc: 'no image file'
   });
  }
  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  let imageFile = req.files.image;
  // Use the mv() method to place the file somewhere on your server
  imageFile.mv('/Users/caglayanserbetci/Desktop/NinjacodersPortal/NinjacodersPortal/images/'+userId+'.jpg', function(error) {
    if (error){
      console.log('error: '+error.message);
      return res.status(400).json({
         status: 400,
         desc: error.message
     });
    }
      return res.status(200).json({
        status: 200,
        desc: userId+" uploaded image"
      });
  });
});

/* GET api listing. */
router.get('/', function(req, res, next) {
    res.send('fileApi starts here');
});

module.exports = router;
