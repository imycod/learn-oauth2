"use strict";

const oauth2orize = require("@poziworld/oauth2orize");
const passport = require("passport");
const login = require("connect-ensure-login");
const jwt = require("jsonwebtoken");
const ClientModel = require("../model/client");
const UserModel = require("../model/user");
const { redis } = require("../redis");
const config = require("../config");
const utils = require("../utils");

// Create OAuth 2.0 server
const server = oauth2orize.createServer();

// Register serialization and deserialization functions.
//
// When a client redirects a user to user authorization endpoint, an
// authorization transaction is initiated. To complete the transaction, the
// user must authenticate and approve the authorization request. Because this
// may involve multiple HTTP request/response exchanges, the transaction is
// stored in the session.
//
// An application must supply serialization functions, which determine how the
// client object is serialized into the session. Typically this will be a
// simple matter of serializing the client's ID, and deserializing by finding
// the client by ID from the database.

server.serializeClient((client, done) => done(null, client.id));

server.deserializeClient(async (id, done) => {
  console.log("deserializeClient id", id);
  try {
    const client = await ClientModel.findById(id);
    return done(null, client);
  } catch (error) {
    return done(error);
  }
});

async function issueTokens(userId, clientId, done) {
  console.log("issueTokens----", userId, clientId);
  try {
    const user = await UserModel.findById(userId);
    if (user) {
      jwt.sign(
        {
          userId: userId,
          clientId: clientId,
        },
        config.accessTokenSecret,
        { expiresIn: config.accessTokenExpire },
        async (error, accessToken) => {
          if (error) return done(error);
          await redis.set(
            accessToken,
            JSON.stringify({
              userId,
              clientId,
            }),
            "EX",
            config.accessTokenExpire
          );
          await redis.set(
            `tag:accessToken:${userId}:${clientId}`,
            accessToken,
            "EX",
            config.accessTokenExpire
          );

          jwt.sign(
            {
              userId: userId,
              clientId: clientId,
            },
            config.refreshTokenSecret,
            { expiresIn: config.refreshTokenExpire },
            async (error, refreshToken) => {
              if (error) return done(error);
              await redis.set(
                refreshToken,
                JSON.stringify({
                  userId,
                  clientId,
                }),
                "EX",
                config.refreshTokenExpire
              );
              await redis.set(
                `tag:refreshToken:${userId}:${clientId}`,
                refreshToken,
                "EX",
                config.refreshTokenExpire
              );

              console.log("accessToken----", accessToken);
              console.log("refreshToken----", refreshToken);
              // Add custom params, e.g. the username
              const params = { username: user.username };
              console.log("params----", params);
              return done(null, accessToken, refreshToken, params);
            }
          );
        }
      );
    }
  } catch (error) {}
}

// Register supported grant types.
//
// OAuth 2.0 specifies a framework that allows users to grant client
// applications limited access to their protected resources. It does this
// through a process of the user granting access, and the client exchanging
// the grant for an access token.

// Grant authorization codes. The callback takes the `client` requesting
// authorization, the `redirectUri` (which is used as a verifier in the
// subsequent exchange), the authenticated `user` granting access, and
// their response, which contains approved scope, duration, etc. as parsed by
// the application. The application issues a code, which is bound to these
// values, and will be exchanged for an access token.

server.grant(
  oauth2orize.grant.code((client, redirectUri, user, ares, done) => {
    console.log(
      "grant.code : client, redirectUri, user---",
      client,
      redirectUri,
      user,
      ares
    );
    const code = utils.getUid(16);
    redis.set(
      code,
      JSON.stringify({
        clientId: client.id,
        redirectUri: redirectUri,
        userId: user.id,
        userName: user.username,
      }),
      "EX",
      60 * 60 * 1,
      (error, result) => {
        console.log("error, code----", error, code);
        if (error) return done(error);
        console.log(done);
        return done(null, code);
      }
    );
  })
);

// Grant implicit authorization. The callback takes the `client` requesting
// authorization, the authenticated `user` granting access, and
// their response, which contains approved scope, duration, etc. as parsed by
// the application. The application issues a token, which is bound to these
// values.

server.grant(
  oauth2orize.grant.token((client, user, ares, done) => {
    issueTokens(user.id, client.clientId, done);
  })
);

// Exchange authorization codes for access tokens. The callback accepts the
// `client`, which is exchanging `code` and any `redirectUri` from the
// authorization request for verification. If these values are validated, the
// application issues an access token on behalf of the user who authorized the
// code. The issued access token response can include a refresh token and
// custom parameters by adding these to the `done()` call

server.exchange(
  oauth2orize.exchange.code((client, code, redirectUri, done) => {
    console.log(
      "exchange.code : client, code, redirectUri----",
      client,
      code,
      redirectUri
    );
    redis.get(code, (error, data) => {
      if (error) return done(error);
      const obj = JSON.parse(data);
      if (client.id !== obj.clientId) return done(null, false);
      if (redirectUri !== obj.redirectUri) return done(null, false);
      issueTokens(obj.userId, obj.clientId, done);
    });
  })
);

// Exchange user id and password for access tokens. The callback accepts the
// `client`, which is exchanging the user's name and password from the
// authorization request for verification. If these values are validated, the
// application issues an access token on behalf of the user who authorized the code.

server.exchange(
  oauth2orize.exchange.password(
    async (client, username, password, scope, done) => {
      try {
        const localClient = await ClientModel.findById(client.clientId);
        if (!localClient) return done(null, false);
        if (localClient.secret !== client.clientSecret) {
          return done(null, false);
        }
        const user = await UserModel.findOne({
          username,
        });
        if (!user) return done(null, false);
        if (password !== user.password) return done(null, false);
        // Everything validated, return the token
        issueTokens(user._id, client.clientId, done);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Exchange the client id and password/secret for an access token. The callback accepts the
// `client`, which is exchanging the client's id and password/secret from the
// authorization request for verification. If these values are validated, the
// application issues an access token on behalf of the client who authorized the code.

server.exchange(
  oauth2orize.exchange.clientCredentials(async (client, scope, done) => {
    try {
      const localClient = await ClientModel.findById(client.clientId);
      if (!localClient) return done(null, false);
      if (localClient.secret !== client.clientSecret) {
        return done(null, false);
      }
      // Everything validated, return the token
      // Pass in a null for user id since there is no user with this grant type
      issueTokens(null, client.clientId, done);
    } catch (error) {
      return done(error);
    }
  })
);

// issue new tokens and remove the old ones
server.exchange(
  oauth2orize.exchange.refreshToken((client, refreshToken, scope, done) => {
    redis.get(refreshToken, (error, data) => {
      const token = JSON.parse(data);
      if (error) return done(error);
      issueTokens(
        token.userId,
        client.id,
        async (err, accessToken, refreshToken) => {
          if (err) {
            done(err, null, null);
          }
          try {
            redis.get(
              `tag:accessToken:${token.userId}:${token.clientId}`,
              async (error, token) => {
                await redis.del(token);
              }
            );
            redis.get(
              `tag:refreshToken:${token.userId}:${token.clientId}`,
              async (error, token) => {
                await redis.del(token);
              }
            );
            await redis.del(`tag:accessToken:${token.userId}:${client.id}`);
            await redis.del(`tag:refreshToken:${token.userId}:${client.id}`);
            done(null, accessToken, refreshToken);
          } catch (error) {
            done(error, null, null);
          }
        }
      );
    });
  })
);

// User authorization endpoint.
//
// `authorization` middleware accepts a `validate` callback which is
// responsible for validating the client making the authorization request. In
// doing so, is recommended that the `redirectUri` be checked against a
// registered value, although security requirements may vary across
// implementations. Once validated, the `done` callback must be invoked with
// a `client` instance, as well as the `redirectUri` to which the user will be
// redirected after an authorization decision is obtained.
//
// This middleware simply initializes a new authorization transaction. It is
// the application's responsibility to authenticate the user and render a dialog
// to obtain their approval (displaying details about the client requesting
// authorization). We accomplish that here by routing through `ensureLoggedIn()`
// first, and rendering the `dialog` view.

module.exports.authorization = [
  login.ensureLoggedIn(),
  server.authorization(
    async (clientId, redirectUri, done) => {
      try {
        const client = await ClientModel.findById(clientId);
        // WARNING: For security purposes, it is highly advisable to check that
        //          redirectUri provided by the client matches one registered with
        //          the server. For simplicity, this example does not. You have
        //          been warned.
        return done(null, client, redirectUri);
      } catch (error) {
        return done(error);
      }
    },
    (client, user, done) => {
      // Check if grant request qualifies for immediate approval

      // Auto-approve
      if (client.isTrusted) return done(null, true);

      redis.get(`${user.id}:${client.clientId}:accessToken`, (error, token) => {
        // Auto-approve
        if (token) return done(null, true);

        // Otherwise ask user
        return done(null, false);
      });
    }
  ),
  (request, response) => {
    console.log("authorization----", request.oauth2);
    console.log("authorization----", request.user);
    response.render("dialog", {
      transactionId: request.oauth2.transactionID,
      user: request.user,
      client: request.oauth2.client,
    });
  },
];

// User decision endpoint.
//
// `decision` middleware processes a user's decision to allow or deny access
// requested by a client application. Based on the grant type requested by the
// client, the above grant middleware configured above will be invoked to send
// a response.

module.exports.decision = [login.ensureLoggedIn(), server.decision()];

// Token endpoint.
//
// `token` middleware handles client requests to exchange authorization grants
// for access tokens. Based on the grant type being exchanged, the above
// exchange middleware will be invoked to handle the request. Clients must
// authenticate when making requests to this endpoint.

module.exports.token = [
  passport.authenticate(["basic", "oauth2-client-password"], {
    session: false,
  }),
  server.token(),
  server.errorHandler(),
];
