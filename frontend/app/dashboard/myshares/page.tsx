"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { FileItemSkeleton } from "@/app/components/SkeletonLoader";
import { RevokeConfirmationModal } from "@/app/components/RevokeConfirmationModal";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Types from our new API response
interface ShareRecipient {
  share_id: string;
  recipient_id: string;
  recipient_username: string;
}

interface MyShareResponse {
  file_id: string;
  filename: string;
  file_size: number;
  shares: ShareRecipient[];
}

export default function MySharesPage() {
  const { jwt } = useAuth();
  const [myShares, setMyShares] = useState<MyShareResponse[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [shareToRevoke, setShareToRevoke] = useState<{
    shareId: string;
    username: string;
    filename: string;
  } | null>(null);

  // Helper for authenticated fetch
  const authFetch = (url: string, options: RequestInit = {}) => {
    if (!jwt) throw new Error("Not authenticated");
    return fetch(url, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${jwt}` },
    });
  };

  // --- 1. Fetch "Shared By Me" data on load ---
  const fetchMyShares = async () => {
    setIsFetching(true);
    setError(null);
    try {
      const response = await authFetch(`${API_URL}/share/shared-by-me`);
      if (!response.ok) {
        throw new Error("Failed to fetch your shared files.");
      }
      const data: MyShareResponse[] = await response.json();
      setMyShares(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (jwt) {
      fetchMyShares();
    }
  }, [jwt]);

  // --- 2. Handle the "Unshare" action ---
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

    setIsLoading(true);
    setError(null);
    try {
      const response = await authFetch(
        `${API_URL}/share/${shareToRevoke.shareId}`,
        {
          method: "DELETE",
        }
      );

      if (response.status !== 204) {
        throw new Error("Failed to unshare the file.");
      }

      // Success! Refresh the list
      await fetchMyShares();
      setShowRevokeModal(false);
      setShareToRevoke(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to format bytes
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
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
            className="px-5 py-2.5 font-semibold text-white glass rounded-lg hover:bg-gray-600/50 transition-all flex items-center gap-2 group cursor-pointer"
          >
            <svg
              className="w-5 h-5 group-hover:-translate-x-1 transition-transform"
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

        {/* Error Display */}
        {error && (
          <div className="glass mb-6 p-4 border-l-4 border-red-500 rounded-lg animate-slide-down">
            <div className="flex items-center gap-3">
              <svg
                className="w-6 h-6 text-red-400"
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
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isFetching ? (
          <div className="space-y-4">
            <FileItemSkeleton />
            <FileItemSkeleton />
            <FileItemSkeleton />
          </div>
        ) : myShares.length === 0 ? (
          /* Empty State */
          <div className="glass p-12 rounded-2xl text-center animate-slide-up">
            <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
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
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">
              No Shared Files Yet
            </h2>
            <p className="text-gray-400 mb-6">
              You haven&apos;t shared any files with others yet. Share files
              from your dashboard to collaborate.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors cursor-pointer"
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
              Go to Dashboard
            </Link>
          </div>
        ) : (
          /* Files List */
          <div className="space-y-4">
            {myShares.map((fileShare, index) => (
              <div
                key={fileShare.file_id}
                className="glass p-6 rounded-2xl hover:bg-white/10 transition-all animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* File Info Header */}
                <div className="flex items-start justify-between mb-4 pb-4 border-b border-white/10">
                  <div className="flex items-start gap-3 flex-1">
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
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-1">
                        {fileShare.filename}
                      </h3>
                      <p className="text-sm text-gray-400">
                        Size: {formatBytes(fileShare.file_size)} • Shared with{" "}
                        {fileShare.shares.length}{" "}
                        {fileShare.shares.length === 1 ? "person" : "people"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Shares List */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
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
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    Shared With:
                  </h4>
                  {fileShare.shares.map((share) => (
                    <div
                      key={share.share_id}
                      className="flex items-center justify-between glass-light rounded-lg p-4 hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-linear-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white text-sm font-bold">
                            {share.recipient_username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-semibold">
                            {share.recipient_username}
                          </p>
                          <p className="text-xs text-gray-400">
                            ID: {share.recipient_id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          handleUnshareClick(
                            share.share_id,
                            share.recipient_username,
                            fileShare.filename
                          )
                        }
                        disabled={isLoading}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer"
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
                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                          />
                        </svg>
                        Revoke Access
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Revoke Confirmation Modal */}
        {showRevokeModal && shareToRevoke && (
          <RevokeConfirmationModal
            recipientUsername={shareToRevoke.username}
            filename={shareToRevoke.filename}
            isLoading={isLoading}
            onConfirm={confirmUnshare}
            onCancel={() => {
              setShowRevokeModal(false);
              setShareToRevoke(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
