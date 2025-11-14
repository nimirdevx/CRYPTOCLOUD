"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

// 1. Add 'isInitialized' to the context type
interface AuthContextType {
  jwt: string | null;
  encryptionKey: CryptoKey | null;
  is2FAEnabled: boolean | null;
  isInitialized: boolean; // <-- ADD THIS
  login: (jwt: string, key: CryptoKey, is2FAEnabled: boolean) => void;
  logout: () => void;
  unlock: (key: CryptoKey) => void;
  update2FAStatus: (enabled: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [jwt, setJwt] = useState<string | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const [is2FAEnabled, setIs2FAEnabled] = useState<boolean | null>(null);
  const [isInitialized, setIsInitialized] = useState(false); // <-- Already here

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

  const login = (
    newJwt: string,
    newKey: CryptoKey,
    newIs2FAEnabled: boolean
  ) => {
    setJwt(newJwt);
    setEncryptionKey(newKey);
    setIs2FAEnabled(newIs2FAEnabled);
    localStorage.setItem("access_token", newJwt);
  };

  const logout = () => {
    setJwt(null);
    setEncryptionKey(null);
    setIs2FAEnabled(null);
    localStorage.removeItem("access_token");
  };

  const unlock = (key: CryptoKey) => {
    setEncryptionKey(key);
  };

  const update2FAStatus = (enabled: boolean) => {
    setIs2FAEnabled(enabled);
  };

  const value = {
    jwt,
    encryptionKey,
    is2FAEnabled,
    isInitialized, // <-- 2. Pass 'isInitialized' in the value
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
