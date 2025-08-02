const sqlite3 = require('better-sqlite3');
const db = new sqlite3('./subscriptions.sqlite');
const { log, config } = require('../settings');

let createDb = 'CREATE TABLE IF NOT EXISTS "subscriptions" ("id" TEXT NOT NULL PRIMARY KEY, "content_type" TEXT NOT NULL, "callback" TEXT NOT NULL, "topic" TEXT not NULL, "function" TEXT not NULL, "lease_seconds" INTEGER, "secret" TEXT, "state" INTEGER)';
db.exec(createDb);
try {
    let insertSubscription = `insert into subscriptions values('ba5b5806-cbeb-4c90-b7c2-226ec79d9710','application/json','${config.root_url}/callback/ba5b5806-cbeb-4c90-b7c2-226ec79d9710','https://citiobs.demo.secure-dimensions.de/staplustest/v1.1/Datastreams(5002)/Observations','ba5b5806-cbeb-4c90-b7c2-226ec79d9710', 120,'secret',1)`;
    db.exec(insertSubscription);
}
catch (err) {
    log.error(err);
}

const getSubscriptions = async function () {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare('SELECT * FROM subscriptions');
        resolve(stmt.all());
    });
}

const getActiveSubscriptions = async function () {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare('SELECT * FROM subscriptions WHERE state=1');
        resolve(stmt.all());
    });
}

const getSubscription = function (id) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare('SELECT * FROM subscriptions WHERE id=?');
        resolve(stmt.get(id));
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
        const stmt = db.prepare('INSERT INTO subscriptions (id, content_type, callback, topic, secret, lease_seconds, function, state) VALUES(?,?,?,?,?,?,?,?) RETURNING *');
        resolve(stmt.run(subscription.id, subscription.content_type, subscription.callback, subscription.topic, subscription.secret, subscription.lease_seconds, subscription.function, subscription.state));
    });
};

module.exports = { getSubscriptions, getActiveSubscriptions, getSubscription, updateSubscription, removeSubscription, newSubscription }