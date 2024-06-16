const Router = require("express").Router;

const user = require('../controller/user')

const router = new Router();

router.get("/", user.getUsers);
router.post("/create", user.createUser);
router.get("/:id", user.findUserById);
router.delete("/:id", user.deleteUserById);

module.exports = router;
