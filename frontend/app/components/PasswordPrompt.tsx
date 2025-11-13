"use client";

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { deriveKey } from "../lib/crypto"; // We reuse our crypto function

export default function PasswordPrompt() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { unlock, logout } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // 1. Re-derive the encryption key
      const encryptionKey = await deriveKey(password);

      // 2. Save it to the context. We're "unlocked"!
      unlock(encryptionKey);

      // We can't actually verify if the password was correct until
      // the user tries to decrypt a file, which is fine.
    } catch (err: any) {
      setError("Failed to derive key. Please try again.");
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-sm flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="p-8 bg-gray-800 rounded-lg shadow-xl w-full max-w-sm"
      >
        <h2 className="text-3xl font-bold mb-4 text-center text-indigo-400">
          Session Locked
        </h2>
        <p className="text-gray-300 text-center mb-6">
          Please enter your password to decrypt your session.
        </p>

        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full p-3 bg-indigo-600 rounded-md font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {isLoading ? "Unlocking..." : "Unlock"}
        </button>
        <button
          type="button"
          onClick={logout}
          className="w-full p-3 mt-2 text-center text-gray-400 text-sm hover:underline"
        >
          Log out instead
        </button>
      </form>
    </div>
  );
}
