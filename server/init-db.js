'use strict';

const fs = require('fs');
const crypto = require('crypto');
const db = require('./db'); 


function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return { hash, salt };
}

async function initDatabase() {
    try {
        console.log("Inizializzazione del database");
        const schema = fs.readFileSync('schema.sql', 'utf8');
        db.exec(schema, (err) => {
            if (err) throw err;
            console.log("Schema.");

            
            seedData();
        });

    } catch (err) {
        console.error("Error:", err.message);
    }
}

function seedData() {


    db.serialize(() => {
        //user
        const { hash, salt } = hashPassword('password');
        const stmtUser = db.prepare("INSERT INTO users (id, username, password_hash, salt) VALUES (?, ?, ?, ?)");
        stmtUser.run(1, 'principessa_nina', hash, salt);
        stmtUser.run(2, 'wapol', hash, salt);
        stmtUser.run(3, 'Enri Jr', hash, salt);
        stmtUser.finalize();

        // stations
        const stations = [
            'Mario House', 'Mushroom Kingdom', 'Luigi Circuit', 'Peach Castle',
            'Boo Woods', 'Desert Land', 'Yoshi Island', 'Peach Beach',
            'Bowser Valley', 'Rainbow Road', 'Bowser Castle', 'Wario Mine'
        ];
        const stmtStation = db.prepare("INSERT INTO stations (id, name) VALUES (?, ?)");
        stations.forEach((name, i) => stmtStation.run(i + 1, name));
        stmtStation.finalize();

        // lines
        const lines = [
           [1, 'Toad Line', 'Red'], [2, 'Yoshi Line', 'Blue'],
            [3, 'Daisy Line', 'Green'], [4, 'Wario Line', 'Yellow']
        ];
        const stmtLine = db.prepare("INSERT INTO lines (id, name, color) VALUES (?, ?, ?)");
        lines.forEach(l => stmtLine.run(l[0], l[1], l[2]));
        stmtLine.finalize();

        // connections
        const connections = [
            [1, 2, 1], [2, 3, 1], [3, 4, 1], 
            [4, 5, 2], [5, 6, 2], [6, 7, 2], 
            [7, 8, 3], [8, 9, 3],            
            [9, 10, 4], [10, 11, 4], [11, 12, 4] ,
            [4, 7, 2], [7,9,3]
        ];
        const stmtConn = db.prepare("INSERT INTO connections (station_a_id, station_b_id, line_id) VALUES (?, ?, ?)");
        connections.forEach(c => stmtConn.run(c[0], c[1], c[2]));
        stmtConn.finalize();

        // events
        const events = [
            ['A peaceful ride', 0], ['Mushroom Boost! Speed up', 1],
            ['Dodged a banana peel in style', 2], ['Coin Cube!', 4],
            ['Hit by a Blue Shell!', -4], ['Slipped off track in the mud', -2],
            ['Vision blurred by Blooper ink', -3], ['Gift from a friend', 1]
        ];
        const stmtEvent = db.prepare("INSERT INTO events (description, effect) VALUES (?, ?)");
        events.forEach(e => stmtEvent.run(e[0], e[1]));
        stmtEvent.finalize();

        // games
        const stmtGame = db.prepare("INSERT INTO games (user_id, score, date) VALUES (?, ?, ?)");
        stmtGame.run(1, 10, '2026-06-12');
        stmtGame.run(1, 1, '2026-06-13');
        stmtGame.run(2, 32, '2026-06-12');
        stmtGame.finalize();

        console.log("Database populated successfully");
    });
}

initDatabase();