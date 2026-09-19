const { Pool } = require("pg");
const env = require("./env");

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,

      // Supabase PostgreSQL utilise une connexion SSL.
      ssl: {
        rejectUnauthorized: false,
      },

      // Adapté à un environnement serverless comme Vercel.
      max: 5,

      idleTimeoutMillis: 30000,

      connectionTimeoutMillis: 10000,
    }
  : {
      host: env.DB_HOST,
      port: env.DB_PORT,
      database: env.DB_NAME,
      user: env.DB_USER,
      password: env.DB_PASSWORD,

      max: 10,

      idleTimeoutMillis: 30000,

      connectionTimeoutMillis: 10000,
    };

const pool = new Pool(poolConfig);

pool.on("error", (error) => {
  console.error("PostgreSQL pool error:", error);
});

module.exports = pool;