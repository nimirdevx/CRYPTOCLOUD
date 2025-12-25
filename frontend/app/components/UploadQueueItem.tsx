/**
 * UploadQueueItem Component
 * Displays individual upload progress with controls
 */

"use client";

import React from "react";
import {
  File,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  RefreshCw,
} from "lucide-react";
import { UploadItem, UploadStatus } from "@/app/hooks/useUploadQueue";

interface UploadQueueItemProps {
  upload: UploadItem;
  onCancel: () => void;
  onRemove: () => void;
  onRetry: () => void;
}

const UploadQueueItem: React.FC<UploadQueueItemProps> = ({
  upload,
  onCancel,
  onRemove,
  onRetry,
}) => {
  // Format file size
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Format speed
  const formatSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond === 0) return "0 B/s";
    const k = 1024;
    const sizes = ["B/s", "KB/s", "MB/s", "GB/s"];
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
    return `${(bytesPerSecond / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Format ETA
  const formatEta = (seconds: number): string => {
    if (seconds === 0 || !isFinite(seconds)) return "--";
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600)
      return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor(
      (seconds % 3600) / 60
    )}m`;
  };

  // Get status icon
  const getStatusIcon = () => {
    switch (upload.status) {
      case UploadStatus.COMPLETED:
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case UploadStatus.FAILED:
        return <XCircle className="w-5 h-5 text-red-500" />;
      case UploadStatus.CANCELED:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
      default:
        return <File className="w-5 h-5 text-blue-500" />;
    }
  };

  // Get status color
  const getProgressColor = () => {
    switch (upload.status) {
      case UploadStatus.COMPLETED:
        return "bg-green-500";
      case UploadStatus.FAILED:
        return "bg-red-500";
      default:
        return "bg-blue-500";
    }
  };

  return (
    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
      {/* File Info Row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {getStatusIcon()}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {upload.file.name}
            </p>
            <div className="flex items-center gap-2 mt-1 whitespace-nowrap">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatSize(upload.uploadedBytes)} /{" "}
                {formatSize(upload.totalBytes)}
              </span>
              {upload.status === UploadStatus.UPLOADING && (
                <>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatSpeed(upload.speed)}
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatEta(upload.eta)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {(upload.status === UploadStatus.UPLOADING ||
            upload.status === UploadStatus.QUEUED) && (
            <button
              onClick={onCancel}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title="Cancel upload"
            >
              <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          )}

          {upload.status === UploadStatus.FAILED && (
            <>
              <button
                onClick={onRetry}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="Retry upload"
              >
                <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={onRemove}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="Remove from list"
              >
                <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </>
          )}

          {(upload.status === UploadStatus.COMPLETED ||
            upload.status === UploadStatus.CANCELED) && (
            <button
              onClick={onRemove}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title="Remove from list"
            >
              <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {(upload.status === UploadStatus.UPLOADING ||
        upload.status === UploadStatus.QUEUED) && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${upload.progress}%` }}
          />
        </div>
      )}

      {/* Error Message */}
      {upload.status === UploadStatus.FAILED && upload.error && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
          {upload.error}
        </p>
      )}

      {/* Status Text */}
      {upload.status === UploadStatus.COMPLETED && (
        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
          Upload complete
        </p>
      )}

      {upload.status === UploadStatus.CANCELED && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Upload canceled
        </p>
      )}

      {upload.status === UploadStatus.QUEUED && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Waiting in queue...
        </p>
      )}
    </div>
  );
};

export default UploadQueueItem;
