var createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const { engine } = require('express-handlebars');
const handlebars = require('handlebars');
const session = require('express-session');
const crypto = require('crypto');
const filter = require("handlebars.filter");
const bodyParser = require('body-parser');

const {config, log} = require('./settings');
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
    path.join(__dirname, '/views/partials/subscription')
  ]
}));

handlebars.registerHelper('eq', function (arg1, arg2, options) {
    if (arg1 == arg2) { return options.fn(this); }
    return options.inverse(this);
});

filter.registerHelper(handlebars);

//app.use(express.json());
//app.use(express.urlencoded({ extended: false }));
app.use(cookieParser('WebhookManager', config.cookie_secret));

var options = {
    inflate: true,
    limit: '100kb',
    type: 'application/octet-stream'
  };
app.use(bodyParser.raw(options));
app.use(express.urlencoded());

app.use(session({ name: crypto.createHash('md5').update(config.app_name).digest("hex"), cookie: { maxAge: 60 *1000 * 1000 /* 1h */ }}))

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
