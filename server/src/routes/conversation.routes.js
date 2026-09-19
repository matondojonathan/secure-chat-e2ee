const express = require("express");

const {
  createConversation,
} = require("../controllers/conversation.controller");

const authenticate =
  require("../middleware/auth.middleware");

const router = express.Router();

router.post(
  "/",
  authenticate,
  createConversation
);

module.exports = router;