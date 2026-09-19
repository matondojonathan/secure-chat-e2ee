import {
  generateECDHKeyPair,
  exportECDHPublicKey,
} from "../crypto/ecdh.js";

import {
  generateSigningKeyPair,
  exportSigningPublicKey,
} from "../crypto/signature.js";

export class E2EEIdentity {
  constructor(userId) {
    this.userId = userId;

    this.ecdhKeyPair = null;
    this.signingKeyPair = null;
  }

  async initialize() {
    this.ecdhKeyPair =
      await generateECDHKeyPair();

    this.signingKeyPair =
      await generateSigningKeyPair();

    console.log(
      "Clés E2EE générées pour:",
      this.userId
    );
  }

  async getPublicKeys() {
    if (
      !this.ecdhKeyPair ||
      !this.signingKeyPair
    ) {
      throw new Error(
        "E2EE identity not initialized"
      );
    }

    return {
      ecdhPublicKey:
        await exportECDHPublicKey(
          this.ecdhKeyPair.publicKey
        ),

      signingPublicKey:
        await exportSigningPublicKey(
          this.signingKeyPair.publicKey
        ),
    };
  }

  getECDHKeyPair() {
    if (!this.ecdhKeyPair) {
      throw new Error(
        "ECDH keys not initialized"
      );
    }

    return this.ecdhKeyPair;
  }

  getSigningKeyPair() {
    if (!this.signingKeyPair) {
      throw new Error(
        "Signing keys not initialized"
      );
    }

    return this.signingKeyPair;
  }
}