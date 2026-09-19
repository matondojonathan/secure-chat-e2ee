const { z } = require("zod");

const conversationService =
  require("../services/conversation.service");

const createConversationSchema =
  z.object({
    recipientId:
      z.string().uuid(),
  });

async function createConversation(
  req,
  res,
  next
) {
  try {
    const data =
      createConversationSchema.parse(
        req.body
      );

    const conversation =
      await conversationService
        .getOrCreateDirectConversation(
          req.user.sub,
          data.recipientId
        );

    res.status(
      conversation.created
        ? 201
        : 200
    ).json({
      status: "ok",
      conversation,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createConversation,
};