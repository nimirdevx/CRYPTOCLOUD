/**
 * useSharedFiles Hook
 * Manages files shared with the current user
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { SharedFileResponse } from "@/app/types";
import { createShareService } from "@/app/services/shareService";
import { createStorageService } from "@/app/services/storageService";
import { decryptData, unwrapFileKey } from "@/app/lib/crypto";

export interface UseSharedFilesResult {
  sharedFiles: SharedFileResponse[];
  isFetching: boolean;
  error: string | null;
  loadingFileId: string | null;
  fetchSharedFiles: () => Promise<void>;
  downloadSharedFile: (file: SharedFileResponse) => Promise<void>;
  setError: (error: string | null) => void;
}

export const useSharedFiles = (): UseSharedFilesResult => {
  const { jwt, privateKey } = useAuth();

  const [sharedFiles, setSharedFiles] = useState<SharedFileResponse[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null);

  // Fetch shared files
  const fetchSharedFiles = useCallback(async () => {
    if (!jwt) return;

    setIsFetching(true);
    setError(null);

    try {
      const service = createShareService(jwt);
      const data = await service.getSharedWithMe();
      setSharedFiles(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch shared files");
    } finally {
      setIsFetching(false);
    }
  }, [jwt]);

  // Download shared file
  const downloadSharedFile = useCallback(
    async (file: SharedFileResponse) => {
      if (!jwt || !privateKey) {
        setError("JWT or Private Key is missing");
        return;
      }

      setLoadingFileId(file.file_id);
      setError(null);

      try {
        const storageService = createStorageService(jwt);

        // Decrypt file key using RSA private key
        const fileKey = await unwrapFileKey(privateKey, file.encryptedFileKey);

        // Get download URL
        const { download_url } = await storageService.getDownloadUrl(
          file.file_id
        );

        // Download encrypted file
        const encryptedBuffer = await storageService.downloadFromS3(
          download_url
        );

        // Decrypt file data
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
      }
    },
    [jwt, privateKey]
  );

  // Fetch on mount
  useEffect(() => {
    fetchSharedFiles();
  }, [fetchSharedFiles]);

  return {
    sharedFiles,
    isFetching,
    error,
    loadingFileId,
    fetchSharedFiles,
    downloadSharedFile,
    setError,
  };
};
