"use client";

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
// 1. IMPORT new crypto function
import { deriveKey, decryptPrivateKey } from "../lib/crypto";
import { API_URL } from "../config/constants";

export default function PasswordPrompt() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // 2. Get 'jwt' and update 'unlock'
  const { unlock, logout, jwt } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // --- 3. Verify Password ---
      const response = await fetch(`${API_URL}/auth/verify-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`, // We are already authenticated
        },
        body: JSON.stringify({ password: password }),
      });

      if (!response.ok) {
        // The server (401) will tell us the password was wrong
        throw new Error("Incorrect password. Please try again.");
      }
      // --- End of verification step ---

      // --- 4. Password is correct. Derive/Fetch/Decrypt ALL keys ---

      // A) Derive the master key
      const masterKey = await deriveKey(password);

      // B) Fetch the encrypted private key
      const keysResponse = await fetch(`${API_URL}/auth/me/keys`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (!keysResponse.ok) throw new Error("Failed to fetch user keys.");

      const { encryptedPrivateKey } = await keysResponse.json();
      if (!encryptedPrivateKey) throw new Error("User keys are not set up.");

      // C) Decrypt the private key
      const privateKey = await decryptPrivateKey(
        masterKey,
        encryptedPrivateKey
      );

      // 5. Save BOTH keys to the context. We're "unlocked"!
      unlock(masterKey, privateKey); // <-- Pass both keys
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <form
        onSubmit={handleSubmit}
        className="relative z-10 bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md animate-scale-up"
      >
        {/* Icon Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 bg-linear-to-br from-[#7c5cff] to-[#6b4ce6] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[#7c5cff]/30">
            <svg
              className="w-10 h-10 text-white"
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
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">
            Session Locked
          </h2>
          <p className="text-[1rem] text-gray-600 text-center">
            Your session has been locked for security
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <div className="shrink-0">
              <svg
                className="w-5 h-5 text-blue-600 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-[1rem] text-gray-700 leading-relaxed">
              Enter your password to unlock and decrypt your files. This keeps
              your data secure even if you step away.
            </p>
          </div>
        </div>

        {/* Password Input */}
        <div className="mb-6">
          <label className="block mb-3 text-[1rem] font-semibold text-gray-900">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-12 py-3.5 bg-white rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#7c5cff]/20 focus:border-[#7c5cff] text-gray-900 placeholder-gray-400 transition-all text-[1rem]"
              placeholder="Enter your password"
              required
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl animate-slide-in">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-600 shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-[1rem] text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Unlock Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 bg-linear-to-r from-[#7c5cff] to-[#6b4ce6] rounded-xl font-semibold text-white hover:from-[#6b4ce6] hover:to-[#5a3dd5] transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-[#7c5cff]/30 hover:shadow-[#7c5cff]/40 flex items-center justify-center gap-2 mb-4 text-[1rem]"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Unlocking...</span>
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                />
              </svg>
              <span>Unlock Session</span>
            </>
          )}
        </button>

        {/* Logout Alternative */}
        <button
          type="button"
          onClick={logout}
          className="w-full py-2.5 text-center text-gray-600 text-[1rem] hover:text-gray-900 transition-colors flex items-center justify-center gap-2 group hover:bg-gray-50 rounded-xl"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span className="group-hover:underline">Log out instead</span>
        </button>
      </form>
    </div>
  );
}
