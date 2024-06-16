'use strict';

const passport = require('passport');
const login = require('connect-ensure-login');

module.exports.index = (request, response) => response.send('OAuth 2.0 Server');

module.exports.loginForm = (request, response) => {
  response.render('login.html', { title: "Oauth2 Provider" })
}

module.exports.login =(req,res,next)=> {
  return passport.authenticate('local', {
    successReturnToOrRedirect: req.session.returnTo || '/',
    failureRedirect: '/login',
  })(req, res, next);
}

module.exports.logout = (request, response) => {
  request.logout();
  response.redirect('/');
};

module.exports.account = [
  login.ensureLoggedIn(),
  (request, response) => response.render('account', { user: request.user }),
];
