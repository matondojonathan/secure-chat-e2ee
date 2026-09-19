const express = require("express");

const {
  getMessages,
} = require("../controllers/message.controller");

const authenticate =
  require("../middleware/auth.middleware");

const router = express.Router();

router.get(
  "/:conversationId",
  authenticate,
  getMessages
);

module.exports = router;