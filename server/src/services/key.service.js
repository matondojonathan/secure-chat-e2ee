const pool = require("../config/database");

async function savePublicKeys(
  userId,
  ecdhPublicKey,
  signingPublicKey
) {
  const result = await pool.query(
    `UPDATE users
     SET
       ecdh_public_key = $1,
       signing_public_key = $2
     WHERE id = $3
     RETURNING
       id,
       username,
       email,
       ecdh_public_key,
       signing_public_key`,
    [
      ecdhPublicKey,
      signingPublicKey,
      userId,
    ]
  );

  if (result.rows.length === 0) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  return result.rows[0];
}

async function getPublicKeys(userId) {
  const result = await pool.query(
    `SELECT
       id,
       username,
       ecdh_public_key,
       signing_public_key
     FROM users
     WHERE id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  return result.rows[0];
}

module.exports = {
  savePublicKeys,
  getPublicKeys,
};