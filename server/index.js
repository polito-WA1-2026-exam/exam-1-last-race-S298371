'use strict';

const express = require('express');
const morgan = require('morgan'); // logger per vedere le richieste nel terminale
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const { body, validationResult } = require('express-validator');
// Importiamo il DAO degli utenti
const userDao = require('./user-dao');

//importo dao gioco: 
const gameDao = require('./game-dao');

//importo auth e middleware 
const { isLoggedIn } = require('./auth');


// Inizializzazione dell'applicazione Express
const app = express();
const port = 3001; // Il server gira sulla porta 3001 (la 3000 sarà per React)

// 1. MIDDLEWARE DI BASE
app.use(morgan('dev'));
app.use(express.json()); // Permette di leggere il body JSON delle richieste POST

// Configurazione CORS per permettere a React (porta 3000) di comunicare con Express (porta 3001)
const corsOptions = {
    origin: 'http://localhost:5173',
    credentials: true,
};
app.use(cors(corsOptions));

// 2. CONFIGURAZIONE DELLE SESSIONI
app.use(session({
    secret: '7x$9P@mK2!wQzA5*bE&rT9_cX4#vB1%nM8(kL3)jH0{gF5}dS2[aQ1]pZ7_fX9',
    resave: false,
    saveUninitialized: false
}));

// Inizializzazione Passport 
app.use(passport.initialize());
app.use(passport.session());



// 4. API DELLE ROTTE DI AUTENTICAZIONE (Login, Logout, Sessione Corrente)
// Regole di validazione sintattica per le credenziali di login
const validaLogin = [
    body('username')
        .notEmpty().withMessage("L'username è obbligatorio.")
        .trim(),
    body('password')
        .notEmpty().withMessage("La password è obbligatoria.")
        .isLength({ min: 5 }).withMessage("La password deve essere lunga almeno 5 caratteri.")
];
// POST /api/sessions -> Effettua il login
app.post('/api/sessions', validaLogin, function(req, res, next) {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Se i campi sono vuoti o la password è corta, risponde subito con 422
        return res.status(422).json({ errors: errors.array() }); // Slide 27
    }

    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            return res.status(401).json(info);
        }
        // Crea la sessione di login
        req.login(user, (err) => {
            if (err) return next(err);
            
            // Creiamo un oggetto pulito usando direttamente 'user'
            const userSafe = { 
                id: user.id, 
                username: user.username 
            };
            
            // Invia il JSON al client in totale sicurezza!
            return res.json(userSafe);
        });
    })(req, res, next);
});

// GET /api/sessions/current -> Verifica se l'utente ha già una sessione attiva (utile al ricaricamento della pagina)
app.get('/api/sessions/current', (req, res) => {
    if (req.isAuthenticated()) {
        const userSafe = { id: req.user.id, username: req.user.username };
        res.status(200).json(userSafe);
    } else {
        res.status(401).json({ error: 'Nessuna sessione attiva' });
    }
});

// DELETE /api/sessions/current -> Effettua il logout
app.delete('/api/sessions/current', (req, res) => {
    req.logout(() => {
        res.status(200).json({ message: 'Logout effettuato con successo' });
    });
});

// ==========================================
// 6. API DI GIOCO REALI (Blocco 4)
// ==========================================

// --- GET /api/network ---
// Restituisce l'intera mappa
app.get('/api/network', isLoggedIn, async (req, res, next) => {
    try {
        const network = await gameDao.getCompleteNetwork();
        res.json(network);
    } catch (err) {
        // Logghiamo l'errore sul terminale del server per non perdere l'eccezione nativa
        console.error("Errore nel recupero della mappa:", err); 
        // Inviamo una risposta pulita al client
        res.status(500).json({ error: 'Errore interno nel recupero della mappa ferroviaria.' });
    }
});
// --- GET /api/ranking ---
// Classifica protetta 
app.get('/api/ranking', isLoggedIn, async (req, res, next) => {
    try {
        const ranking = await gameDao.getRanking();
        res.json(ranking);
    } catch (err) {
        // Applichiamo il medesimo principio: logghiamo l'eccezione sul server per il debug
        console.error("Errore nel recupero della classifica:", err);
        // Inviamo una risposta di errore pulita al client
        res.status(500).json({ error: 'Errore interno nel recupero della classifica globale.' });
    }
});

// --- FUNZIONE AUSILIARIA: Algoritmo BFS per calcolare la distanza minima ---
function calcolaDistanzaMinima(partenzaId, destinazioneId, connections) {
    // Creiamo una lista di adiacenza (il grafo delle stazioni)
    const grafo = {};
    connections.forEach(c => {
        if (!grafo[c.station_a_id]) grafo[c.station_a_id] = [];
        if (!grafo[c.station_b_id]) grafo[c.station_b_id] = [];
        grafo[c.station_a_id].push(c.station_b_id);
        grafo[c.station_b_id].push(c.station_a_id); // Tratta bidirezionale
    });

    // Algoritmo BFS per trovare il percorso più breve
    const coda = [ { nodo: partenzaId, distanza: 0 } ];
    const visitati = new Set([partenzaId]);

    while (coda.length > 0) {
        const { nodo, distanza } = coda.shift();

        if (nodo === destinazioneId) return distanza;

        const vicini = grafo[nodo] || [];
        for (const vicino of vicini) {
            if (!visitati.has(vicino)) {
                visitati.add(vicino);
                coda.push({ nodo: vicino, distanza: distanza + 1 });
            }
        }
    }
    return -1; // Non raggiungibile
}

// --- POST /api/games/start ---
// Avvia una nuova partita calcolando la tratta valida (Riscritto secondo la teoria del Blocco_02)
app.post('/api/games/start', isLoggedIn, async (req, res, next) => { // Aggiunto 'next' qui
    try {
        const network = await gameDao.getCompleteNetwork();
        const stazioni = network.stations;
        const connessioni = network.connections;

        let partenza, destinazione;
        let distanza = 0;
        let tentativi = 0;

        // Ciclo di controllo: estrae finché non trova una tratta lunga almeno 3 segmenti
        while (distanza < 3 && tentativi < 100) {
            partenza = stazioni[Math.floor(Math.random() * stazioni.length)];
            destinazione = stazioni[Math.floor(Math.random() * stazioni.length)];
            
            if (partenza.id !== destinazione.id) {
                distanza = calcolaDistanzaMinima(partenza.id, destinazione.id, connessioni);
            }
            tentativi++;
        }

        if (distanza < 3) {
            return res.status(500).json({ error: "Impossibile generare una tratta valida sulla mappa." });
        }

        // Salva temporaneamente i dati della partita attiva nella sessione dell'utente (Reading_1)
        req.session.partitaAttiva = {
            partenza: partenza,
            destinazione: destinazione,
            score: 20, // Punteggio 
            dataInizio: new Date()
        };

        // Risponde al client come richiesto
        res.json({
            partenza: partenza,
            destinazione: destinazione,
            connections: connessioni
        });

    } catch (err) {
        // Applichiamo la teoria: tracciamo l'errore effettivo sul server e lo passiamo a Express
        console.error("Errore critico durante l'avvio della partita:", err);
        res.status(500).json({ error: "Errore interno del server durante lo start del gioco." });
    }
});

// --- POST /api/games/validate ---
//definisco le regole 
const validaStrutturaPercorso=[
    body('percorso')
        .exists().withMessage("Il campo percorso è obbligatorio.")
        .isArray().withMessage("Il percorso deve essere un array non vuoto.")
];
// Riceve il percorso del giocatore, lo valida, calcola i punti con gli imprevisti e salva nel DB

app.post('/api/games/validate', isLoggedIn, validaStrutturaPercorso, async (req, res, next) => {
    //controllo errori express-validator 
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Se ci sono errori strutturali (manca il body o non è un array), fallisce subito
        return res.status(422).json({ errors: errors.array() });
    }

    // 1. GESTIONE DELLO STATO (Reading_1): Verifica presenza sessione di gioco attiva
    if (!req.session.partitaAttiva) {
        return res.status(400).json({ error: "Nessuna partita attiva trovata per questa sessione." });
    }

    const { partenza, destinazione } = req.session.partitaAttiva;
    const percorsoScelto = req.body.percorso;
    const userId = req.user.id;
    const oggi = new Date().toISOString().split('T')[0];

    // Funzione ausiliaria per gestire i fallimenti semantici salvando a 0 monete sul DB (Richiesto dalle specifiche)
    const fallisciPartita = async (motivo) => {
        try {
            await gameDao.createGame(userId, 0, oggi);
            // Pulizia dello stato della sessione per transizione di fase
            delete req.session.partitaAttiva;
            return res.status(200).json({ esito: "invalido", motivo: motivo, punteggio: 0, eventi: [] });
        } catch (err) {
            console.error("Errore critico durante il salvataggio della partita fallita:", err);
            return res.status(500).json({ error: "Errore interno durante il salvataggio dello stato di fallimento." });
        }
    };

    //GESTIONE ARRAY VUOTO / TEMPO SCADUTO ---
    if (percorsoScelto.length === 0) {
        return await fallisciPartita("Nessuna traccia selezionata, partita invalida.");
    }

    // B. Validazione dei tipi di dato degli elementi interni per evitare eccezioni a runtime (Qualità del codice)
    for (const seg of percorsoScelto) {
        if (!seg || typeof seg !== 'object' || typeof seg.id !== 'number') {
            return res.status(422).json({ error: "Formato dei segmenti non valido o tipi di dato errati." });
        }
    }

    try {
        //controllo sul tempo 
        const oraAttuale = new Date();
        const dataInizio = new Date(req.session.partitaAttiva.dataInizio);
        const secondiTrascorsi = (oraAttuale - dataInizio) / 1000;

        
        if (secondiTrascorsi > 90) {
            return await fallisciPartita("Tempo massimo di 90 secondi esaurito."); 
        }

        // Recuperiamo la topologia della rete dal DB per effettuare i controlli di integrità semantica
        const network = await gameDao.getCompleteNetwork();
        const connessioniMappa = network.connections;
        const stazioniMappa = network.stations;

        const percorsoReale = [];
        for (const segClient of percorsoScelto) {
            const segmentoDalDB = connessioniMappa.find(c => c.id === segClient.id);
            if (!segmentoDalDB) {
                return await fallisciPartita(`Il segmento con ID ${segClient.id} non esiste nella rete ufficiale.`);
            }
            percorsoReale.push(segmentoDalDB);
        }

        // --- CONTROLLO 1: Corrispondenza dei nodi di Partenza e Arrivo ---
        const primoSegmento = percorsoReale[0];
        if (primoSegmento.station_a_id !== partenza.id && primoSegmento.station_b_id !== partenza.id) {
            return await fallisciPartita("Il percorso non inizia dalla stazione di partenza assegnata.");
        }

        const ultimoSegmento = percorsoReale[percorsoReale.length - 1];
        if (ultimoSegmento.station_a_id !== destinazione.id && ultimoSegmento.station_b_id !== destinazione.id) {
            return await fallisciPartita("Il percorso non termina nella stazione di destinazione assegnata.");
        }

        // --- CONTROLLO 2: Continuità del grafo e unicità dei segmenti ---
        const segmentiVisti = new Set();
        let stazioneCorrenteId = partenza.id;

        for (let i = 0; i < percorsoReale.length; i++) {
            const segReale = percorsoReale[i];

            // Vincolo: ciascun segmento può essere selezionato una sola volta (No duplicati)
            if (segmentiVisti.has(segReale.id)) {
                return await fallisciPartita("Il percorso contiene segmenti duplicati.");
            }
            segmentiVisti.add(segReale.id);

            // Verifica della proprietà di adiacenza dei nodi (Continuità della linea)
            if (segReale.station_a_id === stazioneCorrenteId) {
                stazioneCorrenteId = segReale.station_b_id; 
            } else if (segReale.station_b_id === stazioneCorrenteId) {
                stazioneCorrenteId = segReale.station_a_id; 
            } else {
                return await fallisciPartita("Il percorso è interrotto (manca continuità tra segmenti consecutivi).");
            }

            // --- CONTROLLO 3: Restrizioni sui cambi di linea (Solo nelle stazioni di interscambio) ---
            if (i > 0) {
                
                const segPrecedente = percorsoReale[i - 1];
                
                if (segReale.line_id !== segPrecedente.line_id) {
                    
                    // PRIMA ERA COSÌ: const stazioneContattoId = (segPrecedente.station_a_id === seg.station_a_id ...
                    // ORA È COSÌ (Usa i nodi sicuri per trovare l'intersezione):
                    let stazioneContattoId;
                    if (segPrecedente.station_a_id === segReale.station_a_id || segPrecedente.station_a_id === segReale.station_b_id) {
                        stazioneContattoId = segPrecedente.station_a_id;
                    } else {
                        stazioneContattoId = segPrecedente.station_b_id;
                    }
                    
                    const connessioniDiQuestaStazione = connessioniMappa.filter(c => 
                        c.station_a_id === stazioneContattoId || c.station_b_id === stazioneContattoId
                    );
                    const lineeUniche = new Set(connessioniDiQuestaStazione.map(c => c.line_id));

                    if (lineeUniche.size < 2) {
                        const stazioneContatto = stazioniMappa.find(s => s.id === stazioneContattoId);
                        return await fallisciPartita(`Cambio di linea illegale: la stazione ${stazioneContatto ? stazioneContatto.name : 'Sconosciuta'} non è un nodo di interscambio.`);
                    }
                }
            }
        }

        // --- ELABORAZIONE LOGICA DEL PUNTEGGIO FINALE (BUSINESS LOGIC) ---
        let monete = 20; 
        const elencoEventiEstratti = [];
        const tuttiGliEventi = await gameDao.getEvents();

        // Generazione stocastica degli imprevisti/bonus per ogni tratta percorsa
        for (let i = 0; i < percorsoReale.length; i++) {
            const eventoCasuale = tuttiGliEventi[Math.floor(Math.random() * tuttiGliEventi.length)];
            monete += eventoCasuale.effect;
            
            elencoEventiEstratti.push({
                segmento_index: i,
                description: eventoCasuale.description,
                modifier: eventoCasuale.effect
            });
        }

        // Vincolo: se il computo delle monete è negativo, il risultato memorizzato viene normalizzato a zero
        if (monete < 0) {
            monete = 0;
        }

        // Persistenza dello stato finale sul Database relazionale
        await gameDao.createGame(userId, monete, oggi);

        // Rimozione dello stato transitorio dalla sessione per prevenire replay-attack sulla validazione
        delete req.session.partitaAttiva;

        return res.status(200).json({
            esito: "valido",
            punteggio: monete,
            eventi: elencoEventiEstratti
        });

    } catch (err) {
        // EXPRESS ASYNC ERROR HANDLING (Blocco_02): Trasmissione dell'eccezione al middleware di log centralizzato
        console.error("Eccezione intercettata durante la validazione:", err);
        return next(err);
    }
});

// 5. AVVIO DEL SERVER
app.listen(port, () => {
    console.log(`Server Express avviato su http://localhost:${port}`);
});