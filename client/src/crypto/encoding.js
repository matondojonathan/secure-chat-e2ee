export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);

  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return window.btoa(binary);
}

export function uint8ArrayToBase64(bytes) {
  return arrayBufferToBase64(bytes);
}

export function base64ToUint8Array(base64) {
  const binary = window.atob(base64);

  const bytes = new Uint8Array(
    binary.length
  );

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

export function base64ToArrayBuffer(base64) {
  return base64ToUint8Array(base64).buffer;
}

export function stringToUint8Array(value) {
  return new TextEncoder().encode(value);
}

export function uint8ArrayToString(bytes) {
  return new TextDecoder().decode(bytes);
}