'use strict';

const express = require('express');
const morgan = require('morgan'); 
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const { body, validationResult } = require('express-validator');

const userDao = require('./user-dao');
const gameDao = require('./game-dao');
const { isLoggedIn } = require('./auth');
const app = express();
const port = 3001; 


app.use(morgan('dev'));
app.use(express.json()); 

// cors config
const corsOptions = {
    origin: 'http://localhost:5173',
    credentials: true,
};
app.use(cors(corsOptions));

// session config
app.use(session({
    secret: '7x$9P@mK2!wQzA5*bE&rT9_cX4#vB1%nM8(kL3)jH0{gF5}dS2[aQ1]pZ7_fX9',
    resave: false,
    saveUninitialized: false
}));

// passport initialization
app.use(passport.initialize());
app.use(passport.session());



// sintactin validation for login
const validaLogin = [
    body('username')
        .notEmpty().withMessage("Missing username.")
        .trim(),
    body('password')
        .notEmpty().withMessage("Missgin password.")
        .isLength({ min: 5 }).withMessage("password must be longer than 5 .")
];
// POST /api/sessions --login
app.post('/api/sessions', validaLogin, function(req, res, next) {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        
        return res.status(422).json({ errors: errors.array() }); 
    }

    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            return res.status(401).json(info);
        }
        // login session
        req.login(user, (err) => {
            if (err) return next(err);
            

            const userSafe = { 
                id: user.id, 
                username: user.username 
            };
            
            
            return res.json(userSafe);
        });
    })(req, res, next);
});

// active session for user
app.get('/api/sessions/current', (req, res) => {
    if (req.isAuthenticated()) {
        const userSafe = { id: req.user.id, username: req.user.username };
        res.status(200).json(userSafe);
    } else {
        res.status(401).json({ error: 'no active session' });
    }
});

//il logout
app.delete('/api/sessions/current', (req, res) => {
    req.logout(() => {
        res.status(200).json({});
    });
});

//retunr network
app.get('/api/network', isLoggedIn, async (req, res, next) => {
    try {
        const network = await gameDao.getCompleteNetwork();
        res.json(network);
    } catch (err) {
        console.error("Error retrieving the map:", err); 
        res.status(500).json({ error: 'Internal error while retrieving the railway map.' });
    }
});

// ranking (protected)
app.get('/api/ranking', isLoggedIn, async (req, res, next) => {
    try {
        const ranking = await gameDao.getRanking();
        res.json(ranking);
    } catch (err) {
        console.error("Error retreving the ranking:", err);
        res.status(500).json({ error: 'Internal error while retrieving the ranking.' });
    }
});

// BFS algorithm
function calcolaDistanzaMinima(partenzaId, destinazioneId, connections) {
    const grafo = {};
    connections.forEach(c => {
        if (!grafo[c.station_a_id]) grafo[c.station_a_id] = [];
        if (!grafo[c.station_b_id]) grafo[c.station_b_id] = [];
        grafo[c.station_a_id].push(c.station_b_id);
        grafo[c.station_b_id].push(c.station_a_id); 
    });

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
    return -1; 
}

// new game
app.post('/api/games/start', isLoggedIn, async (req, res, next) => { 
    try {
        const network = await gameDao.getCompleteNetwork();
        const stazioni = network.stations;
        const connessioni = network.connections;

        let partenza, destinazione;
        let distanza = 0;
        let tentativi = 0;

        while (distanza < 3 && tentativi < 100) {
            partenza = stazioni[Math.floor(Math.random() * stazioni.length)];
            destinazione = stazioni[Math.floor(Math.random() * stazioni.length)];
            
            if (partenza.id !== destinazione.id) {
                distanza = calcolaDistanzaMinima(partenza.id, destinazione.id, connessioni);
            }
            tentativi++;
        }

        if (distanza < 3) {
            return res.status(500).json({ error: "Impossibible create a valid route." });
        }

        req.session.partitaAttiva = {
            partenza: partenza,
            destinazione: destinazione,
            score: 20, 
            dataInizio: new Date()
        };

        res.json({
            partenza: partenza,
            destinazione: destinazione,
            connections: connessioni
        });

    } catch (err) {
        console.error("Critical error while starting the game:", err);
        res.status(500).json({ error: "Internal server error while starting the game." });
    }
});

// validate 
const validaStrutturaPercorso=[
    body('percorso')
        .exists().withMessage("The route field is required.")
        .isArray().withMessage("The route must be a non-empty array.")
];


app.post('/api/games/validate', isLoggedIn, validaStrutturaPercorso, async (req, res, next) => {
    //express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    if (!req.session.partitaAttiva) {
        return res.status(400).json({ error: "No active game found for this session." });
    }

    const { partenza, destinazione } = req.session.partitaAttiva;
    const percorsoScelto = req.body.percorso;
    const userId = req.user.id;
    const oggi = new Date().toISOString().split('T')[0];

    //0 score per partite invalide
    const fallisciPartita = async (motivo) => {
        try {
            await gameDao.createGame(userId, 0, oggi);
        
            delete req.session.partitaAttiva;
            return res.status(200).json({ esito: "invalido", motivo: motivo, punteggio: 0, eventi: [] });
        } catch (err) {
            console.error("Critical error while saving the failed game:", err);
            return res.status(500).json({ error: "Internal error while saving the failure state." });
        }
    };

    //end time
    if (percorsoScelto.length === 0) {
        return await fallisciPartita("No track selected, invalid game.");
    }

    
    for (const seg of percorsoScelto) {
        if (!seg || typeof seg !== 'object' || typeof seg.id !== 'number') {
            return res.status(422).json({});
        }
    }

    try {
        //time check 
        const oraAttuale = new Date();
        const dataInizio = new Date(req.session.partitaAttiva.dataInizio);
        const secondiTrascorsi = (oraAttuale - dataInizio) / 1000;

        
        if (secondiTrascorsi > 95) {
            return await fallisciPartita("Time's up"); 
        }

        
        const network = await gameDao.getCompleteNetwork();
        const connessioniMappa = network.connections;
        const stazioniMappa = network.stations;

        const percorsoReale = [];
        for (const segClient of percorsoScelto) {
            const segmentoDalDB = connessioniMappa.find(c => c.id === segClient.id);
            if (!segmentoDalDB) {
                return await fallisciPartita(`The segment with ID ${segClient.id} does not exist in the official network.`);
            }
            percorsoReale.push(segmentoDalDB);
        }

        // check start and finish
        const primoSegmento = percorsoReale[0];
        if (primoSegmento.station_a_id !== partenza.id && primoSegmento.station_b_id !== partenza.id) {
            return await fallisciPartita("The route does not start from the assigned starting station.");
        }

        const ultimoSegmento = percorsoReale[percorsoReale.length - 1];
        if (ultimoSegmento.station_a_id !== destinazione.id && ultimoSegmento.station_b_id !== destinazione.id) {
            return await fallisciPartita("The route does not end at the assigned destination station.");
        }

        // graph continuity, Segment uniqueness
        const segmentiVisti = new Set();
        let stazioneCorrenteId = partenza.id;

        for (let i = 0; i < percorsoReale.length; i++) {
            const segReale = percorsoReale[i];

            
            if (segmentiVisti.has(segReale.id)) {
                return await fallisciPartita("The route contains duplicate segments.");
            }
            segmentiVisti.add(segReale.id);

            
            if (segReale.station_a_id === stazioneCorrenteId) {
                stazioneCorrenteId = segReale.station_b_id; 
            } else if (segReale.station_b_id === stazioneCorrenteId) {
                stazioneCorrenteId = segReale.station_a_id; 
            } else {
                return await fallisciPartita("The route is broken.");
            }

            // check scamnio lineee
            if (i > 0) {
                
                const segPrecedente = percorsoReale[i - 1];
                
                if (segReale.line_id !== segPrecedente.line_id) {
                    
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
                        return await fallisciPartita(`Illegal line change: the station ${stazioneContatto ? stazioneContatto.name : 'Unknown'} is not an interchange node.`);
                    }
                }
            }
        }

        // score
        let monete = 20; 
        const elencoEventiEstratti = [];
        const tuttiGliEventi = await gameDao.getEvents();

        // events
        for (let i = 0; i < percorsoReale.length; i++) {
            const eventoCasuale = tuttiGliEventi[Math.floor(Math.random() * tuttiGliEventi.length)];
            monete += eventoCasuale.effect;
            
            elencoEventiEstratti.push({
                segmento_index: i,
                description: eventoCasuale.description,
                modifier: eventoCasuale.effect
            });
        }

        if (monete < 0) {
            monete = 0;
        }

        await gameDao.createGame(userId, monete, oggi);

        delete req.session.partitaAttiva;

        return res.status(200).json({
            esito: "valido",
            punteggio: monete,
            eventi: elencoEventiEstratti
        });

    } catch (err) {
        console.error("Exception caught during validation:", err);
        return next(err);
    }
});

// server
app.listen(port, () => {
    console.log(`Express server started on http://localhost:${port}`);
});