require("dotenv").config();
const express = require("express");
const http = require("http");
const next = require("next");
const session = require("express-session");
const passport = require("passport");
const Auth0Strategy = require("passport-auth0");
const uid = require("uid-safe");
const authRoutes = require("./auth-routes");
const thoughtsAPI = require("./thoughts-api");

const dev = process.env.NODE_ENV !== "production";
const app = next({
  dev,
  dir: "./src",
});
const nextHandle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  // configure session mgmt and add to express server
  const sessionConfig = {
    secret: uid.sync(18), // create a cryptographically safe secret
    cookie: {
      maxAge: 86400 * 1000 // cookies are valid for 24 hours
    },
    resave: false,
    saveUninitialized: true,
  };
  server.use(session(sessionConfig));

  // configure auth0 strategy
  const auth0Strategy = new Auth0Strategy(
    {
      domain: process.env.AUTH0_DOMAIN,
      clientID: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET,
      callbackURL: process.env.AUTH0_CALLBACK_URL
    },
    function(accessToken, refreshToken, extraParams, profile, done) {
      return done(null, profile);
    }
  );
  passport.use(auth0Strategy);

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));

  // add passport and authentication routes to express server
  server.use(passport.initialize());
  server.use(passport.session());
  server.use(authRoutes);

  server.use(thoughtsAPI);

  // restrict access to some routes
  const restrictAccess = (req, res, next) => {
    if (!req.isAuthenticated()) return res.redirect("/login");
    next();
  };
  server.use("/profile", restrictAccess);
  server.use("/share-thought", restrictAccess);

  // Next.js handles all other requests
  server.get("*", nextHandle);

  http.createServer(server).listen(process.env.PORT, () => {
    console.log(`listening on port ${process.env.PORT}`);
  });
})
