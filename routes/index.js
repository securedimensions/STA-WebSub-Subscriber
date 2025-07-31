const express = require('express');
const router = express.Router();
const NavLinkService = require('../services/NavLinkService');
const crypto = require('crypto');

const navLinkService = new NavLinkService();

router.use(function (req, res, next) {
      navLinkService.registerNavLinks([
    { "label": "Subscriptions", "url": "/user/subscriptions" }
  ]);
    navLinkService.setNavLinkActive('/');
    next();
});

/* GET home page. */
router.get('/', async function(req, res, next) {
  navLinkService.setCustomNavLinkActive('/');
  res.render('index', { 
    agentName: process.env.APP_NAME,
    navLinks: navLinkService.getNavLinks(),
    customNavLinks: navLinkService.getCustomNavLinks(),
    user: req.session.user
  });
});

router.get('/about', async function(req, res, next) {
  navLinkService.setCustomNavLinkActive('/about');
  res.render('about', { 
    agentName: process.env.APP_NAME,
    navLinks: navLinkService.getNavLinks(),
    customNavLinks: navLinkService.getCustomNavLinks(),
    user: req.session.user
  });
});

router.get('/terms', async function(req, res, next) {
  navLinkService.setCustomNavLinkActive('/terms');
  res.render('terms', { 
    agentName: process.env.APP_NAME,
    navLinks: navLinkService.getNavLinks(),
    customNavLinks: navLinkService.getCustomNavLinks(),
    user: req.session.user
  });
});

router.get('/privacy', async function(req, res, next) {
  navLinkService.setCustomNavLinkActive('/privacy');
  res.render('privacy', { 
    agentName: process.env.APP_NAME,
    navLinks: navLinkService.getNavLinks(),
    customNavLinks: navLinkService.getCustomNavLinks(),
    user: req.session.user
  });
});

router.get('/cookie', async function(req, res, next) {
  navLinkService.setCustomNavLinkActive('/cookie');
  res.render('cookie', { 
    agentName: process.env.APP_NAME,
    navLinks: navLinkService.getNavLinks(),
    customNavLinks: navLinkService.getCustomNavLinks(),
    user: req.session.user,
    cookie: crypto.createHash('md5').update(process.env.APP_NAME).digest("hex")
  });
});

module.exports = router;
