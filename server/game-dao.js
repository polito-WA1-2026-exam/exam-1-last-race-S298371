'use strict';

const db = require('./db');

//return complete network
exports.getCompleteNetwork = () => {
    return new Promise((resolve, reject) => {
        const sqlStations = 'SELECT * FROM stations';
        const sqlLines = 'SELECT * FROM lines';
        const sqlConnections = 'SELECT * FROM connections';

        db.all(sqlStations, [], (err, stations) => {
            if (err) return reject(err);
            
            db.all(sqlLines, [], (err, lines) => {
                if (err) return reject(err);
                
                db.all(sqlConnections, [], (err, connections) => {
                    if (err) return reject(err);
                    
                    
                    resolve({
                        stations: stations,
                        lines: lines,
                        connections: connections
                    });
                });
            });
        });
    });
};

//obtain best result (ranking)
exports.getRanking = () => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT users.username, MAX(games.score) as top_score
            FROM games
            JOIN users ON games.user_id = users.id
            GROUP BY users.id
            ORDER BY top_score DESC
        `;
        db.all(sql, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

//obtain events
exports.getEvents = () => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM events';
        db.all(sql, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

//save game
exports.createGame = (userId, score, date) => {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO games (user_id, score, date) VALUES (?, ?, ?)';
        db.run(sql, [userId, score, date], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
    });
};