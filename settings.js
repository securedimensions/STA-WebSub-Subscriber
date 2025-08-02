"use strict";

require("dotenv").config();

const log = require('loglevel');
log.setLevel(process.env.LOG_LEVEL || "WARN");

let root_url = process.env.ROOT_URL || 'http://localhost:3000/callback';
root_url = (root_url.endsWith('/')) ? root_url.slice(0,-1) : root_url;

module.exports = {
    "config": {
        "port": process.env.PORT || 3000,
        "root_url": root_url,
        "hub_url": process.env.HUB_URL || 'http://localhost:4000/api/subscriptions',
        "lease_seconds": process.env.LEASE_SECONDS || 300,
        "lease_skew_seconds": process.env.LEASE_SKEW_SECONDS || 10,
        "cookie_secret": process.env.COOKIE_SECRET || '4230fjfopagcudg39tuzt5izlhorj39g',
        "app_name": process.env.APP_NAME || 'STA-WebSub Webhook Management',
        "login": process.env.LOGIN || 'admin',
        'password': process.env.PASSWORD || 'changeMe'
    },
    log
}