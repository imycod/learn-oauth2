"use strict";

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const BasicStrategy = require("passport-http").BasicStrategy;
const ClientPasswordStrategy =
  require("passport-oauth2-client-password").Strategy;
const BearerStrategy = require("passport-http-bearer").Strategy;
const jwt = require("jsonwebtoken");
const UserModel = require("../model/user");
const ClientModel = require("../model/client");
const { redis } = require("../redis");
const config = require("../config");

/**
 * LocalStrategy
 *
 * This strategy is used to authenticate users based on a username and password.
 * Anytime a request is made to authorize an application, we must ensure that
 * a user is logged in before asking them to approve the request.
 */
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await UserModel.findOne({
        username: username,
      });
      if (!user) return done(null, false);
      if (user.password !== password) return done(null, false);
      return done(null, user);
    } catch (error) {
      done(error);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user._id)
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await UserModel.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

/**
 * BasicStrategy & ClientPasswordStrategy
 *
 * These strategies are used to authenticate registered OAuth clients. They are
 * employed to protect the `token` endpoint, which consumers use to obtain
 * access tokens. The OAuth 2.0 specification suggests that clients use the
 * HTTP Basic scheme to authenticate. Use of the client password strategy
 * allows clients to send the same credentials in the request body (as opposed
 * to the `Authorization` header). While this approach is not recommended by
 * the specification, in practice it is quite common.
 */
async function verifyClient(clientId, clientSecret, done) {
  console.log('verifyClient: clientId----',clientId,clientSecret)
  try {
    const client = await ClientModel.findById(clientId);
    if (!client) return done(null, false);
    if (client.secret !== clientSecret) return done(null, false);
    return done(null, client);
  } catch (error) {
    return done(error);
  }
}

passport.use(new BasicStrategy(verifyClient));

passport.use(new ClientPasswordStrategy(verifyClient));

/**
 * BearerStrategy
 *
 * This strategy is used to authenticate either users or clients based on an access token
 * (aka a bearer token). If a user, they must have previously authorized a client
 * application, which is issued an access token to make requests on behalf of
 * the authorizing user.
 */
passport.use(
  new BearerStrategy(async (accessToken, done) => {
    redis.get(accessToken, async (error, data) => {
      const token = JSON.parse(data)
      if (error) return done(error);
      if (!token) return done(null, false);
      token = jwt.verify(token, config.accessTokenSecret);
      if (token.userId) {
        try {
          const user = await UserModel.findById(token.userId);
          if (!user) return done(null, false);
          done(null, user, { scope: "*" });
        } catch (error) {
          return done(error);
        }
      } else {
        try {
          const client = await ClientModel.findById(token.clientId);
          if (!client) return done(null, false);
          done(null, client, { scope: "*" });
        } catch (error) {
          return done(error);
        }
      }
    });
  })
);
