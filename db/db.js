const sqlite3 = require('better-sqlite3');
const db = new sqlite3('./subscriptions.sqlite');
const { log, config } = require('../settings');



const getSubscriptions = async function () {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare('SELECT * FROM subscriptions');
        let subscriptions = stmt.all();
        for (let subscription of subscriptions) {
            subscription.topics = JSON.parse(subscription.topics);
        }
        resolve(subscriptions);
    });
}

const getActiveSubscriptions = async function () {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare('SELECT * FROM subscriptions WHERE state=1');
        let subscriptions = stmt.all();
        for (let subscription of subscriptions) {
            subscription.topics = JSON.parse(subscription.topics);
        }
        resolve(subscriptions);
    });
}

const getSubscription = function (id) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare('SELECT * FROM subscriptions WHERE id=?');
        let subscription = stmt.get(id);
        subscription.topics = JSON.parse(subscription.topics);
        resolve(subscription);
    });
}

const updateSubscription = function(id, secret, lease_seconds, state) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare('UPDATE subscriptions SET secret=?, lease_seconds=?, state=? WHERE id=? RETURNING *');
        resolve(stmt.run(secret, lease_seconds, state, id));
    });
};

const removeSubscription = function(id) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare('DELETE FROM subscriptions WHERE id=?');
        resolve(stmt.run(id));
    });
}

const newSubscription = function(subscription) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare('INSERT INTO subscriptions (id, content_type, callback, topics, secret, lease_seconds, function, state) VALUES(?,?,?,?,?,?,?,?) RETURNING *');
        const topics = (Array.isArray(subscription.topics)) ? JSON.stringify(subscription.topics) : JSON.stringify([subscription.topics]);
        resolve(stmt.run(subscription.id, subscription.content_type, subscription.callback, topics, subscription.secret, subscription.lease_seconds, subscription.function, subscription.state));
    });
};

module.exports = { getSubscriptions, getActiveSubscriptions, getSubscription, updateSubscription, removeSubscription, newSubscription }

let createDb = 'CREATE TABLE IF NOT EXISTS "subscriptions" ("id" TEXT NOT NULL PRIMARY KEY, "content_type" TEXT NOT NULL, "callback" TEXT NOT NULL, "topics" TEXT not NULL, "function" TEXT not NULL, "lease_seconds" INTEGER, "secret" TEXT, "state" INTEGER)';
db.exec(createDb);
try {
    const subscription = {
        id: 'ba5b5806-cbeb-4c90-b7c2-226ec79d9710',
        content_type: 'application/json',
        callback: '${config.root_url}/callback/ba5b5806-cbeb-4c90-b7c2-226ec79d9710',
        topics: 'https://citiobs.demo.secure-dimensions.de/staplustest/v1.1/Datastreams(5002)/Observations',
        function: 'ba5b5806-cbeb-4c90-b7c2-226ec79d9710', 
        lease_seconds: 120,
        secret: 'secret',
        state: 1
    };
    if (!getSubscription(subscription.id))
        newSubscription(subscription);
}
catch (err) {
    log.error(err);
}