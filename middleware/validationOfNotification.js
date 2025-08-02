const parseHttpHeader = require('parse-http-header');
const { getSubscription } = require('../db/db');
const { log } = require('../settings');

const validationOfNotification = async (req, res, next) => {
  log.info("websub validationOfNotification Middleware");

  const id = req.params.id;
  const subscription = await getSubscription(id);

  res.locals.subscription = subscription;
  log.debug("subscription: ", subscription);
  if (typeof subscription === 'undefined') {
    const error = 'callback does not exist';
    log.error(error);
    return res.status(404).contentType('text').send(error);
  }

  // If the subscription is inactive, return 410 GONE
  if (subscription.state !== 1) {
    log.error('notification received for inactive subscription on callback: ', subscription.callback);
    return res.status(410).end();
  }

  if (!req.header('content-type') === undefined) {
    const error = 'header content-type missing';
    log.error(error);
    return res.status(415).contentType('text').send(error);
  }

  let content_type = parseHttpHeader(req.headers['content-type'])[0];
  log.debug(`content-type: ${content_type}`);

  if (content_type !== subscription.content_type) {
    const error = 'content-type not allowed';
    log.error(error);
    return res.status(415).contentType('text').send(error);
  }

  if (subscription.secret !== '') {
    const x_hub_signature = req.header('x-hub-signature');
    if (x_hub_signature === undefined) {
      log.error("ignoring message because X-Hub-Signature header is missing");
      return res.status(200).contentType('text').send('OK');
    }
    const [x_hub_algorithm, x_hub_value] = x_hub_signature.split('=');
    if ((typeof x_hub_algorithm === 'undefined') || (typeof x_hub_value === 'undefined')) {
      const error = 'X-Hub-Signature header value has wrong format';
      log.error(error);
      return res.status(400).contentType('text').send(error);
    }
    if (!['sha1', 'sha256', 'sha384', 'sha512'].indexOf(x_hub_algorithm)) {
      const error = 'X-Hub-Signature uses unrecognized HMAC algorithm';
      log.error(error);
      return res.status(400).contentType('text').send(error);
    }
    res.locals.x_hub_algorithm = x_hub_algorithm;
    res.locals.x_hub_value = x_hub_value
    
  }

  next();
};

module.exports = { validationOfNotification }