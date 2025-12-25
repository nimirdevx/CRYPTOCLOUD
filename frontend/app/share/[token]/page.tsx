"use client";

/**
 * Public Share Access Page
 * Anonymous users can access shared files via public links
 *
 * PRIVACY: Decryption happens client-side using key from URL fragment
 */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getPublicLinkMetadata,
  downloadPublicFile,
  extractKeyFromUrl,
} from "@/app/services/publicShareService";
import type { PublicShareMetadata } from "@/app/types";

export default function PublicSharePage() {
  const params = useParams();
  const token = params.token as string;

  const [metadata, setMetadata] = useState<PublicShareMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [decryptionKey, setDecryptionKey] = useState<string | null>(null);

  // Extract decryption key from URL fragment
  useEffect(() => {
    const extractKey = () => {
      const hash = window.location.hash;
      if (!hash) {
        setError("Invalid link - missing decryption key");
        setLoading(false);
        return;
      }

      // Parse the hash manually to avoid URLSearchParams decoding issues
      // Format: #key=base64encodedkey (URL-safe base64: no padding, - instead of +, _ instead of /)
      const keyMatch = hash.match(/[#&]key=([^&]+)/);
      if (!keyMatch) {
        setError("Invalid link - missing decryption key");
        setLoading(false);
        return;
      }

      try {
        // Decode URL-safe base64 (convert back to standard base64 and decode)
        let keyBase64 = keyMatch[1];

        // Convert URL-safe base64 to standard base64
        keyBase64 = keyBase64.replace(/-/g, "+").replace(/_/g, "/");

        // Add padding if needed
        while (keyBase64.length % 4) {
          keyBase64 += "=";
        }

        const decodedKey = atob(keyBase64);
        setDecryptionKey(decodedKey);
      } catch (e) {
        console.error("Failed to decode key:", e);
        setError("Invalid link - corrupted decryption key");
        setLoading(false);
      }
    };

    extractKey();
  }, []);

  // Fetch link metadata
  useEffect(() => {
    if (!token || !decryptionKey) return;

    async function fetchMetadata() {
      try {
        const data = await getPublicLinkMetadata(token);
        setMetadata(data);
      } catch (err: any) {
        setError(err.message || "Failed to load file information");
      } finally {
        setLoading(false);
      }
    }

    fetchMetadata();
  }, [token, decryptionKey]);

  const handleDownload = async () => {
    if (!decryptionKey) {
      setError("Decryption key not found");
      return;
    }

    setDownloading(true);
    setError(null);

    try {
      // 1. Get encrypted file URL from server
      const downloadData = await downloadPublicFile(token, {
        password: metadata?.password_required ? password : undefined,
      });

      // 2. Download encrypted file
      const response = await fetch(downloadData.download_url);
      if (!response.ok) throw new Error("Failed to download file");

      const encryptedBlob = await response.blob();

      // 3. Decrypt file client-side
      // TODO: Implement actual decryption using decryptionKey
      // For now, just trigger download (you'll need to add crypto utils)
      const decryptedBlob = await decryptFile(encryptedBlob, decryptionKey);

      // 4. Trigger download
      const url = URL.createObjectURL(decryptedBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadData.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || "Failed to download file");
    } finally {
      setDownloading(false);
    }
  };

  // Decrypt file using client-side Web Crypto API
  async function decryptFile(
    encryptedBlob: Blob,
    keyString: string // Already decoded from base64 in useEffect
  ): Promise<Blob> {
    try {
      // 1. Convert the decoded key string to ArrayBuffer
      const keyBuffer = new Uint8Array(keyString.length);
      for (let i = 0; i < keyString.length; i++) {
        keyBuffer[i] = keyString.charCodeAt(i);
      }

      // 2. Import the key as a CryptoKey
      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyBuffer,
        { name: "AES-GCM" },
        false,
        ["decrypt"]
      );

      // 3. Read encrypted data from blob
      const encryptedBuffer = await encryptedBlob.arrayBuffer();

      // 4. Extract IV (first 12 bytes) and ciphertext
      const iv = encryptedBuffer.slice(0, 12);
      const ciphertext = encryptedBuffer.slice(12);

      // 5. Decrypt using Web Crypto API
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: new Uint8Array(iv) },
        cryptoKey,
        ciphertext
      );

      // 6. Return as Blob
      return new Blob([decryptedBuffer]);
    } catch (error) {
      console.error("Decryption error:", error);
      throw new Error(
        "Failed to decrypt file. The link may be invalid or corrupted."
      );
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#7c5cff]"></div>
            <div className="absolute inset-0 rounded-full bg-[#7c5cff]/10 animate-pulse"></div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">Loading your file...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 p-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full border border-gray-100">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-red-500"
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
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              {error.includes("expired")
                ? "Link Expired"
                : "Unable to Load File"}
            </h1>
            <p className="text-gray-600 leading-relaxed">{error}</p>
            {error.includes("expired") && (
              <p className="mt-4 text-sm text-gray-500">
                This link has expired for security. Please request a new link.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!metadata) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gray-100 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-24">
            {/* Left: Enhanced Title Section */}
            <div className="flex items-center gap-4">
              {/* Icon Badge */}
              <div className="w-14 h-14 bg-linear-to-br from-[#7c5cff]/10 to-[#6a4de6]/10 rounded-2xl flex items-center justify-center border-2 border-[#7c5cff]/20">
                <svg
                  className="w-7 h-7 text-[#7c5cff]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
              </div>

              {/* Text Content */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  File Shared With You
                </h2>
                <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                  <svg
                    className="w-4 h-4 text-[#7c5cff]"
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
                  <span className="font-medium">End-to-end encrypted</span>
                  <span className="text-gray-400">•</span>
                  <span>Download securely</span>
                </p>
              </div>
            </div>

            {/* Right: Logo and Folder Icon */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-linear-to-br from-[#7c5cff] to-[#6a4de6] rounded-2xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <h1 className="text-xl font-bold text-gray-900">
                    CryptoCloud
                  </h1>
                  <p className="text-xs text-gray-500">Secure File Sharing</p>
                </div>
              </div>

              {/* Folder Icon */}
              <div className="flex items-center">
                <svg
                  className="w-10 h-10 text-[#7c5cff]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto py-12 px-4">
        {/* Main Card - Floating Island Effect */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
          {/* File Preview Header */}
          <div className="relative bg-linear-to-br from-[#7c5cff] to-[#6a4de6] p-8">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
            <div className="relative flex items-center gap-6">
              {/* File Icon */}
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shrink-0">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white/80 mb-1">
                  FILENAME
                </p>
                <h3 className="text-2xl font-bold text-white break-all mb-2">
                  {metadata.filename}
                </h3>
                <div className="flex items-center gap-4 text-sm text-white/90">
                  <span className="flex items-center gap-1">
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
                        d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                      />
                    </svg>
                    {formatFileSize(metadata.file_size)}
                  </span>
                  <span className="flex items-center gap-1">
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
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                      />
                    </svg>
                    {metadata.download_count}{" "}
                    {metadata.download_count === 1 ? "download" : "downloads"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {/* Shared Date */}
              <div className="bg-linear-to-br from-blue-50 to-white rounded-2xl p-5 border border-gray-100 hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                      Shared On
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(metadata.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Expires */}
              <div className="bg-linear-to-br from-orange-50 to-white rounded-2xl p-5 border border-gray-100 hover:border-orange-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-orange-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                      Expires
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(metadata.expires_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Security */}
              <div className="bg-linear-to-br from-purple-50 to-white rounded-2xl p-5 border border-gray-100 hover:border-purple-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    {metadata.password_required ? (
                      <svg
                        className="w-5 h-5 text-purple-600"
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
                    ) : (
                      <svg
                        className="w-5 h-5 text-purple-600"
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
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                      Security
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {metadata.password_required
                        ? "Password Required"
                        : "Public Access"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Password Input */}
            {metadata.password_required && (
              <div className="mb-8">
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  🔒 Enter Password to Unlock
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-5 py-4 pr-12 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#7c5cff]/20 focus:border-[#7c5cff] transition-all text-gray-900 placeholder-gray-400 text-lg"
                    autoComplete="new-password"
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2">
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
                </div>
              </div>
            )}

            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={
                downloading || (metadata.password_required && !password)
              }
              className="w-full bg-linear-to-r from-[#7c5cff] to-[#6a4de6] hover:from-[#6a4de6] hover:to-[#5a3dd6] disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-6 px-8 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-[#7c5cff]/20 hover:shadow-xl hover:shadow-[#7c5cff]/30 hover:-translate-y-0.5 disabled:hover:translate-y-0 disabled:shadow-none disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {downloading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent"></div>
                  <span className="text-lg">Downloading & Decrypting...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-7 h-7 group-hover:animate-bounce"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  <span className="text-xl">Download File</span>
                </>
              )}
            </button>

            {/* Security Notice */}
            <div className="mt-8 bg-linear-to-br from-blue-50 to-indigo-50 border-2 border-blue-100 rounded-2xl p-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shrink-0">
                  <svg
                    className="w-6 h-6 text-white"
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
                  <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <span>🔐</span>
                    <span>End-to-End Encrypted</span>
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    This file is end-to-end encrypted. Decryption happens
                    entirely in your browser using the key embedded in the URL.
                    The server never has access to your decryption key or file
                    contents. Your privacy is guaranteed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-sm text-gray-500">
            Powered by{" "}
            <span className="text-[#7c5cff] font-semibold">CryptoCloud</span> •
            Privacy-First File Sharing
          </p>
        </div>
      </div>
    </div>
  );
}
