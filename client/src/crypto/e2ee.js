import {
  generateECDHKeyPair,
  exportECDHPublicKey,
  importECDHPublicKey,
  deriveSharedKey,
} from "./ecdh.js";

import {
  encryptAESGCM,
  decryptAESGCM,
} from "./aes-gcm.js";

import {
  generateSigningKeyPair,
  exportSigningPublicKey,
  importSigningPublicKey,
  signData,
  verifySignature,
} from "./signature.js";

import {
  arrayBufferToBase64,
  uint8ArrayToBase64,
  base64ToArrayBuffer,
  base64ToUint8Array,
} from "./encoding.js";

import { ReplayProtection } from "./replay.js";


export class E2EEManager {
  constructor(userId) {
    this.userId =
      userId;

    this.ecdhKeyPair =
      null;

    this.signingKeyPair =
      null;

    this.sharedKeys =
      new Map();

    this.replayProtection =
      new ReplayProtection();

    this.sequenceNumber =
      0;
  }


  getStorageKey() {
    return `secure-chat-e2ee-keys-${this.userId}`;
  }


  async initialize() {
    const stored =
      localStorage.getItem(
        this.getStorageKey()
      );

    if (stored) {
      try {
        const data =
          JSON.parse(stored);

        if (
          data.ecdhPrivateKey &&
          data.ecdhPublicKey &&
          data.signingPrivateKey &&
          data.signingPublicKey
        ) {
          this.ecdhKeyPair = {
            privateKey:
              await window.crypto.subtle.importKey(
                "jwk",
                data.ecdhPrivateKey,
                {
                  name: "ECDH",
                  namedCurve: "P-256",
                },
                true,
                [
                  "deriveKey",
                  "deriveBits",
                ]
              ),

            publicKey:
              await window.crypto.subtle.importKey(
                "jwk",
                data.ecdhPublicKey,
                {
                  name: "ECDH",
                  namedCurve: "P-256",
                },
                true,
                []
              ),
          };

          this.signingKeyPair = {
            privateKey:
              await window.crypto.subtle.importKey(
                "jwk",
                data.signingPrivateKey,
                {
                  name: "ECDSA",
                  namedCurve: "P-256",
                },
                true,
                ["sign"]
              ),

            publicKey:
              await window.crypto.subtle.importKey(
                "jwk",
                data.signingPublicKey,
                {
                  name: "ECDSA",
                  namedCurve: "P-256",
                },
                true,
                ["verify"]
              ),
          };

          console.log(
            "Clés E2EE persistantes restaurées"
          );

          return {
            ecdhPublicKey:
              data.ecdhPublicKey,

            signingPublicKey:
              data.signingPublicKey,
          };
        }
      } catch (error) {
        console.warn(
          "Impossible de restaurer les clés E2EE. Génération de nouvelles clés.",
          error
        );

        localStorage.removeItem(
          this.getStorageKey()
        );
      }
    }

    this.ecdhKeyPair =
      await generateECDHKeyPair();

    this.signingKeyPair =
      await generateSigningKeyPair();

    const ecdhPrivateKey =
      await window.crypto.subtle.exportKey(
        "jwk",
        this.ecdhKeyPair.privateKey
      );

    const ecdhPublicKey =
      await exportECDHPublicKey(
        this.ecdhKeyPair.publicKey
      );

    const signingPrivateKey =
      await window.crypto.subtle.exportKey(
        "jwk",
        this.signingKeyPair.privateKey
      );

    const signingPublicKey =
      await exportSigningPublicKey(
        this.signingKeyPair.publicKey
      );

    localStorage.setItem(
      this.getStorageKey(),
      JSON.stringify({
        ecdhPrivateKey,
        ecdhPublicKey,
        signingPrivateKey,
        signingPublicKey,
      })
    );

    console.log(
      "Nouvelles clés E2EE générées et conservées dans le navigateur"
    );

    return {
      ecdhPublicKey,
      signingPublicKey,
    };
  }


  async createSharedKey(
    otherUserId,
    otherECDHPublicKeyJwk
  ) {
    if (!this.ecdhKeyPair) {
      throw new Error(
        "E2EE manager not initialized"
      );
    }

    const otherPublicKey =
      await importECDHPublicKey(
        otherECDHPublicKeyJwk
      );

    const sharedKey =
      await deriveSharedKey(
        this.ecdhKeyPair.privateKey,
        otherPublicKey
      );

    this.sharedKeys.set(
      otherUserId,
      sharedKey
    );

    return sharedKey;
  }


  getSharedKey(
    otherUserId
  ) {
    const key =
      this.sharedKeys.get(
        otherUserId
      );

    if (!key) {
      throw new Error(
        "Shared key not available"
      );
    }

    return key;
  }


  async encryptMessage(
    recipientUserId,
    conversationId,
    plaintext
  ) {
    const key =
      this.getSharedKey(
        recipientUserId
      );

    this.sequenceNumber +=
      1;

    const sequenceNumber =
      this.sequenceNumber;

    const {
      ciphertext,
      nonce,
    } =
      await encryptAESGCM(
        key,
        plaintext
      );

    const nonceBase64 =
      uint8ArrayToBase64(
        nonce
      );

    const ciphertextBase64 =
      arrayBufferToBase64(
        ciphertext
      );

    const dataToSign =
      new TextEncoder().encode(
        [
          conversationId,
          this.userId,
          sequenceNumber,
          nonceBase64,
          ciphertextBase64,
        ].join("|")
      );

    const signature =
      await signData(
        this.signingKeyPair
          .privateKey,
        dataToSign
      );

    return {
      type:
        "message",

      conversationId,

      senderId:
        this.userId,

      sequenceNumber,

      nonce:
        nonceBase64,

      ciphertext:
        ciphertextBase64,

      signature:
        arrayBufferToBase64(
          signature
        ),
    };
  }


  async decryptMessage(
    senderUserId,
    senderSigningPublicKeyJwk,
    conversationId,
    sequenceNumber,
    nonceBase64,
    ciphertextBase64,
    signatureBase64
  ) {
    const accepted =
      this.replayProtection.accept(
        senderUserId,
        sequenceNumber
      );

    if (!accepted) {
      throw new Error(
        "Replay attack detected"
      );
    }

    const dataToVerify =
      new TextEncoder().encode(
        [
          conversationId,
          senderUserId,
          sequenceNumber,
          nonceBase64,
          ciphertextBase64,
        ].join("|")
      );

    const senderPublicKey =
      await importSigningPublicKey(
        senderSigningPublicKeyJwk
      );

    const valid =
      await verifySignature(
        senderPublicKey,
        base64ToArrayBuffer(
          signatureBase64
        ),
        dataToVerify
      );

    if (!valid) {
      throw new Error(
        "Invalid digital signature"
      );
    }

    const key =
      this.getSharedKey(
        senderUserId
      );

    const plaintext =
      await decryptAESGCM(
        key,
        base64ToArrayBuffer(
          ciphertextBase64
        ),
        base64ToUint8Array(
          nonceBase64
        )
      );

    return plaintext;
  }
}