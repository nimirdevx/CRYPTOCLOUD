/**
 * Storage Service
 * Handles all file and folder API operations
 */

import {
  FileMetadata,
  StorageUsage,
  UploadUrlResponse,
  DownloadUrlResponse,
  PaginatedFileResponse,
} from "@/app/types";
import { API_URL } from "@/app/config/constants";
import { handleApiError, checkTokenValidity } from "@/app/lib/apiError";

/**
 * Helper function to create authenticated fetch requests
 * Automatically handles 401 errors by logging out the user
 * Proactively checks token validity before making requests
 */
export const createAuthFetch = (jwt: string) => {
  return async (url: string, options: RequestInit = {}) => {
    // Proactively check if token is expired before making the request
    if (!checkTokenValidity()) {
      throw new Error("Token expired - user logged out");
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${jwt}`,
      },
    });

    // Check for errors and handle 401 automatically
    if (!response.ok) {
      await handleApiError(response);
    }

    return response;
  };
};

/**
 * Storage Service Class
 * Encapsulates all storage-related API calls
 */
export class StorageService {
  private jwt: string;
  private authFetch: (url: string, options?: RequestInit) => Promise<Response>;

  constructor(jwt: string) {
    this.jwt = jwt;
    this.authFetch = createAuthFetch(jwt);
  }

  /**
   * Fetch files in a folder
   */
  async getFiles(
    parentId: string | null = null,
    page: number = 1,
    pageSize: number = 50
  ): Promise<PaginatedFileResponse> {
    const query = new URLSearchParams();
    if (parentId) {
      query.append("parentId", parentId);
    }
    query.append("page", page.toString());
    query.append("page_size", pageSize.toString());

    const response = await this.authFetch(
      `${API_URL}/files/?${query.toString()}`
    );

    return response.json();
  }

  /**
   * Search for files and folders recursively
   */
  async searchFiles(
    query: string,
    parentId: string | null = null,
    page: number = 1,
    pageSize: number = 50
  ): Promise<PaginatedFileResponse> {
    const params = new URLSearchParams();
    params.append("query", query);
    if (parentId) {
      params.append("parentId", parentId);
    }
    params.append("page", page.toString());
    params.append("page_size", pageSize.toString());

    const response = await this.authFetch(
      `${API_URL}/files/search?${params.toString()}`
    );

    return response.json();
  }

  /**
   * Get storage usage statistics
   */
  async getStorageUsage(): Promise<StorageUsage> {
    const response = await this.authFetch(`${API_URL}/files/users/me/storage`);

    return response.json();
  }

  /**
   * Request an upload URL from the server
   */
  async requestUploadUrl(
    filename: string,
    fileSize: number,
    contentType: string = "application/octet-stream"
  ): Promise<UploadUrlResponse> {
    const response = await this.authFetch(
      `${API_URL}/files/request-upload-url`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename,
          content_type: contentType,
          file_size: fileSize,
        }),
      }
    );

    return response.json();
  }

  /**
   * Finalize an upload after S3 upload completes
   */
  async finalizeUpload(
    filename: string,
    s3Key: string,
    fileSize: number,
    parentId: string | null,
    encryptedFileKey: string
  ): Promise<FileMetadata> {
    const response = await this.authFetch(`${API_URL}/files/finalize-upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename,
        s3_key: s3Key,
        file_size: fileSize,
        parentId,
        encryptedFileKey,
      }),
    });

    return response.json();
  }

  /**
   * Get a download URL for a file
   */
  async getDownloadUrl(fileId: string): Promise<DownloadUrlResponse> {
    const response = await this.authFetch(
      `${API_URL}/files/download-url/${fileId}`
    );

    return response.json();
  }

  /**
   * Delete a file or folder
   */
  async deleteFile(fileId: string): Promise<void> {
    await this.authFetch(`${API_URL}/files/${fileId}`, {
      method: "DELETE",
    });
  }

  /**
   * Rename a file or folder
   */
  async renameFile(fileId: string, newFilename: string): Promise<FileMetadata> {
    const response = await this.authFetch(`${API_URL}/files/${fileId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ new_filename: newFilename }),
    });

    return response.json();
  }

  /**
   * Move a file or folder to a new parent folder
   */
  async moveFile(
    fileId: string,
    newParentId: string | null
  ): Promise<FileMetadata> {
    const response = await this.authFetch(`${API_URL}/files/${fileId}/move`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ new_parent_id: newParentId }),
    });

    return response.json();
  }

  /**
   * Create a new folder
   */
  async createFolder(
    name: string,
    parentId: string | null = null
  ): Promise<FileMetadata> {
    const response = await this.authFetch(`${API_URL}/files/folders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, parentId }),
    });

    return response.json();
  }

  /**
   * Download encrypted file from S3
   */
  async downloadFromS3(downloadUrl: string): Promise<ArrayBuffer> {
    const response = await fetch(downloadUrl);

    if (!response.ok) {
      throw new Error("File download from S3 failed");
    }

    return response.arrayBuffer();
  }
}

/**
 * Factory function to create a new StorageService instance
 */
export const createStorageService = (jwt: string): StorageService => {
  return new StorageService(jwt);
};
