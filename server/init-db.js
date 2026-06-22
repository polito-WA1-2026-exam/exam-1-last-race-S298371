'use strict';

const fs = require('fs');
const db = require('./db');

console.log("Inizializzazione del database in corso...");

// 1. Leggiamo lo schema strutturale (CREATE TABLE)
fs.readFile('schema.sql', 'utf8', (err, schemaData) => {
    if (err) {
        console.error("Errore nella lettura del file schema.sql:", err);
        process.exit(1);
    }

    // Eseguiamo lo schema per creare le tabelle se non esistono
    db.exec(schemaData, (err) => {
        if (err) {
            console.error("Errore durante la creazione dello schema:", err.message);
            process.exit(1);
        }
        console.log("1. Schema del database (tabelle) configurato con successo.");

        // 2. Solo dopo che lo schema è pronto, leggiamo i dati di popolamento (INSERT INTO)
        fs.readFile('seeding.sql', 'utf8', (err, seedingData) => {
            if (err) {
                console.error("Errore nella lettura del file seeding.sql:", err);
                process.exit(1);
            }

            // Eseguiamo il seeding per azzerare e inserire i record aggiornati
            db.exec(seedingData, (err) => {
                if (err) {
                    console.error("Errore durante il popolamento (seeding):", err.message);
                    process.exit(1);
                }
                console.log("2. Database popolato con successo (12 Stazioni, 4 Linee, 3 Interscambi, Utenti crypto)!");
                process.exit(0); // Uscita con successo
            });
        });
    });
});