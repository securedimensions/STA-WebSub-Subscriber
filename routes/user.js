const express = require('express');
const router = express.Router();
const { randomUUID } = require('crypto');
const { config, log } = require('../settings');
const NavLinkService = require('../services/NavLinkService');
const { getSubscription, getSubscriptions, updateSubscription, removeSubscription, newSubscription } = require('../db/db');
const { newSubscriptionChecker } = require('../middleware/newSubscriptionChecker');
const { validationResult } = require('express-validator');

const navLinkService = new NavLinkService();

const states = [{ 'key': 'active', 'value': 1 }, { 'key': 'allow unsubscribe', 'value': 2 }];

/* GET user home page. */
router.get('/', async function (req, res, next) {
  res.redirect('/user/subscriptions');
});

router.get('/subscriptions', async function (req, res, next) {
  navLinkService.registerNavLinks([
    { "label": "Subscriptions", "url": "/user/subscriptions" },
    { "label": "New", "url": "/user/subscriptions/new" }
  ]);
  navLinkService.setNavLinkActive("/user/subscriptions");
  const subscriptions = await getSubscriptions();
  res.render('subscriptions', {
    agentName: process.env.NAME,
    navLinks: navLinkService.getNavLinks(),
    customNavLinks: navLinkService.getCustomNavLinks(),
    user: req.session.user,
    subscriptions: subscriptions
  });
});

router.get('/subscriptions/new', async function (req, res, next) {
  navLinkService.registerNavLinks([
    { "label": "Subscriptions", "url": "/user/subscriptions" },
    { "label": "New", "url": "/user/subscriptions/new" }
  ]);
  const uuid = randomUUID();
  const root_url = (config.root_url.endsWith('/')) ? config.root_url : config.root_url + '/';
  const subscription = { 'id': uuid, 'callback': root_url + 'callback/' + uuid, 'state': 0 };
  navLinkService.setNavLinkActive('/user/subscriptions/new');
  res.render('subscription_new', {
    agentName: process.env.NAME,
    navLinks: navLinkService.getNavLinks(),
    customNavLinks: navLinkService.getCustomNavLinks(),
    user: req.session.user,
    subscription: subscription,
    states: states
  });
});

router.post('/subscriptions/new', newSubscriptionChecker, async function (req, res, next) {
  let errors = validationResult(req);

  if (!errors.isEmpty()) {
    errors = errors.array();
    let subscription = {
      'id': req.body.id,
      'callback': req.body.callback,
      'topic': req.body.topic,
      'content_type': req.body.content_type,
      'secret': req.body.secret,
      'lease_seconds': req.body.lease_seconds,
      'function': req.body.function,
      'state': req.body.state
    }
    navLinkService.setNavLinkActive('/user/subscriptions/new');
    return res.render('subscription_new', {
      errors: errors || null,
      error_keys: (errors || []).map(error => error.path),
      agentName: process.env.NAME,
      navLinks: navLinkService.getNavLinks(),
      customNavLinks: navLinkService.getCustomNavLinks(),
      user: req.session.user,
      subscription: subscription,
      states: states
    });
  }
  let subscription = {
    'id': req.body.id,
    'callback': req.body.callback,
    'topic': req.body.topic,
    'content_type': req.body.content_type,
    'secret': req.body.secret,
    'lease_seconds': req.body.lease_seconds,
    'function': req.body.function,
    'state': req.body.state
  }
  await newSubscription(subscription);
  res.redirect(303, '/user/subscriptions/' + req.body.id);
});

router.get('/subscriptions/:id', async function (req, res, next) {
  navLinkService.registerNavLinks([
    { "label": "Subscriptions", "url": "/user/subscriptions" },
    { "label": "New", "url": "/user/subscriptions/new" }
  ]);
  const subscription = await getSubscription(req.params.id);
  res.render('subscription_update', {
    agentName: process.env.NAME,
    navLinks: navLinkService.getNavLinks(),
    customNavLinks: navLinkService.getCustomNavLinks(),
    user: req.session.user,
    subscription: subscription,
    states: states
  });
});

router.post('/subscriptions/:id', async function (req, res, next) {
  await updateSubscription(req.params.id, req.body.secret, req.body.lease_seconds, req.body.state);
  const subscription = await getSubscription(req.params.id);
  res.render('subscription_update', {
    agentName: process.env.NAME,
    navLinks: navLinkService.getNavLinks(),
    customNavLinks: navLinkService.getCustomNavLinks(),
    user: req.session.user,
    subscription: subscription,
    states: states
  });
});

router.delete('/subscriptions/:id', async function (req, res, next) {
  await removeSubscription(req.params.id);
  res.redirect(303, '/user/subscriptions');
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