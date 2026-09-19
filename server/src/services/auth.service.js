const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const pool = require("../config/database");
const config = require("../config/env");

async function registerUser({ username, email, password }) {
  const existingUser = await pool.query(
    "SELECT id FROM users WHERE username = $1 OR email = $2",
    [username, email]
  );

  if (existingUser.rows.length > 0) {
    const error = new Error("Username or email already exists");
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const result = await pool.query(
    `INSERT INTO users (username, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, username, email, created_at`,
    [username, email, passwordHash]
  );

  const user = result.rows[0];

  const token = jwt.sign(
    {
      sub: user.id,
      username: user.username,
    },
    config.jwtSecret,
    { expiresIn: "1h" }
  );

  return {
    user,
    token,
  };
}

async function loginUser({ email, password }) {
  const result = await pool.query(
    `SELECT id, username, email, password_hash, created_at
     FROM users
     WHERE email = $1`,
    [email]
  );

  if (result.rows.length === 0) {
    const error = new Error("Invalid email or password");
    error.status = 401;
    throw error;
  }

  const user = result.rows[0];

  const passwordValid = await bcrypt.compare(
    password,
    user.password_hash
  );

  if (!passwordValid) {
    const error = new Error("Invalid email or password");
    error.status = 401;
    throw error;
  }

  const token = jwt.sign(
    {
      sub: user.id,
      username: user.username,
    },
    config.jwtSecret,
    { expiresIn: "1h" }
  );

  delete user.password_hash;

  return {
    user,
    token,
  };
}

module.exports = {
  registerUser,
  loginUser,
};