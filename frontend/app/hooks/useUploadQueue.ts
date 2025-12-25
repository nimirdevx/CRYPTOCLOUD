/**
 * useUploadQueue Hook
 * Manages multiple file uploads with queue, progress tracking, pause/resume, and cancel functionality
 */

import { useState, useCallback, useRef } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { createStorageService } from "@/app/services/storageService";
import {
  encryptData,
  generateRandomAesKey,
  encryptFileKey,
} from "@/app/lib/crypto";
import { uploadToS3WithProgress } from "@/app/lib/upload";

export enum UploadStatus {
  QUEUED = "queued",
  UPLOADING = "uploading",
  PAUSED = "paused",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELED = "canceled",
}

export interface UploadItem {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  speed: number; // bytes per second
  eta: number; // seconds remaining
  error?: string;
  uploadedBytes: number;
  totalBytes: number;
  startTime?: number;
  // For pause/resume functionality
  abortController?: AbortController;
  s3Key?: string;
  uploadUrl?: string;
  encryptedBlob?: Blob;
  encryptedFileKey?: string;
}

interface UseUploadQueueResult {
  uploads: UploadItem[];
  isUploading: boolean;
  addToQueue: (files: File[], folderId?: string | null) => void;
  cancelUpload: (uploadId: string) => void;
  removeUpload: (uploadId: string) => void;
  pauseUpload: (uploadId: string) => void;
  resumeUpload: (uploadId: string) => void;
  cancelAll: () => void;
  clearCompleted: () => void;
  retryUpload: (uploadId: string) => void;
}

export const useUploadQueue = (
  onUploadComplete?: () => void
): UseUploadQueueResult => {
  const { jwt, encryptionKey } = useAuth();
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const uploadQueueRef = useRef<Map<string, UploadItem>>(new Map());
  const processingRef = useRef(false);

  // Update state from ref
  const syncState = useCallback(() => {
    setUploads(Array.from(uploadQueueRef.current.values()));
  }, []);

  // Calculate upload speed and ETA
  const calculateSpeedAndEta = useCallback(
    (uploadItem: UploadItem, uploadedBytes: number): UploadItem => {
      const now = Date.now();
      const elapsedTime = (now - (uploadItem.startTime || now)) / 1000; // seconds
      const speed = elapsedTime > 0 ? uploadedBytes / elapsedTime : 0;
      const remainingBytes = uploadItem.totalBytes - uploadedBytes;
      const eta = speed > 0 ? remainingBytes / speed : 0;

      return {
        ...uploadItem,
        uploadedBytes,
        speed,
        eta,
        progress: Math.round((uploadedBytes / uploadItem.totalBytes) * 100),
      };
    },
    []
  );

  // Process upload queue
  const processQueue = useCallback(async () => {
    if (processingRef.current || !jwt || !encryptionKey) return;

    const queuedUploads = Array.from(uploadQueueRef.current.values()).filter(
      (u) => u.status === UploadStatus.QUEUED
    );

    if (queuedUploads.length === 0) {
      processingRef.current = false;
      return;
    }

    processingRef.current = true;
    const uploadItem = queuedUploads[0];

    try {
      const service = createStorageService(jwt);
      const abortController = new AbortController();

      // Update status to uploading
      uploadItem.status = UploadStatus.UPLOADING;
      uploadItem.startTime = Date.now();
      uploadItem.abortController = abortController;
      uploadQueueRef.current.set(uploadItem.id, uploadItem);
      syncState();

      // Generate file key
      const fileKey = await generateRandomAesKey();

      // Encrypt file
      const fileBuffer = await uploadItem.file.arrayBuffer();
      const encryptedBuffer = await encryptData(fileKey, fileBuffer);
      const encryptedBlob = new Blob([encryptedBuffer]);

      // Encrypt file key
      const encryptedFileKeyString = await encryptFileKey(
        encryptionKey,
        fileKey
      );

      // Request upload URL (with file size for quota check)
      const { upload_url, s3_key } = await service.requestUploadUrl(
        uploadItem.file.name,
        uploadItem.file.size
      );

      // Store for pause/resume (if needed in future)
      uploadItem.encryptedBlob = encryptedBlob;
      uploadItem.encryptedFileKey = encryptedFileKeyString;
      uploadItem.s3Key = s3_key;
      uploadItem.uploadUrl = upload_url;
      uploadQueueRef.current.set(uploadItem.id, uploadItem);

      // Upload to S3 with progress (wrapped with abort support)
      await new Promise<void>((resolve, reject) => {
        const signal = abortController.signal;

        // Listen for abort
        signal.addEventListener("abort", () => {
          reject(new Error("AbortError"));
        });

        uploadToS3WithProgress(upload_url, encryptedBlob, (percentage) => {
          if (signal.aborted) {
            reject(new Error("AbortError"));
            return;
          }
          const uploadedBytes = Math.round(
            (percentage / 100) * uploadItem.totalBytes
          );
          const updated = calculateSpeedAndEta(uploadItem, uploadedBytes);
          uploadQueueRef.current.set(uploadItem.id, updated);
          syncState();
        })
          .then(resolve)
          .catch(reject);
      });

      // Finalize upload
      await service.finalizeUpload(
        uploadItem.file.name,
        s3_key,
        uploadItem.file.size,
        null, // We'll add folder support later
        encryptedFileKeyString
      );

      // Mark as completed
      uploadItem.status = UploadStatus.COMPLETED;
      uploadItem.progress = 100;
      uploadItem.uploadedBytes = uploadItem.totalBytes;
      uploadQueueRef.current.set(uploadItem.id, uploadItem);
      syncState();

      // Call completion callback
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (err: any) {
      // Check if it was canceled
      if (
        err.name === "AbortError" ||
        uploadItem.status === UploadStatus.CANCELED
      ) {
        uploadItem.status = UploadStatus.CANCELED;
      } else {
        uploadItem.status = UploadStatus.FAILED;
        uploadItem.error = err.message || "Upload failed";
      }
      uploadQueueRef.current.set(uploadItem.id, uploadItem);
      syncState();
    } finally {
      processingRef.current = false;
      // Process next item in queue
      setTimeout(() => processQueue(), 100);
    }
  }, [jwt, encryptionKey, syncState, calculateSpeedAndEta, onUploadComplete]);

  // Add files to queue
  const addToQueue = useCallback(
    (files: File[], folderId?: string | null) => {
      const newUploads: UploadItem[] = files.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        status: UploadStatus.QUEUED,
        progress: 0,
        speed: 0,
        eta: 0,
        uploadedBytes: 0,
        totalBytes: file.size,
      }));

      newUploads.forEach((upload) => {
        uploadQueueRef.current.set(upload.id, upload);
      });

      syncState();
      processQueue();
    },
    [syncState, processQueue]
  );

  // Cancel upload (for active uploads)
  const cancelUpload = useCallback(
    (uploadId: string) => {
      const upload = uploadQueueRef.current.get(uploadId);
      if (!upload) return;

      // If already finished, just remove it
      if (
        upload.status === UploadStatus.COMPLETED ||
        upload.status === UploadStatus.FAILED ||
        upload.status === UploadStatus.CANCELED
      ) {
        uploadQueueRef.current.delete(uploadId);
        syncState();
        return;
      }

      // Abort if uploading
      if (upload.abortController) {
        upload.abortController.abort();
      }

      upload.status = UploadStatus.CANCELED;
      uploadQueueRef.current.set(uploadId, upload);
      syncState();
    },
    [syncState]
  );

  // Remove upload from queue (for completed/failed/canceled uploads)
  const removeUpload = useCallback(
    (uploadId: string) => {
      uploadQueueRef.current.delete(uploadId);
      syncState();
    },
    [syncState]
  );

  // Pause upload (note: actual pause/resume requires chunked upload support)
  const pauseUpload = useCallback(
    (uploadId: string) => {
      const upload = uploadQueueRef.current.get(uploadId);
      if (!upload || upload.status !== UploadStatus.UPLOADING) return;

      // For now, we abort the upload
      if (upload.abortController) {
        upload.abortController.abort();
      }

      upload.status = UploadStatus.PAUSED;
      uploadQueueRef.current.set(uploadId, upload);
      syncState();
    },
    [syncState]
  );

  // Resume upload
  const resumeUpload = useCallback(
    (uploadId: string) => {
      const upload = uploadQueueRef.current.get(uploadId);
      if (!upload || upload.status !== UploadStatus.PAUSED) return;

      // Reset to queued and process
      upload.status = UploadStatus.QUEUED;
      upload.progress = 0;
      upload.uploadedBytes = 0;
      uploadQueueRef.current.set(uploadId, upload);
      syncState();
      processQueue();
    },
    [syncState, processQueue]
  );

  // Retry failed upload
  const retryUpload = useCallback(
    (uploadId: string) => {
      const upload = uploadQueueRef.current.get(uploadId);
      if (!upload || upload.status !== UploadStatus.FAILED) return;

      upload.status = UploadStatus.QUEUED;
      upload.progress = 0;
      upload.uploadedBytes = 0;
      upload.error = undefined;
      uploadQueueRef.current.set(uploadId, upload);
      syncState();
      processQueue();
    },
    [syncState, processQueue]
  );

  // Cancel all uploads
  const cancelAll = useCallback(() => {
    uploadQueueRef.current.forEach((upload) => {
      if (
        upload.status === UploadStatus.QUEUED ||
        upload.status === UploadStatus.UPLOADING
      ) {
        if (upload.abortController) {
          upload.abortController.abort();
        }
        upload.status = UploadStatus.CANCELED;
      }
    });
    syncState();
  }, [syncState]);

  // Clear completed uploads
  const clearCompleted = useCallback(() => {
    Array.from(uploadQueueRef.current.keys()).forEach((key) => {
      const upload = uploadQueueRef.current.get(key);
      if (
        upload &&
        (upload.status === UploadStatus.COMPLETED ||
          upload.status === UploadStatus.CANCELED)
      ) {
        uploadQueueRef.current.delete(key);
      }
    });
    syncState();
  }, [syncState]);

  const isUploading = uploads.some(
    (u) =>
      u.status === UploadStatus.UPLOADING || u.status === UploadStatus.QUEUED
  );

  return {
    uploads,
    isUploading,
    addToQueue,
    cancelUpload,
    removeUpload,
    pauseUpload,
    resumeUpload,
    cancelAll,
    clearCompleted,
    retryUpload,
  };
};
