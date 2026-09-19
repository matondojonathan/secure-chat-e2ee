const pool = require("../config/database");

async function getUsers(currentUserId) {
  const result = await pool.query(
    `SELECT
       id,
       username,
       email,
       created_at
     FROM users
     WHERE id <> $1
     ORDER BY username ASC`,
    [currentUserId]
  );

  return result.rows;
}

module.exports = {
  getUsers,
};