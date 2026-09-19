const pool = require("../config/database");

async function healthCheck(req, res, next) {
  try {
    const result = await pool.query("SELECT NOW() AS now");

    res.json({
      status: "ok",
      database: "connected",
      timestamp: result.rows[0].now,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  healthCheck,
};