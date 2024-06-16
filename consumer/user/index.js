const Router = require("express").Router;
const passport = require("passport");

const router = new Router();

router.get(
  "/info",
  passport.authenticate("berry", { scope: ["email"] }),
  (req, res) => {
    res.send("11");
  }
);

module.exports = router;
