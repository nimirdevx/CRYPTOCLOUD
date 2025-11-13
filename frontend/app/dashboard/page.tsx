"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { encryptData, decryptData } from "../lib/crypto";
import Link from "next/link"; // 1. IMPORT LINK

// API URL
const API_URL = "http://127.0.0.1:8000";

// Type for our file metadata
interface FileMetadata {
  id: string;
  filename: string;
  owner_id: string;
  upload_time: string;
}

export default function DashboardPage() {
  const { jwt, encryptionKey, logout } = useAuth();
  const router = useRouter();

  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
      try {
        const response = await authFetch(`${API_URL}/files/`);
        if (!response.ok) throw new Error("Failed to fetch files.");

        const data: FileMetadata[] = await response.json();
        setFiles(data);
      } catch (err: any) {
        setError(err.message);
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
    setMessage("Starting upload...");

    try {
      // --- Step 0: Read and Encrypt the file ---
      setMessage("Encrypting file... (this may take a moment)");
      const fileBuffer = await selectedFile.arrayBuffer();
      const encryptedBuffer = await encryptData(encryptionKey, fileBuffer);
      const encryptedBlob = new Blob([encryptedBuffer]);

      // --- Step 1: Request Upload URL from our server ---
      setMessage("Requesting upload location...");
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
      setMessage("Upload complete!");
      setFiles([...files, newFileMetadata]); // Add new file to our list
      setSelectedFile(null); // Clear the file input
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
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
    <div className="p-4 md:p-10 max-w-4xl mx-auto">
      {/* 2. UPDATE THE HEADER */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-bold text-white">My Dashboard</h1>
        {/* Wrap buttons in a div for layout */}
        <div className="flex gap-4">
          <Link
            href="/dashboard/security"
            className="px-5 py-2 font-semibold text-white bg-gray-600 rounded-md hover:bg-gray-700 transition"
          >
            Security
          </Link>
          <button
            onClick={handleLogout}
            className="px-5 py-2 font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </div>
      {/* END OF UPDATE */}

      {/* Upload Section */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-indigo-300">
          Upload New File
        </h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="file"
            onChange={handleFileChange}
            className="grow p-3 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-md file:border-0
                       file:text-sm file:font-semibold
                       file:bg-indigo-600 file:text-white
                       hover:file:bg-indigo-700"
          />
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isLoading}
            className="px-6 py-3 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Uploading..." : "Upload"}
          </button>
        </div>
        {/* Status Messages */}
        <div className="h-6 mt-4">
          {isLoading && <p className="text-blue-300">{message}</p>}
          {error && <p className="text-red-400">{error}</p>}
          {!isLoading && !error && message && (
            <p className="text-green-300">{message}</p>
          )}
        </div>
      </div>

      {/* File List Section */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
        <h2 className="text-2xl font-semibold mb-4 text-indigo-300">
          My Files
        </h2>
        <div className="space-y-3">
          {files.length === 0 ? (
            <p className="text-gray-400">You have no files uploaded.</p>
          ) : (
            files.map((file) => (
              <div
                key={file.id}
                className="flex justify-between items-center p-4 bg-gray-700 rounded-md"
              >
                <span className="font-medium text-white">{file.filename}</span>
                <button
                  onClick={() => handleDownload(file)}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  Download
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
