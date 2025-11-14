"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { encryptData, decryptData } from "../lib/crypto";
import Link from "next/link";
import { FileItemSkeleton } from "../components/SkeletonLoader";
import { StorageQuotaBar } from "../components/StorageQuotaBar";
import { FileUploadSection } from "../components/FileUploadSection";
import { FileListHeader } from "../components/FileListHeader";
import { FileItem } from "../components/FileItem";
import { DeleteConfirmationModal } from "../components/DeleteConfirmationModal";
import { PreviewModal } from "../components/PreviewModal";

// API URL
const API_URL = "http://127.0.0.1:8000";

// Type for our file metadata
interface FileMetadata {
  id: string;
  filename: string;
  owner_id: string;
  upload_time: string;
  file_size: number;
}

// Storage quota interface
interface StorageUsage {
  used: number;
  quota: number;
}

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
  const [searchQuery, setSearchQuery] = useState("");
  const [storageUsage, setStorageUsage] = useState<StorageUsage | null>(null);
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [newFilename, setNewFilename] = useState("");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFilename, setPreviewFilename] = useState<string>("");

  // Filter files based on search query
  const filteredFiles = files.filter((file) =>
    file.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Helper: Authenticated Fetch ---
  const authFetch = (url: string, options: RequestInit = {}) => {
    if (!jwt) throw new Error("Not authenticated");
    return fetch(url, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${jwt}` },
    });
  };

  // --- Unified data fetching function ---
  const fetchData = async () => {
    if (!jwt) return;
    try {
      const filesResponse = await authFetch(`${API_URL}/files/`);
      if (!filesResponse.ok) throw new Error("Failed to fetch files.");
      const filesData: FileMetadata[] = await filesResponse.json();
      setFiles(filesData);

      const storageResponse = await authFetch(
        `${API_URL}/files/users/me/storage`
      );
      if (!storageResponse.ok) throw new Error("Failed to fetch storage.");
      const storageData: StorageUsage = await storageResponse.json();
      setStorageUsage(storageData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsFetchingFiles(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [jwt]);

  // --- Handle File Selection ---
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // --- Handle Upload ---
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
      setMessage("Encrypting file...");
      setUploadProgress(25);
      const fileBuffer = await selectedFile.arrayBuffer();
      const encryptedBuffer = await encryptData(encryptionKey, fileBuffer);
      const encryptedBlob = new Blob([encryptedBuffer]);

      setMessage("Requesting upload location...");
      setUploadProgress(40);
      const requestUploadResponse = await authFetch(
        `${API_URL}/files/request-upload-url`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: selectedFile.name,
            content_type: "application/octet-stream",
          }),
        }
      );
      if (!requestUploadResponse.ok)
        throw new Error("Could not get upload URL.");

      const { upload_url, s3_key } = await requestUploadResponse.json();

      setMessage("Uploading file...");
      setUploadProgress(60);
      const uploadToS3Response = await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": "application/octet-stream" },
        body: encryptedBlob,
      });
      if (!uploadToS3Response.ok) throw new Error("File upload to S3 failed.");

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
            file_size: selectedFile.size,
          }),
        }
      );
      if (!finalizeResponse.ok) throw new Error("Failed to finalize upload.");

      setUploadProgress(100);
      setMessage("Upload complete!");
      setSelectedFile(null);

      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      await fetchData();
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

  // --- Handle Download ---
  const handleDownload = async (file: FileMetadata) => {
    if (!jwt || !encryptionKey) {
      setError("JWT or Encryption Key is missing.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setMessage(`Downloading ${file.filename}...`);

    try {
      const response = await authFetch(
        `${API_URL}/files/download-url/${file.id}`
      );
      if (!response.ok) throw new Error("Could not get download URL.");

      const { download_url } = await response.json();

      setMessage("File downloading...");
      const s3Response = await fetch(download_url);
      if (!s3Response.ok) throw new Error("File download from S3 failed.");

      const encryptedBuffer = await s3Response.arrayBuffer();

      setMessage("Decrypting file...");
      const decryptedBuffer = await decryptData(encryptionKey, encryptedBuffer);

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

  // --- Handle Preview ---
  const handlePreview = async (file: FileMetadata) => {
    if (!jwt || !encryptionKey) {
      setError("JWT or Encryption Key is missing.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setMessage(`Loading preview for ${file.filename}...`);

    try {
      const response = await authFetch(
        `${API_URL}/files/download-url/${file.id}`
      );
      if (!response.ok) throw new Error("Could not get download URL.");

      const { download_url } = await response.json();

      setMessage("File downloading...");
      const s3Response = await fetch(download_url);
      if (!s3Response.ok) throw new Error("File download from S3 failed.");

      const encryptedBuffer = await s3Response.arrayBuffer();

      setMessage("Decrypting file...");
      const decryptedBuffer = await decryptData(encryptionKey, encryptedBuffer);

      // Determine MIME type based on file extension
      const ext = file.filename.split(".").pop()?.toLowerCase() || "";
      let mimeType = "application/octet-stream";

      if (["jpg", "jpeg"].includes(ext)) mimeType = "image/jpeg";
      else if (ext === "png") mimeType = "image/png";
      else if (ext === "gif") mimeType = "image/gif";
      else if (ext === "svg") mimeType = "image/svg+xml";
      else if (ext === "webp") mimeType = "image/webp";
      else if (ext === "bmp") mimeType = "image/bmp";
      else if (ext === "pdf") mimeType = "application/pdf";

      const blob = new Blob([decryptedBuffer], { type: mimeType });
      const objectUrl = URL.createObjectURL(blob);

      setPreviewUrl(objectUrl);
      setPreviewFilename(file.filename);
      setShowPreviewModal(true);
      setMessage(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Handle Preview Modal Close ---
  const handleClosePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPreviewFilename("");
    setShowPreviewModal(false);
  };

  // --- Handle Delete ---
  const handleDelete = async (file: FileMetadata) => {
    setIsLoading(true);
    setError(null);
    setMessage(`Deleting ${file.filename}...`);

    try {
      const response = await authFetch(`${API_URL}/files/${file.id}`, {
        method: "DELETE",
      });

      if (response.status === 204) {
        setMessage("File deleted successfully.");
        await fetchData();
      } else {
        const data = await response.json();
        throw new Error(data.detail || "Failed to delete file.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setShowDeleteModal(false);
      setFileToDelete(null);
    }
  };

  // --- Handle Logout ---
  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // --- Handle Rename ---
  const startRename = (file: FileMetadata) => {
    setRenamingFileId(file.id);
    setNewFilename(file.filename);
  };

  const cancelRename = () => {
    setRenamingFileId(null);
    setNewFilename("");
  };

  const submitRename = async (file: FileMetadata) => {
    if (!newFilename || newFilename === file.filename) {
      cancelRename();
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await authFetch(`${API_URL}/files/${file.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_filename: newFilename }),
      });

      if (!response.ok) {
        const updatedFile = await response.json();
        throw new Error(updatedFile.detail || "Failed to rename file.");
      }

      const updatedFile = await response.json();
      setFiles(files.map((f) => (f.id === file.id ? updatedFile : f)));
      setMessage("File renamed successfully.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      cancelRename();
    }
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
              className="px-5 py-2.5 font-semibold text-white glass rounded-lg hover:bg-gray-600/50 transition-all flex items-center gap-2 group cursor-pointer"
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
              className="px-5 py-2.5 font-semibold text-white bg-red-600/80 rounded-lg hover:bg-red-600 transition-all flex items-center gap-2 cursor-pointer"
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

        {/* Storage Quota Bar */}
        <StorageQuotaBar usage={storageUsage} />

        {/* Upload Section */}
        <FileUploadSection
          selectedFile={selectedFile}
          isLoading={isLoading}
          uploadProgress={uploadProgress}
          message={message}
          error={error}
          onFileChange={handleFileChange}
          onUpload={handleUpload}
        />

        {/* File List Section */}
        <div
          className="glass p-6 rounded-2xl shadow-2xl animate-slide-up"
          style={{ animationDelay: "0.1s" }}
        >
          <FileListHeader
            filesCount={files.length}
            filteredCount={filteredFiles.length}
            searchQuery={searchQuery}
            isFetchingFiles={isFetchingFiles}
            onSearchChange={setSearchQuery}
            onRefresh={() => {
              setIsFetchingFiles(true);
              fetchData();
            }}
          />

          <div className="space-y-3">
            {isFetchingFiles ? (
              <>
                <FileItemSkeleton />
                <FileItemSkeleton />
                <FileItemSkeleton />
                <FileItemSkeleton />
                <FileItemSkeleton />
              </>
            ) : filteredFiles.length === 0 ? (
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
                  {searchQuery ? "No files found" : "No files yet"}
                </h3>
                <p className="text-gray-500">
                  {searchQuery
                    ? `No files match "${searchQuery}"`
                    : "Upload your first file to get started"}
                </p>
              </div>
            ) : (
              filteredFiles.map((file, index) => (
                <FileItem
                  key={file.id}
                  file={file}
                  index={index}
                  isLoading={isLoading}
                  isRenaming={renamingFileId === file.id}
                  newFilename={newFilename}
                  onRenameStart={() => startRename(file)}
                  onRenameChange={setNewFilename}
                  onRenameSubmit={() => submitRename(file)}
                  onRenameCancel={cancelRename}
                  onPreview={() => handlePreview(file)}
                  onDownload={() => handleDownload(file)}
                  onDelete={() => {
                    setFileToDelete(file);
                    setShowDeleteModal(true);
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && fileToDelete && (
        <DeleteConfirmationModal
          file={fileToDelete}
          isLoading={isLoading}
          onConfirm={() => handleDelete(fileToDelete)}
          onCancel={() => {
            setShowDeleteModal(false);
            setFileToDelete(null);
          }}
        />
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewUrl && (
        <PreviewModal
          filename={previewFilename}
          previewUrl={previewUrl}
          onClose={handleClosePreview}
        />
      )}
    </div>
  );
}
