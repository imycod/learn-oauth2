const express = require("express");
const passport = require("passport");

const user = require("./user");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

require("./strategy");

app.use("/user", user);

app.get(
  "/callback",
  passport.authenticate("berry", { session: false }),
  (req, res) => {
    res.send("pass");
  }
);

app.listen(5001, () => {
  console.log("server is running on port 5001");
});
