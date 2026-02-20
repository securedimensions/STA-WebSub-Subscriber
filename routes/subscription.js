const express = require('express');
const router = express.Router();
const { randomUUID } = require('crypto');
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');

const { config, log } = require('../settings.js');
const NavLinkService = require('../services/NavLinkService.js');
const { getSubscription, getSubscriptions, updateSubscription, removeSubscription, newSubscription } = require('../db/db.js');
const { newSubscriptionChecker } = require('../middleware/newSubscriptionChecker.js');
const { sendSubscription, stopCron, restartCron } = require('../util.js');

const navLinkService = new NavLinkService();

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
  const states = [{ 'key': 'inactive', 'value': 0 }, { 'key': 'active', 'value': 1 }, { 'key': 'allow unsubscribe', 'value': 2 }];
  res.render('subscriptions', {
    agentName: process.env.APP_NAME,
    navLinks: navLinkService.getNavLinks(),
    customNavLinks: navLinkService.getCustomNavLinks(),
    user: req.session.user,
    subscriptions: subscriptions,
    states: states
  });
});

router.get('/subscriptions/new', async function (req, res, next) {
  navLinkService.registerNavLinks([
    { "label": "Subscriptions", "url": "/user/subscriptions" },
    { "label": "New", "url": "/user/subscriptions/new" }
  ]);
  const uuid = randomUUID();
  const subscription = { 'id': uuid, 'topics': [''], 'callback': config.root_url + '/callback/' + uuid, 'state': 0 };
  navLinkService.setNavLinkActive('/user/subscriptions/new');
  const states = [{ 'key': 'inactive', 'value': 0 }, { 'key': 'active', 'value': 1 }];
  res.render('subscription_new', {
    agentName: process.env.APP_NAME,
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
      'topics': Array.isArray(req.body.topics) ? req.body.topics : [req.body.topics],
      'content_type': req.body.content_type,
      'secret': req.body.secret,
      'lease_seconds': req.body.lease_seconds,
      'function': req.file ? req.file.originalname : undefined,
      'state': req.body.state ? req.body.state : undefined
    }
    navLinkService.setNavLinkActive('/user/subscriptions/new');
    const states = [{ 'key': 'inactive', 'value': 0 }, { 'key': 'active', 'value': 1 }];
    return res.render('subscription_new', {
      errors: errors || null,
      error_keys: (errors || []).map(error => error.path),
      agentName: process.env.APP_NAME,
      navLinks: navLinkService.getNavLinks(),
      customNavLinks: navLinkService.getCustomNavLinks(),
      user: req.session.user,
      subscription: subscription,
      states: states
    });
  }

  const functionPath = path.join(__dirname, '../callbacks/' + req.body.id + '.js')
  if (fs.existsSync(functionPath)) {
    fs.rmSync(functionPath);
  }
  fs.copyFileSync(path.join(__dirname, '../uploads/', req.file.filename), path.join(__dirname, '../callbacks/' + req.body.id + '.js'));
  fs.unlinkSync(path.join(__dirname, '../uploads/', req.file.filename));

  let subscription = {
    'id': req.body.id,
    'callback': req.body.callback,
    'topics': Array.isArray(req.body.topics) ? req.body.topics : [req.body.topics],
    'content_type': req.body.content_type,
    'secret': req.body.secret,
    'lease_seconds': req.body.lease_seconds,

    'function': req.body.id + '.js',
    'state': req.body.state
  }
  await newSubscription(subscription);

  if (subscription.state == 1) {
    await sendSubscription(subscription, 'subscribe');
  }

  res.redirect(303, '/user/subscriptions/' + req.body.id);
});

router.get('/subscriptions/:id', async function (req, res, next) {
  navLinkService.registerNavLinks([
    { "label": "Subscriptions", "url": "/user/subscriptions" },
    { "label": "New", "url": "/user/subscriptions/new" }
  ]);
  const subscription = await getSubscription(req.params.id);
  if (typeof subscription === 'undefined') {
    return res.redirect('/user/subscriptions');
  }
  const states = [{ 'key': 'inactive', 'value': 0 }, { 'key': 'active', 'value': 1 }, { 'key': 'allow unsubscribe', 'value': 2 }];
  res.render('subscription_update', {
    agentName: process.env.APP_NAME,
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
  await stopCron(subscription);
  if (subscription.state == 0) {
    await sendSubscription(subscription, 'unsubscribe');
    await stopCron(subscription);
  } else if (subscription.state == 1) {
    await sendSubscription(subscription, 'subscribe');
    await restartCron(subscription)
  }
  const states = [{ 'key': 'inactive', 'value': 0 }, { 'key': 'active', 'value': 1 }, { 'key': 'allow unsubscribe', 'value': 2 }];
  res.render('subscription_update', {
    agentName: process.env.APP_NAME,
    navLinks: navLinkService.getNavLinks(),
    customNavLinks: navLinkService.getCustomNavLinks(),
    user: req.session.user,
    subscription: subscription,
    states: states
  });
});

router.delete('/subscriptions/:id', async function (req, res, next) {
  const subscription = await getSubscription(req.params.id);
  await removeSubscription(req.params.id);
  await stopCron(subscription);
  const functionPath = path.join(__dirname, '../callbacks/' + subscription.function);
  if (fs.existsSync(functionPath)) {
    fs.rmSync(functionPath);
  }

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