"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { encryptData, decryptData } from "../lib/crypto";
import Link from "next/link";
import { FileItemSkeleton } from "../components/SkeletonLoader";

// API URL
const API_URL = "http://127.0.0.1:8000";

// Type for our file metadata
interface FileMetadata {
  id: string;
  filename: string;
  owner_id: string;
  upload_time: string;
}

// Helper function to get file icon based on extension
const getFileIcon = (filename: string) => {
  const ext = filename.split(".").pop()?.toLowerCase();

  // Image files
  if (["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp"].includes(ext || "")) {
    return (
      <svg
        className="w-8 h-8 text-blue-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    );
  }

  // PDF files
  if (ext === "pdf") {
    return (
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
          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      </svg>
    );
  }

  // Document files
  if (["doc", "docx", "txt", "rtf", "odt"].includes(ext || "")) {
    return (
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
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    );
  }

  // Archive files
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext || "")) {
    return (
      <svg
        className="w-8 h-8 text-yellow-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
        />
      </svg>
    );
  }

  // Video files
  if (["mp4", "avi", "mov", "wmv", "flv", "mkv"].includes(ext || "")) {
    return (
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
          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
    );
  }

  // Default file icon
  return (
    <svg
      className="w-8 h-8 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    </svg>
  );
};

export default function DashboardPage() {
  const { jwt, encryptionKey, logout } = useAuth();
  const router = useRouter();

  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingFiles, setIsFetchingFiles] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [fileToDelete, setFileToDelete] = useState<FileMetadata | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // --- Helper: Authenticated Fetch ---
  // A wrapper for 'fetch' that automatically adds our JWT
  const authFetch = (url: string, options: RequestInit = {}) => {
    if (!jwt) throw new Error("Not authenticated");

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${jwt}`,
      },
    });
  };

  // --- 1. Fetch File List on Load ---
  useEffect(() => {
    if (!jwt) return; // Don't fetch if not logged in

    const fetchFiles = async () => {
      setIsFetchingFiles(true);
      try {
        const response = await authFetch(`${API_URL}/files/`);
        if (!response.ok) throw new Error("Failed to fetch files.");

        const data: FileMetadata[] = await response.json();
        setFiles(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsFetchingFiles(false);
      }
    };
    fetchFiles();
  }, [jwt]); // Re-run when jwt changes (after login)

  // --- 2. Handle File Selection ---
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // --- 3. Handle Upload (The 3-Step S3 Flow) ---
  const handleUpload = async () => {
    if (!selectedFile || !jwt || !encryptionKey) {
      setError("File, JWT, or Encryption Key is missing.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setUploadProgress(0);
    setMessage("Starting upload...");

    try {
      // --- Step 0: Read and Encrypt the file ---
      setMessage("Encrypting file... (this may take a moment)");
      setUploadProgress(25);
      const fileBuffer = await selectedFile.arrayBuffer();
      const encryptedBuffer = await encryptData(encryptionKey, fileBuffer);
      const encryptedBlob = new Blob([encryptedBuffer]);

      // --- Step 1: Request Upload URL from our server ---
      setMessage("Requesting upload location...");
      setUploadProgress(40);
      const requestUploadResponse = await authFetch(
        `${API_URL}/files/request-upload-url`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: selectedFile.name,
            content_type: "application/octet-stream", // We upload all as generic bytes
          }),
        }
      );
      if (!requestUploadResponse.ok)
        throw new Error("Could not get upload URL.");

      const { upload_url, s3_key } = await requestUploadResponse.json();

      // --- Step 2: Upload the ENCRYPTED file to S3 ---
      setMessage("Uploading file...");
      setUploadProgress(60);
      const uploadToS3Response = await fetch(upload_url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/octet-stream",
        },
        body: encryptedBlob,
      });
      if (!uploadToS3Response.ok) throw new Error("File upload to S3 failed.");

      // --- Step 3: Finalize Upload with our server ---
      setMessage("Finalizing upload...");
      setUploadProgress(80);
      const finalizeResponse = await authFetch(
        `${API_URL}/files/finalize-upload`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: selectedFile.name,
            s3_key: s3_key,
          }),
        }
      );
      if (!finalizeResponse.ok) throw new Error("Failed to finalize upload.");

      const newFileMetadata = await finalizeResponse.json();

      // --- Success! ---
      setUploadProgress(100);
      setMessage("Upload complete!");
      setFiles([...files, newFileMetadata]); // Add new file to our list
      setSelectedFile(null); // Clear the file input

      // Clear the file input element
      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (err: any) {
      setError(err.message);
      setUploadProgress(0);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setMessage(null);
        setUploadProgress(0);
      }, 3000);
    }
  };

  // --- 4. Handle Download (The 2-Step S3 Flow) ---
  const handleDownload = async (file: FileMetadata) => {
    if (!jwt || !encryptionKey) {
      setError("JWT or Encryption Key is missing.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setMessage(`Downloading ${file.filename}...`);

    try {
      // --- Step 1: Request Download URL from our server ---
      const response = await authFetch(
        `${API_URL}/files/download-url/${file.id}`
      );
      if (!response.ok) throw new Error("Could not get download URL.");

      const { download_url } = await response.json();

      // --- Step 2: Download the ENCRYPTED file from S3 ---
      setMessage("File downloading...");
      const s3Response = await fetch(download_url);
      if (!s3Response.ok) throw new Error("File download from S3 failed.");

      const encryptedBuffer = await s3Response.arrayBuffer();

      // --- Step 3: Decrypt the file ---
      setMessage("Decrypting file...");
      const decryptedBuffer = await decryptData(encryptionKey, encryptedBuffer);

      // --- Success! Offer file to user ---
      const blob = new Blob([decryptedBuffer]);
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = file.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setMessage("Download complete!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 5. Handle Logout ---
  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <svg
                className="w-10 h-10 text-indigo-400"
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
              My Dashboard
            </h1>
            <p className="text-gray-400">
              Securely manage your encrypted files
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard/security"
              className="px-5 py-2.5 font-semibold text-white glass rounded-lg hover:bg-gray-600/50 transition-all flex items-center gap-2 group"
            >
              <svg
                className="w-5 h-5 group-hover:rotate-12 transition-transform"
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
              Security
            </Link>
            <button
              onClick={handleLogout}
              className="px-5 py-2.5 font-semibold text-white bg-red-600/80 rounded-lg hover:bg-red-600 transition-all flex items-center gap-2"
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </div>
        </div>

        {/* Upload Section */}
        <div className="glass p-6 rounded-2xl shadow-2xl mb-8 animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
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
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-white">
              Upload New File
            </h2>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full p-3 bg-gray-700/50 backdrop-blur-sm rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white
                             file:mr-4 file:py-2 file:px-4
                             file:rounded-lg file:border-0
                             file:text-sm file:font-semibold
                             file:bg-indigo-600 file:text-white
                             hover:file:bg-indigo-700 file:transition-all
                             cursor-pointer transition-all"
                />
                {selectedFile && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-300">
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
                    <span>
                      {selectedFile.name} (
                      {(selectedFile.size / 1024).toFixed(2)} KB)
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || isLoading}
                className="px-8 py-3 font-semibold text-white bg-linear-to-r from-green-600 to-emerald-600 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-green-500/50 flex items-center justify-center gap-2 min-w-[140px]"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Uploading...</span>
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
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <span>Upload</span>
                  </>
                )}
              </button>
            </div>

            {/* Progress Bar */}
            {isLoading && uploadProgress > 0 && (
              <div className="space-y-2 animate-slide-in">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>{message}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Status Messages */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg animate-slide-in">
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

            {!isLoading && !error && message && (
              <div className="p-3 bg-green-500/10 border border-green-500/50 rounded-lg animate-slide-in">
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
        </div>

        {/* File List Section */}
        <div
          className="glass p-6 rounded-2xl shadow-2xl animate-slide-up"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-400"
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
              <div>
                <h2 className="text-2xl font-semibold text-white">My Files</h2>
                <p className="text-sm text-gray-400">
                  {files.length} file{files.length !== 1 ? "s" : ""} stored
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {isFetchingFiles ? (
              // Show skeleton loaders while fetching
              <>
                <FileItemSkeleton />
                <FileItemSkeleton />
                <FileItemSkeleton />
                <FileItemSkeleton />
                <FileItemSkeleton />
              </>
            ) : files.length === 0 ? (
              <div className="text-center py-16 animate-fade-in">
                <div className="w-20 h-20 bg-gray-700/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-10 h-10 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-300 mb-2">
                  No files yet
                </h3>
                <p className="text-gray-500">
                  Upload your first file to get started
                </p>
              </div>
            ) : (
              files.map((file, index) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 glass-light rounded-xl hover:bg-gray-600/30 transition-all group animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="shrink-0">{getFileIcon(file.filename)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate group-hover:text-indigo-300 transition-colors">
                        {file.filename}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(file.upload_time).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(file)}
                      disabled={isLoading}
                      className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2 group"
                    >
                      <svg
                        className="w-4 h-4 group-hover:translate-y-0.5 transition-transform"
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
                      Download
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
