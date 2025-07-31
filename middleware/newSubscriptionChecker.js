const { body } = require("express-validator");
const fs = require('fs');
const path = require('path');
const multer  = require('multer')
const upload = multer({ dest: path.join(__dirname, '../uploads') })

const newSubscriptionChecker = [
  upload.single('file'),
  body("topic")
    .exists({ checkFalsy: true })
    .withMessage("topic is required")
    .isURL({protocols: ['http', 'https']})
    .withMessage("topic must be a URL with protocol http or https"),
  body("lease_seconds")
    .exists({ checkFalsy: true })
    .withMessage("lease_seconds is required")
    .isInt({ min:60})
    .withMessage("lease_seconds must be integer and > 60"),
  body("content_type")
    .exists({ checkFalsy: true })
    .withMessage("content_type is required")
    .isString()
    .withMessage('content_type must be a string')
    .contains('/')
    .withMessage('content_type must include a /'),
  body("secret")
    .exists({ checkFalsy: true })
    .withMessage("secret is required")
    .isString()
    .withMessage('secret must be a string')
    .isLength({ min: 20, max:200 })
    .withMessage('secret must have length between 20 and 200 characters'),
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
        if(req.file.mimetype === 'text/javascript'){
            return '.js';
        }else{
            throw new Error('upload must be a Javascript file');
        }
    })
    .withMessage('function must upload a Javascript file that contains your function to be executed')
    .custom(async (value, { req }) => {
        const functionPath = path.join(__dirname, '../callbacks/' + req.file.originalname)
        if (fs.existsSync(functionPath)) {
            throw new Error("Javascript file does already exist");
        }
        return true;
    })
];

module.exports = { newSubscriptionChecker }