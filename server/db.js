'use strict';

const sqlite = require('sqlite3');

// Apre il database in modalità lettura/scrittura
const db = new sqlite.Database('database.db', (err) => {
    if (err) {
        console.error('Errore durante la connessione al database:', err.message);
        throw err;
    }
    console.log('Connessione a database.db riuscita!');
});

module.exports = db;