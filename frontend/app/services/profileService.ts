/**
 * Profile Service
 * Handles profile picture upload, fetch, and delete operations
 */

import { API_URL } from "@/app/config/constants";
import { handleApiError, checkTokenValidity } from "@/app/lib/apiError";

interface ProfilePictureUploadRequest {
  content_type: string;
}

interface ProfilePictureUploadResponse {
  upload_url: string;
  s3_key: string;
}

interface ProfilePictureFinalizeRequest {
  s3_key: string;
}

interface UserResponse {
  id: string;
  username: string;
  email: string;
  is_2fa_enabled: boolean;
  profile_picture_url: string | null;
}

interface ProfilePictureResponse {
  profile_picture_url: string | null;
}

/**
 * Profile Service Class
 * Encapsulates all profile-related API calls
 */
export class ProfileService {
  /**
   * Request upload URL for profile picture
   */
  async requestUploadUrl(
    contentType: string,
    jwt: string
  ): Promise<ProfilePictureUploadResponse> {
    // Proactively check token validity
    if (!checkTokenValidity()) {
      throw new Error("Token expired - user logged out");
    }

    const response = await fetch(`${API_URL}/profile/request-upload-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({ content_type: contentType }),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  }

  /**
   * Upload profile picture to S3
   */
  async uploadToS3(uploadUrl: string, file: File): Promise<void> {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!response.ok) {
      throw new Error("Failed to upload profile picture to S3");
    }
  }

  /**
   * Finalize profile picture upload
   */
  async finalizeUpload(s3Key: string, jwt: string): Promise<UserResponse> {
    const response = await fetch(`${API_URL}/profile/finalize-upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({ s3_key: s3Key }),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  }

  /**
   * Complete profile picture upload (combines all steps)
   */
  async uploadProfilePicture(file: File, jwt: string): Promise<UserResponse> {
    // Step 1: Request upload URL
    const { upload_url, s3_key } = await this.requestUploadUrl(file.type, jwt);

    // Step 2: Upload to S3
    await this.uploadToS3(upload_url, file);

    // Step 3: Finalize upload
    return await this.finalizeUpload(s3_key, jwt);
  }

  /**
   * Get current profile picture URL
   */
  async getProfilePicture(jwt: string): Promise<ProfilePictureResponse> {
    const response = await fetch(`${API_URL}/profile/picture`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  }

  /**
   * Delete profile picture
   */
  async deleteProfilePicture(jwt: string): Promise<UserResponse> {
    const response = await fetch(`${API_URL}/profile/picture`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  }
}

// Export singleton instance
export const profileService = new ProfileService();
