const { body } = require("express-validator");
const fs = require('fs');
const path = require('path');

const newSubscriptionChecker = [
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
  body("function")
    .exists({ checkFalsy: true })
    .withMessage("function is required")
    .isString()
    .withMessage('function must be a string')
    .custom(async (value, { req }) => {
        const functionPath = path.join(__dirname, '../callbacks/' + value + '.js')
        if (!fs.existsSync(functionPath)) {
            throw new Error("File for function is missing");
        }
        return true;
      })
];

module.exports = { newSubscriptionChecker }