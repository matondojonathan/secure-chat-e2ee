const express = require("express");

const {
  saveKeys,
  getKeys,
} = require("../controllers/key.controller");

const authenticate = require("../middleware/auth.middleware");

const router = express.Router();

router.post(
  "/",
  authenticate,
  saveKeys
);

router.get(
  "/:userId",
  authenticate,
  getKeys
);

module.exports = router;