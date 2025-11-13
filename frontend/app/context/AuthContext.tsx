'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the shape of our context data
interface AuthContextType {
  jwt: string | null;
  encryptionKey: CryptoKey | null;
  login: (jwt: string, key: CryptoKey) => void;
  logout: () => void;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [jwt, setJwt] = useState<string | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);

  const login = (newJwt: string, newKey: CryptoKey) => {
    setJwt(newJwt);
    setEncryptionKey(newKey);
    // In a real app, you might save the JWT to an httpOnly cookie
  };

  const logout = () => {
    setJwt(null);
    setEncryptionKey(null);
    // Also clear the cookie
  };

  return (
    <AuthContext.Provider value={{ jwt, encryptionKey, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Create a custom hook to easily use the context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}