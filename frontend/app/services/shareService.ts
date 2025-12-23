/**
 * Share Service
 * Handles all file sharing API operations
 */

import { SharedFileResponse, MyShareResponse } from "@/app/types";
import { createAuthFetch } from "./storageService";
import { API_URL } from "@/app/config/constants";

/**
 * Share Service Class
 * Encapsulates all sharing-related API calls
 */
export class ShareService {
  private jwt: string;
  private authFetch: (url: string, options?: RequestInit) => Promise<Response>;

  constructor(jwt: string) {
    this.jwt = jwt;
    this.authFetch = createAuthFetch(jwt);
  }

  /**
   * Get files shared with me
   */
  async getSharedWithMe(): Promise<SharedFileResponse[]> {
    const response = await this.authFetch(`${API_URL}/share/shared-with-me`);

    if (!response.ok) {
      throw new Error("Failed to fetch shared files");
    }

    return response.json();
  }

  /**
   * Get files shared by me
   */
  async getSharedByMe(): Promise<MyShareResponse[]> {
    const response = await this.authFetch(`${API_URL}/share/shared-by-me`);

    if (!response.ok) {
      throw new Error("Failed to fetch your shared files");
    }

    return response.json();
  }

  /**
   * Share a file with another user
   */
  async shareFile(
    fileId: string,
    recipientUsername: string,
    encryptedFileKey: string
  ): Promise<void> {
    const response = await this.authFetch(
      `${API_URL}/share/files/${fileId}/share`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientUsername,
          encryptedFileKey,
        }),
      }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.detail || "Failed to share file");
    }
  }

  /**
   * Revoke access to a shared file
   */
  async revokeShare(shareId: string): Promise<void> {
    const response = await this.authFetch(`${API_URL}/share/${shareId}`, {
      method: "DELETE",
    });

    if (response.status !== 204) {
      throw new Error("Failed to unshare the file");
    }
  }

  /**
   * Get a user's public key for encryption
   */
  async getUserPublicKey(username: string): Promise<string> {
    const response = await this.authFetch(
      `${API_URL}/auth/users/${username}/public-key`
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.detail || "Failed to get user public key");
    }

    const data = await response.json();
    return data.public_key;
  }

  /**
   * Search for users by username
   */
  async searchUsers(username: string): Promise<
    Array<{
      id: string;
      username: string;
      publicKey: string;
    }>
  > {
    const response = await this.authFetch(
      `${API_URL}/share/users/search?username=${username}`
    );

    if (!response.ok) {
      throw new Error("Failed to search users");
    }

    return response.json();
  }
}

/**
 * Factory function to create a new ShareService instance
 */
export const createShareService = (jwt: string): ShareService => {
  return new ShareService(jwt);
};
