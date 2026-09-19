import {
  E2EEManager,
} from "../crypto/e2ee.js";

import {
  savePublicKeys,
  getPublicKeys,
} from "./keyApi.js";

import {
  getConversationMessages,
} from "./messageApi.js";

import {
  WebSocketClient,
} from "../websocket/websocketClient.js";


export class ChatSession {
  constructor({
    userId,
    token,
  }) {
    this.userId =
      userId;

    this.token =
      token;

    this.e2ee =
      new E2EEManager(
        userId
      );

    this.websocket =
      new WebSocketClient(
        token
      );

    this.onMessage =
      null;

    this.onStatus =
      null;
  }


  setStatus(status) {
    console.log(
      `[ChatSession] ${status}`
    );

    if (this.onStatus) {
      this.onStatus(
        status
      );
    }
  }


  async initialize() {
    this.setStatus(
      "Génération des clés E2EE..."
    );

    const publicKeys =
      await this.e2ee.initialize();

    this.setStatus(
      "Publication des clés publiques..."
    );

    await savePublicKeys(
      this.token,
      publicKeys.ecdhPublicKey,
      publicKeys.signingPublicKey
    );

    this.setStatus(
      "Clés publiques enregistrées"
    );

    this.websocket.onOpen =
      () => {
        this.setStatus(
          "WebSocket connecté"
        );
      };

    this.websocket.onMessage =
      async (message) => {
        await this.handleMessage(
          message
        );
      };

    this.websocket.onClose =
      () => {
        this.setStatus(
          "WebSocket déconnecté"
        );
      };

    this.websocket.onError =
      () => {
        this.setStatus(
          "Erreur WebSocket"
        );
      };
  }


  async prepareRecipient(
    recipientUserId
  ) {
    this.setStatus(
      "Récupération de la clé publique du destinataire..."
    );

    const response =
      await getPublicKeys(
        this.token,
        recipientUserId
      );

    const recipient =
      response.user;

    if (
      !recipient.ecdh_public_key
    ) {
      throw new Error(
        "Le destinataire ne possède pas encore de clé ECDH"
      );
    }

    if (
      !recipient.signing_public_key
    ) {
      throw new Error(
        "Le destinataire ne possède pas encore de clé ECDSA"
      );
    }

    await this.e2ee.createSharedKey(
      recipientUserId,
      recipient.ecdh_public_key
    );

    this.setStatus(
      "Clé partagée ECDH établie"
    );

    return recipient;
  }


  async sendMessage({
    recipientUserId,
    conversationId,
    plaintext,
  }) {
    const message =
      await this.e2ee.encryptMessage(
        recipientUserId,
        conversationId,
        plaintext
      );

    this.setStatus(
      "Message chiffré et signé"
    );

    this.websocket.send(
      message
    );

    this.setStatus(
      "Message E2EE envoyé"
    );

    return message;
  }


  async loadHistory(
    conversationId,
    recipientUserId
  ) {
    this.setStatus(
      "Chargement de l'historique..."
    );

    const response =
      await getConversationMessages(
        this.token,
        conversationId
      );

    const messages =
      response.messages || [];

    const decryptedMessages =
      [];

    /*
     * On récupère la clé ECDH du destinataire
     * si elle n'est pas déjà disponible.
     */
    if (
      !this.e2ee.sharedKeys.has(
        recipientUserId
      )
    ) {
      await this.prepareRecipient(
        recipientUserId
      );
    }

    /*
     * On récupère les clés ECDSA nécessaires
     * pour vérifier les signatures.
     */
    const senderIds =
      [
        ...new Set(
          messages.map(
            (message) =>
              message.sender_id
          )
        ),
      ];

    const senderKeys =
      new Map();

    for (
      const senderId
      of senderIds
    ) {
      const keyResponse =
        await getPublicKeys(
          this.token,
          senderId
        );

      const signingPublicKey =
        keyResponse.user
          .signing_public_key;

      if (
        signingPublicKey
      ) {
        senderKeys.set(
          senderId,
          signingPublicKey
        );
      }
    }

    /*
     * Les messages doivent être traités
     * dans l'ordre chronologique.
     *
     * Cela est important pour le mécanisme
     * anti-rejeu simplifié.
     */
    const orderedMessages =
      [...messages].sort(
        (a, b) =>
          new Date(
            a.created_at
          ) -
          new Date(
            b.created_at
          )
      );

    for (
      const message
      of orderedMessages
    ) {
      /*
       * Dans cette interface, les messages
       * envoyés par l'utilisateur courant
       * sont déjà connus côté client.
       *
       * On ne tente donc pas de les
       * déchiffrer ici.
       */
      if (
        message.sender_id ===
        this.userId
      ) {
        decryptedMessages.push({
          ...message,
          plaintext:
            "[Message envoyé par vous]",
          own: true,
        });

        continue;
      }

      try {
        const signingKey =
          senderKeys.get(
            message.sender_id
          );

        if (
          !signingKey
        ) {
          throw new Error(
            "Clé ECDSA de l'expéditeur introuvable"
          );
        }

        const plaintext =
          await this.e2ee.decryptMessage(
            message.sender_id,
            signingKey,
            message.conversation_id,
            Number(
              message.sequence_number
            ),
            message.nonce,
            message.ciphertext,
            message.signature
          );

        decryptedMessages.push({
          ...message,
          plaintext,
          own: false,
        });
      } catch (error) {
        console.error(
          "Historique E2EE rejeté:",
          error
        );

        decryptedMessages.push({
          ...message,
          plaintext:
            "[Message non déchiffrable]",
          own: false,
          decryptionError:
            error.message,
        });
      }
    }

    this.setStatus(
      `${decryptedMessages.length} message(s) dans l'historique`
    );

    return decryptedMessages;
  }


  async handleMessage(
    message
  ) {
    if (
      message.type !==
      "message"
    ) {
      console.log(
        "Message WebSocket système:",
        message
      );

      return;
    }

    try {
      const sender =
        await getPublicKeys(
          this.token,
          message.senderId
        );

      if (
        !sender.user
          .signing_public_key
      ) {
        throw new Error(
          "Clé ECDSA de l'expéditeur introuvable"
        );
      }

      const plaintext =
        await this.e2ee.decryptMessage(
          message.senderId,
          sender.user
            .signing_public_key,
          message.conversationId,
          message.sequenceNumber,
          message.nonce,
          message.ciphertext,
          message.signature
        );

      console.log(
        "Message E2EE déchiffré:",
        plaintext
      );

      if (
        this.onMessage
      ) {
        this.onMessage({
          ...message,
          plaintext,
          own: false,
        });
      }
    } catch (
      error
    ) {
      console.error(
        "Échec du traitement E2EE:",
        error
      );

      this.setStatus(
        `Message rejeté : ${error.message}`
      );
    }
  }


  close() {
    this.websocket.close();

    this.setStatus(
      "Session fermée"
    );
  }
}