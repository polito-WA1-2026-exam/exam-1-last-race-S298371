'use strict';

const sqlite = require('sqlite3');

const db = new sqlite.Database('database.db', (err) => {
    if (err) {
        console.error('Error while connecting to the database:', err.message);
        throw err;
    }
    console.log('Connection to database.db successful');
});

module.exports = db;