// Génère une paire de clés ECDSA.
// La clé privée reste dans le navigateur.
export async function generateSigningKeyPair() {
  return window.crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["sign", "verify"]
  );
}

// Exporte la clé publique ECDSA au format JWK.
export async function exportSigningPublicKey(publicKey) {
  return window.crypto.subtle.exportKey(
    "jwk",
    publicKey
  );
}

// Importe une clé publique ECDSA depuis un JWK.
export async function importSigningPublicKey(jwk) {
  return window.crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["verify"]
  );
}

// Signe des données avec la clé privée ECDSA.
export async function signData(privateKey, data) {
  return window.crypto.subtle.sign(
    {
      name: "ECDSA",
      hash: {
        name: "SHA-256",
      },
    },
    privateKey,
    data
  );
}

// Vérifie une signature avec la clé publique ECDSA.
export async function verifySignature(
  publicKey,
  signature,
  data
) {
  return window.crypto.subtle.verify(
    {
      name: "ECDSA",
      hash: {
        name: "SHA-256",
      },
    },
    publicKey,
    signature,
    data
  );
}