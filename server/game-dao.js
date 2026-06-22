'use strict';

const db = require('./db');

/**
 * 1. Restituisce la mappa completa (stazioni, linee e connessioni insieme)
 * Richiesto da: GET /api/network
 */
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
                    
                    // Impacchettiamo tutto in un unico oggetto di rete
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

/**
 * 2. Estrae la classifica dei punteggi migliori (un record per ogni utente che ha giocato)
 * Richiesto da: GET /api/ranking
 */
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

/**
 * 3. Recupera tutti gli eventi casuali (imprevisti e bonus)
 * Richiesto da: POST /api/games/validate (per estrarre gli eventi durante il percorso)
 */
exports.getEvents = () => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM events';
        // Usiamo db.all perché vogliamo estrarre un array con TUTTE le righe degli eventi
        db.all(sql, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

/**
 * 4. Salva una nuova partita (vinta o fallita) nel database
 * Richiesto da: POST /api/games/validate
 */
exports.createGame = (userId, score, date) => {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO games (user_id, score, date) VALUES (?, ?, ?)';
        // Usiamo db.run perché stiamo INSERENDO dati, non leggendo. 
        // I punti interrogativi (?) evitano le SQL Injection.
        db.run(sql, [userId, score, date], function(err) {
            if (err) {
                reject(err);
            } else {
                // "this.lastID" contiene l'ID della nuova riga appena creata nel database
                resolve(this.lastID);
            }
        });
    });
};