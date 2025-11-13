"use client";

import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import PasswordPrompt from "../components/PasswordPrompt";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Get 'isInitialized' from the context
  const { jwt, encryptionKey, isInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 2. Wait for the context to be ready
    if (!isInitialized) {
      return; // Do nothing until auth is loaded
    }

    // 3. Now we can safely check for the JWT
    if (!jwt) {
      router.push("/auth/login");
    }
  }, [jwt, isInitialized, router]); // 4. Add 'isInitialized' to dependencies

  // --- This is the new render logic ---

  // 1. Show a loading screen while context is initializing
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl">Initializing Session...</p>
      </div>
    );
  }

  // 2. Auth is loaded, but user is not logged in.
  // This state is brief, as the useEffect above will redirect.
  if (!jwt) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl">Redirecting to login...</p>
      </div>
    );
  }

  // 3. User is logged in (has JWT) but app is LOCKED (no key)
  if (jwt && !encryptionKey) {
    return (
      <>
        <PasswordPrompt />
        {/* Blur the background app for security and UX */}
        <div className="blur-sm grayscale pointer-events-none">{children}</div>
      </>
    );
  }

  // 4. User is logged in AND unlocked!
  return <>{children}</>;
}
