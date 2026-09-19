const jwt = require("jsonwebtoken");

const config = require("../config/env");

function authenticate(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      status: "error",
      message: "Authentication required",
    });
  }

  const token = authorization.substring(7);

  try {
    const payload = jwt.verify(token, config.jwtSecret);

    req.user = payload;

    next();
  } catch (error) {
    return res.status(401).json({
      status: "error",
      message: "Invalid or expired token",
    });
  }
}

module.exports = authenticate;