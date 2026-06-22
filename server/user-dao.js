'use strict';

const db = require('./db'); 
const crypto = require('crypto'); // Riferimento Teoria: modulo core nativo di Node.js

/**
 * Recupera un utente dato il suo id (usato da Passport per la sessione)
 */
exports.getUserById = (id) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM users WHERE id = ?';
        db.get(sql, [id], (err, row) => {
            if (err) {
                reject(err);
            } else if (row === undefined) {
                resolve(null);
            } else {
                // Ritorna l'utente senza password e senza salt per massima sicurezza (API Design)
                const user = { id: row.id, username: row.username };
                resolve(user);
            }
        });
    });
};

/**
 * Funzione di Login: verifica le credenziali dell'utente usando il modulo crypto (PBKDF2)
 */
exports.getUser = (username, password) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM users WHERE username = ?';
        db.get(sql, [username], (err, row) => {
            if (err) {
                reject(err);
            } else if (row === undefined) {
                resolve(false); // Utente non trovato
            } else {
                // --- UTILIZZO DI SCRYPT ASINCRONO ---
                // Utilizziamo crypto.scrypt con una lunghezza di 64 byte, per allinearci a init-db.js
                crypto.scrypt(password, row.salt, 64, (err, hashedPassword) => {
                    if (err) return reject(err);
                    
                    // Convertiamo l'hash calcolato in esadecimale per confrontarlo con quello nel DB
                    const passwordTarget = hashedPassword.toString('hex');
                    
                    // Creiamo i due buffer in modo pulito
                    const dbBuffer = Buffer.from(row.password_hash, 'hex');
                    const targetBuffer = Buffer.from(passwordTarget, 'hex');

                    // ==========================================
                    // 🔍 CONSOLE.LOG DI DEBUG AGGIORNATO
                    // ==========================================
                    console.log("--- DEBUG LOGIN (SCRYPT) ---");
                    console.log("Username inserito:", username);
                    console.log("Lunghezza hash nel DB (Buffer):", dbBuffer.length);
                    console.log("Lunghezza hash calcolato (Buffer):", targetBuffer.length);
                    console.log("Hash nel DB (Hex):", row.password_hash);
                    console.log("Hash calcolato (Hex):", passwordTarget);
                    // ==========================================

                    // CONTROLLO DI SICUREZZA: Verifica della stessa lunghezza per evitare RangeError
                    if (dbBuffer.length !== targetBuffer.length) {
                        return resolve(false); 
                    }

                    // Confronto sicuro nel tempo (Costant-time comparison)
                    if (crypto.timingSafeEqual(dbBuffer, targetBuffer)) {    
                        // Autenticazione riuscita, restituisci l'utente pulito
                        const user = { id: row.id, username: row.username };
                        resolve(user);
                    } else {
                        // Password errata
                        resolve(false);
                    }
                });
            }
        });
    });
};