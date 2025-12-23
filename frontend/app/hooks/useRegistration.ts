import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import {
  deriveKey,
  generateRsaKeyPair,
  exportPublicKey,
  encryptPrivateKey,
} from "@/app/lib/crypto";
import { API_URL } from "@/app/config/constants";

interface RegistrationState {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  error: string | null;
  isLoading: boolean;
  showPassword: boolean;
  showConfirmPassword: boolean;
}

export const useRegistration = () => {
  const [state, setState] = useState<RegistrationState>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    error: null,
    isLoading: false,
    showPassword: false,
    showConfirmPassword: false,
  });

  const { jwt } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (jwt) {
      router.push("/dashboard");
    }
  }, [jwt, router]);

  // Reusable state updater
  const updateState = useCallback((updates: Partial<RegistrationState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Validate password strength
  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }
    return null;
  };

  // Validate email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateState({ error: null, isLoading: true });

    try {
      // Validate username
      if (state.username.length < 3) {
        throw new Error("Username must be at least 3 characters long");
      }

      // Validate email
      if (!validateEmail(state.email)) {
        throw new Error("Please enter a valid email address");
      }

      // Validate password strength
      const passwordError = validatePassword(state.password);
      if (passwordError) {
        throw new Error(passwordError);
      }

      // Validate password confirmation
      if (state.password !== state.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      // Generate all keys client-side
      const masterKey = await deriveKey(state.password);
      const { publicKey, privateKey } = await generateRsaKeyPair();
      const publicKeyString = await exportPublicKey(publicKey);
      const encryptedPrivateKeyString = await encryptPrivateKey(
        masterKey,
        privateKey
      );

      // Send registration request to backend
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: state.username,
          password: state.password,
          email: state.email,
          publicKey: publicKeyString,
          encryptedPrivateKey: encryptedPrivateKeyString,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Registration failed");
      }

      // Success! Redirect to login page
      router.push("/auth/login");
    } catch (err: any) {
      console.error("Registration error:", err);
      updateState({ error: err.message, isLoading: false });
    }
  };

  // Setters
  const setUsername = useCallback(
    (username: string) => {
      updateState({ username });
    },
    [updateState]
  );

  const setEmail = useCallback(
    (email: string) => {
      updateState({ email });
    },
    [updateState]
  );

  const setPassword = useCallback(
    (password: string) => {
      updateState({ password });
    },
    [updateState]
  );

  const setConfirmPassword = useCallback(
    (confirmPassword: string) => {
      updateState({ confirmPassword });
    },
    [updateState]
  );

  const setShowPassword = useCallback(
    (showPassword: boolean) => {
      updateState({ showPassword });
    },
    [updateState]
  );

  const setShowConfirmPassword = useCallback(
    (showConfirmPassword: boolean) => {
      updateState({ showConfirmPassword });
    },
    [updateState]
  );

  const togglePasswordVisibility = useCallback(() => {
    updateState({ showPassword: !state.showPassword });
  }, [state.showPassword, updateState]);

  const toggleConfirmPasswordVisibility = useCallback(() => {
    updateState({ showConfirmPassword: !state.showConfirmPassword });
  }, [state.showConfirmPassword, updateState]);

  return {
    // State
    ...state,
    jwt,

    // Actions
    handleSubmit,
    setUsername,
    setEmail,
    setPassword,
    setConfirmPassword,
    setShowPassword,
    setShowConfirmPassword,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility,
  };
};
