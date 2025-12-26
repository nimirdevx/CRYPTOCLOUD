"use client";

import { Download, X, Copy, Trash2, Share2, Users, Link2 } from "lucide-react";
import { formatBytes } from "@/app/utils/format";
import { RevokeConfirmationModal } from "@/app/components/RevokeConfirmationModal";

// Helper to render icons (moved from main file)
const getFileIcon = (filename: string) => {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext || "")) {
    return (
      <svg
        className="w-5 h-5 text-blue-400"
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
  return (
    <svg
      className="w-5 h-5 text-gray-400"
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

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

interface SharedFileDetailsProps {
  selectedFile: any;
  activeTab: "shared-with-me" | "shared-by-me" | "public-links";
  onDownload: (file: any) => void;
  loadingFileId: string | null;
  onClose: () => void;
  // Shared by me props
  onUnshare: (shareId: string, username: string, filename: string) => void;
  isRevoking: boolean;
  // Public link props
  onCopyLink: (link: any) => void;
  copyingLink: string | null;
  onRevokeLink: (token: string) => void;
  isRevokingPublicLink: boolean;
}

export const SharedFileDetails = ({
  selectedFile,
  activeTab,
  onDownload,
  loadingFileId,
  onClose,
  onUnshare,
  isRevoking,
  onCopyLink,
  copyingLink,
  onRevokeLink,
  isRevokingPublicLink,
}: SharedFileDetailsProps) => {
  if (!selectedFile) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Shared With Me View */}
      {activeTab === "shared-with-me" && (
        <>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            File Details
          </h3>
          <div className="mb-6 text-center">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-xl flex items-center justify-center">
              {getFileIcon(selectedFile.filename)}
            </div>
            <p className="text-[1.2rem] font-medium text-gray-700 break-all">
              {selectedFile.filename}
            </p>
          </div>
          <div className="border-t border-gray-100 pt-6 space-y-4">
            <div>
              <p className="text-[1rem] text-gray-500 uppercase font-semibold mb-1">
                Size
              </p>
              <p className="text-[1.1rem] text-gray-900">
                {formatBytes(selectedFile.file_size)}
              </p>
            </div>
            <div>
              <p className="text-[1rem] text-gray-500 uppercase font-semibold mb-1">
                Shared By
              </p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#7c5cff] rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {selectedFile.owner_username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-[1.1rem] text-gray-900">
                  {selectedFile.owner_username}
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                Shared Date
              </p>
              <p className="text-sm text-gray-900">
                {formatDate(selectedFile.shared_at)}
              </p>
            </div>
          </div>
          <div className="mt-auto pt-6 border-t border-gray-100">
            <button
              onClick={() => onDownload(selectedFile)}
              disabled={loadingFileId === selectedFile.file_id}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#7c5cff] text-white font-medium rounded-xl hover:bg-[#6a4de6] transition-colors disabled:opacity-50"
            >
              {loadingFileId === selectedFile.file_id ? (
                <span>Downloading...</span>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Download File</span>
                </>
              )}
            </button>
          </div>
        </>
      )}

      {/* Shared By Me View */}
      {activeTab === "shared-by-me" && (
        <>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Share Recipients
          </h3>
          <div className="mb-6 text-center">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-xl flex items-center justify-center">
              {getFileIcon(selectedFile.filename)}
            </div>
            <p className="text-sm font-medium text-gray-700 break-all">
              {selectedFile.filename}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formatBytes(selectedFile.file_size)}
            </p>
          </div>
          <div className="border-t border-gray-100 pt-6 flex-1 overflow-y-auto">
            <p className="text-xs text-gray-500 uppercase font-semibold mb-3">
              Shared With ({selectedFile.shares.length})
            </p>
            <div className="space-y-2">
              {selectedFile.shares.map((share: any) => (
                <div
                  key={share.share_id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#7c5cff] rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {share.recipient_username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-900 font-medium">
                      {share.recipient_username}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnshare(
                        share.share_id,
                        share.recipient_username,
                        selectedFile.filename
                      );
                    }}
                    disabled={isRevoking}
                    className="p-1 text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Public Links View */}
      {activeTab === "public-links" && (
        <>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Public Link Details
          </h3>
          <div className="mb-6 text-center">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-xl flex items-center justify-center">
              {getFileIcon(selectedFile.filename)}
            </div>
            <p className="text-sm font-medium text-gray-700 break-all">
              {selectedFile.filename}
            </p>
          </div>

          <div className="border-t border-gray-100 pt-6 space-y-4">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                Downloads
              </p>
              <p className="text-sm text-gray-900">
                {selectedFile.download_count}{" "}
                {selectedFile.max_downloads
                  ? `/ ${selectedFile.max_downloads}`
                  : ""}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                Expires
              </p>
              <p className="text-sm text-gray-900">
                {formatDate(selectedFile.expires_at)}
              </p>
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-gray-100 space-y-2">
            <button
              onClick={() => onCopyLink(selectedFile)}
              disabled={copyingLink === selectedFile.token}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#7c5cff] text-white font-medium rounded-xl hover:bg-[#6a4de6] transition-colors disabled:opacity-50"
            >
              {copyingLink === selectedFile.token ? (
                <span>Copying...</span>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
            <button
              onClick={() => {
                if (confirm("Revoke?")) onRevokeLink(selectedFile.token);
              }}
              disabled={isRevokingPublicLink}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Revoke Link</span>
            </button>
          </div>
        </>
      )}

      {/* Close button for Mobile/Modal specifically */}
      <div className="mt-4 pt-4 border-t border-gray-100 lg:hidden">
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200"
        >
          Close
        </button>
      </div>
    </div>
  );
};
