const Router = require("express").Router;

const client = require("../controller/client");

const router = Router();

router.get("/", client.getClients);
router.post("/create", client.createClient);
router.put("/:id", client.updateClientById);
router.get("/:id", client.findClientById);
router.delete("/:id", client.deleteClientById);

module.exports = router;
