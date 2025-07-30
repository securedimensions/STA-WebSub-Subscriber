const express = require('express');
const router = express.Router();

const indexRouter = require('./routes/index');
const loginRouter = require('./routes/login');
const userRouter = require('./routes/user');
const webhookRouter = require('./routes/webhook');
const auth = require('./middleware/auth');

router.use('/callback', webhookRouter);
router.use('/', indexRouter);
router.use('/', loginRouter);
//router.use('/user', userRouter);
router.use('/user', auth, userRouter);

module.exports = router;