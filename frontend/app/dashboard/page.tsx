"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import {
  encryptData,
  decryptData,
  generateRandomAesKey,
  encryptFileKey,
  decryptFileKey,
} from "../lib/crypto";
import { uploadToS3WithProgress } from "../lib/upload";
import { useDragAndDrop } from "../hooks/useDragAndDrop";
import Link from "next/link";
import { FileItemSkeleton } from "../components/SkeletonLoader";
import { StorageQuotaBar } from "../components/StorageQuotaBar";
import { FileUploadSection } from "../components/FileUploadSection";
import { FileListHeader } from "../components/FileListHeader";
import { FileItem } from "../components/FileItem";
import { DeleteConfirmationModal } from "../components/DeleteConfirmationModal";
import { PreviewModal } from "../components/PreviewModal";
import { ShareModal } from "../components/ShareModal"; // 1. Import ShareModal

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Type for our file metadata
interface FileMetadata {
  id: string;
  filename: string;
  owner_id: string;
  upload_time: string;
  file_size: number;
  isFolder: boolean;
  parentId: string | null;
  encryptedFileKey: string | null;
}

// Breadcrumb interface
interface Breadcrumb {
  id: string | null;
  name: string;
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
  const [isUploading, setIsUploading] = useState(false);
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
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderPath, setFolderPath] = useState<Breadcrumb[]>([
    { id: null, name: "Home" },
  ]);
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);

  // --- 2. ADD NEW STATE FOR THE SHARE MODAL ---
  const [fileToShare, setFileToShare] = useState<FileMetadata | null>(null);

  // --- Initialize drag-and-drop functionality ---
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const dragAndDrop = useDragAndDrop(handleFileSelect);

  // Filter files based on search query
  const filteredFiles = files
    .filter((file) =>
      file.filename.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // Sort folders first, then files
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.filename.localeCompare(b.filename);
    });

  // Count folders and files separately
  const foldersCount = files.filter((file) => file.isFolder).length;
  const actualFilesCount = files.filter((file) => !file.isFolder).length;

  // --- Helper: Authenticated Fetch ---
  const authFetch = (url: string, options: RequestInit = {}) => {
    if (!jwt) throw new Error("Not authenticated");
    return fetch(url, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${jwt}` },
    });
  };

  // --- Unified data fetching function ---
  const fetchData = async (folderId: string | null = null) => {
    if (!jwt) return;
    try {
      const query = new URLSearchParams();
      if (folderId) {
        query.append("parentId", folderId);
      }
      const filesResponse = await authFetch(
        `${API_URL}/files/?${query.toString()}`
      );
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
    fetchData(currentFolderId);
  }, [jwt, currentFolderId]);

  // --- Handle File Selection ---
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // --- Handle Upload ---
  const handleUpload = async () => {
    if (!selectedFile || !jwt || !encryptionKey) {
      setError("File, JWT, or Master Key is missing.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);
    setMessage("Starting upload...");

    try {
      // --- Step 0a: Generate a NEW, unique key for this file ---
      setMessage("Generating file key...");
      const fileKey = await generateRandomAesKey();

      // --- Step 0b: Read and Encrypt the file using the NEW fileKey ---
      setMessage("Encrypting file...");
      setUploadProgress(10);
      const fileBuffer = await selectedFile.arrayBuffer();
      const encryptedBuffer = await encryptData(fileKey, fileBuffer); // Encrypt with fileKey
      const encryptedBlob = new Blob([encryptedBuffer]);

      // --- Step 0c: Encrypt the fileKey with the MASTER key ---
      setMessage("Securing file key...");
      setUploadProgress(20);
      const encryptedFileKeyString = await encryptFileKey(
        encryptionKey,
        fileKey
      ); // Encrypt fileKey with masterKey

      // --- Step 1: Request Upload URL ---
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

      // --- Step 2: Upload encrypted file to S3 with REAL progress tracking ---
      setMessage("Uploading file...");
      setUploadProgress(60);

      await uploadToS3WithProgress(upload_url, encryptedBlob, (percentage) => {
        // Map the S3 upload progress (0-100%) to our overall progress (60-80%)
        const mappedProgress = 60 + percentage * 0.2;
        setUploadProgress(Math.round(mappedProgress));
        setMessage(`Uploading file... ${percentage}%`);
      });

      // --- Step 3: Finalize Upload (UPDATED) ---
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
            parentId: currentFolderId,
            encryptedFileKey: encryptedFileKeyString, // <-- SEND THE KEY
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

      await fetchData(currentFolderId);
    } catch (err: any) {
      setError(err.message);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        setMessage(null);
        setUploadProgress(0);
      }, 3000);
    }
  };

  // --- Handle Download ---
  const handleDownload = async (file: FileMetadata) => {
    if (!jwt || !encryptionKey) {
      setError("JWT or Master Key is missing.");
      return;
    }
    if (!file.encryptedFileKey) {
      // Sanity check
      setError("File key is missing. Cannot decrypt.");
      return;
    }

    setLoadingFileId(file.id);
    setLoadingMessage("Downloading...");
    setError(null);

    try {
      // --- Step 1: Request Download URL ---
      const response = await authFetch(
        `${API_URL}/files/download-url/${file.id}`
      );
      if (!response.ok) throw new Error("Could not get download URL.");

      const { download_url } = await response.json();

      // --- Step 2: Download the ENCRYPTED file from S3 ---
      setLoadingMessage("File downloading...");
      const s3Response = await fetch(download_url);
      if (!s3Response.ok) throw new Error("File download from S3 failed.");

      const encryptedBuffer = await s3Response.arrayBuffer();

      // --- Step 3a: Decrypt the FILE KEY ---
      setLoadingMessage("Unlocking file key...");
      const fileKey = await decryptFileKey(
        encryptionKey,
        file.encryptedFileKey
      );

      // --- Step 3b: Decrypt the FILE DATA ---
      setLoadingMessage("Decrypting file...");
      const decryptedBuffer = await decryptData(fileKey, encryptedBuffer);

      // --- Success! Offer file to user ---
      const blob = new Blob([decryptedBuffer]);
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = file.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingFileId(null);
      setLoadingMessage(null);
    }
  };

  // --- Handle Preview ---
  const handlePreview = async (file: FileMetadata) => {
    if (!jwt || !encryptionKey) {
      setError("JWT or Master Key is missing.");
      return;
    }
    if (!file.encryptedFileKey) {
      // Sanity check
      setError("File key is missing. Cannot decrypt.");
      return;
    }

    setLoadingFileId(file.id);
    setLoadingMessage("Loading preview...");
    setError(null);

    try {
      // --- Step 1: Request Download URL ---
      const response = await authFetch(
        `${API_URL}/files/download-url/${file.id}`
      );
      if (!response.ok) throw new Error("Could not get download URL.");

      const { download_url } = await response.json();

      // --- Step 2: Download the ENCRYPTED file from S3 ---
      setLoadingMessage("File downloading...");
      const s3Response = await fetch(download_url);
      if (!s3Response.ok) throw new Error("File download from S3 failed.");

      const encryptedBuffer = await s3Response.arrayBuffer();

      // --- Step 3a: Decrypt the FILE KEY ---
      setLoadingMessage("Unlocking file key...");
      const fileKey = await decryptFileKey(
        encryptionKey,
        file.encryptedFileKey
      );

      // --- Step 3b: Decrypt the FILE DATA ---
      setLoadingMessage("Decrypting file...");
      const decryptedBuffer = await decryptData(fileKey, encryptedBuffer);

      // --- Success! Show preview ---
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingFileId(null);
      setLoadingMessage(null);
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
        await fetchData(currentFolderId);
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

  // --- Handle Create Folder ---
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setError("Folder name cannot be empty.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await authFetch(`${API_URL}/files/folders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFolderName,
          parentId: currentFolderId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to create folder.");
      }

      setMessage("Folder created successfully.");
      setShowCreateFolderModal(false);
      setNewFolderName("");
      await fetchData(currentFolderId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Handle Folder Click (Navigation) ---
  const handleFolderClick = (folder: FileMetadata) => {
    setCurrentFolderId(folder.id);
    setFolderPath([...folderPath, { id: folder.id, name: folder.filename }]);
  };

  // --- Handle Breadcrumb Click ---
  const handleBreadcrumbClick = (index: number) => {
    const newPath = folderPath.slice(0, index + 1);
    setFolderPath(newPath);
    setCurrentFolderId(newPath[newPath.length - 1].id);
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
          isLoading={isUploading}
          uploadProgress={uploadProgress}
          message={message}
          error={error}
          onFileChange={handleFileChange}
          onUpload={handleUpload}
          currentFolderName={folderPath[folderPath.length - 1].name}
          isDragging={dragAndDrop.isDragging}
          onDragEnter={dragAndDrop.handleDragEnter}
          onDragOver={dragAndDrop.handleDragOver}
          onDragLeave={dragAndDrop.handleDragLeave}
          onDrop={dragAndDrop.handleDrop}
        />

        {/* Sharing Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Shared With Me Card */}
          <Link
            href="/dashboard/shared"
            className="group glass p-6 rounded-xl hover:bg-white/10 transition-all cursor-pointer border border-white/5 hover:border-indigo-500/50"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-600/20 rounded-lg group-hover:bg-indigo-600/30 transition-colors">
                  <svg
                    className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform"
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
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Shared With Me
                  </h3>
                  <p className="text-sm text-gray-400">
                    Files others have shared
                  </p>
                </div>
              </div>
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>

          {/* Shared By Me Card */}
          <Link
            href="/dashboard/myshares"
            className="group glass p-6 rounded-xl hover:bg-white/10 transition-all cursor-pointer border border-white/5 hover:border-purple-500/50"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-600/20 rounded-lg group-hover:bg-purple-600/30 transition-colors">
                  <svg
                    className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform"
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
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Shared By Me
                  </h3>
                  <p className="text-sm text-gray-400">
                    Files you&apos;ve shared
                  </p>
                </div>
              </div>
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
        </div>

        {/* File List Section */}
        <div
          className="glass p-6 rounded-2xl shadow-2xl animate-slide-up"
          style={{ animationDelay: "0.1s" }}
        >
          {/* Breadcrumbs */}
          <div className="mb-4 flex items-center gap-2 text-sm">
            {folderPath.map((crumb, index) => (
              <div key={index} className="flex items-center gap-2">
                {index > 0 && (
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}
                <button
                  onClick={() => handleBreadcrumbClick(index)}
                  className={`${
                    index === folderPath.length - 1
                      ? "text-indigo-400 font-semibold"
                      : "text-gray-400 hover:text-white"
                  } transition-colors`}
                >
                  {crumb.name}
                </button>
              </div>
            ))}
          </div>

          {/* Action Bar with New Folder Button */}
          <div className="mb-4 flex items-center gap-3">
            <button
              onClick={() => setShowCreateFolderModal(true)}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            >
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Folder
            </button>
          </div>

          <FileListHeader
            filesCount={actualFilesCount}
            foldersCount={foldersCount}
            filteredCount={filteredFiles.length}
            searchQuery={searchQuery}
            isFetchingFiles={isFetchingFiles}
            onSearchChange={setSearchQuery}
            onRefresh={() => {
              setIsFetchingFiles(true);
              fetchData(currentFolderId);
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
                  onFolderClick={() => handleFolderClick(file)}
                  loadingFileId={loadingFileId}
                  loadingMessage={loadingMessage}
                  onShare={() => setFileToShare(file)} // --- 4. ADD onShare PROP ---
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

      {/* Create Folder Modal */}
      {showCreateFolderModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowCreateFolderModal(false)}
        >
          <div
            className="bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-yellow-500"
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
                New Folder
              </h2>
              <button
                onClick={() => setShowCreateFolderModal(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all"
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

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Folder Name
              </label>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFolder();
                  if (e.key === "Escape") setShowCreateFolderModal(false);
                }}
                placeholder="Enter folder name..."
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                autoFocus
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleCreateFolder}
                disabled={isLoading || !newFolderName.trim()}
                className="flex-1 px-6 py-3 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Create Folder
              </button>
              <button
                onClick={() => {
                  setShowCreateFolderModal(false);
                  setNewFolderName("");
                }}
                disabled={isLoading}
                className="flex-1 px-6 py-3 font-semibold text-white bg-gray-700 rounded-lg hover:bg-gray-600 transition-all disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- 5. ADD THE SHARE MODAL RENDER --- */}
      {fileToShare && (
        <ShareModal
          file={fileToShare}
          authFetch={authFetch}
          onClose={() => setFileToShare(null)}
        />
      )}
    </div>
  );
}
