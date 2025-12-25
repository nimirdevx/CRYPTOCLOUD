import React from "react";

interface RenameModalProps {
  isOpen: boolean;
  currentName: string;
  newName: string;
  isFolder: boolean;
  onNewNameChange: (name: string) => void;
  onClose: () => void;
  onRename: () => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  currentName,
  newName,
  isFolder,
  onNewNameChange,
  onClose,
  onRename,
}) => {
  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newName.trim()) {
      onRename();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-scale-up">
        {/* Header with Icon */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0">
            <svg
              className="w-7 h-7 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              Rename {isFolder ? "Folder" : "File"}
            </h3>
            <p className="text-[1rem] text-gray-600 mt-1">Enter a new name</p>
          </div>
        </div>

        {/* Current Name Info */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Current name:</p>
          <p className="text-[1rem] font-semibold text-gray-900 break-all">
            {currentName}
          </p>
        </div>

        {/* Input Field */}
        <input
          type="text"
          value={newName}
          onChange={(e) => onNewNameChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter new name"
          className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-[1rem] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all mb-6"
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
            onClick={onRename}
            disabled={!newName.trim()}
            className="flex-1 px-5 py-3 bg-amber-600 text-white rounded-xl text-[1rem] font-semibold hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-600/20"
          >
            Rename
          </button>
        </div>
      </div>
    </div>
  );
};
