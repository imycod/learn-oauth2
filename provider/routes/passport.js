const passport = require("passport");

const user = {
  profile: [
    passport.authenticate("bearer", { session: false }),
    (request, response) => {
      // request.authInfo is set using the `info` argument supplied by
      // `BearerStrategy`. It is typically used to indicate scope of the token,
      // and used in access control checks. For illustrative purposes, this
      // example simply returns the scope in the response.
      response.json({
        user_id: request.user.id,
        name: request.user.name,
        scope: request.authInfo.scope,
      });
    },
  ],
};

const client = {
  profile: [
    passport.authenticate("bearer", { session: false }),
    (request, response) => {
      // request.authInfo is set using the `info` argument supplied by
      // `BearerStrategy`. It is typically used to indicate scope of the token,
      // and used in access control checks. For illustrative purposes, this
      // example simply returns the scope in the response.
      response.json({
        client_id: request.user.id,
        name: request.user.name,
        scope: request.authInfo.scope,
      });
    },
  ],
};

module.exports = {
  user,
  client,
};
