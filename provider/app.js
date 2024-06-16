const express = require("express");
const session = require("express-session");
const passport = require("passport");
const path = require("path");

const client = require("./routes/client");
const user = require("./routes/user");
const profile = require("./routes/profile");

const Auth = require("./routes/passport");
const Oauth2 = require("./routes/oauth2");
const Site = require("./routes/site");

const { redisStore } = require("./redis");

const app = express();
app.use(
  session({
    store: redisStore,
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

require("./auth");
require("./database");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// 设置视图引擎和视图目录
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "html");
// 使用 ejs 模板引擎渲染 HTML 文件
app.engine("html", require("ejs").renderFile);
// 设置静态文件目录
app.use(express.static(path.join(__dirname, "public")));

app.use("/client", client);
app.use("/user", user);
app.use("/profile", profile);

app.get("/login", Site.loginForm);
app.post("/login", Site.login);
app.get("/logout", Site.logout);
app.get("/account", Site.account);

app.get("/oauth/authorize", Oauth2.authorization);
app.post("/oauth/authorize/decision", Oauth2.decision);
app.post("/oauth/token", Oauth2.token);

app.get("/api/userinfo", Auth.user.profile);
app.get("/api/clientinfo", Auth.client.profile);

app.get("/", (req, res) => {
  res.render("index", { title: "Oauth2 Provider" });
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    code: err.statusCode || err.status,
    message: err.message,
  });
  next();
});

app.listen(5000, () => {
  console.log("server is running on port 5000");
});
