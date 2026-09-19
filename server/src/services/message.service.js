const pool = require("../config/database");

async function saveEncryptedMessage({
  conversationId,
  senderId,
  ciphertext,
  nonce,
  signature,
  sequenceNumber,
}) {
  const result = await pool.query(
    `INSERT INTO messages
     (
       conversation_id,
       sender_id,
       ciphertext,
       nonce,
       signature,
       sequence_number
     )
     VALUES
     ($1, $2, $3, $4, $5, $6)
     RETURNING
       id,
       conversation_id,
       sender_id,
       ciphertext,
       nonce,
       signature,
       sequence_number,
       created_at`,
    [
      conversationId,
      senderId,
      ciphertext,
      nonce,
      signature,
      sequenceNumber,
    ]
  );

  return result.rows[0];
}

async function getConversationMessages(
  conversationId,
  userId
) {
  const membership =
    await pool.query(
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

  if (
    membership.rows.length === 0
  ) {
    const error =
      new Error(
        "User is not a member of this conversation"
      );

    error.status = 403;

    throw error;
  }

  const result =
    await pool.query(
      `SELECT
         id,
         conversation_id,
         sender_id,
         ciphertext,
         nonce,
         signature,
         sequence_number,
         created_at
       FROM messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC`,
      [conversationId]
    );

  return result.rows;
}

module.exports = {
  saveEncryptedMessage,
  getConversationMessages,
};