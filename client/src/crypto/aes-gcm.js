// Génère une clé AES-GCM de 256 bits.
export async function generateAESKey() {
  return window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"]
  );
}

// Chiffre un message avec AES-256-GCM.
//
// Retourne :
// - ciphertext : données chiffrées
// - nonce : valeur unique utilisée pour ce chiffrement
export async function encryptAESGCM(key, plaintext) {
  const encoder = new TextEncoder();

  const plaintextBytes = encoder.encode(plaintext);

  // AES-GCM utilise un nonce de 96 bits = 12 octets.
  const nonce = window.crypto.getRandomValues(
    new Uint8Array(12)
  );

  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: nonce,
    },
    key,
    plaintextBytes
  );

  return {
    ciphertext,
    nonce,
  };
}

// Déchiffre un message AES-256-GCM.
export async function decryptAESGCM(key, ciphertext, nonce) {
  const plaintextBytes = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: nonce,
    },
    key,
    ciphertext
  );

  const decoder = new TextDecoder();

  return decoder.decode(plaintextBytes);
}