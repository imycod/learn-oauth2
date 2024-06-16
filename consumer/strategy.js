const passport = require("passport");
const OAuth2Strategy = require("passport-oauth").OAuth2Strategy;

const berryStrategy = new OAuth2Strategy(
  {
    authorizationURL: "http://localhost:5000/oauth/authorize",
    tokenURL: "http://localhost:5000/oauth/token",
    clientID: "666d983b7241c9b6b6524785",
    clientSecret: "xxxxberry",
    callbackURL: "/callback",
  },
  (accessToken, refreshToken, profile, done) => {
    console.log(
      "accessToken, refreshToken, profile",
      accessToken,
      refreshToken,
      profile
    );
    done(null, profile);
  }
);

berryStrategy.name = "berry";

passport.use(berryStrategy);
