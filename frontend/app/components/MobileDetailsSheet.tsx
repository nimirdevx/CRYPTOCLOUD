"use client";

import React, { useEffect } from "react";
import {
  X,
  Folder,
  FileText,
  ImageIcon,
  Share2,
  Link2,
  Download,
  Pencil,
  Trash2,
} from "lucide-react";
import { formatBytes, formatRelativeDate, getFileType } from "../utils";

interface FileMetadata {
  id: string;
  filename: string;
  isFolder: boolean;
  file_size?: number;
  upload_time: string;
  itemCount?: number;
  calculatedSize?: number;
}

interface MobileDetailsSheetProps {
  isOpen: boolean;
  file: FileMetadata | null;
  onClose: () => void;
  onDownload?: () => void;
  onRename?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
}

export const MobileDetailsSheet: React.FC<MobileDetailsSheetProps> = ({
  isOpen,
  file,
  onClose,
  onDownload,
  onRename,
  onShare,
  onDelete,
}) => {
  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !file) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="md:hidden fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 transform transition-transform duration-300 max-h-[80vh] overflow-hidden ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Handle Bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Details</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(80vh-120px)] px-6 py-4">
          {/* File Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-[#E8E4FF] rounded-2xl flex items-center justify-center">
              {file.isFolder ? (
                <Folder className="w-10 h-10 text-[#7c5cff]" />
              ) : getFileType(file.filename, false) === "Image" ? (
                <ImageIcon className="w-10 h-10 text-[#7c5cff]" />
              ) : (
                <FileText className="w-10 h-10 text-[#7c5cff]" />
              )}
            </div>
          </div>

          {/* File Name */}
          <h4 className="text-lg font-semibold text-gray-900 text-center mb-6 wrap-break-word">
            {file.filename}
          </h4>

          {/* File Details */}
          <div className="space-y-4 mb-6">
            <div>
              <span className="text-sm text-gray-500 font-medium">Type</span>
              <p className="text-base text-gray-900 mt-1">
                {getFileType(file.filename, file.isFolder)}
              </p>
            </div>

            {file.isFolder ? (
              <>
                <div>
                  <span className="text-sm text-gray-500 font-medium">
                    Items
                  </span>
                  <p className="text-base text-gray-900 mt-1">
                    {file.itemCount !== undefined
                      ? `${file.itemCount} item${
                          file.itemCount !== 1 ? "s" : ""
                        }`
                      : "Unknown"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 font-medium">
                    Total Size
                  </span>
                  <p className="text-base text-gray-900 mt-1">
                    {file.calculatedSize !== undefined
                      ? formatBytes(file.calculatedSize)
                      : "Calculating..."}
                  </p>
                </div>
              </>
            ) : (
              <div>
                <span className="text-sm text-gray-500 font-medium">Size</span>
                <p className="text-base text-gray-900 mt-1">
                  {formatBytes(file.file_size || 0)}
                </p>
              </div>
            )}

            <div>
              <span className="text-sm text-gray-500 font-medium">
                Modified
              </span>
              <p className="text-base text-gray-900 mt-1">
                {formatRelativeDate(file.upload_time)}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          {!file.isFolder && (
            <div className="space-y-2 border-t border-gray-100 pt-4">
              {onDownload && (
                <button
                  onClick={() => {
                    onDownload();
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <Download className="w-5 h-5" />
                  <span className="font-medium">Download</span>
                </button>
              )}
              {onShare && (
                <button
                  onClick={() => {
                    onShare();
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  <span className="font-medium">Share</span>
                </button>
              )}
            </div>
          )}

          {onRename && (
            <button
              onClick={() => {
                onRename();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-xl transition-colors mt-2"
            >
              <Pencil className="w-5 h-5" />
              <span className="font-medium">Rename</span>
            </button>
          )}

          {onDelete && (
            <button
              onClick={() => {
                onDelete();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-xl transition-colors mt-2"
            >
              <Trash2 className="w-5 h-5" />
              <span className="font-medium">Delete</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
};
