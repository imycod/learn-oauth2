const Router = require("express").Router;

const profile = require("../controller/profile");

const router = new Router();

router.get("/", profile.getProfiles);
router.post("/create", profile.createProfile);
router.delete("/:id", profile.deleteProfileById);
router.put("/client/:id", profile.updateClientToProfileById);
router.put("/:id", profile.updateProfileById);

module.exports = router;
