const express = require('express');
const router = express.Router();

const indexRouter = require('./routes/index');
const loginRouter = require('./routes/login');
const userRouter = require('./routes/user');
const auth = require('./routes/auth');

router.use('/', indexRouter);
router.use('/user', auth, userRouter);
router.use('/', loginRouter);

module.exports = router;