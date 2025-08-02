const express = require('express');
const crypto = require('crypto');

const router = express.Router();

const {validationOfIntent} = require('../middleware/validationOfIntent');
const {validationOfNotification} = require('../middleware/validationOfNotification');
const {updateSubscription, removeSubscription} = require('../db/db');
const { log } = require('../settings');
var   { crons, restartCron } = require('../util');

router.use('/:id', function(req, res, next) {
    if (['PATCH', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'].includes(req.method)) {
        return res.status(405).contentType('text').send('method not implemented');
    }
    next();
});

router.get('/:id', validationOfIntent, async function(req, res, next) {
    const id = req.params.id;
    log.info("Webhook GET - id: ", id);
    let subscription = res.locals.subscription;
    log.debug("subscription: ", subscription);

    // at this point, the validation of intent has passed successfully
    // Option 1: The Hub renews an existing subscription -> update secret and lease_seconds
    // Option 2: The Hub asks for unsubscription -> check if the subscription is marked for removal (subscription.state == unsubscribe) was already done in the middleware
    // Option 3: The Hub denied a previous subscription request -> remove subscription
    log.debug("mode: ", res.locals.mode);
    if (res.locals.mode === 'subscribe') {
        await updateSubscription(id, res.locals.secret, res.locals.lease_seconds, subscription.state);
        subscription.secret = res.locals.secret;
        subscription.lease_seconds = res.locals.lease_seconds;
        subscription.state = res.locals.state;
        log.debug('updated subscription: ', subscription);
        await restartCron(subscription);
    } else if (res.locals.mode === 'unsubscribe') {
        await stopCron(subscription);
    } else if (res.locals.mode === 'denied') {
        await stopCron(subscription);
        await removeSubscription(id);
    }
    return res.status(200).type('text').send(res.locals.challenge);
});

router.post('/:id', validationOfNotification, async function(req, res, next) {
    const id = req.params.id;
    log.info("Webhook POST - id: ", id);
    const subscription = res.locals.subscription;
    log.debug("subscription: ", subscription);
    
    if (subscription.secret !== '') {
        let hmac = crypto.createHmac(res.locals.x_hub_algorithm, subscription.secret);
        log.debug('start collecting POSTed data and calculate hmac');
        let body = [];
            req.on('data', async (data) => {
                hmac.update(data);
                body.push(data);
            });
            req.on('end', async () => {
                const hash = hmac.digest("hex");
                log.debug('finished collecting POSTed data');
                if (hash !== res.locals.x_hub_value) {
                    log.error("ignoring message because X-Hub-Signature is wrong");
                } else {
                    log.debug("hmac match");
                    require('../callbacks/' + subscription.function).call(body);
                }
                return res.status(200).end();
            }); 
    } else {
        log.debug('start collecting POSTed data and calculate hmac');
        let body = [];
            req.on('data', async (data) => {
                body.push(data);
            });
            req.on('end', async () => {
                log.debug('finished collecting POSTed data');
                require('../callbacks/' + subscription.function).call(body);
                return res.status(200).end();
            }); 
    }


   
});

module.exports = router;