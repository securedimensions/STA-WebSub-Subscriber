const express = require('express');
const router = express.Router();

const {websubGET, websubPOST} = require('../middleware/websub');
const {getWebhook} = require('../db/db');

router.get('/:id', websubGET, async function(req, res, next) {
    const id = req.params.id;
    console.log("Webhook GET - id: ", id);
    webhook = await getWebhook(id);
    console.log("webhook: ", webhook);
    if (typeof webhook === 'undefined') {
        return res.status(404).end();
    }
    return res.send('GET');
});

router.post('/:id', websubPOST, async function(req, res, next) {
    const id = req.params.id;
    console.log("Webhook POST - id: ", id);
    webhook = await getWebhook(id);
    console.log("webhook: ", webhook);
    if (typeof webhook === 'undefined') {
        return res.status(404).end();
    }
    return res.send('POST');
});

module.exports = router;