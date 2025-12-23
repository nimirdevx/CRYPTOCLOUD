"use client";

import { useSharedFiles } from "@/app/hooks/useSharedFiles";
import { formatBytes, formatDate } from "@/app/utils/format";
import { FileItemSkeleton } from "@/app/components/SkeletonLoader";
import Link from "next/link";

export default function SharedWithMePage() {
  const {
    sharedFiles,
    isFetching,
    error,
    loadingFileId,
    downloadSharedFile,
    setError,
  } = useSharedFiles();

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <svg
                className="w-10 h-10 text-indigo-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Shared With Me
            </h1>
            <p className="text-gray-400">
              Files that others have shared with you
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
                className="w-6 h-6 text-indigo-400"
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
              {isFetching ? "Loading..." : `${sharedFiles.length} Files`}
            </h2>
          </div>

          <div className="space-y-3">
            {isFetching ? (
              <>
                <FileItemSkeleton />
                <FileItemSkeleton />
                <FileItemSkeleton />
              </>
            ) : sharedFiles.length === 0 ? (
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
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-300 mb-2">
                  No Shared Files
                </h3>
                <p className="text-gray-500">
                  Files shared with you will appear here
                </p>
              </div>
            ) : (
              sharedFiles.map((file, index) => (
                <div
                  key={file.id}
                  className="glass p-4 rounded-xl hover:bg-white/5 transition-all animate-slide-up border border-white/5"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-600/20 rounded-lg">
                          <svg
                            className="w-5 h-5 text-indigo-400"
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
                          <h3 className="text-white font-medium truncate">
                            {file.filename}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                            <span className="flex items-center gap-1">
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
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                              {file.owner_username}
                            </span>
                            <span>•</span>
                            <span>{formatBytes(file.file_size)}</span>
                            <span>•</span>
                            <span>{formatDate(file.shared_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {loadingFileId === file.file_id ? (
                        <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent"></div>
                          <span>Downloading...</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => downloadSharedFile(file)}
                          className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-2 cursor-pointer"
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
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                          Download
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
