// Génère une paire de clés ECDH.
// La clé privée reste dans le navigateur.
// La clé publique peut être exportée et envoyée au serveur.
export async function generateECDHKeyPair() {
  return window.crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true,
    ["deriveKey", "deriveBits"]
  );
}

// Exporte une clé publique ECDH au format JWK.
// Ce format est pratique pour l'envoyer au serveur.
export async function exportECDHPublicKey(publicKey) {
  return window.crypto.subtle.exportKey("jwk", publicKey);
}

// Importe la clé publique ECDH d'un autre utilisateur.
export async function importECDHPublicKey(jwk) {
  return window.crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true,
    []
  );
}

// Dérive une clé AES-GCM partagée à partir de :
// - notre clé privée ECDH
// - la clé publique ECDH de l'autre utilisateur
export async function deriveSharedKey(privateKey, otherPublicKey) {
  return window.crypto.subtle.deriveKey(
    {
      name: "ECDH",
      public: otherPublicKey,
    },
    privateKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"]
  );
}