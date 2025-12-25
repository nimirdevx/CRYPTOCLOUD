interface FileInfoPanelProps {
  filename: string;
  fileSize?: number;
  fileType: string;
  isOpen: boolean;
  onClose: () => void;
}

export const FileInfoPanel = ({
  filename,
  fileSize,
  fileType,
  isOpen,
  onClose,
}: FileInfoPanelProps) => {
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const getFileExtension = () => {
    return filename.split(".").pop()?.toUpperCase() || "UNKNOWN";
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-60 animate-fadeIn"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-6 top-24 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 p-6 z-70 w-80 animate-slideInRight">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">File Information</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Close"
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

        {/* Info List */}
        <div className="space-y-4">
          {/* Filename */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
              Name
            </p>
            <p className="text-sm text-gray-900 font-medium wrap-break-word">
              {filename}
            </p>
          </div>

          {/* File Type */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
              Type
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-900 font-medium capitalize">
                {fileType}
              </span>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded">
                {getFileExtension()}
              </span>
            </div>
          </div>

          {/* File Size */}
          {fileSize !== undefined && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Size
              </p>
              <p className="text-sm text-gray-900 font-medium">
                {formatFileSize(fileSize)}
              </p>
            </div>
          )}

          {/* Keyboard Shortcuts */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-3">
              Keyboard Shortcuts
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Close preview</span>
                <kbd className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-mono rounded border border-gray-300">
                  Esc
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">File info</span>
                <kbd className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-mono rounded border border-gray-300">
                  I
                </kbd>
              </div>
              {(fileType === "image" || fileType === "pdf") && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Zoom in</span>
                    <kbd className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-mono rounded border border-gray-300">
                      +
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Zoom out</span>
                    <kbd className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-mono rounded border border-gray-300">
                      -
                    </kbd>
                  </div>
                </>
              )}
              {fileType === "image" && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Fullscreen</span>
                    <kbd className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-mono rounded border border-gray-300">
                      F
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Rotate</span>
                    <kbd className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-mono rounded border border-gray-300">
                      R
                    </kbd>
                  </div>
                </>
              )}
              {fileType === "pdf" && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Next page</span>
                    <kbd className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-mono rounded border border-gray-300">
                      →
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Previous page</span>
                    <kbd className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-mono rounded border border-gray-300">
                      ←
                    </kbd>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
