require("dotenv").config();

const port =
  Number(process.env.PORT) || 3000;

const database = {
  host:
    process.env.DB_HOST ||
    "localhost",

  port:
    Number(process.env.DB_PORT) ||
    5433,

  name:
    process.env.DB_NAME ||
    "secure_chat",

  user:
    process.env.DB_USER ||
    "postgres",

  password:
    process.env.DB_PASSWORD ||
    "",
};

const jwtSecret =
  process.env.JWT_SECRET || "";

if (
  !jwtSecret ||
  jwtSecret.length < 32
) {
  throw new Error(
    "JWT_SECRET must contain at least 32 characters"
  );
}

const config = {
  port,

  database,

  jwtSecret,
};

module.exports = config;