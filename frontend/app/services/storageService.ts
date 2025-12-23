/**
 * Storage Service
 * Handles all file and folder API operations
 */

import {
  FileMetadata,
  StorageUsage,
  UploadUrlResponse,
  DownloadUrlResponse,
} from "@/app/types";
import { API_URL } from "@/app/config/constants";

/**
 * Helper function to create authenticated fetch requests
 */
export const createAuthFetch = (jwt: string) => {
  return (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${jwt}`,
      },
    });
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
  async getFiles(parentId: string | null = null): Promise<FileMetadata[]> {
    const query = new URLSearchParams();
    if (parentId) {
      query.append("parentId", parentId);
    }

    const response = await this.authFetch(
      `${API_URL}/files/?${query.toString()}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch files");
    }

    return response.json();
  }

  /**
   * Get storage usage statistics
   */
  async getStorageUsage(): Promise<StorageUsage> {
    const response = await this.authFetch(`${API_URL}/files/users/me/storage`);

    if (!response.ok) {
      throw new Error("Failed to fetch storage usage");
    }

    return response.json();
  }

  /**
   * Request an upload URL from the server
   */
  async requestUploadUrl(
    filename: string,
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
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Could not get upload URL");
    }

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

    if (!response.ok) {
      throw new Error("Failed to finalize upload");
    }

    return response.json();
  }

  /**
   * Get a download URL for a file
   */
  async getDownloadUrl(fileId: string): Promise<DownloadUrlResponse> {
    const response = await this.authFetch(
      `${API_URL}/files/download-url/${fileId}`
    );

    if (!response.ok) {
      throw new Error("Could not get download URL");
    }

    return response.json();
  }

  /**
   * Delete a file or folder
   */
  async deleteFile(fileId: string): Promise<void> {
    const response = await this.authFetch(`${API_URL}/files/${fileId}`, {
      method: "DELETE",
    });

    if (response.status !== 204) {
      const data = await response.json();
      throw new Error(data.detail || "Failed to delete file");
    }
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

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.detail || "Failed to rename file");
    }

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

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.detail || "Failed to create folder");
    }

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
