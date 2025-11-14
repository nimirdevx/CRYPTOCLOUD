"use client";

import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
      <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-10 animate-slide-up">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors group mb-6"
            >
              <svg
                className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span>Back to Dashboard</span>
            </Link>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center">
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
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">
                  Security Settings
                </h1>
                <p className="text-gray-400 mt-1">
                  Manage your account security and authentication
                </p>
              </div>
            </div>
          </div>

          {/* 2FA Section */}
          <div
            className="glass p-8 rounded-2xl shadow-2xl mb-8 animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <svg
                    className="w-6 h-6 text-indigo-400"
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
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-1">
                    Two-Factor Authentication (2FA)
                  </h2>
                  <p className="text-sm text-gray-400">
                    Add an extra layer of security to your account
                  </p>
                </div>
              </div>

              {is2FAEnabled && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/50 rounded-lg">
                  <svg
                    className="w-4 h-4 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-medium text-green-400">
                    Enabled
                  </span>
                </div>
              )}
            </div>

            {is2FAEnabled ? (
              <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center shrink-0">
                    <svg
                      className="w-6 h-6 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Your account is protected
                    </h3>
                    <p className="text-gray-300">
                      Two-factor authentication is currently{" "}
                      <span className="text-green-400 font-semibold">
                        enabled
                      </span>{" "}
                      on your account. You'll need to enter a code from your
                      authenticator app when signing in.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-6 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center shrink-0">
                      <svg
                        className="w-6 h-6 text-yellow-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Enhance your security
                      </h3>
                      <p className="text-gray-300 mb-4">
                        Two-factor authentication adds an extra layer of
                        protection to your account. Use an authenticator app
                        like{" "}
                        <span className="font-semibold text-indigo-400">
                          Google Authenticator
                        </span>{" "}
                        or{" "}
                        <span className="font-semibold text-indigo-400">
                          Authy
                        </span>
                        .
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 1: Generate Button */}
                {!qrCode && (
                  <button
                    onClick={handleGenerate2FA}
                    className="px-6 py-3 font-semibold text-white bg-linear-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-indigo-500/50 flex items-center gap-2"
                  >
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
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    Enable Two-Factor Authentication
                  </button>
                )}

                {/* Step 2: Show QR Code and Verify Input */}
                {qrCode && (
                  <div className="space-y-6 animate-slide-in">
                    <div className="bg-gray-700/30 p-6 rounded-xl">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center shrink-0">
                          <span className="text-indigo-400 font-bold">1</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-2">
                            Scan QR Code
                          </h3>
                          <p className="text-gray-300 mb-4">
                            Open your authenticator app and scan this QR code:
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-center">
                        <div className="bg-white p-4 rounded-xl inline-block shadow-xl">
                          <Image
                            src={qrCode}
                            alt="2FA QR Code"
                            width={220}
                            height={220}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-700/30 p-6 rounded-xl">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center shrink-0">
                          <span className="text-indigo-400 font-bold">2</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-2">
                            Verify Code
                          </h3>
                          <p className="text-gray-300 mb-4">
                            Enter the 6-digit code from your authenticator app:
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={totpCode}
                            onChange={(e) => setTotpCode(e.target.value)}
                            className="w-full p-4 bg-gray-700/50 backdrop-blur-sm rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white text-center text-2xl tracking-widest placeholder-gray-500 transition-all"
                            placeholder="000000"
                            maxLength={6}
                          />
                        </div>
                        <button
                          onClick={handleVerify2FA}
                          className="px-6 py-4 font-semibold text-white bg-linear-to-r from-green-600 to-emerald-600 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-green-500/50 flex items-center justify-center gap-2 min-w-[180px]"
                        >
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
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Verify & Enable
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Status Messages */}
            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg animate-slide-in">
                <p className="text-red-400 text-sm flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {error}
                </p>
              </div>
            )}
            {message && (
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/50 rounded-lg animate-slide-in">
                <p className="text-green-400 text-sm flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {message}
                </p>
              </div>
            )}
          </div>

          {/* Delete Account Section */}
          <div
            className="glass p-8 rounded-2xl shadow-2xl border-2 border-red-500/30 animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center shrink-0">
                <svg
                  className="w-6 h-6 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-red-400 mb-1">
                  Danger Zone
                </h2>
                <p className="text-sm text-gray-400">
                  Irreversible and destructive actions
                </p>
              </div>
            </div>

            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Delete Account
              </h3>
              <p className="text-gray-300 mb-4">
                Once you delete your account, there is no going back. All your
                encrypted files and account data will be{" "}
                <span className="text-red-400 font-semibold">
                  permanently deleted
                </span>
                .
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-6 py-3 font-semibold text-white bg-red-600/80 rounded-lg hover:bg-red-600 transition-all flex items-center gap-2 group"
              >
                <svg
                  className="w-5 h-5 group-hover:scale-110 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete My Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass p-8 rounded-2xl shadow-2xl max-w-md w-full border-2 border-red-500/30 animate-slide-up">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-red-500/20 rounded-xl flex items-center justify-center shrink-0">
                <svg
                  className="w-8 h-8 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-red-400">
                Delete Account?
              </h2>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
              <p className="text-gray-300 text-sm">
                <strong className="text-white">
                  This action cannot be undone.
                </strong>{" "}
                All your encrypted files and metadata will be permanently
                destroyed and cannot be recovered.
              </p>
            </div>

            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium text-gray-300">
                Confirm your password to continue:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-500"
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
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full pl-10 p-3 bg-gray-700/50 backdrop-blur-sm rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-white placeholder-gray-400 transition-all"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {deleteError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg animate-slide-in">
                <p className="text-red-400 text-sm flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {deleteError}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword("");
                  setDeleteError(null);
                }}
                className="flex-1 px-6 py-3 font-semibold text-gray-300 glass-light rounded-lg hover:bg-gray-600/50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 px-6 py-3 font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all flex items-center justify-center gap-2"
              >
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
