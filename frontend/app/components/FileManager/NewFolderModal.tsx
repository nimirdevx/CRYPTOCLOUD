import React from "react";

interface NewFolderModalProps {
  isOpen: boolean;
  folderName: string;
  onFolderNameChange: (name: string) => void;
  onClose: () => void;
  onCreate: () => void;
}

export const NewFolderModal: React.FC<NewFolderModalProps> = ({
  isOpen,
  folderName,
  onFolderNameChange,
  onClose,
  onCreate,
}) => {
  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && folderName.trim()) {
      onCreate();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-scale-up">
        {/* Header with Icon */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-[#7c5cff]/10 rounded-xl flex items-center justify-center shrink-0">
            <svg
              className="w-7 h-7 text-[#7c5cff]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              Create New Folder
            </h3>
            <p className="text-[1rem] text-gray-600 mt-1">
              Enter a name for your folder
            </p>
          </div>
        </div>

        {/* Input Field */}
        <input
          type="text"
          value={folderName}
          onChange={(e) => onFolderNameChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g., Documents, Photos..."
          className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-[1rem] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7c5cff]/20 focus:border-[#7c5cff] transition-all mb-6"
          autoFocus
        />

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-5 py-3 bg-gray-100 rounded-xl text-[1rem] font-semibold text-gray-700 hover:bg-gray-200 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onCreate}
            disabled={!folderName.trim()}
            className="flex-1 px-5 py-3 bg-[#7c5cff] text-white rounded-xl text-[1rem] font-semibold hover:bg-[#6b4ce6] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#7c5cff]/20"
          >
            Create Folder
          </button>
        </div>
      </div>
    </div>
  );
};
