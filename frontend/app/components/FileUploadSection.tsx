import { ChangeEvent } from "react";

interface FileUploadSectionProps {
  selectedFile: File | null;
  isLoading: boolean;
  uploadProgress: number;
  message: string | null;
  error: string | null;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  currentFolderName?: string;
}

export const FileUploadSection = ({
  selectedFile,
  isLoading,
  uploadProgress,
  message,
  error,
  onFileChange,
  onUpload,
  currentFolderName,
}: FileUploadSectionProps) => {
  return (
    <div className="glass p-6 rounded-2xl shadow-2xl mb-8 animate-slide-up">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
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
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-white">Upload New File</h2>
          {currentFolderName && currentFolderName !== "Home" && (
            <p className="text-sm text-gray-400 mt-0.5">
              Uploading to:{" "}
              <span className="text-indigo-400 font-medium">
                {currentFolderName}
              </span>
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="file"
              onChange={onFileChange}
              className="w-full p-3 bg-gray-700/50 backdrop-blur-sm rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-lg file:border-0
                         file:text-sm file:font-semibold
                         file:bg-indigo-600 file:text-white
                         hover:file:bg-indigo-700 file:transition-all
                         cursor-pointer transition-all"
            />
            {selectedFile && (
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-300">
                <svg
                  className="w-4 h-4 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)}{" "}
                  KB)
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onUpload}
            disabled={!selectedFile || isLoading}
            className="px-8 py-3 font-semibold text-white bg-linear-to-r from-green-600 to-emerald-600 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-green-500/50 flex items-center justify-center gap-2 min-w-[140px] cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Uploading...</span>
              </>
            ) : (
              <>
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
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span>Upload</span>
              </>
            )}
          </button>
        </div>

        {/* Progress Bar */}
        {isLoading && uploadProgress > 0 && (
          <div className="space-y-2 animate-slide-in">
            <div className="flex justify-between text-sm text-gray-400">
              <span>{message}</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg animate-slide-in">
            <p className="text-red-400 text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </p>
          </div>
        )}

        {!isLoading && !error && message && (
          <div className="p-3 bg-green-500/10 border border-green-500/50 rounded-lg animate-slide-in">
            <p className="text-green-400 text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              {message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
