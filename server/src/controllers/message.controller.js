const { z } = require("zod");

const messageService =
  require("../services/message.service");

const conversationIdSchema =
  z.object({
    conversationId:
      z.string().uuid(),
  });

async function getMessages(
  req,
  res,
  next
) {
  try {
    const data =
      conversationIdSchema.parse(
        req.params
      );

    const messages =
      await messageService
        .getConversationMessages(
          data.conversationId,
          req.user.sub
        );

    res.json({
      status: "ok",
      messages,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMessages,
};