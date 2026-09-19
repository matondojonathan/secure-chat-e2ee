const pool = require("../config/database");

async function isUserMemberOfConversation(
  conversationId,
  userId
) {
  const result = await pool.query(
    `SELECT 1
     FROM conversation_members
     WHERE conversation_id = $1
       AND user_id = $2
     LIMIT 1`,
    [
      conversationId,
      userId,
    ]
  );

  return result.rows.length > 0;
}

async function getConversationMembers(
  conversationId
) {
  const result = await pool.query(
    `SELECT user_id
     FROM conversation_members
     WHERE conversation_id = $1`,
    [conversationId]
  );

  return result.rows.map(
    (row) => row.user_id
  );
}

async function getOrCreateDirectConversation(
  userId,
  recipientId
) {
  if (userId === recipientId) {
    const error = new Error(
      "Impossible de créer une conversation avec soi-même"
    );

    error.status = 400;

    throw error;
  }

  const client =
    await pool.connect();

  try {
    await client.query(
      "BEGIN"
    );

    /*
     * Recherche d'une conversation directe
     * contenant exactement les deux utilisateurs.
     */
    const existing =
      await client.query(
        `SELECT c.id
         FROM conversations c
         INNER JOIN conversation_members cm
           ON cm.conversation_id = c.id
         WHERE cm.user_id = ANY($1::uuid[])
         GROUP BY c.id
         HAVING COUNT(*) = 2
            AND COUNT(
              CASE
                WHEN cm.user_id = $2::uuid
                THEN 1
              END
            ) = 1
            AND COUNT(
              CASE
                WHEN cm.user_id = $3::uuid
                THEN 1
              END
            ) = 1
         LIMIT 1`,
        [
          [userId, recipientId],
          userId,
          recipientId,
        ]
      );

    if (existing.rows.length > 0) {
      await client.query(
        "COMMIT"
      );

      return {
        id: existing.rows[0].id,
        created: false,
      };
    }

    /*
     * Vérification que le destinataire existe.
     */
    const recipient =
      await client.query(
        `SELECT
           id,
           username,
           email
         FROM users
         WHERE id = $1`,
        [recipientId]
      );

    if (recipient.rows.length === 0) {
      const error = new Error(
        "Destinataire introuvable"
      );

      error.status = 404;

      throw error;
    }

    /*
     * Création de la conversation.
     */
    const conversation =
      await client.query(
        `INSERT INTO conversations DEFAULT VALUES
         RETURNING id, created_at`
      );

    const conversationId =
      conversation.rows[0].id;

    /*
     * Ajout des deux membres.
     */
    await client.query(
      `INSERT INTO conversation_members
       (
         conversation_id,
         user_id
       )
       VALUES
       ($1, $2),
       ($1, $3)`,
      [
        conversationId,
        userId,
        recipientId,
      ]
    );

    await client.query(
      "COMMIT"
    );

    return {
      id: conversationId,
      created: true,
    };
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
  isUserMemberOfConversation,
  getConversationMembers,
  getOrCreateDirectConversation,
};