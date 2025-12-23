import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { deriveKey, decryptPrivateKey } from "@/app/lib/crypto";
import { API_URL } from "@/app/config/constants";

interface LoginState {
  username: string;
  password: string;
  totpCode: string;
  error: string | null;
  needs2FA: boolean;
  isLoading: boolean;
  showPassword: boolean;
  useBackupCode: boolean;
}

export const useLogin = () => {
  const router = useRouter();
  const { login, jwt, isInitialized } = useAuth();

  // Initialize all state
  const [state, setState] = useState<LoginState>({
    username: "",
    password: "",
    totpCode: "",
    error: null,
    needs2FA: false,
    isLoading: false,
    showPassword: false,
    useBackupCode: false,
  });

  // Helper to update state
  const updateState = useCallback((updates: Partial<LoginState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Helper to fetch and decrypt keys
  const fetchAndDecryptKeys = useCallback(
    async (token: string, masterKey: CryptoKey) => {
      const keysResponse = await fetch(`${API_URL}/auth/me/keys`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!keysResponse.ok) {
        throw new Error("Failed to fetch user keys.");
      }

      const { encryptedPrivateKey } = await keysResponse.json();
      if (!encryptedPrivateKey) {
        throw new Error("User keys are not set up.");
      }

      return await decryptPrivateKey(masterKey, encryptedPrivateKey);
    },
    []
  );

  // Handle 2FA login
  const handle2FALogin = useCallback(async () => {
    updateState({ error: null, isLoading: true });

    try {
      const response = await fetch(`${API_URL}/auth/2fa/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: state.username,
          password: state.password,
          totp_code: state.totpCode,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "2FA Login failed");
      }

      const jwtToken = data.access_token;
      const is2FAEnabled = data.is_2fa_enabled;

      // Derive key and decrypt private key
      const masterKey = await deriveKey(state.password);
      const privateKey = await fetchAndDecryptKeys(jwtToken, masterKey);
      login(jwtToken, masterKey, privateKey, is2FAEnabled);

      router.push("/dashboard");
    } catch (err: any) {
      updateState({ error: err.message, isLoading: false });
    }
  }, [
    state.username,
    state.password,
    state.totpCode,
    fetchAndDecryptKeys,
    login,
    router,
    updateState,
  ]);

  // Note: Backup codes are handled by the same handle2FALogin function
  // The backend's /auth/2fa/login endpoint checks TOTP first, then falls back to backup codes

  // Handle standard login
  const handleStandardLogin = useCallback(async () => {
    updateState({ error: null, isLoading: true });

    try {
      const formData = new FormData();
      formData.append("username", state.username);
      formData.append("password", state.password);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        // Check for 2FA requirement
        if (data.detail === "2FA_REQUIRED") {
          updateState({ needs2FA: true, error: null, isLoading: false });
          return;
        }
        throw new Error(data.detail || "Login failed");
      }

      // Standard login success
      const jwtToken = data.access_token;
      const is2FAEnabled = data.is_2fa_enabled;

      // Derive key and decrypt private key
      const masterKey = await deriveKey(state.password);
      const privateKey = await fetchAndDecryptKeys(jwtToken, masterKey);
      login(jwtToken, masterKey, privateKey, is2FAEnabled);

      router.push("/dashboard");
    } catch (err: any) {
      updateState({ error: err.message, isLoading: false });
    }
  }, [
    state.username,
    state.password,
    fetchAndDecryptKeys,
    login,
    router,
    updateState,
  ]);

  // Main submit handler
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (state.needs2FA) {
        // Both TOTP codes and backup codes use the same endpoint
        await handle2FALogin();
      } else {
        await handleStandardLogin();
      }
    },
    [state.needs2FA, handle2FALogin, handleStandardLogin]
  );

  // Field setters
  const setUsername = useCallback(
    (username: string) => {
      updateState({ username });
    },
    [updateState]
  );

  const setPassword = useCallback(
    (password: string) => {
      updateState({ password });
    },
    [updateState]
  );

  const setTotpCode = useCallback(
    (totpCode: string) => {
      updateState({ totpCode });
    },
    [updateState]
  );

  const setShowPassword = useCallback(
    (showPassword: boolean) => {
      updateState({ showPassword });
    },
    [updateState]
  );

  const setUseBackupCode = useCallback(
    (useBackupCode: boolean) => {
      updateState({ useBackupCode, totpCode: "", error: null });
    },
    [updateState]
  );

  const togglePasswordVisibility = useCallback(() => {
    updateState({ showPassword: !state.showPassword });
  }, [state.showPassword, updateState]);

  const resetToStandardLogin = useCallback(() => {
    updateState({
      needs2FA: false,
      totpCode: "",
      error: null,
      useBackupCode: false,
    });
  }, [updateState]);

  return {
    // State
    ...state,
    jwt,
    isInitialized,

    // Actions
    handleSubmit,
    setUsername,
    setPassword,
    setTotpCode,
    setShowPassword,
    setUseBackupCode,
    togglePasswordVisibility,
    resetToStandardLogin,
  };
};
