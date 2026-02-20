const { body } = require("express-validator");
const fs = require('fs');
const path = require('path');
const multer  = require('multer')
const upload = multer({ dest: path.join(__dirname, '../uploads') })

const newSubscriptionChecker = [
  upload.single('file'),
  body("topics")
    .exists({ checkFalsy: true })
    .withMessage("topics is required")
    .custom(async (value, {req}) => {
        if(Array.isArray(value)){
          for(let topic of value) {
            if (!topic.startsWith('http'))
              throw new Error('topic must be a URL with protocol http or https');
          }
        }else{
            if (!value.startsWith('http'))
              throw new Error('topic must be a URL with protocol http or https');
        }
        return true;
    }),
  body("lease_seconds")
    .exists({ checkFalsy: true })
    .withMessage("lease_seconds is required")
    .isInt({ min:60})
    .withMessage("lease_seconds must be integer and greater than or equal to 60"),
  body("content_type")
    .exists({ checkFalsy: true })
    .withMessage("content_type is required")
    .isString()
    .withMessage('content_type must be a string')
    .contains('/')
    .withMessage('content_type must include a /'),
  body("id")
    .exists({ checkFalsy: true })
    .withMessage("id is required"),
  body("secret")
    .optional({nullable: true, checkFalsy: true}),
  body("state")
    .exists({ checkFalsy: true })
    .withMessage("state selection is required"),
  body("file")
    .custom(async (value, {req}) => {
        if(typeof req.file !== 'undefined'){
            return true;
        }else{
            throw new Error('a Javascript file is rquired');
        }
    })
    .withMessage("function file is required")
    .custom(async (value, {req}) => {
        if((req.file.mimetype === 'text/javascript') || (req.file.mimetype === 'application/x-javascript')){
            return '.js';
        }else{
            throw new Error('upload must be a Javascript file');
        }
    })
    .withMessage('function must upload a Javascript file that contains your function to be executed')
    .custom(async (value, { req }) => {
        const functionPath = path.join(__dirname, '../callbacks/' + req.body.id + '.js')
        if (fs.existsSync(functionPath)) {
            throw new Error("Javascript file does already exist");
        }
        return true;
    })
];

module.exports = { newSubscriptionChecker }