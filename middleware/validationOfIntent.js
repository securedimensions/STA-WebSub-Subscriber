const querystring = require("querystring");
const url = require('url');
const { getSubscription } = require('../db/db');
const { log } = require('../settings');

var Enum = require('enum');
var subscription_state = new Enum({
 'inactive': 0,
 'active': 1,
 'unsubscribe': 2
});

const validationOfIntent = async (req, res, next) => {
  log.info("websub validationOfIntent Middleware");

  let mode = req.query['hub.mode'] || null;
  if (mode === null) {
    const error = 'parameter hub.mode required';
    log.error(error);
    return res.status(400).contentType('text').send(error);
  }
  mode = mode.toString("utf8").trim();
  log.info("requested mode: " + mode);

  if (!['subscribe', 'unsubscribe'].find(m => m === mode)) {
    const error = 'hub.mode not allowed: ' + mode;
    log.error(error)
    return res.status(400).contentType('text').send(error);
  }
  res.locals.mode = mode;

  let topic = req.query['hub.topic'] || null;
  if (topic === null) {
    const error = 'parameter hub.topic required';
    log.error(error);
    return res.status(400).contentType('text').send(error);
  }
  res.locals.topic = querystring.unescape(topic.toString("utf8").trim());
  log.debug("topic: " + res.locals.topic);


  let challenge = req.query['hub.challenge'] || null;
  if (challenge === null) {
    const error = 'parameter hub.challenge required';
    log.error(error);
    return res.status(400).contentType('text').send(error);
  }

  challenge = challenge.toString("utf8").trim();

  if (challenge.length > 200) {
    const error = 'parameter hub.challenge exceeds limit of 200 bytes';
    log.error(error);
    return res.status(400).contentType('text').send(error);
  }

  res.locals.challenge = challenge;
  log.debug("challenge: ", res.locals.challenge);

  const subscription = await getSubscription(req.params.id);
  if (typeof subscription === 'undefined') {
    const callback = url.format({
      protocol: req.protocol,
      host: req.get('host'),
      pathname: req.baseUrl + '/' + req.params.id
    });
    const error = 'callback does not exist: ' + callback;
    log.error(error);
    return res.status(404).contentType('text').send(error);
  }
  res.locals.subscription = subscription;

  if (res.locals.topic !== subscription.topic) {
    const error = 'topic and callback do not match';
    log.error(error);
    return res.status(404).type('text').send(error);
  }

  if (mode === 'subscribe') {

    // process lease_seconds
    let lease_seconds = req.query['hub.lease_seconds'] || null;
    log.debug(`lease_seconds: ${lease_seconds}`);
    if (lease_seconds === null) {
      const error = 'parameter hub.lease_seconds required';
      log.error(error);
      return res.status(400).contentType('text').send(error);
    }

    lease_seconds = lease_seconds.toString("utf8").trim();
    if (isFinite(lease_seconds) && Number(lease_seconds) % 1 == 0) {
      lease_seconds = Number(lease_seconds);
    } else {
      const error = 'parameter hub.lease_seconds must be a number';
      log.error(error);
      return res.status(400).contentType('text').send(error);
    }

    if (lease_seconds < 60) {
      const error = 'parameter hub.lease_seconds must be greater than 60';
      log.error(error);
      return res.status(400).contentType('text').send(error);
    }
    res.locals.lease_seconds = lease_seconds;
    // In case the Hub has changed the lease_seconds according to own policy
    log.info('setting lease_seconds to: ', res.locals.lease_seconds);

    let secret = req.query['hub.secret'] || null;
    if (secret !== null) {
      secret = secret.toString("utf8").trim();

      if (secret.length > 200) {
        const error = 'hub.secret exceeds limit of 200 bytes';
        log.error(error);
        return res.status(400).contentType('text').send(error);
      }
    }
    res.locals.secret = secret;
    log.debug('secret: ', res.locals.secret);

  } else if (subscription.state !== subscription_state.unsubscribe.value) {
      const error = 'callback not marked for unsubscribe';
      log.error(error);
      return res.status(403).contentType('text').send(error);
  }

  next();
};

module.exports = { validationOfIntent }