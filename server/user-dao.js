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
                const user = { id: row.id, username: row.username };
                
                // --- APPLICAZIONE TEORIA CRYPTO NATIVO ---
                // Calcoliamo l'hash della password inserita usando il salt memorizzato nel DB
                // Parametri standard delle dispense: 1000 iterazioni, 64 byte di lunghezza, algoritmo sha512
                crypto.pbkdf2(password, row.salt, 1000, 64, 'sha512', (err, hashedPassword) => {
                    if (err) return reject(err);
                    
                    // Convertiamo l'hash calcolato in esadecimale per confrontarlo con quello nel DB
                    const passwordTarget = hashedPassword.toString('hex');
                    
                    // 1. Creiamo i due buffer in modo pulito
const dbBuffer = Buffer.from(row.password_hash, 'hex');
const targetBuffer = Buffer.from(passwordTarget, 'hex');

// ==========================================
    // 🔍 CONSOLE.LOG DI DEBUG (Rimuovere prima dell'esame)
    // ==========================================
    console.log("--- DEBUG LOGIN ---");
    console.log("Username inserito:", username);
    console.log("Password inserita:", password);
    console.log("Lunghezza hash nel DB (Buffer):", dbBuffer.length);
    console.log("Lunghezza hash calcolato (Buffer):", targetBuffer.length);
    console.log("Hash nel DB (Hex):", row.password_hash);
    console.log("Hash calcolato (Hex):", passwordTarget);
    // ==========================================

// 2. CONTROLLO DI SICUREZZA: Se le lunghezze sono diverse, le password sono sicuramente diverse!
// Questo evita il lancio del RangeError e il conseguente crash del server.
if (dbBuffer.length !== targetBuffer.length) {
    // Risolvi la promessa a false (o gestisci il fallimento del login in base a come è scritto il tuo DAO)
    return resolve(false); 
}

// 3. Se hanno la stessa lunghezza, possiamo effettuare il confronto sicuro senza rischio di crash
if (crypto.timingSafeEqual(dbBuffer, targetBuffer)) {    
    // Autenticazione riuscita, restituisci l'utente pulito
    const user = { id: row.id, username: row.username };
    resolve(user);
} else {
    // Password errata ma con stessa lunghezza buffer
    resolve(false);
}
                });
            }
        });
    });
};