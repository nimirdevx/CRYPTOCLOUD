interface FileMetadata {
  id: string;
  filename: string;
  owner_id: string;
  upload_time: string;
  file_size: number;
}

interface DeleteConfirmationModalProps {
  file: FileMetadata | null;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmationModal = ({
  file,
  isLoading,
  onConfirm,
  onCancel,
}: DeleteConfirmationModalProps) => {
  if (!file) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div
        className="glass max-w-md w-full p-6 rounded-2xl shadow-2xl animate-slide-up border border-red-500/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning Icon */}
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-white text-center mb-2">
          Delete File?
        </h3>

        {/* Message */}
        <p className="text-gray-300 text-center mb-1">
          Are you sure you want to delete
        </p>
        <p className="text-white font-semibold text-center mb-4 break-all px-2">
          "{file.filename}"
        </p>
        <p className="text-gray-400 text-sm text-center mb-6">
          This action cannot be undone. The file will be permanently removed
          from your storage.
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 font-semibold text-white glass-light rounded-lg hover:bg-gray-600/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Deleting...</span>
              </>
            ) : (
              <>
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <span>Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
