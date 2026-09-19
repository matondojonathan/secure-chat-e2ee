const express = require("express");

const {
  getUsers,
} = require("../controllers/user.controller");

const authenticate =
  require("../middleware/auth.middleware");

const router = express.Router();

router.get(
  "/",
  authenticate,
  getUsers
);

module.exports = router;