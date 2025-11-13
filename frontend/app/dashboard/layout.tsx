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
      <div className="flex flex-col items-center justify-center min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="glass p-8 rounded-2xl shadow-2xl animate-slide-up">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold text-white mb-1">
                Initializing Session
              </p>
              <p className="text-sm text-gray-400">
                Setting up your secure environment...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Auth is loaded, but user is not logged in.
  // This state is brief, as the useEffect above will redirect.
  if (!jwt) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="glass p-8 rounded-2xl shadow-2xl animate-slide-up">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold text-white mb-1">
                Redirecting...
              </p>
              <p className="text-sm text-gray-400">
                Taking you to the login page
              </p>
            </div>
          </div>
        </div>
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
