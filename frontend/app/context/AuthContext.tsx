"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { setGlobalLogoutHandler } from "@/app/lib/apiError";

// 1. Add 'isInitialized' to the context type
interface AuthContextType {
  jwt: string | null;
  encryptionKey: CryptoKey | null; // This is the "Master Key" (AES)
  privateKey: CryptoKey | null; // <-- RSA Private Key
  is2FAEnabled: boolean | null;
  isInitialized: boolean;
  login: (
    jwt: string,
    masterKey: CryptoKey,
    privateKey: CryptoKey, // <-- ADD THIS
    is2FAEnabled: boolean
  ) => void;
  logout: () => void;
  unlock: (masterKey: CryptoKey, privateKey: CryptoKey) => void; // <-- UPDATE THIS
  update2FAStatus: (enabled: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [jwt, setJwt] = useState<string | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null); // <-- ADD THIS
  const [is2FAEnabled, setIs2FAEnabled] = useState<boolean | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const storedJwt = localStorage.getItem("access_token");
      if (storedJwt) {
        setJwt(storedJwt);
      }
    } catch (e) {
      console.error("Failed to read from localStorage", e);
    }
    setIsInitialized(true); // Mark as loaded
  }, []);

  const logout = () => {
    setJwt(null);
    setEncryptionKey(null);
    setPrivateKey(null); // <-- ADD THIS
    setIs2FAEnabled(null);
    localStorage.removeItem("access_token");
  };

  // Register global logout handler on mount
  useEffect(() => {
    setGlobalLogoutHandler(logout);
  }, []);

  const login = (
    newJwt: string,
    newMasterKey: CryptoKey,
    newPrivateKey: CryptoKey, // <-- ADD THIS
    newIs2FAEnabled: boolean
  ) => {
    setJwt(newJwt);
    setEncryptionKey(newMasterKey);
    setPrivateKey(newPrivateKey); // <-- ADD THIS
    setIs2FAEnabled(newIs2FAEnabled);
    localStorage.setItem("access_token", newJwt);
  };

  const unlock = (newMasterKey: CryptoKey, newPrivateKey: CryptoKey) => {
    setEncryptionKey(newMasterKey);
    setPrivateKey(newPrivateKey); // <-- ADD THIS
  };

  const update2FAStatus = (enabled: boolean) => {
    setIs2FAEnabled(enabled);
  };

  const value = {
    jwt,
    encryptionKey,
    privateKey, // <-- ADD THIS
    is2FAEnabled,
    isInitialized,
    login,
    logout,
    unlock,
    update2FAStatus,
  };

  // 3. REMOVE the loading check from here.
  // We want to render the app immediately so layouts
  // can show their own loading states.
  // if (!isInitialized) { ... } // <-- DELETE THIS BLOCK

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
