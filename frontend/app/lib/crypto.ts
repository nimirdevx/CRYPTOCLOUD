/**
 * Derives a 256-bit AES-GCM key from a password using PBKDF2.
 * This key is non-extractable and will live in memory.
 */
export async function deriveKey(password: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const rawPassword = enc.encode(password);

  // 1. Import the password as a "base key" for PBKDF2
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    rawPassword,
    "PBKDF2",
    false, // not extractable
    ["deriveKey"]
  );

  // 2. Derive the AES-GCM key
  // We use a static salt for simplicity. In a real app,
  // you would generate a unique salt for each user and store it.
  const salt = enc.encode("your-static-salt");
  const iterations = 100000; // A good baseline

  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: iterations,
      hash: "SHA-256",
    },
    baseKey, // The imported password key
    { name: "AES-GCM", length: 256 }, // The key type we want to end up with
    false, // not extractable
    ["encrypt", "decrypt"] // Key usages
  );

  return derivedKey;
}
