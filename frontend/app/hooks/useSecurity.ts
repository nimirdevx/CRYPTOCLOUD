import { useState, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { authService } from "@/app/services";
import { profileService } from "@/app/services/profileService";
import { API_URL } from "@/app/config/constants";
import type { User } from "@/app/types";

interface SecurityState {
  // 2FA QR Code
  qrCode: string | null;
  totpCode: string;

  // Messages
  error: string | null;
  message: string | null;

  // Delete Account
  showDeleteModal: boolean;
  deletePassword: string;
  deleteError: string | null;

  // Disable 2FA
  showDisable2FAModal: boolean;
  disable2FAPassword: string;
  disable2FAError: string | null;

  // Backup Codes
  showBackupCodesPasswordModal: boolean;
  backupCodesPassword: string;
  backupCodesPasswordError: string | null;
  generatedBackupCodes: string[] | null;

  // User data
  currentUser: User | null;
  newUsername: string;
  updateUsernameError: string | null;

  // Profile picture upload
  isUploadingProfilePicture: boolean;
  profilePictureError: string | null;
}

export const useSecurity = () => {
  const { jwt, is2FAEnabled, logout, update2FAStatus } = useAuth();
  const router = useRouter();

  // Initialize all state
  const [state, setState] = useState<SecurityState>({
    qrCode: null,
    totpCode: "",
    error: null,
    message: null,
    showDeleteModal: false,
    deletePassword: "",
    deleteError: null,
    showDisable2FAModal: false,
    disable2FAPassword: "",
    disable2FAError: null,
    showBackupCodesPasswordModal: false,
    backupCodesPassword: "",
    backupCodesPasswordError: null,
    generatedBackupCodes: null,
    currentUser: null,
    newUsername: "",
    updateUsernameError: null,
    isUploadingProfilePicture: false,
    profilePictureError: null,
  });

  // Helper to update state
  const updateState = useCallback((updates: Partial<SecurityState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Clear messages
  const clearMessages = useCallback(() => {
    updateState({ error: null, message: null, updateUsernameError: null });
  }, [updateState]);

  // ============ User Data Operations ============

  /**
   * Get current user
   */
  const getCurrentUser = useCallback(async () => {
    if (!jwt) {
      updateState({ error: "Not authenticated" });
      return;
    }

    clearMessages();
    try {
      const user = await authService.getCurrentUser(jwt);
      updateState({ currentUser: user, newUsername: user.username });
    } catch (err: any) {
      updateState({ error: err.message || "Failed to fetch user data" });
    }
  }, [jwt, updateState, clearMessages]);

  /**
   * Update username
   */
  const updateUsername = useCallback(async () => {
    if (!jwt) {
      updateState({ updateUsernameError: "Not authenticated" });
      return;
    }

    if (!state.newUsername) {
      updateState({ updateUsernameError: "Username cannot be empty." });
      return;
    }

    updateState({ updateUsernameError: null });
    try {
      await authService.updateUsername(jwt, state.newUsername);
      updateState({
        message: "Username updated successfully!",
      });
      getCurrentUser(); // Refresh user data
    } catch (err: any) {
      updateState({
        updateUsernameError: err.message || "Failed to update username",
      });
    }
  }, [jwt, state.newUsername, updateState, getCurrentUser]);

  // ============ 2FA Operations ============

  /**
   * Generate 2FA QR code
   */
  const generate2FA = useCallback(async () => {
    if (!jwt) {
      updateState({ error: "Not authenticated" });
      return;
    }

    clearMessages();
    try {
      const data = await authService.generate2FA(jwt);
      updateState({ qrCode: data.qr_code_data_url });
    } catch (err: any) {
      updateState({ error: err.message || "Failed to generate 2FA secret" });
    }
  }, [jwt, updateState, clearMessages]);

  /**
   * Verify 2FA code and enable 2FA
   */
  const verify2FA = useCallback(async () => {
    if (!jwt) {
      updateState({ error: "Not authenticated" });
      return;
    }

    if (!state.totpCode) {
      updateState({ error: "Please enter the verification code" });
      return;
    }

    clearMessages();
    try {
      await authService.verify2FA(jwt, state.totpCode);
      updateState({
        message: "2FA has been enabled successfully!",
        qrCode: null,
        totpCode: "",
      });
      update2FAStatus(true);
    } catch (err: any) {
      updateState({ error: err.message || "Failed to verify code" });
    }
  }, [jwt, state.totpCode, updateState, clearMessages, update2FAStatus]);

  /**
   * Cancel 2FA setup
   */
  const cancel2FASetup = useCallback(() => {
    updateState({
      qrCode: null,
      totpCode: "",
      error: null,
    });
  }, [updateState]);

  /**
   * Disable 2FA
   */
  const disable2FA = useCallback(async () => {
    if (!jwt) {
      updateState({ disable2FAError: "Not authenticated" });
      return;
    }

    if (!state.disable2FAPassword) {
      updateState({ disable2FAError: "You must enter your password." });
      return;
    }

    updateState({ disable2FAError: null });
    try {
      await authService.disable2FA(jwt, state.disable2FAPassword);
      updateState({
        message: "2FA has been disabled successfully!",
        showDisable2FAModal: false,
        disable2FAPassword: "",
      });
      update2FAStatus(false);
    } catch (err: any) {
      updateState({ disable2FAError: err.message || "Failed to disable 2FA" });
    }
  }, [jwt, state.disable2FAPassword, updateState, update2FAStatus]);

  // ============ Backup Codes Operations ============

  /**
   * Generate backup codes
   */
  const generateBackupCodes = useCallback(async () => {
    if (!jwt) {
      updateState({ backupCodesPasswordError: "Not authenticated" });
      return;
    }

    if (!state.backupCodesPassword) {
      updateState({
        backupCodesPasswordError: "You must enter your password.",
      });
      return;
    }

    updateState({ backupCodesPasswordError: null });
    try {
      const codes = await authService.generateBackupCodes(
        jwt,
        state.backupCodesPassword
      );
      updateState({
        showBackupCodesPasswordModal: false,
        backupCodesPassword: "",
        generatedBackupCodes: codes,
      });
    } catch (err: any) {
      updateState({
        backupCodesPasswordError:
          err.message || "Failed to generate backup codes",
      });
    }
  }, [jwt, state.backupCodesPassword, updateState]);

  // ============ Account Operations ============

  /**
   * Delete account
   */
  const deleteAccount = useCallback(async () => {
    if (!jwt) {
      updateState({ deleteError: "Not authenticated" });
      return;
    }

    if (!state.deletePassword) {
      updateState({ deleteError: "You must enter your password." });
      return;
    }

    updateState({ deleteError: null });
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ password: state.deletePassword }),
      });

      if (response.status === 204) {
        logout();
        router.push("/");
      } else {
        const data = await response.json();
        throw new Error(data.detail || "Failed to delete account");
      }
    } catch (err: any) {
      updateState({ deleteError: err.message || "Failed to delete account" });
    }
  }, [jwt, state.deletePassword, updateState, logout, router]);

  // ============ UI State Setters ============

  const setTotpCode = useCallback(
    (code: string) => {
      updateState({ totpCode: code });
    },
    [updateState]
  );

  const setShowDeleteModal = useCallback(
    (show: boolean) => {
      updateState({
        showDeleteModal: show,
        deletePassword: show ? state.deletePassword : "",
        deleteError: show ? state.deleteError : null,
      });
    },
    [updateState, state.deletePassword, state.deleteError]
  );

  const setDeletePassword = useCallback(
    (password: string) => {
      updateState({ deletePassword: password });
    },
    [updateState]
  );

  const setShowDisable2FAModal = useCallback(
    (show: boolean) => {
      updateState({
        showDisable2FAModal: show,
        disable2FAPassword: show ? state.disable2FAPassword : "",
        disable2FAError: show ? state.disable2FAError : null,
      });
    },
    [updateState, state.disable2FAPassword, state.disable2FAError]
  );

  const setDisable2FAPassword = useCallback(
    (password: string) => {
      updateState({ disable2FAPassword: password });
    },
    [updateState]
  );

  const setShowBackupCodesPasswordModal = useCallback(
    (show: boolean) => {
      updateState({
        showBackupCodesPasswordModal: show,
        backupCodesPassword: show ? state.backupCodesPassword : "",
        backupCodesPasswordError: show ? state.backupCodesPasswordError : null,
      });
    },
    [updateState, state.backupCodesPassword, state.backupCodesPasswordError]
  );

  const setBackupCodesPassword = useCallback(
    (password: string) => {
      updateState({ backupCodesPassword: password });
    },
    [updateState]
  );

  const setGeneratedBackupCodes = useCallback(
    (codes: string[] | null) => {
      updateState({ generatedBackupCodes: codes });
    },
    [updateState]
  );

  const setNewUsername = useCallback(
    (username: string) => {
      updateState({ newUsername: username });
    },
    [updateState]
  );

  // ============ Profile Picture Operations ============

  /**
   * Upload profile picture
   */
  const uploadProfilePicture = useCallback(
    async (file: File) => {
      if (!jwt) {
        updateState({ profilePictureError: "Not authenticated" });
        return;
      }

      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        updateState({
          profilePictureError:
            "Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.",
        });
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        updateState({
          profilePictureError: "File too large. Maximum size is 5MB.",
        });
        return;
      }

      updateState({
        isUploadingProfilePicture: true,
        profilePictureError: null,
      });

      try {
        const updatedUser = await profileService.uploadProfilePicture(
          file,
          jwt
        );
        updateState({
          isUploadingProfilePicture: false,
          currentUser: updatedUser,
          message: "Profile picture updated successfully!",
        });

        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent("profilePictureUpdated"));
      } catch (err: any) {
        updateState({
          isUploadingProfilePicture: false,
          profilePictureError:
            err.message || "Failed to upload profile picture",
        });
      }
    },
    [jwt, updateState]
  );

  /**
   * Delete profile picture
   */
  const deleteProfilePicture = useCallback(async () => {
    if (!jwt) {
      updateState({ profilePictureError: "Not authenticated" });
      return;
    }

    updateState({
      isUploadingProfilePicture: true,
      profilePictureError: null,
    });

    try {
      const updatedUser = await profileService.deleteProfilePicture(jwt);
      updateState({
        isUploadingProfilePicture: false,
        currentUser: updatedUser,
        message: "Profile picture deleted successfully!",
      });

      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent("profilePictureUpdated"));
    } catch (err: any) {
      updateState({
        isUploadingProfilePicture: false,
        profilePictureError: err.message || "Failed to delete profile picture",
      });
    }
  }, [jwt, updateState]);

  return {
    // State
    ...state,
    is2FAEnabled,

    // User Data
    getCurrentUser,
    updateUsername,
    setNewUsername,

    // Profile Picture Operations
    uploadProfilePicture,
    deleteProfilePicture,

    // 2FA Operations
    generate2FA,
    verify2FA,
    cancel2FASetup,
    disable2FA,

    // Backup Codes Operations
    generateBackupCodes,

    // Account Operations
    deleteAccount,

    // UI State Setters
    setTotpCode,
    setShowDeleteModal,
    setDeletePassword,
    setShowDisable2FAModal,
    setDisable2FAPassword,
    setShowBackupCodesPasswordModal,
    setBackupCodesPassword,
    setGeneratedBackupCodes,

    // Utility
    clearMessages,
  };
};
