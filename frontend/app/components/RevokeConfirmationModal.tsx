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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div
        className="bg-white max-w-md w-full p-8 rounded-2xl shadow-2xl animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning Icon */}
        <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-orange-600"
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
        <h3 className="text-2xl font-bold text-gray-900 text-center mb-3">
          Revoke Share Access?
        </h3>

        {/* Message */}
        <div className="bg-orange-50 rounded-xl p-5 mb-4 border-2 border-orange-200">
          <p className="text-[1rem] text-gray-700 text-center mb-3">
            You are about to revoke access for:
          </p>
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-10 h-10 bg-linear-to-br from-[#7c5cff] to-[#6b4ce6] rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {recipientUsername.charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="text-[1rem] font-bold text-gray-900">
              {recipientUsername}
            </p>
          </div>
          <p className="text-[1rem] text-gray-700 text-center">
            from accessing{" "}
            <span className="font-semibold text-gray-900">"{filename}"</span>
          </p>
        </div>

        <p className="text-[1rem] text-gray-600 text-center mb-8">
          They will no longer be able to view or download this file. This action
          cannot be undone.
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-5 py-3 font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-5 py-3 font-semibold text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Revoking...</span>
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
