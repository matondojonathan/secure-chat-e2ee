const crypto =
  require("crypto");

const bcrypt =
  require("bcryptjs");

const pool =
  require("../config/database");

function hashToken(
  token
) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

async function createResetToken(
  email
) {
  const userResult =
    await pool.query(
      `SELECT id, email
       FROM users
       WHERE email = $1`,
      [email]
    );

  /*
   * Ne pas révéler si l'adresse existe.
   */
  if (
    userResult.rows.length === 0
  ) {
    return null;
  }

  const user =
    userResult.rows[0];

  const token =
    crypto.randomBytes(
      32
    ).toString("hex");

  const tokenHash =
    hashToken(token);

  const expiresAt =
    new Date(
      Date.now() +
        15 * 60 * 1000
    );

  await pool.query(
    `UPDATE password_reset_tokens
     SET used_at = NOW()
     WHERE user_id = $1
       AND used_at IS NULL`,
    [user.id]
  );

  await pool.query(
    `INSERT INTO password_reset_tokens
     (
       user_id,
       token_hash,
       expires_at
     )
     VALUES
     ($1, $2, $3)`,
    [
      user.id,
      tokenHash,
      expiresAt,
    ]
  );

  /*
   * Pour le TP local uniquement :
   * on retourne le token afin de permettre
   * le test sans serveur SMTP.
   *
   * En production, ce token serait envoyé
   * uniquement par e-mail.
   */
  return {
    token,
    expiresAt,
  };
}

async function resetPassword(
  token,
  newPassword
) {
  const tokenHash =
    hashToken(token);

  const client =
    await pool.connect();

  try {
    await client.query(
      "BEGIN"
    );

    const result =
      await client.query(
        `SELECT
           id,
           user_id
         FROM password_reset_tokens
         WHERE token_hash = $1
           AND used_at IS NULL
           AND expires_at > NOW()
         FOR UPDATE`,
        [tokenHash]
      );

    if (
      result.rows.length === 0
    ) {
      const error =
        new Error(
          "Token de réinitialisation invalide ou expiré"
        );

      error.status = 400;

      throw error;
    }

    const reset =
      result.rows[0];

    const passwordHash =
      await bcrypt.hash(
        newPassword,
        12
      );

    await client.query(
      `UPDATE users
       SET password_hash = $1
       WHERE id = $2`,
      [
        passwordHash,
        reset.user_id,
      ]
    );

    await client.query(
      `UPDATE password_reset_tokens
       SET used_at = NOW()
       WHERE id = $1`,
      [reset.id]
    );

    await client.query(
      "COMMIT"
    );
  } catch (error) {
    await client.query(
      "ROLLBACK"
    );

    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  createResetToken,
  resetPassword,
};