"use client";

import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";

const API_URL = "http://127.0.0.1:8000";

export default function SecurityPage() {
  const { jwt, is2FAEnabled, logout } = useAuth();
  const router = useRouter();

  const [qrCode, setQrCode] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // --- NEW STATES FOR DELETE MODAL ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // ------------------------------------

  // Helper for authenticated fetch
  const authFetch = (url: string, options: RequestInit = {}) => {
    if (!jwt) throw new Error("Not authenticated");
    return fetch(url, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${jwt}` },
    });
  };

  // --- 1. Generate QR Code ---
  const handleGenerate2FA = async () => {
    setError(null);
    setMessage(null);
    try {
      const response = await authFetch(`${API_URL}/auth/2fa/generate`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to generate 2FA secret.");

      const data = await response.json();
      setQrCode(data.qr_code_data_url); // Save the base64 image data
    } catch (err: any) {
      setError(err.message);
    }
  };

  // --- 2. Verify Code and Enable ---
  const handleVerify2FA = async () => {
    setError(null);
    setMessage(null);
    try {
      const response = await authFetch(`${API_URL}/auth/2fa/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totp_code: totpCode }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.detail || "Failed to verify code.");

      setMessage("2FA has been enabled successfully!");
      setQrCode(null); // Hide QR code
      // A simple page reload to update the "2FA is Enabled" status
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // --- 3. Handle Account Deletion ---
  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError("You must enter your password.");
      return;
    }
    setDeleteError(null);

    try {
      const response = await authFetch(`${API_URL}/auth/me`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });

      if (response.status === 204) {
        // Success!
        logout(); // Log the user out from the context
        router.push("/"); // Redirect to homepage
      } else {
        const data = await response.json();
        throw new Error(data.detail || "Failed to delete account.");
      }
    } catch (err: any) {
      setDeleteError(err.message);
    }
  };
  // ------------------------------------

  return (
    <>
      <div className="p-10 max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-10">Security</h1>

        {/* 2FA Section */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-indigo-300">
            Two-Factor Authentication (2FA)
          </h2>
          {is2FAEnabled ? (
            <div>
              <p className="text-green-400 mb-4">
                2FA is currently **Enabled** on your account.
              </p>
              {/* You could add a "Disable 2FA" button here */}
            </div>
          ) : (
            <div>
              <p className="text-gray-300 mb-4">
                Secure your account with an authenticator app.
              </p>

              {/* Step 1: Generate Button */}
              {!qrCode && (
                <button
                  onClick={handleGenerate2FA}
                  className="px-5 py-2 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition"
                >
                  Enable 2FA
                </button>
              )}

              {/* Step 2: Show QR Code and Verify Input */}
              {qrCode && (
                <div className="mt-4">
                  <p className="text-gray-300 mb-2">
                    Scan this QR code with your authenticator app (like Google
                    Authenticator):
                  </p>
                  <div className="bg-white p-4 rounded-md inline-block">
                    <Image
                      src={qrCode}
                      alt="2FA QR Code"
                      width={200}
                      height={200}
                    />
                  </div>
                  [Image of a smartphone scanning a TOTP QR code from a website]
                  <p className="text-gray-300 mt-4 mb-2">
                    Then, enter the 6-digit code to verify:
                  </p>
                  <div className="flex gap-4">
                    <input
                      type="text"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value)}
                      className="w-full max-w-xs p-3 bg-gray-700 rounded-md border border-gray-600"
                      maxLength={6}
                    />
                    <button
                      onClick={handleVerify2FA}
                      className="px-5 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition"
                    >
                      Verify & Enable
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Status Messages */}
          <div className="h-6 mt-4">
            {error && <p className="text-red-400">{error}</p>}
            {message && <p className="text-green-300">{message}</p>}
          </div>
        </div>

        {/* --- Delete Account Section --- */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-red-500/50">
          <h2 className="text-2xl font-semibold mb-4 text-red-400">
            Danger Zone
          </h2>
          <p className="text-gray-300 mb-4">
            Deleting your account is irreversible. All your files and account
            data will be permanently wiped.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-5 py-2 font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 transition"
          >
            Delete My Account
          </button>
        </div>
        {/* ------------------------------------ */}
      </div>

      {/* --- Delete Confirmation Modal --- */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-800 p-8 rounded-lg shadow-2xl max-w-md w-full">
            <h2 className="text-2xl font-bold text-red-400 mb-4">
              Are you sure?
            </h2>
            <p className="text-gray-300 mb-6">
              This action cannot be undone. All your encrypted files and
              metadata will be permanently destroyed.
            </p>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium">
                To confirm, please enter your password:
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            {deleteError && (
              <p className="text-red-400 text-sm mb-4">{deleteError}</p>
            )}
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-5 py-2 font-semibold text-gray-300 bg-gray-600 rounded-md hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-5 py-2 font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 transition"
              >
                Delete My Account
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ------------------------------------ */}
    </>
  );
}
