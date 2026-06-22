'use strict';

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const userDao = require('./user-dao'); 

// conf (Username e Password)
passport.use(new LocalStrategy(
  function(username, password, done) {
    userDao.getUser(username, password)
      .then((user) => {
        if (!user) {
          return done(null, false, { message: 'Incorrect username or password.' });
        }
        return done(null, user);
      })
      .catch((err) => {
        return done(err); 
      });
  }
));

// Serialize
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize
passport.deserializeUser((id, done) => {
  userDao.getUserById(id)
    .then((user) => {
      done(null, user); 
    })
    .catch((err) => {
      done(err, null);
    });
});

const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next(); 
  }
  
  return res.status(401).json({ error: 'You are not logged in.' });
};

module.exports = { isLoggedIn };