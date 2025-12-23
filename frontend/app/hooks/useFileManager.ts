/**
 * useFileManager Hook
 * Manages file state, operations, and upload/download logic
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { FileMetadata, StorageUsage, Breadcrumb } from "@/app/types";
import { createStorageService } from "@/app/services/storageService";
import {
  encryptData,
  decryptData,
  generateRandomAesKey,
  encryptFileKey,
  decryptFileKey,
} from "@/app/lib/crypto";
import { uploadToS3WithProgress } from "@/app/lib/upload";
import { getMimeType } from "@/app/utils/format";

export interface UseFileManagerResult {
  // State
  files: FileMetadata[];
  storageUsage: StorageUsage | null;
  isLoading: boolean;
  isUploading: boolean;
  isFetchingFiles: boolean;
  uploadProgress: number;
  message: string | null;
  error: string | null;
  currentFolderId: string | null;
  folderPath: Breadcrumb[];
  loadingFileId: string | null;
  loadingMessage: string | null;

  // Actions
  fetchFiles: () => Promise<void>;
  uploadFile: (file: File) => Promise<void>;
  downloadFile: (file: FileMetadata) => Promise<void>;
  previewFile: (file: FileMetadata) => Promise<{
    url: string;
    filename: string;
  }>;
  deleteFile: (fileId: string) => Promise<void>;
  renameFile: (fileId: string, newFilename: string) => Promise<void>;
  createFolder: (name: string) => Promise<void>;
  navigateToFolder: (folder: FileMetadata) => void;
  navigateToBreadcrumb: (index: number) => void;
  setError: (error: string | null) => void;
  setMessage: (message: string | null) => void;
}

export const useFileManager = (): UseFileManagerResult => {
  const { jwt, encryptionKey } = useAuth();

  // State
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [storageUsage, setStorageUsage] = useState<StorageUsage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isFetchingFiles, setIsFetchingFiles] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<Breadcrumb[]>([
    { id: null, name: "Home" },
  ]);
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);

  // Fetch files and storage usage
  const fetchFiles = useCallback(async () => {
    if (!jwt) return;

    setIsFetchingFiles(true);
    setError(null);

    try {
      const service = createStorageService(jwt);
      const [filesData, storageData] = await Promise.all([
        service.getFiles(currentFolderId),
        service.getStorageUsage(),
      ]);

      setFiles(filesData);
      setStorageUsage(storageData);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setIsFetchingFiles(false);
    }
  }, [jwt, currentFolderId]);

  // Upload file
  const uploadFile = useCallback(
    async (file: File) => {
      if (!file || !jwt || !encryptionKey) {
        setError("File, JWT, or Master Key is missing");
        return;
      }

      setIsUploading(true);
      setError(null);
      setUploadProgress(0);
      setMessage("Starting upload...");

      try {
        const service = createStorageService(jwt);

        // Generate unique file key
        setMessage("Generating file key...");
        const fileKey = await generateRandomAesKey();
        setUploadProgress(10);

        // Encrypt file
        setMessage("Encrypting file...");
        const fileBuffer = await file.arrayBuffer();
        const encryptedBuffer = await encryptData(fileKey, fileBuffer);
        const encryptedBlob = new Blob([encryptedBuffer]);
        setUploadProgress(20);

        // Encrypt file key with master key
        setMessage("Securing file key...");
        const encryptedFileKeyString = await encryptFileKey(
          encryptionKey,
          fileKey
        );
        setUploadProgress(30);

        // Request upload URL
        setMessage("Requesting upload location...");
        const { upload_url, s3_key } = await service.requestUploadUrl(
          file.name
        );
        setUploadProgress(40);

        // Upload to S3 with progress
        setMessage("Uploading file...");
        await uploadToS3WithProgress(
          upload_url,
          encryptedBlob,
          (percentage) => {
            const mappedProgress = 40 + percentage * 0.4;
            setUploadProgress(Math.round(mappedProgress));
            setMessage(`Uploading file... ${percentage}%`);
          }
        );
        setUploadProgress(80);

        // Finalize upload
        setMessage("Finalizing upload...");
        await service.finalizeUpload(
          file.name,
          s3_key,
          file.size,
          currentFolderId,
          encryptedFileKeyString
        );

        setUploadProgress(100);
        setMessage("Upload complete!");

        // Refresh files
        await fetchFiles();
      } catch (err: any) {
        setError(err.message || "Upload failed");
        setUploadProgress(0);
      } finally {
        setIsUploading(false);
        setTimeout(() => {
          setMessage(null);
          setUploadProgress(0);
        }, 3000);
      }
    },
    [jwt, encryptionKey, currentFolderId, fetchFiles]
  );

  // Download file
  const downloadFile = useCallback(
    async (file: FileMetadata) => {
      if (!jwt || !encryptionKey) {
        setError("JWT or Master Key is missing");
        return;
      }

      if (!file.encryptedFileKey) {
        setError("File key is missing. Cannot decrypt");
        return;
      }

      setLoadingFileId(file.id);
      setLoadingMessage("Downloading...");
      setError(null);

      try {
        const service = createStorageService(jwt);

        // Get download URL
        const { download_url } = await service.getDownloadUrl(file.id);

        // Download encrypted file
        setLoadingMessage("File downloading...");
        const encryptedBuffer = await service.downloadFromS3(download_url);

        // Decrypt file key
        setLoadingMessage("Unlocking file key...");
        const fileKey = await decryptFileKey(
          encryptionKey,
          file.encryptedFileKey
        );

        // Decrypt file data
        setLoadingMessage("Decrypting file...");
        const decryptedBuffer = await decryptData(fileKey, encryptedBuffer);

        // Trigger download
        const blob = new Blob([decryptedBuffer]);
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = file.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err: any) {
        setError(err.message || "Download failed");
      } finally {
        setLoadingFileId(null);
        setLoadingMessage(null);
      }
    },
    [jwt, encryptionKey]
  );

  // Preview file
  const previewFile = useCallback(
    async (file: FileMetadata): Promise<{ url: string; filename: string }> => {
      if (!jwt || !encryptionKey) {
        throw new Error("JWT or Master Key is missing");
      }

      if (!file.encryptedFileKey) {
        throw new Error("File key is missing. Cannot decrypt");
      }

      setLoadingFileId(file.id);
      setLoadingMessage("Loading preview...");
      setError(null);

      try {
        const service = createStorageService(jwt);

        // Get download URL
        const { download_url } = await service.getDownloadUrl(file.id);

        // Download encrypted file
        setLoadingMessage("File downloading...");
        const encryptedBuffer = await service.downloadFromS3(download_url);

        // Decrypt file key
        setLoadingMessage("Unlocking file key...");
        const fileKey = await decryptFileKey(
          encryptionKey,
          file.encryptedFileKey
        );

        // Decrypt file data
        setLoadingMessage("Decrypting file...");
        const decryptedBuffer = await decryptData(fileKey, encryptedBuffer);

        // Create blob with proper MIME type
        const mimeType = getMimeType(file.filename);
        const blob = new Blob([decryptedBuffer], { type: mimeType });
        const objectUrl = URL.createObjectURL(blob);

        return {
          url: objectUrl,
          filename: file.filename,
        };
      } catch (err: any) {
        setError(err.message || "Preview failed");
        throw err;
      } finally {
        setLoadingFileId(null);
        setLoadingMessage(null);
      }
    },
    [jwt, encryptionKey]
  );

  // Delete file
  const deleteFile = useCallback(
    async (fileId: string) => {
      if (!jwt) return;

      setIsLoading(true);
      setError(null);

      try {
        const service = createStorageService(jwt);
        await service.deleteFile(fileId);
        setMessage("File deleted successfully");
        await fetchFiles();
      } catch (err: any) {
        setError(err.message || "Delete failed");
      } finally {
        setIsLoading(false);
      }
    },
    [jwt, fetchFiles]
  );

  // Rename file
  const renameFile = useCallback(
    async (fileId: string, newFilename: string) => {
      if (!jwt) return;

      setIsLoading(true);
      setError(null);

      try {
        const service = createStorageService(jwt);
        const updatedFile = await service.renameFile(fileId, newFilename);
        setFiles((prevFiles) =>
          prevFiles.map((f) => (f.id === fileId ? updatedFile : f))
        );
        setMessage("File renamed successfully");
      } catch (err: any) {
        setError(err.message || "Rename failed");
      } finally {
        setIsLoading(false);
      }
    },
    [jwt]
  );

  // Create folder
  const createFolder = useCallback(
    async (name: string) => {
      if (!jwt) return;

      setIsLoading(true);
      setError(null);

      try {
        const service = createStorageService(jwt);
        await service.createFolder(name, currentFolderId);
        setMessage("Folder created successfully");
        await fetchFiles();
      } catch (err: any) {
        setError(err.message || "Create folder failed");
      } finally {
        setIsLoading(false);
      }
    },
    [jwt, currentFolderId, fetchFiles]
  );

  // Navigate to folder
  const navigateToFolder = useCallback((folder: FileMetadata) => {
    setCurrentFolderId(folder.id);
    setFolderPath((prev) => [
      ...prev,
      { id: folder.id, name: folder.filename },
    ]);
  }, []);

  // Navigate via breadcrumb
  const navigateToBreadcrumb = useCallback((index: number) => {
    setFolderPath((prev) => {
      const newPath = prev.slice(0, index + 1);
      setCurrentFolderId(newPath[newPath.length - 1].id);
      return newPath;
    });
  }, []);

  // Fetch files on mount and when folder changes
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  return {
    // State
    files,
    storageUsage,
    isLoading,
    isUploading,
    isFetchingFiles,
    uploadProgress,
    message,
    error,
    currentFolderId,
    folderPath,
    loadingFileId,
    loadingMessage,

    // Actions
    fetchFiles,
    uploadFile,
    downloadFile,
    previewFile,
    deleteFile,
    renameFile,
    createFolder,
    navigateToFolder,
    navigateToBreadcrumb,
    setError,
    setMessage,
  };
};
