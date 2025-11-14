interface FileListHeaderProps {
  filesCount: number;
  foldersCount: number;
  filteredCount: number;
  searchQuery: string;
  isFetchingFiles: boolean;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
}

export const FileListHeader = ({
  filesCount,
  foldersCount,
  filteredCount,
  searchQuery,
  isFetchingFiles,
  onSearchChange,
  onRefresh,
}: FileListHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
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
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-white">My Files</h2>
          <p className="text-sm text-gray-400">
            {foldersCount > 0 && (
              <>
                {foldersCount} folder{foldersCount !== 1 ? "s" : ""}
                {filesCount > 0 && ", "}
              </>
            )}
            {filesCount > 0 && (
              <>
                {filesCount} file{filesCount !== 1 ? "s" : ""}
              </>
            )}
            {filesCount === 0 && foldersCount === 0 && "No items"}
            {searchQuery && ` • ${filteredCount} found`}
          </p>
        </div>
        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isFetchingFiles}
          className="ml-2 p-2.5 glass-light rounded-lg hover:bg-gray-600/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
          title="Refresh files"
        >
          <svg
            className={`w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors ${
              isFetchingFiles ? "animate-spin" : "group-hover:rotate-180"
            } transition-transform duration-500`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* Search Bar */}
      {filesCount > 0 && (
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-700/50 backdrop-blur-sm rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer group"
            >
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-gray-300 transition-colors"
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
          )}
        </div>
      )}
    </div>
  );
};
