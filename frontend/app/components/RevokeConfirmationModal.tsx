interface RevokeConfirmationModalProps {
  recipientUsername: string;
  filename: string;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const RevokeConfirmationModal = ({
  recipientUsername,
  filename,
  isLoading,
  onConfirm,
  onCancel,
}: RevokeConfirmationModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div
        className="glass max-w-md w-full p-6 rounded-2xl shadow-2xl animate-scale-up border border-orange-500/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning Icon */}
        <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-orange-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-white text-center mb-2">
          Revoke Share Access?
        </h3>

        {/* Message */}
        <div className="bg-white/5 rounded-lg p-4 mb-4 border border-white/10">
          <p className="text-gray-300 text-sm text-center mb-2">
            You are about to revoke access for:
          </p>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {recipientUsername.charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="text-white font-semibold">{recipientUsername}</p>
          </div>
          <p className="text-gray-400 text-sm text-center">
            from accessing{" "}
            <span className="text-white font-medium">"{filename}"</span>
          </p>
        </div>

        <p className="text-gray-400 text-sm text-center mb-6">
          They will no longer be able to view or download this file. This action
          cannot be undone.
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
            className="flex-1 px-4 py-2.5 font-semibold text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Revoking...</span>
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
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
                <span>Revoke Access</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
