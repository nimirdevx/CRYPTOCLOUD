"use client";

/**
 * Public Link Modal Component
 * Create and manage public share links
 *
 * PRIVACY: Decryption key embedded in URL fragment (never sent to server)
 */

import { useState } from "react";
import { createPortal } from "react-dom";
import { createPublicLink } from "@/app/services/publicShareService";
import { decryptFileKey } from "@/app/lib/crypto";
import { useAuth } from "@/app/context/AuthContext";
import type {
  CreatePublicShareRequest,
  PublicShareResponse,
} from "@/app/types";

interface PublicLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileId: string;
  filename: string;
  encryptedFileKey: string; // The file's AES key (encrypted with user's master key)
}

export default function PublicLinkModal({
  isOpen,
  onClose,
  fileId,
  filename,
  encryptedFileKey,
}: PublicLinkModalProps) {
  const { encryptionKey } = useAuth(); // Get user's master encryption key
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Form state
  const [password, setPassword] = useState("");
  const [maxDownloads, setMaxDownloads] = useState<number | undefined>(
    undefined
  );
  const [expiresIn, setExpiresIn] = useState(24); // Default 24 hours

  const handleCreate = async () => {
    if (!encryptionKey) {
      setError("Encryption key not available. Please log in again.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Decrypt the file key using user's master key
      const fileKey = await decryptFileKey(encryptionKey, encryptedFileKey);

      // 2. Create the public link on the server
      const request: CreatePublicShareRequest = {
        expires_in_hours: expiresIn,
        ...(password && { password }),
        ...(maxDownloads && { max_downloads: maxDownloads }),
      };

      const response: PublicShareResponse = await createPublicLink(
        fileId,
        request
      );

      // 3. Build the complete URL with decrypted file key in fragment
      // PRIVACY: The key is in the URL fragment (#key=xxx) and never sent to server
      const fullUrl = await buildPublicUrl(response.token, fileKey);

      setPublicUrl(fullUrl);
    } catch (err: any) {
      setError(err.message || "Failed to create public link");
    } finally {
      setLoading(false);
    }
  };

  const buildPublicUrl = async (
    token: string,
    fileKey: CryptoKey
  ): Promise<string> => {
    // Export the CryptoKey to raw format, then base64 encode
    const keyBuffer = await crypto.subtle.exportKey("raw", fileKey);
    const keyArray = new Uint8Array(keyBuffer);
    const keyString = String.fromCharCode(...keyArray);
    const keyBase64 = btoa(keyString);

    // URL-encode the key to preserve + and / characters
    const encodedKey = encodeURIComponent(keyBase64);

    const baseUrl = window.location.origin;
    return `${baseUrl}/share/${token}#key=${encodedKey}`;
  };

  const handleCopy = async () => {
    if (!publicUrl) return;

    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleClose = () => {
    setPublicUrl(null);
    setPassword("");
    setMaxDownloads(undefined);
    setExpiresIn(24);
    setError(null);
    setCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        // Close modal if clicking on backdrop
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Create Public Link
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Share <span className="font-medium">{filename}</span> with anyone
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {!publicUrl ? (
            <>
              {/* Expiration Time */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Link expires in
                </label>
                <select
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                >
                  <option value={1}>1 hour</option>
                  <option value={6}>6 hours</option>
                  <option value={12}>12 hours</option>
                  <option value={24}>24 hours (default)</option>
                  <option value={48}>48 hours</option>
                  <option value={72}>3 days</option>
                  <option value={168}>7 days</option>
                </select>
              </div>

              {/* Password Protection */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Password (optional)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave empty for no password"
                  autoComplete="new-password"
                  data-form-type="other"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Add extra protection with a password
                </p>
              </div>

              {/* Download Limit */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Maximum downloads (optional)
                </label>
                <input
                  type="number"
                  value={maxDownloads || ""}
                  onChange={(e) =>
                    setMaxDownloads(
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  placeholder="Unlimited"
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Limit how many times the file can be downloaded
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Privacy Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex gap-2">
                  <svg
                    className="w-5 h-5 text-blue-600 shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="text-xs text-blue-800">
                    <p className="font-semibold mb-1">Privacy-First Sharing</p>
                    <p>
                      The decryption key will be embedded in the URL. The server
                      never has access to your file contents.
                    </p>
                  </div>
                </div>
              </div>

              {/* Create Button */}
              <button
                onClick={handleCreate}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Creating Link...
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
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                    Create Public Link
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              {/* Success State - Show Link */}
              <div className="text-center py-4">
                <div className="text-green-500 text-5xl mb-4">✓</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Public Link Created!
                </h3>
                <p className="text-sm text-gray-700 mb-4">
                  Anyone with this link can download the file
                </p>
              </div>

              {/* URL Display */}
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1 font-medium">
                  Your shareable link:
                </p>
                <p className="text-sm text-gray-900 break-all font-mono">
                  {publicUrl}
                </p>
              </div>

              {/* Copy Button */}
              <button
                onClick={handleCopy}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Copied!
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
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy Link
                  </>
                )}
              </button>

              {/* Done Button */}
              <button
                onClick={handleClose}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // Use portal to render modal outside the normal DOM hierarchy
  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
}
