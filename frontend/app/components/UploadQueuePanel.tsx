/**
 * UploadQueuePanel Component
 * Displays active file uploads in a floating panel at the bottom-right corner
 */

"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Minimize2,
  Maximize2,
  Upload,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { UploadItem, UploadStatus } from "@/app/hooks/useUploadQueue";
import UploadQueueItem from "@/app/components/UploadQueueItem";

interface UploadQueuePanelProps {
  uploads: UploadItem[];
  onCancel: (uploadId: string) => void;
  onRemove: (uploadId: string) => void;
  onRetry: (uploadId: string) => void;
  onCancelAll: () => void;
  onClearCompleted: () => void;
}

const UploadQueuePanel: React.FC<UploadQueuePanelProps> = ({
  uploads,
  onCancel,
  onRemove,
  onRetry,
  onCancelAll,
  onClearCompleted,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Show panel when new uploads are added
  useEffect(() => {
    if (uploads.length > 0) {
      setIsVisible(true);
    }
  }, [uploads.length]);

  // If no uploads, don't render
  if (uploads.length === 0) {
    return null;
  }

  // Calculate stats
  const activeUploads = uploads.filter(
    (u) =>
      u.status === UploadStatus.UPLOADING || u.status === UploadStatus.QUEUED
  );
  const completedUploads = uploads.filter(
    (u) => u.status === UploadStatus.COMPLETED
  );
  const failedUploads = uploads.filter((u) => u.status === UploadStatus.FAILED);

  const totalProgress =
    uploads.length > 0
      ? Math.round(
          uploads.reduce((sum, u) => sum + u.progress, 0) / uploads.length
        )
      : 0;

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-full">
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-300 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <div>
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                Uploads{" "}
                {activeUploads.length > 0 && `(${activeUploads.length})`}
              </h3>
              {activeUploads.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {totalProgress}% complete
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Clear completed button */}
            {completedUploads.length > 0 && (
              <button
                onClick={onClearCompleted}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="Clear completed"
              >
                <Trash2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            )}

            {/* Minimize/Maximize button */}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title={isMinimized ? "Maximize" : "Minimize"}
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              ) : (
                <Minimize2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              )}
            </button>

            {/* Close button */}
            {activeUploads.length === 0 && (
              <button
                onClick={() => setIsVisible(false)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="Close"
              >
                <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Overall Progress Bar */}
        {!isMinimized && activeUploads.length > 0 && (
          <div className="px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Overall Progress
              </span>
              <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                {totalProgress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${totalProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Upload List */}
        {!isMinimized && (
          <div className="max-h-96 overflow-y-auto bg-white dark:bg-gray-800">
            {uploads.map((upload) => (
              <UploadQueueItem
                key={upload.id}
                upload={upload}
                onCancel={() => onCancel(upload.id)}
                onRemove={() => onRemove(upload.id)}
                onRetry={() => onRetry(upload.id)}
              />
            ))}
          </div>
        )}

        {/* Footer Actions */}
        {!isMinimized && activeUploads.length > 0 && (
          <div className="px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700">
            <button
              onClick={onCancelAll}
              className="w-full px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-medium"
            >
              Cancel All Uploads
            </button>
          </div>
        )}

        {/* Summary when minimized */}
        {isMinimized && (
          <div className="px-4 py-3 bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                {activeUploads.length > 0 && (
                  <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                    <Upload className="w-4 h-4" />
                    <span className="font-medium">{activeUploads.length}</span>
                  </div>
                )}
                {completedUploads.length > 0 && (
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-medium">
                      {completedUploads.length}
                    </span>
                  </div>
                )}
                {failedUploads.length > 0 && (
                  <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                    <XCircle className="w-4 h-4" />
                    <span className="font-medium">{failedUploads.length}</span>
                  </div>
                )}
              </div>
              {activeUploads.length > 0 && (
                <span className="text-gray-600 dark:text-gray-400">
                  {totalProgress}%
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadQueuePanel;
