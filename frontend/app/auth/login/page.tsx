"use client";

import { useState, useEffect } from "react"; // 1. Added useEffect
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { deriveKey } from "@/app/lib/crypto";

const API_URL = "http://127.0.0.1:8000";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { login, jwt } = useAuth(); // 2. Get jwt from context

  // 3. Add redirect logic
  useEffect(() => {
    if (jwt) {
      router.push("/dashboard");
    }
  }, [jwt, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // --- Task 1: Authenticate with the server ---
    try {
      // Your backend expects FormData, not JSON!
      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        body: formData, // Send as FormData
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Login failed");
      }

      const data = await response.json();
      const jwtToken = data.access_token; // Renamed to avoid conflict

      // --- Task 2: Derive Encryption Key (Client-Side) ---
      // We use the *same password* from the form state
      const encryptionKey = await deriveKey(password);

      // --- Success! ---
      // Save both the JWT and the Encryption Key to our global context
      login(jwtToken, encryptionKey);

      // Redirect to the dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
  };

  // 4. Show loading/null while redirecting
  if (jwt) {
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
          Sign In
        </h2>

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

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <button
          type="submit"
          className="w-full p-3 bg-indigo-600 rounded-md font-semibold hover:bg-indigo-700 transition"
        >
          Sign In
        </button>

        <p className="text-center text-sm mt-4">
          Need an account?{" "}
          <Link href="/auth/register" className="text-indigo-400 hover:underline">
            Register here
          </Link>
        </p>
      </form>
    </div>
  );
}
