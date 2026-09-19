const WebSocket =
  require("ws");

const jwt =
  require("jsonwebtoken");

const { z } =
  require("zod");

const config =
  require("../config/env");


const {
  isUserMemberOfConversation,
  getConversationMembers,
} =
  require("../services/conversation.service");


const {
  saveEncryptedMessage,
} =
  require("../services/message.service");


const clients =
  new Map();


const MAX_MESSAGE_SIZE =
  256 * 1024;


const e2eeMessageSchema =
  z.object({
    type:
      z.literal("message"),

    conversationId:
      z.string().uuid(),

    senderId:
      z.string().uuid(),

    sequenceNumber:
      z.number()
        .int()
        .nonnegative(),

    nonce:
      z.string()
        .min(1)
        .max(100),

    ciphertext:
      z.string()
        .min(1)
        .max(250000),

    signature:
      z.string()
        .min(1)
        .max(1000),
  });


function createWebSocketServer(
  server
) {
  const wss =
    new WebSocket.Server({
      server,

      path:
        "/ws",

      maxPayload:
        MAX_MESSAGE_SIZE,
    });


  wss.on(
    "connection",
    (socket, request) => {

      const url =
        new URL(
          request.url,
          `http://${request.headers.host}`
        );


      const token =
        url.searchParams.get(
          "token"
        );


      if (!token) {
        socket.close(
          1008,
          "Authentication required"
        );

        return;
      }


      let payload;


      try {
        payload =
          jwt.verify(
            token,
            config.jwtSecret
          );
      } catch {
        socket.close(
          1008,
          "Invalid or expired token"
        );

        return;
      }


      socket.user = {
        id:
          payload.sub,

        username:
          payload.username,
      };


      /*
       * Un seul socket actif par utilisateur.
       */
      const existingSocket =
        clients.get(
          socket.user.id
        );


      if (
        existingSocket &&
        existingSocket !== socket
      ) {
        try {
          existingSocket.close(
            1000,
            "New connection opened"
          );
        } catch {
          // Rien à faire.
        }
      }


      clients.set(
        socket.user.id,
        socket
      );


      console.log(
        `WebSocket authenticated: ${socket.user.username}`
      );


      socket.send(
        JSON.stringify({
          type:
            "connection",

          message:
            "WebSocket connection authenticated",

          user:
            socket.user,
        })
      );


      socket.on(
        "message",
        async (data) => {

          if (
            data.length >
            MAX_MESSAGE_SIZE
          ) {
            socket.send(
              JSON.stringify({
                type:
                  "error",

                message:
                  "Message trop volumineux",
              })
            );

            return;
          }


          let message;


          try {
            message =
              JSON.parse(
                data.toString()
              );
          } catch {
            socket.send(
              JSON.stringify({
                type:
                  "error",

                message:
                  "Invalid JSON",
              })
            );

            return;
          }


          const validation =
            e2eeMessageSchema.safeParse(
              message
            );


          if (
            !validation.success
          ) {
            socket.send(
              JSON.stringify({
                type:
                  "error",

                message:
                  "Invalid E2EE message format",
              })
            );

            return;
          }


          const e2eeMessage =
            validation.data;


          if (
            e2eeMessage.senderId !==
            socket.user.id
          ) {
            socket.send(
              JSON.stringify({
                type:
                  "error",

                message:
                  "Sender identity mismatch",
              })
            );

            return;
          }


          try {

            const isMember =
              await isUserMemberOfConversation(
                e2eeMessage.conversationId,
                socket.user.id
              );


            if (!isMember) {
              socket.send(
                JSON.stringify({
                  type:
                    "error",

                  message:
                    "User is not a member of this conversation",
                })
              );

              return;
            }


            const savedMessage =
              await saveEncryptedMessage({
                conversationId:
                  e2eeMessage.conversationId,

                senderId:
                  socket.user.id,

                ciphertext:
                  e2eeMessage.ciphertext,

                nonce:
                  e2eeMessage.nonce,

                signature:
                  e2eeMessage.signature,

                sequenceNumber:
                  e2eeMessage.sequenceNumber,
              });


            console.log(
              `Encrypted message persisted: ${savedMessage.id}`
            );


            const members =
              await getConversationMembers(
                e2eeMessage.conversationId
              );


            for (
              const memberId
              of members
            ) {

              if (
                memberId ===
                socket.user.id
              ) {
                continue;
              }


              const recipientSocket =
                clients.get(
                  memberId
                );


              if (
                recipientSocket &&
                recipientSocket.readyState ===
                  WebSocket.OPEN
              ) {
                recipientSocket.send(
                  JSON.stringify(
                    e2eeMessage
                  )
                );


                console.log(
                  `E2EE message relayed to user ${memberId}`
                );
              }
            }

          } catch (error) {

            console.error(
              "WebSocket message processing error:",
              error
            );


            socket.send(
              JSON.stringify({
                type:
                  "error",

                message:
                  "Internal server error",
              })
            );
          }
        }
      );


      socket.on(
        "close",
        () => {

          if (
            clients.get(
              socket.user.id
            ) === socket
          ) {
            clients.delete(
              socket.user.id
            );
          }


          console.log(
            `WebSocket disconnected: ${socket.user.username}`
          );
        }
      );
    }
  );


  return wss;
}


module.exports = {
  createWebSocketServer,
};