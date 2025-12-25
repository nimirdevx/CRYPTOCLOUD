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
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
        <div className="h-4 bg-gray-200 rounded-lg w-1/3 mb-2"></div>
        <div className="h-2 bg-gray-200 rounded-full w-full"></div>
      </div>
    );
  }

  const { used, quota } = usage;
  const percentUsed = quota > 0 ? (used / quota) * 100 : 0;

  return (
    <div className="bg-white  rounded-2xl  ">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-gray-500 font-medium text-[0.9375rem]">Storage Usage</h3>
        <span className="text-sm font-medium text-gray-600">
          {percentUsed.toFixed(1)}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="h-2 rounded-full bg-[#7c5cff]"
          style={{ width: `${percentUsed > 100 ? 100 : percentUsed}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-500 mt-1.5">
        {formatBytes(used)} of {formatBytes(quota)} used
      </p>
    </div>
  );
};
