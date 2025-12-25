"use client";

import { useState } from "react";
import { useMyShares } from "@/app/hooks/useMyShares";
import { formatBytes } from "@/app/utils/format";
import { FileItemSkeleton } from "@/app/components/SkeletonLoader";
import { RevokeConfirmationModal } from "@/app/components/RevokeConfirmationModal";
import { ImageIcon, FileText, X, Cloud } from "lucide-react";
import Avatar from "@/app/components/Avatar";

const getFileIcon = (filename: string) => {
  const ext = filename.split(".").pop()?.toLowerCase();

  if (["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp"].includes(ext || "")) {
    return <ImageIcon className="w-5 h-5 text-blue-400" />;
  }

  if (ext === "pdf") {
    return <FileText className="w-5 h-5 text-red-400" />;
  }

  return <FileText className="w-5 h-5 text-gray-400" />;
};

export default function MySharesContent() {
  const { myShares, isFetching, error, isLoading, revokeShare, setError } =
    useMyShares();

  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [shareToRevoke, setShareToRevoke] = useState<{
    shareId: string;
    username: string;
    filename: string;
  } | null>(null);
  const [selectedFile, setSelectedFile] = useState<any | null>(null);

  const handleUnshareClick = (
    shareId: string,
    username: string,
    filename: string
  ) => {
    setShareToRevoke({ shareId, username, filename });
    setShowRevokeModal(true);
  };

  const confirmUnshare = async () => {
    if (!shareToRevoke) return;
    await revokeShare(shareToRevoke.shareId);
    setShowRevokeModal(false);
    setShareToRevoke(null);
  };

  const cancelUnshare = () => {
    setShowRevokeModal(false);
    setShareToRevoke(null);
  };

  return (
    <div className="flex h-full gap-6">
      {/* Column 2: Main Content Area */}
      <div className="flex-1 bg-white rounded-3xl shadow-sm flex flex-col overflow-hidden">
        <div className="px-6 py-6">
          <h1 className="text-[1.375rem] leading-7 font-bold text-gray-900 mb-4">
            Shared
          </h1>

          {/* Error Message */}
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <X className="w-5 h-5" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Files Count */}
          <div className="mb-4">
            <p className="text-[0.875rem] leading-5 text-gray-500">
              {myShares.length} {myShares.length === 1 ? "file" : "files"}{" "}
              shared
            </p>
          </div>

          {/* Files Table */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    File Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Recipients
                  </th>
                </tr>
              </thead>
              <tbody>
                {isFetching ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td colSpan={3} className="px-6 py-4">
                        <FileItemSkeleton />
                      </td>
                    </tr>
                  ))
                ) : myShares.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12">
                      <div className="flex flex-col items-center text-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-gray-400"
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
                        <p className="text-gray-600 font-medium">
                          No shared files
                        </p>
                        <p className="text-[0.875rem] leading-5 text-gray-500">
                          Start sharing files from My Files
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  myShares.map((file) => (
                    <tr
                      key={file.file_id}
                      onClick={() => setSelectedFile(file)}
                      className={`border-b border-gray-50 cursor-pointer transition-colors ${
                        selectedFile?.file_id === file.file_id
                          ? "bg-[#7c5cff]/10"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.filename)}
                          <span className="text-[0.875rem] leading-5 font-normal text-gray-900 block max-w-lg overflow-x-auto whitespace-nowrap hide-scrollbar">
                            {file.filename}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-[0.875rem] leading-5 text-gray-500 whitespace-nowrap">
                        {formatBytes(file.file_size)}
                      </td>
                      <td className="px-6 py-3 text-[0.875rem] leading-5 text-gray-500 whitespace-nowrap">
                        {file.shares.length}{" "}
                        {file.shares.length === 1 ? "person" : "people"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Column 3: Right Panel */}
      <aside className="w-72 bg-white rounded-3xl shadow-sm flex flex-col overflow-hidden p-6">
        {selectedFile ? (
          <>
            <h3 className="text-[1.375rem] leading-7 font-bold text-gray-900 mb-6">
              Share Recipients
            </h3>

            <div className="mb-6 text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-[#E8E4FF] rounded-2xl flex items-center justify-center">
                {getFileIcon(selectedFile.filename)}
              </div>
              <p className="text-[0.875rem] leading-5 font-medium text-gray-900 wrap-break-word">
                {selectedFile.filename}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatBytes(selectedFile.file_size)}
              </p>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">
                Shared With ({selectedFile.shares.length})
              </p>

              <div className="space-y-2">
                {selectedFile.shares.map((share: any) => (
                  <div
                    key={share.share_id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar username={share.recipient_username} size="sm" />
                      <span className="text-[0.875rem] leading-5 font-medium text-gray-900">
                        {share.recipient_username}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnshareClick(
                          share.share_id,
                          share.recipient_username,
                          selectedFile.filename
                        );
                      }}
                      disabled={isLoading}
                      className="p-1 text-red-500 hover:text-red-700 disabled:opacity-50"
                      title="Revoke access"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6 mt-6">
              <button
                onClick={() => setSelectedFile(null)}
                className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Close Details
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-6 mt-8">
              <div className="w-28 h-28 bg-[#E8E4FF] rounded-2xl flex items-center justify-center">
                <Cloud className="w-14 h-14 text-[#7c5cff]" />
              </div>
            </div>

            <h3 className="text-[1.375rem] leading-7 font-bold text-gray-900 text-center mb-4">
              Sharing Summary
            </h3>

            <div className="p-4 bg-gray-50 rounded-xl mb-4">
              <p className="text-[0.875rem] leading-5 text-gray-600">
                Select a file to manage share recipients and permissions.
              </p>
            </div>

            <div className="border-t border-gray-100 pt-6 mt-6">
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Total Files Shared
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {myShares.length}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Total Recipients
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {myShares.reduce((acc, file) => acc + file.shares.length, 0)}
                </p>
              </div>
            </div>
          </>
        )}
      </aside>

      {/* Revoke Confirmation Modal */}
      {showRevokeModal && shareToRevoke && (
        <RevokeConfirmationModal
          recipientUsername={shareToRevoke.username}
          filename={shareToRevoke.filename}
          onConfirm={confirmUnshare}
          onCancel={cancelUnshare}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
