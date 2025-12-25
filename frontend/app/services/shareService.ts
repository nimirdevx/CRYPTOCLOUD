/**
 * Share Service
 * Handles all file sharing API operations
 */

import {
  SharedFileResponse,
  MyShareResponse,
  PaginatedSharedFilesResponse,
  PaginatedMySharesResponse,
} from "@/app/types";
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
  async getSharedWithMe(
    page: number = 1,
    pageSize: number = 50
  ): Promise<PaginatedSharedFilesResponse> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("page_size", pageSize.toString());

    const response = await this.authFetch(
      `${API_URL}/share/shared-with-me?${params.toString()}`
    );

    return response.json();
  }

  /**
   * Get files shared by me
   */
  async getSharedByMe(
    page: number = 1,
    pageSize: number = 50
  ): Promise<PaginatedMySharesResponse> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("page_size", pageSize.toString());

    const response = await this.authFetch(
      `${API_URL}/share/shared-by-me?${params.toString()}`
    );

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
    await this.authFetch(`${API_URL}/share/files/${fileId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientUsername,
        encryptedFileKey,
      }),
    });
  }

  /**
   * Revoke access to a shared file
   */
  async revokeShare(shareId: string): Promise<void> {
    await this.authFetch(`${API_URL}/share/${shareId}`, {
      method: "DELETE",
    });
  }

  /**
   * Get a user's public key for encryption
   */
  async getUserPublicKey(username: string): Promise<string> {
    const response = await this.authFetch(
      `${API_URL}/auth/users/${username}/public-key`
    );

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

    return response.json();
  }
}

/**
 * Factory function to create a new ShareService instance
 */
export const createShareService = (jwt: string): ShareService => {
  return new ShareService(jwt);
};
