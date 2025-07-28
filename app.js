var createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const { engine } = require('express-handlebars');
const handlebars = require('handlebars');
const session = require('express-session');
const dotenv = require('dotenv').config();
const crypto = require('crypto');
const filter = require("handlebars.filter");

const routes = require('./routes');
const NavLinkService = require('./services/NavLinkService');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.engine('hbs', engine({
  extname: 'hbs',
  defaultView: 'default',
  layoutsDir: path.join(__dirname, '/views/layouts/'),
  partialsDir: [
    path.join(__dirname, '/views/partials'),
    path.join(__dirname, '/views/partials/home'),
  ]
}));


filter.registerHelper(handlebars);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser('WebhookManager'));

app.use(session({ name: crypto.createHash('md5').update(process.env.NAME).digest("hex"), cookie: { maxAge: 60 *1000 * 1000 /* 1h */ }}))

app.use('/', routes);
app.use('/', express.static(path.join(__dirname, 'public')));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  
  const navLinkService = new NavLinkService();
  navLinkService.registerCustomLinks([
    { "label": "About", "url": "/about" }
  ]);
  navLinkService.setCustomNavLinkActive('/');
  res.render('error' , {
      navLinks: navLinkService.getNavLinks(),
      customNavLinks: navLinkService.getCustomNavLinks(),
      user: req.session.user
  });
});

module.exports = app;
