"use client";

import { useState } from "react";
import { useMyShares } from "@/app/hooks/useMyShares";
import { formatBytes } from "@/app/utils/format";
import { FileItemSkeleton } from "@/app/components/SkeletonLoader";
import { RevokeConfirmationModal } from "@/app/components/RevokeConfirmationModal";
import Link from "next/link";

export default function MySharesPage() {
  const {
    myShares,
    isFetching,
    error,
    isLoading,
    revokeShare,
    setError,
  } = useMyShares();

  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [shareToRevoke, setShareToRevoke] = useState<{
    shareId: string;
    username: string;
    filename: string;
  } | null>(null);

  // Handle unshare click
  const handleUnshareClick = (
    shareId: string,
    username: string,
    filename: string
  ) => {
    setShareToRevoke({ shareId, username, filename });
    setShowRevokeModal(true);
  };

  // Confirm unshare
  const confirmUnshare = async () => {
    if (!shareToRevoke) return;

    await revokeShare(shareToRevoke.shareId);
    setShowRevokeModal(false);
    setShareToRevoke(null);
  };

  // Cancel unshare
  const cancelUnshare = () => {
    setShowRevokeModal(false);
    setShareToRevoke(null);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <svg
                className="w-10 h-10 text-purple-400"
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
              Shared By Me
            </h1>
            <p className="text-gray-400">
              Manage files you&apos;ve shared with others
            </p>
          </div>

          <Link
            href="/dashboard"
            className="px-5 py-2.5 font-semibold text-white glass rounded-lg hover:bg-gray-600/50 transition-all flex items-center gap-2 cursor-pointer"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-600/20 border border-red-600/50 rounded-lg text-red-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
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
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-200 hover:text-white"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* File List */}
        <div className="glass p-6 rounded-2xl shadow-2xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <svg
                className="w-6 h-6 text-purple-400"
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
              {isFetching ? "Loading..." : `${myShares.length} Shared Files`}
            </h2>
          </div>

          <div className="space-y-6">
            {isFetching ? (
              <>
                <FileItemSkeleton />
                <FileItemSkeleton />
                <FileItemSkeleton />
              </>
            ) : myShares.length === 0 ? (
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
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-300 mb-2">
                  No Shared Files
                </h3>
                <p className="text-gray-500">
                  You haven&apos;t shared any files yet
                </p>
              </div>
            ) : (
              myShares.map((item, index) => (
                <div
                  key={item.file_id}
                  className="glass p-5 rounded-xl border border-white/5 animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* File Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-purple-600/20 rounded-lg">
                      <svg
                        className="w-6 h-6 text-purple-400"
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
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium text-lg truncate">
                        {item.filename}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {formatBytes(item.file_size)} •{" "}
                        {item.shares.length} recipient
                        {item.shares.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  {/* Recipients List */}
                  {item.shares.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-300 mb-3">
                        Shared with:
                      </h4>
                      {item.shares.map((share) => (
                        <div
                          key={share.share_id}
                          className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-600/30 rounded-full flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-purple-300"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                            </div>
                            <span className="text-white font-medium">
                              {share.recipient_username}
                            </span>
                          </div>

                          <button
                            onClick={() =>
                              handleUnshareClick(
                                share.share_id,
                                share.recipient_username,
                                item.filename
                              )
                            }
                            disabled={isLoading}
                            className="px-3 py-1.5 text-sm font-semibold text-red-200 bg-red-600/20 rounded-lg hover:bg-red-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
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
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            Revoke
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Revoke Confirmation Modal */}
      {showRevokeModal && shareToRevoke && (
        <RevokeConfirmationModal
          recipientUsername={shareToRevoke.username}
          filename={shareToRevoke.filename}
          isLoading={isLoading}
          onConfirm={confirmUnshare}
          onCancel={cancelUnshare}
        />
      )}
    </div>
  );
}
