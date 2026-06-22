'use strict';

const fs = require('fs');
const crypto = require('crypto');
const db = require('./db'); // Il tuo file db.js

// Funzione per generare hash sicuro con scrypt
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return { hash, salt };
}

async function initDatabase() {
    try {
        console.log("Inizializzazione del database...");

        // 1. Leggiamo ed eseguiamo lo schema.sql
        const schema = fs.readFileSync('schema.sql', 'utf8');
        db.exec(schema, (err) => {
            if (err) throw err;
            console.log("-> Schema creato correttamente.");

            // 2. Inseriamo i dati in sequenza
            seedData();
        });

    } catch (err) {
        console.error("Errore fatale:", err.message);
    }
}

function seedData() {
    console.log("-> Popolamento del database in corso...");

    db.serialize(() => {
        // 1. INSERIMENTO UTENTI
        const { hash, salt } = hashPassword('password');
        const stmtUser = db.prepare("INSERT INTO users (id, username, password_hash, salt) VALUES (?, ?, ?, ?)");
        stmtUser.run(1, 'principessa_nina', hash, salt);
        stmtUser.run(2, 'wapol', hash, salt);
        stmtUser.run(3, 'Enri Jr', hash, salt);
        stmtUser.finalize();

        // 2. INSERIMENTO STAZIONI
        const stations = [
            'Casa di Mario', 'Regno dei Funghi', 'Circuito di Luigi', 'Castello di Peach',
            'Bosco dei Boos', 'Desert Land', 'Yoshi Island', 'Spiaggia di Peach',
            'Valle di Bowser', 'Pista Arcobaleno', 'Castello di Bowser', 'Miniera di Wario'
        ];
        const stmtStation = db.prepare("INSERT INTO stations (id, name) VALUES (?, ?)");
        stations.forEach((name, i) => stmtStation.run(i + 1, name));
        stmtStation.finalize();

        // 3. INSERIMENTO LINEE
        const lines = [
            [1, 'Linea Toad', 'Red'], [2, 'Linea Yoshi', 'Blue'],
            [3, 'Linea Daisy', 'Green'], [4, 'Linea Wario', 'Yellow']
        ];
        const stmtLine = db.prepare("INSERT INTO lines (id, name, color) VALUES (?, ?, ?)");
        lines.forEach(l => stmtLine.run(l[0], l[1], l[2]));
        stmtLine.finalize();

        // 4. INSERIMENTO CONNESSIONI (Ora le stazioni e linee esistono!)
        const connections = [
            [1, 2, 1], [2, 3, 1], [3, 4, 1], // Linea 1
            [4, 5, 2], [5, 6, 2], [6, 7, 2], // Linea 2
            [7, 8, 3], [8, 9, 3],            // Linea 3
            [9, 10, 4], [10, 11, 4], [11, 12, 4] // Linea 4
        ];
        const stmtConn = db.prepare("INSERT INTO connections (station_a_id, station_b_id, line_id) VALUES (?, ?, ?)");
        connections.forEach(c => stmtConn.run(c[0], c[1], c[2]));
        stmtConn.finalize();

        // 5. INSERIMENTO EVENTI
        const events = [
            ['Viaggio tranquillo sul rettilineo', 0], ['Fungo Scatto! Corri più veloce', 1],
            ['Superata una trappola di banane con stile', 2], ['Hai preso il Cubo Oggetto... Cubo di Monete!', 4],
            ['Colpito da un Guscio Blu!', -4], ['Sbandata fuori pista sul fango', -2],
            ['Vista offuscata dalla pece del polpo', -3], ['Un passeggero gentile ti regala una moneta', 1]
        ];
        const stmtEvent = db.prepare("INSERT INTO events (description, effect) VALUES (?, ?)");
        events.forEach(e => stmtEvent.run(e[0], e[1]));
        stmtEvent.finalize();

        // 6. INSERIMENTO PARTITE
        const stmtGame = db.prepare("INSERT INTO games (user_id, score, date) VALUES (?, ?, ?)");
        stmtGame.run(1, 24, '2026-06-12');
        stmtGame.run(1, 15, '2026-06-13');
        stmtGame.run(2, 32, '2026-06-12');
        stmtGame.finalize();

        console.log("-> Database popolato con successo!");
    });
}

initDatabase();