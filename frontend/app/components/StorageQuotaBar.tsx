interface StorageUsage {
  used: number;
  quota: number;
}

// Helper function to format bytes into human-readable format
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

export const StorageQuotaBar = ({ usage }: { usage: StorageUsage | null }) => {
  if (!usage) {
    return (
      <div className="glass p-6 rounded-2xl shadow-2xl mb-8 animate-pulse">
        <div className="h-6 bg-gray-700/50 rounded-lg w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-700/50 rounded-full w-full mb-2"></div>
        <div className="h-4 bg-gray-700/50 rounded-lg w-1/3"></div>
      </div>
    );
  }

  const { used, quota } = usage;
  const percentUsed = (used / quota) * 100;
  const isNearLimit = percentUsed >= 80;
  const isAtLimit = percentUsed >= 95;

  return (
    <div
      className="glass p-6 rounded-2xl shadow-2xl mb-8 animate-slide-up"
      style={{ animationDelay: "0.05s" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 ${
              isAtLimit
                ? "bg-red-500/20"
                : isNearLimit
                ? "bg-yellow-500/20"
                : "bg-indigo-500/20"
            } rounded-xl flex items-center justify-center`}
          >
            <svg
              className={`w-6 h-6 ${
                isAtLimit
                  ? "text-red-400"
                  : isNearLimit
                  ? "text-yellow-400"
                  : "text-indigo-400"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-white">Storage Usage</h2>
            <p className="text-sm text-gray-400">
              {formatBytes(used)} of {formatBytes(quota)} used
            </p>
          </div>
        </div>
        <div className="text-right">
          <span
            className={`text-2xl font-bold ${
              isAtLimit
                ? "text-red-400"
                : isNearLimit
                ? "text-yellow-400"
                : "text-indigo-400"
            }`}
          >
            {percentUsed.toFixed(1)}%
          </span>
          <p className="text-xs text-gray-500">capacity</p>
        </div>
      </div>
      <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${
            isAtLimit
              ? "bg-linear-to-r from-red-600 to-red-500"
              : isNearLimit
              ? "bg-linear-to-r from-yellow-600 to-orange-500"
              : "bg-linear-to-r from-indigo-500 to-purple-500"
          }`}
          style={{ width: `${percentUsed > 100 ? 100 : percentUsed}%` }}
        ></div>
      </div>
      {isAtLimit && (
        <p className="text-sm text-red-400 mt-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          Storage nearly full! Consider deleting unused files.
        </p>
      )}
    </div>
  );
};
