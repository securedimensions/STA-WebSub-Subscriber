var { request } = require('urllib');
var querystring = require("querystring");
const { config, log } = require('./settings');

var crons = [];

async function sendSubscription(subscription, method) {
    log.debug(`sending ${method} for: `, subscription.callback);
    request(config.hub_url, {
        method: 'POST',
        followRedirect: false,
        data: {
          'hub.mode': method,
          'hub.topic': querystring.escape(subscription.topic),
          'hub.callback': subscription.callback,
          'hub.secret': subscription.secret,
          'hub.lease_seconds': subscription.lease_seconds
        }
      }).then(res => {
        log.debug('status: %s, body: %s, headers: %j', res.statusCode, res.data, res.headers);

        if (res.statusCode >= 300) {
          log.error(`${mode} update request returned status code: `, res.statusCode);
          return;
        }

      }).catch(error => {
        log.error(error);
      });
}

async function startCron(subscription) {
    const cron = setTimeout(function () {
      const date = new Date();
      log.info('cron executed at: ', date.toISOString());
      log.info('callback: ', subscription.callback);
        sendSubscription(subscription, 'subscribe');
    }, subscription.lease_seconds * 1000 /*ms*/);
    log.info('cron started for callback: ', subscription.callback);
    const date = new Date();
    const firstExecDate = date.getTime() + subscription.lease_seconds * 1000;
    log.info('cron will execute at: ', (new Date(firstExecDate)).toISOString());
    crons.push({'callback': subscription.callback, 'cron': cron});
}

async function stopCron(subscription) {
    const cron = crons.find(e => e.callback == subscription.callback);
    if (typeof cron !== 'undefined') {
        clearTimeout(cron.cron);
        crons = crons.filter(function(e) { return e.callback != subscription.callback; }); 
        log.debug('cron stopped for ', subscription.callback);
    }
        
}

async function restartCron(subscription) {
    const cron = crons.find(e => e.callback == subscription.callback);
    if (typeof cron !== 'undefined') {
        await stopCron(subscription);
    }

    await startCron(subscription);

}

module.exports = { sendSubscription, crons, startCron, stopCron, restartCron }