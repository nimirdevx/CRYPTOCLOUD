/**
 * Public Share Service
 * Handles API calls for public share links (privacy-first approach)
 *
 * PRIVACY: Decryption keys are NEVER sent to the server.
 * Keys are stored in URL fragments (client-side only).
 */

import type {
  CreatePublicShareRequest,
  PublicShareResponse,
  PublicShareMetadata,
  PublicShareListItem,
  DownloadPublicFileRequest,
  PublicFileDownloadResponse,
} from "../types";
import { API_URL } from "../config/constants";
import { handleApiError, checkTokenValidity } from "@/app/lib/apiError";

/**
 * Creates an authenticated fetch function
 */
function createAuthFetch() {
  return async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem("access_token");

    // Proactively check token validity if token exists
    if (token && !checkTokenValidity()) {
      throw new Error("Token expired - user logged out");
    }

    const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response;
  };
}

const authFetch = createAuthFetch();

/**
 * Creates a public share link for a file
 * Note: Frontend must append #key=xxx to the returned URL
 */
export async function createPublicLink(
  fileId: string,
  request: CreatePublicShareRequest = {}
): Promise<PublicShareResponse> {
  const response = await authFetch(`${API_URL}/api/files/${fileId}/public`, {
    method: "POST",
    body: JSON.stringify(request),
  });
  return response.json();
}

/**
 * Gets metadata about a public link (no auth required)
 */
export async function getPublicLinkMetadata(
  token: string
): Promise<PublicShareMetadata> {
  // This is a PUBLIC endpoint - no auth header needed
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/share/${token}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to fetch link metadata");
  }

  return response.json();
}

/**
 * Downloads a public file (no auth required)
 * Returns S3 presigned URL for the encrypted file
 */
export async function downloadPublicFile(
  token: string,
  request: DownloadPublicFileRequest = {}
): Promise<PublicFileDownloadResponse> {
  // This is a PUBLIC endpoint - no auth header needed
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/share/${token}/download`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to download file");
  }

  return response.json();
}

/**
 * Gets all public links created by the current user (requires auth)
 */
export async function getMyPublicLinks(): Promise<PublicShareListItem[]> {
  const response = await authFetch(`${API_URL}/api/public-links`, {
    method: "GET",
  });
  return response.json();
}

/**
 * Revokes a public link (requires auth)
 */
export async function revokePublicLink(token: string): Promise<void> {
  await authFetch(`${API_URL}/api/public-links/${token}`, {
    method: "DELETE",
  });
}

/**
 * Builds the complete public share URL with decryption key in fragment
 */
export function buildPublicShareUrl(
  token: string,
  encryptionKey: string
): string {
  const baseUrl = window.location.origin;
  const keyParam = btoa(encryptionKey); // Base64 encode the key
  return `${baseUrl}/share/${token}#key=${keyParam}`;
}

/**
 * Extracts the decryption key from URL fragment
 */
export function extractKeyFromUrl(): string | null {
  if (typeof window === "undefined") return null;

  const hash = window.location.hash;
  if (!hash) return null;

  const params = new URLSearchParams(hash.slice(1));
  const keyParam = params.get("key");

  if (!keyParam) return null;

  try {
    return atob(keyParam); // Base64 decode
  } catch (e) {
    console.error("Failed to decode key from URL:", e);
    return null;
  }
}
