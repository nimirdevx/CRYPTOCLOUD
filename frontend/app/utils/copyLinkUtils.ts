import { decryptFileKey } from "../lib/crypto";
import { API_URL } from "../config/constants";

/**
 * Copies a public share link with encryption key to clipboard
 * @param fileId - The file ID to create a link for
 * @param encryptionKey - User's master encryption key
 * @param token - Optional public share token (if already created)
 * @returns Promise that resolves when link is copied
 */
export async function copyPublicLinkToClipboard(
  fileId: string,
  encryptionKey: CryptoKey,
  token?: string
): Promise<void> {
  const jwt = localStorage.getItem("access_token");

  if (!jwt) {
    throw new Error("Not authenticated");
  }

  // 1. Fetch the file data to get the encrypted_file_key
  const response = await fetch(`${API_URL}/files/${fileId}`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch file data");
  }

  const fileData = await response.json();

  // 2. Decrypt the file key
  const fileKey = await decryptFileKey(
    encryptionKey,
    fileData.encryptedFileKey
  );

  // 3. Build the complete URL with the key fragment
  // Use URL-safe base64 encoding (no padding, replace +/ with -_)
  const keyBuffer = await crypto.subtle.exportKey("raw", fileKey);
  const keyArray = Array.from(new Uint8Array(keyBuffer));
  const keyBase64 = btoa(String.fromCharCode(...keyArray))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  // If we have a token, use it. Otherwise, use the file ID as fallback
  const shareIdentifier = token || fileId;
  const fullUrl = `${window.location.origin}/share/${shareIdentifier}#key=${keyBase64}`;

  // 4. Copy to clipboard
  await navigator.clipboard.writeText(fullUrl);
}
