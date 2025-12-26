"use client";

import { MoreVertical } from "lucide-react";

// Helper to render icons (duplicated for simplicity, or import from a shared utility)
const getFileIcon = (filename: string) => {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext || "")) {
    return (
      <svg
        className="w-10 h-10 text-blue-400"
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
      className="w-10 h-10 text-gray-400"
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

interface SharedMobileListProps {
  files: any[];
  activeTab: string;
  onFileClick: (file: any) => void;
  isLoading: boolean;
}

export const SharedMobileList = ({
  files,
  activeTab,
  onFileClick,
  isLoading,
}: SharedMobileListProps) => {
  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-500">Loading files...</div>
    );
  }

  if (files.length === 0) {
    return <div className="p-8 text-center text-gray-500">No files found.</div>;
  }

  return (
    <div className="flex flex-col">
      {files.map((file, index) => {
        // Match the same key generation logic as the desktop view
        const fileKey = activeTab === 'public-links'
          ? `public-${(file as any).token}`
          : `file-${file.file_id}-${index}`;
          
        return (
          <div
            key={fileKey}
            onClick={() => onFileClick(file)}
            className="flex items-center gap-4 p-4 border-b border-gray-100 bg-white active:bg-gray-50 transition-colors cursor-pointer"
          >
            {/* Large Icon */}
            <div className="shrink-0">{getFileIcon(file.filename)}</div>

            {/* Filename & Info */}
            <div className="flex-1 min-w-0">
              <p className="text-base font-medium text-gray-900 truncate">
                {file.filename}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {activeTab === "shared-with-me"
                  ? `From: ${file.owner_username}`
                  : "Tap for details"}
              </p>
            </div>

            {/* Action Trigger */}
            <button className="p-2 text-gray-400">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
