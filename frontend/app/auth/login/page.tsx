"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { deriveKey } from "@/app/lib/crypto";

const API_URL = "http://127.0.0.1:8000";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState(""); // <-- ADD 2FA CODE STATE
  const [error, setError] = useState<string | null>(null);
  const [needs2FA, setNeeds2FA] = useState(false); // <-- ADD 2FA STEP STATE
  const [isLoading, setIsLoading] = useState(false); // <-- ADD LOADING STATE

  const router = useRouter();
  const { login, jwt , isInitialized } = useAuth();

  useEffect(() => {
    // 2. Wait for context
    if (!isInitialized) {
      return;
    }
    
    // 3. Now, safely redirect
    if (jwt) {
      router.push('/dashboard');
    }
  }, [jwt, isInitialized, router]); // 4. Add 'isInitialized'

  useEffect(() => {
    if (jwt) {
      router.push("/dashboard");
    }
  }, [jwt, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (needs2FA) {
      // --- This is the 2FA LOGIN flow ---
      try {
        const response = await fetch(`${API_URL}/auth/2fa/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username, // Send username and password again
            password,
            totp_code: totpCode, // Plus the 2FA code
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || "2FA Login failed");
        }

        const jwtToken = data.access_token;
        const is2FAEnabled = data.is_2fa_enabled;

        // Derive the key
        const encryptionKey = await deriveKey(password);

        // Save to context
        login(jwtToken, encryptionKey, is2FAEnabled);

        router.push("/dashboard");
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    } else {
      // --- This is the STANDARD LOGIN flow ---
      try {
        const formData = new FormData();
        formData.append("username", username);
        formData.append("password", password);

        const response = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
          // CHECK FOR 2FA_REQUIRED
          if (data.detail === "2FA_REQUIRED") {
            setNeeds2FA(true); // Show the 2FA input
            setError(null);
          } else {
            throw new Error(data.detail || "Login failed");
          }
        } else {
          // --- Standard Login Success ---
          const jwtToken = data.access_token;
          const is2FAEnabled = data.is_2fa_enabled;
          const encryptionKey = await deriveKey(password);
          login(jwtToken, encryptionKey, is2FAEnabled);
          router.push("/dashboard");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!isInitialized || jwt) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <form
        onSubmit={handleSubmit}
        className="p-8 bg-gray-800 rounded-lg shadow-xl w-full max-w-sm"
      >
        <h2 className="text-3xl font-bold mb-6 text-center text-indigo-400">
          {needs2FA ? "Enter 2FA Code" : "Sign In"}
        </h2>

        {/* --- Show this part ONLY if 2FA is NOT needed --- */}
        {!needs2FA && (
          <>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

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
          </>
        )}

        {/* --- Show this part ONLY if 2FA IS needed --- */}
        {needs2FA && (
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium">
              6-Digit Code
            </label>
            <input
              type="text"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
              maxLength={6}
            />
          </div>
        )}

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full p-3 bg-indigo-600 rounded-md font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {isLoading ? "Loading..." : needs2FA ? "Verify Code" : "Sign In"}
        </button>

        {!needs2FA && (
          <p className="text-center text-sm mt-4">
            Need an account?{" "}
            <Link href="/auth/register" className="text-indigo-400 hover:underline">
              Register here
            </Link>
          </p>
        )}
      </form>
    </div>
  );
}
