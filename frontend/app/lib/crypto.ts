"use client";

// --- Helper functions for Base64 <-> ArrayBuffer ---
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}
// --------------------------------------------------

/**
 * Derives a 256-bit AES-GCM key from a password using PBKDF2.
 * This is your MASTER key.
 */
export async function deriveKey(password: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const rawPassword = enc.encode(password);

  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    rawPassword,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const salt = enc.encode("your-static-salt");
  const iterations = 100000;

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: iterations,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false, // This key is not-extractable
    // --- UPDATE USAGES ---
    // This key will encrypt file keys AND the user's private key
    ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
    // ---------------------
  );
}

/**
 * Encrypts data (as an ArrayBuffer) using a given key (e.g., a file key).
 * Returns an ArrayBuffer containing the IV + ciphertext.
 */
export async function encryptData(
  key: CryptoKey,
  data: ArrayBuffer
): Promise<ArrayBuffer> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedData = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    data
  );

  const ivLength = iv.byteLength;
  const combinedBuffer = new Uint8Array(ivLength + encryptedData.byteLength);
  combinedBuffer.set(iv, 0);
  combinedBuffer.set(new Uint8Array(encryptedData), ivLength);

  return combinedBuffer.buffer;
}

/**
 * Decrypts data (an ArrayBuffer containing IV + ciphertext)
 * using a given key (e.g., a file key).
 */
export async function decryptData(
  key: CryptoKey,
  data: ArrayBuffer
): Promise<ArrayBuffer> {
  const iv = data.slice(0, 12);
  const encryptedData = data.slice(12);

  return window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    key,
    encryptedData
  );
}

/**
 * Generates a new, random, extractable AES-GCM key for a single file.
 */
export async function generateRandomAesKey(): Promise<CryptoKey> {
  return window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true, // <-- Extractable
    ["encrypt", "decrypt"]
  );
}

/**
 * Exports a CryptoKey to a storable string format.
 */
async function keyToString(key: CryptoKey): Promise<string> {
  const jwk = await window.crypto.subtle.exportKey("jwk", key);
  return JSON.stringify(jwk);
}

/**
 * Imports a stored string (JWK) back into a CryptoKey.
 */
async function stringToKey(jwkString: string): Promise<CryptoKey> {
  const jwk = JSON.parse(jwkString);
  return window.crypto.subtle.importKey("jwk", jwk, { name: "AES-GCM" }, true, [
    "encrypt",
    "decrypt",
  ]);
}

/**
 * Encrypts a file key (as a string) using your master key.
 */
export async function encryptFileKey(
  masterKey: CryptoKey,
  fileKey: CryptoKey
): Promise<string> {
  // 1. Convert the file key to a string
  const fileKeyString = await keyToString(fileKey);

  // 2. Encrypt that string using our existing encryptData function
  const data = new TextEncoder().encode(fileKeyString);
  const encryptedKeyBuffer = await encryptData(masterKey, data.buffer);

  // 3. Convert the encrypted ArrayBuffer to base64 to store in DB
  // Use the new helper function
  return arrayBufferToBase64(encryptedKeyBuffer);
}

/**
 * Decrypts an encrypted file key (from DB) using your master key.
 */
export async function decryptFileKey(
  masterKey: CryptoKey,
  encryptedKeyString: string
): Promise<CryptoKey> {
  // 1. Convert base64 string back to ArrayBuffer
  // Use the new helper function
  const encryptedKeyBuffer = base64ToArrayBuffer(encryptedKeyString);

  // 2. Decrypt the buffer using our existing decryptData function
  const decryptedKeyData = await decryptData(masterKey, encryptedKeyBuffer);

  // 3. Convert the decrypted ArrayBuffer back to a string
  const fileKeyString = new TextDecoder().decode(decryptedKeyData);

  // 4. Convert that string back into a usable CryptoKey
  return stringToKey(fileKeyString);
}

// --- RSA KEY GENERATION FUNCTIONS ---

/**
 * Generates a new RSA-OAEP 4096-bit key pair for encryption.
 * This is the user's "mailbox" key pair.
 */
export async function generateRsaKeyPair(): Promise<CryptoKeyPair> {
  return window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 4096,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]), // 65537
      hash: "SHA-256",
    },
    true, // Extractable
    ["wrapKey", "unwrapKey"] // Public key wraps, Private key unwraps
  );
}

/**
 * Exports a Public Key to a base64 string (SPKI format).
 */
export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey("spki", key);
  return arrayBufferToBase64(exported);
}

/**
 * Encrypts a Private Key using the user's master key.
 * Returns a base64 string of the encrypted private key.
 */
export async function encryptPrivateKey(
  masterKey: CryptoKey,
  privateKey: CryptoKey
): Promise<string> {
  // 1. Export the private key to a buffer (PKCS8 format)
  const privateKeyBuffer = await window.crypto.subtle.exportKey(
    "pkcs8",
    privateKey
  );

  // 2. Encrypt that buffer with the master key
  const encryptedPrivateKeyBuffer = await encryptData(
    masterKey,
    privateKeyBuffer
  );

  // 3. Convert the final encrypted buffer to base64
  return arrayBufferToBase64(encryptedPrivateKeyBuffer);
}

/**
 * Decrypts an encrypted Private Key (from DB) using your master key.
 * Returns the CryptoKey for the private key.
 */
export async function decryptPrivateKey(
  masterKey: CryptoKey,
  encryptedPrivateKeyString: string
): Promise<CryptoKey> {
  // 1. Convert base64 string back to ArrayBuffer
  const encryptedPrivateKeyBuffer = base64ToArrayBuffer(
    encryptedPrivateKeyString
  );

  // 2. Decrypt the buffer using our existing decryptData function
  const decryptedPrivateKeyBuffer = await decryptData(
    masterKey,
    encryptedPrivateKeyBuffer
  );

  // 3. Import the decrypted buffer (PKCS8 format) as a CryptoKey
  return window.crypto.subtle.importKey(
    "pkcs8",
    decryptedPrivateKeyBuffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true, // Must be extractable
    ["unwrapKey"] // This key's job is to unwrap other keys
  );
}

// --- FILE SHARING FUNCTIONS ---

/**
 * Imports a base64 Public Key (SPKI) into a usable CryptoKey.
 */
export async function importPublicKey(
  base64PublicKey: string
): Promise<CryptoKey> {
  const keyBuffer = base64ToArrayBuffer(base64PublicKey);
  return window.crypto.subtle.importKey(
    "spki",
    keyBuffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256", // <-- This should match the hash you generate with
    },
    true,
    ["wrapKey"] // This key's job is to "wrap" (encrypt) other keys
  );
}

/**
 * "Wraps" (encrypts) a file's AES key using a recipient's RSA Public Key.
 * Returns a base64 string of the encrypted file key.
 */
export async function wrapFileKey(
  publicKey: CryptoKey, // The RECIPIENT'S public key
  fileKey: CryptoKey    // The AES key for the file
): Promise<string> {
  // 1. Use the browser's built-in 'wrapKey' function.
  // This securely exports and encrypts the fileKey in one step.
  const wrappedKeyBuffer = await window.crypto.subtle.wrapKey(
    "raw", // We'll wrap the raw bytes of the key
    fileKey,
    publicKey,
    {
      name: "RSA-OAEP",
    }
  );

  // 2. Convert the final encrypted buffer to base64
  return arrayBufferToBase64(wrappedKeyBuffer);
}

export async function unwrapFileKey(
  privateKey: CryptoKey, // YOUR private key
  wrappedKeyString: string // The encrypted file key from the DB
): Promise<CryptoKey> {
  // 1. Convert base64 string back to ArrayBuffer
  const wrappedKeyBuffer = base64ToArrayBuffer(wrappedKeyString);

  // 2. Use 'unwrapKey' to decrypt and import the AES key in one step.
  // This is the matching pair to 'wrapKey'.
  return window.crypto.subtle.unwrapKey(
    "raw", // It was wrapped in 'raw' format
    wrappedKeyBuffer,
    privateKey,
    {
      name: "RSA-OAEP",
    },
    { name: "AES-GCM", length: 256 }, // The algorithm of the key we are unwrapping
    true, // The unwrapped key should be extractable (matches our file keys)
    ["encrypt", "decrypt"] // The unwrapped key's usages
  );
}
