"use client";

/**
 * Derives a 256-bit AES-GCM key from a password using PBKDF2.
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

  const salt = enc.encode("your-static-salt"); // Use a static salt for simplicity
  const iterations = 100000;

  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: iterations,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  return derivedKey;
}

// --- NEW FUNCTION 1: ENCRYPT DATA ---
/**
 * Encrypts data (as an ArrayBuffer) using the derived AES-GCM key.
 * Returns an ArrayBuffer containing the IV + ciphertext.
 */
export async function encryptData(
  key: CryptoKey,
  data: ArrayBuffer
): Promise<ArrayBuffer> {
  // Generate a random 12-byte Initialization Vector (IV)
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    data
  );

  // Combine IV and encrypted data into one buffer
  // We put the IV at the beginning of the file
  const ivLength = iv.byteLength;
  const combinedBuffer = new Uint8Array(ivLength + encryptedData.byteLength);
  combinedBuffer.set(iv, 0);
  combinedBuffer.set(new Uint8Array(encryptedData), ivLength);

  return combinedBuffer.buffer;
}

// --- NEW FUNCTION 2: DECRYPT DATA ---
/**
 * Decrypts data (an ArrayBuffer containing IV + ciphertext)
 * using the derived AES-GCM key.
 */
export async function decryptData(
  key: CryptoKey,
  data: ArrayBuffer
): Promise<ArrayBuffer> {
  // Extract the 12-byte IV from the beginning of the file
  const iv = data.slice(0, 12);
  const encryptedData = data.slice(12);

  const decryptedData = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encryptedData
  );

  return decryptedData;
}
