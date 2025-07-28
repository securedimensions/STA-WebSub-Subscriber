const express = require('express');
const router = express.Router();

const indexRouter = require('./routes/index');
const loginRouter = require('./routes/login');
const userRouter = require('./routes/user');
const webhookRouter = require('./routes/webhook');
const auth = require('./middleware/auth');

router.use('/webhook', webhookRouter);
router.use('/', indexRouter);
router.use('/user', auth, userRouter);
router.use('/', loginRouter);


module.exports = router;