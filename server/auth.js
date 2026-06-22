'use strict';

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const userDao = require('./user-dao'); // Importa il DAO dell'utente riscritti con crypto

// 1. Configurazione della Strategia Locale (Username e Password)
passport.use(new LocalStrategy(
  function(username, password, done) {
    userDao.getUser(username, password)
      .then((user) => {
        if (!user) {
          // Credenziali errate (Teoria: ritorniamo false senza lanciare eccezioni di crash)
          return done(null, false, { message: 'Username o password errati.' });
        }
        // Autenticazione riuscita, passiamo l'oggetto utente pulito
        return done(null, user);
      })
      .catch((err) => {
        return done(err); // Errore del database o del sistema crypto
      });
  }
));

// 2. Serializzazione dell'utente nella sessione (salviamo solo l'ID nel cookie)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// 3. Deserializzazione dell'utente (recuperiamo l'utente intero dall'ID salvato nel cookie)
passport.deserializeUser((id, done) => {
  userDao.getUserById(id)
    .then((user) => {
      done(null, user); // Rende l'utente accessibile in ogni rotta tramite req.user
    })
    .catch((err) => {
      done(err, null);
    });
});

// 4. Middleware personalizzato per proteggere le rotte (Teoria: Access Control Middleware)
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next(); // L'utente è loggato, procedi verso la rotta
  }
  // Se non è autenticato, blocca subito la richiesta con errore 401 Unauthorized
  return res.status(401).json({ error: 'Non sei autenticato. Effettua il login per accedere.' });
};

module.exports = { isLoggedIn };