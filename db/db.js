const sqlite3 = require('better-sqlite3');
const db = new sqlite3('./webhooks.sqlite', {},
    (err) => { 
        let createUsers = 'CREATE TABLE IF NOT EXISTS "webhooks" ("id" TEXT NOT NULL PRIMARY KEY,"content_type" TEXT NOT NULL)';
        db.run(createUsers);
    });

const getWebhooks = async function () {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM webhooks', (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
}

const getWebhook = async function (id) {
    return new Promise(async (resolve, reject) => {
        const row = await db.prepare('SELECT * FROM webhooks WHERE id=?').get(id);
        console.log("row: ", row);
        resolve(row);
    });
}

module.exports = { getWebhooks, getWebhook };