/**
 * Authentication Service
 * Handles all authentication and 2FA API operations
 */

import {
  LoginResponse,
  RegisterResponse,
  TwoFactorSetupResponse,
  TwoFactorStatusResponse,
} from "@/app/types";
import { API_URL } from "@/app/config/constants";

/**
 * Auth Service Class
 * Encapsulates all authentication-related API calls
 */
export class AuthService {
  /**
   * Login user
   */
  async login(
    username: string,
    password: string,
    totpCode?: string
  ): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        password,
        totp_code: totpCode,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.detail || "Login failed");
    }

    return response.json();
  }

  /**
   * Register new user
   */
  async register(
    username: string,
    email: string,
    password: string,
    publicKey: string
  ): Promise<RegisterResponse> {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        email,
        password,
        publicKey,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.detail || "Registration failed");
    }

    return response.json();
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.detail || "Password reset request failed");
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        new_password: newPassword,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.detail || "Password reset failed");
    }
  }

  /**
   * Setup 2FA for user
   */
  async setup2FA(jwt: string): Promise<TwoFactorSetupResponse> {
    const response = await fetch(`${API_URL}/auth/2fa/setup`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.detail || "2FA setup failed");
    }

    return response.json();
  }

  /**
   * Enable 2FA after setup
   */
  async enable2FA(jwt: string, totpCode: string): Promise<void> {
    const response = await fetch(`${API_URL}/auth/2fa/enable`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ totp_code: totpCode }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.detail || "Failed to enable 2FA");
    }
  }

  /**
   * Generate 2FA QR code
   */
  async generate2FA(jwt: string): Promise<{ qr_code_data_url: string }> {
    const response = await fetch(`${API_URL}/auth/2fa/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.detail || "Failed to generate 2FA secret");
    }

    return response.json();
  }

  /**
   * Verify 2FA code and enable 2FA
   */
  async verify2FA(jwt: string, totpCode: string): Promise<void> {
    const response = await fetch(`${API_URL}/auth/2fa/verify`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ totp_code: totpCode }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.detail || "Failed to verify code");
    }
  }

  /**
   * Disable 2FA (requires password, not TOTP code)
   */
  async disable2FA(jwt: string, password: string): Promise<void> {
    const response = await fetch(`${API_URL}/auth/2fa/disable`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.detail || "Failed to disable 2FA");
    }
  }

  /**
   * Generate backup codes (requires password)
   */
  async generateBackupCodes(jwt: string, password: string): Promise<string[]> {
    const response = await fetch(`${API_URL}/auth/2fa/generate-backup-codes`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.detail || "Failed to generate backup codes");
    }

    return response.json();
  }

  /**
   * Get 2FA status
   */
  async get2FAStatus(jwt: string): Promise<TwoFactorStatusResponse> {
    const response = await fetch(`${API_URL}/auth/2fa/status`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.detail || "Failed to get 2FA status");
    }

    return response.json();
  }

  /**
   * Verify backup code
   */
  async verifyBackupCode(
    username: string,
    password: string,
    backupCode: string
  ): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/auth/2fa/verify-backup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        password,
        backup_code: backupCode,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.detail || "Backup code verification failed");
    }

    return response.json();
  }
}

/**
 * Factory function to create a new AuthService instance
 */
export const createAuthService = (): AuthService => {
  return new AuthService();
};

/**
 * Singleton instance for convenience
 */
export const authService = new AuthService();
