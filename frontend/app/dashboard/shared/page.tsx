"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { decryptData, unwrapFileKey } from "@/app/lib/crypto";
import { FileItemSkeleton } from "@/app/components/SkeletonLoader";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// This is the new response type from our API
interface SharedFileResponse {
  id: string; // Share ID
  file_id: string;
  filename: string;
  file_size: number;
  owner_username: string;
  shared_at: string; // Will be an ISO string
  encryptedFileKey: string;
}

export default function SharedWithMePage() {
  const { jwt, privateKey } = useAuth(); // We need the PRIVATE KEY to decrypt
  const [sharedFiles, setSharedFiles] = useState<SharedFileResponse[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null);

  // Helper for authenticated fetch
  const authFetch = (url: string, options: RequestInit = {}) => {
    if (!jwt) throw new Error("Not authenticated");
    return fetch(url, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${jwt}` },
    });
  };

  // 1. Fetch shared files on load
  useEffect(() => {
    if (!jwt) return;

    const fetchSharedFiles = async () => {
      setIsFetching(true);
      setError(null);
      try {
        const response = await authFetch(`${API_URL}/share/shared-with-me`);
        if (!response.ok) {
          throw new Error("Failed to fetch shared files.");
        }
        const data: SharedFileResponse[] = await response.json();
        setSharedFiles(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsFetching(false);
      }
    };

    fetchSharedFiles();
  }, [jwt]);

  // 2. Handle the download of a shared file
  const handleSharedDownload = async (file: SharedFileResponse) => {
    if (!jwt || !privateKey) {
      setError("JWT or Private Key is missing.");
      return;
    }

    setLoadingFileId(file.file_id);
    setError(null);

    try {
      // --- This is the Core Sharing Crypto Flow ---
      // 1. Decrypt the file's AES key using *our* RSA Private Key
      const fileKey = await unwrapFileKey(privateKey, file.encryptedFileKey);

      // 2. Get the S3 download URL
      const urlResponse = await authFetch(
        `${API_URL}/files/download-url/${file.file_id}`
      );
      if (!urlResponse.ok) throw new Error("Could not get download URL.");
      const { download_url } = await urlResponse.json();

      // 3. Download the encrypted file from S3
      const s3Response = await fetch(download_url);
      if (!s3Response.ok) throw new Error("File download from S3 failed.");
      const encryptedBuffer = await s3Response.arrayBuffer();

      // 4. Decrypt the file data using the unwrapped file key
      const decryptedBuffer = await decryptData(fileKey, encryptedBuffer);

      // 5. Offer to user
      const blob = new Blob([decryptedBuffer]);
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = file.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      setError("Decryption failed. The key may be invalid or corrupted.");
      console.error(err);
    } finally {
      setLoadingFileId(null);
    }
  };

  // Helper to format bytes
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Helper to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Shared With Me
            </h1>
            <p className="text-gray-400">
              Files that others have shared with you
            </p>
          </div>
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="glass-light border-l-4 border-red-500 p-4 rounded-xl">
            <div className="flex items-center gap-3">
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
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* File List */}
        <div className="glass p-6 rounded-2xl shadow-2xl">
          {isFetching ? (
            <div className="space-y-4">
              <FileItemSkeleton />
              <FileItemSkeleton />
              <FileItemSkeleton />
            </div>
          ) : sharedFiles.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-20 h-20 text-gray-600 mx-auto mb-4"
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
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                No shared files yet
              </h3>
              <p className="text-gray-500">
                Files shared with you will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-gray-400 border-b border-gray-700">
                <div className="col-span-5">File Name</div>
                <div className="col-span-2">Owner</div>
                <div className="col-span-2">Size</div>
                <div className="col-span-2">Shared At</div>
                <div className="col-span-1">Actions</div>
              </div>

              {/* File Items */}
              {sharedFiles.map((file) => (
                <div
                  key={file.id}
                  className="grid grid-cols-12 gap-4 items-center p-4 glass-light rounded-xl hover:bg-gray-700/30 transition-colors duration-200"
                >
                  {/* File Name with Icon */}
                  <div className="col-span-5 flex items-center gap-3">
                    <svg
                      className="w-8 h-8 text-blue-400 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <div className="truncate">
                      <p className="font-medium text-white truncate">
                        {file.filename}
                      </p>
                    </div>
                  </div>

                  {/* Owner */}
                  <div className="col-span-2">
                    <span className="text-sm text-gray-400">
                      @{file.owner_username}
                    </span>
                  </div>

                  {/* Size */}
                  <div className="col-span-2">
                    <span className="text-sm text-gray-400">
                      {formatBytes(file.file_size)}
                    </span>
                  </div>

                  {/* Shared At */}
                  <div className="col-span-2">
                    <span className="text-sm text-gray-400">
                      {formatDate(file.shared_at)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1">
                    <button
                      onClick={() => handleSharedDownload(file)}
                      disabled={loadingFileId === file.file_id}
                      className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Download"
                    >
                      {loadingFileId === file.file_id ? (
                        <svg
                          className="w-5 h-5 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
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
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="glass-light p-4 rounded-xl border-l-4 border-blue-500">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-blue-400 shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h4 className="text-white font-semibold mb-1">
                About Shared Files
              </h4>
              <p className="text-gray-400 text-sm">
                These files are securely encrypted and can only be decrypted
                with your private key. The owner has encrypted the file key with
                your public key, ensuring end-to-end encryption.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
