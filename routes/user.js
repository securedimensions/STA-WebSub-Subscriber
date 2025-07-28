const express = require('express');
const router = express.Router();
const path = require("path");
const crypto = require('crypto')
const { check, validationResult } = require('express-validator');

const NavLinkService = require('../services/NavLinkService');

const navLinkService = new NavLinkService();

router.use(function (req, res, next) {
    navLinkService.clearLinkClasses();
    navLinkService.setNavLinkActive('/');
    next();
});

/* GET user home page. */
router.get('/', async function(req, res, next) {
  navLinkService.registerCustomLinks([
    { "label": "About", "url": "/about" }
  ]);
  res.render('home', { 
    agentName: process.env.NAME,
    navLinks: navLinkService.getNavLinks(),
    customNavLinks: navLinkService.getCustomNavLinks(),
    user: req.session.user
  });
});

router.get('/logout', async function (req, res, next) {
  if (req.session.user) {
    req.session.user = null;
  }
  const sessionToken = req.cookies["VerifiersCookie"];
  if (sessionToken) {
    res.clearCookie("VerifiersCookie");

  }
  res.status(200).redirect('/');
});

module.exports = router;