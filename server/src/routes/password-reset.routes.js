const express =
  require("express");

const {
  requestReset,
  resetPassword,
} =
  require("../controllers/password-reset.controller");

const router =
  express.Router();

router.post(
  "/request",
  requestReset
);

router.post(
  "/reset",
  resetPassword
);

module.exports =
  router;