// Helper function to get file icon based on extension
const getFileIcon = (filename: string) => {
  const ext = filename.split(".").pop()?.toLowerCase();

  // Image files
  if (["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp"].includes(ext || "")) {
    return (
      <svg
        className="w-8 h-8 text-blue-400"
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

  // PDF files
  if (ext === "pdf") {
    return (
      <svg
        className="w-8 h-8 text-red-400"
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
  }

  // Document files
  if (["doc", "docx", "txt", "rtf", "odt"].includes(ext || "")) {
    return (
      <svg
        className="w-8 h-8 text-indigo-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    );
  }

  // Archive files
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext || "")) {
    return (
      <svg
        className="w-8 h-8 text-yellow-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
        />
      </svg>
    );
  }

  // Video files
  if (["mp4", "avi", "mov", "wmv", "flv", "mkv"].includes(ext || "")) {
    return (
      <svg
        className="w-8 h-8 text-purple-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
    );
  }

  // Default file icon
  return (
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
        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    </svg>
  );
};

// Helper function to format bytes
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

interface FileMetadata {
  id: string;
  filename: string;
  owner_id: string;
  upload_time: string;
  file_size: number;
}

interface FileItemProps {
  file: FileMetadata;
  index: number;
  isLoading: boolean;
  isRenaming: boolean;
  newFilename: string;
  onRenameStart: () => void;
  onRenameChange: (filename: string) => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

export const FileItem = ({
  file,
  index,
  isLoading,
  isRenaming,
  newFilename,
  onRenameStart,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
  onDownload,
  onDelete,
}: FileItemProps) => {
  return (
    <div
      className="p-4 glass-light rounded-xl hover:bg-gray-600/30 transition-all group animate-slide-up"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {isRenaming ? (
        // Rename Input View
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newFilename}
            onChange={(e) => onRenameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onRenameSubmit();
              if (e.key === "Escape") onRenameCancel();
            }}
            className="flex-1 p-2.5 bg-gray-700/50 backdrop-blur-sm rounded-lg border border-indigo-500 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            autoFocus
          />
          <button
            onClick={onRenameSubmit}
            disabled={isLoading}
            className="px-4 py-2.5 text-sm font-semibold bg-green-600 rounded-lg text-white hover:bg-green-700 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
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
                d="M5 13l4 4L19 7"
              />
            </svg>
            Save
          </button>
          <button
            onClick={onRenameCancel}
            disabled={isLoading}
            className="px-4 py-2.5 text-sm font-semibold bg-gray-600 rounded-lg text-white hover:bg-gray-700 transition-all disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      ) : (
        // Default File View
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="shrink-0">{getFileIcon(file.filename)}</div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate group-hover:text-indigo-300 transition-colors">
                {file.filename}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>
                  {new Date(file.upload_time).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span>•</span>
                <span>{formatBytes(file.file_size)}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {/* Rename Button */}
            <button
              onClick={onRenameStart}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 group cursor-pointer"
            >
              <svg
                className="w-4 h-4 group-hover:rotate-12 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z"
                />
              </svg>
              Rename
            </button>
            {/* Download Button */}
            <button
              onClick={onDownload}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 group cursor-pointer"
            >
              <svg
                className="w-4 h-4 group-hover:translate-y-0.5 transition-transform"
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
            {/* Delete Button */}
            <button
              onClick={onDelete}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-semibold text-white bg-red-600/80 rounded-lg hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 group cursor-pointer"
            >
              <svg
                className="w-4 h-4 group-hover:scale-110 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
