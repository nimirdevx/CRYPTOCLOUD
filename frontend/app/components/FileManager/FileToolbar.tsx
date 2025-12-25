import React from "react";
import { Plus, ChevronDown, Upload, FolderPlus, Search } from "lucide-react";

interface FileToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isSearching?: boolean;
  showAddMenu: boolean;
  onToggleAddMenu: () => void;
  onUploadClick: () => void;
  onNewFolderClick: () => void;
}

export const FileToolbar: React.FC<FileToolbarProps> = ({
  searchQuery,
  onSearchChange,
  isSearching,
  showAddMenu,
  onToggleAddMenu,
  onUploadClick,
  onNewFolderClick,
}) => {
  return (
    <div className="relative">
      <button
        onClick={onToggleAddMenu}
        className="flex items-center gap-2 px-5 py-2.5 bg-[#7c5cff] text-white rounded-xl font-medium hover:bg-[#6b4ce6] transition-colors w-fit"
      >
        <Plus className="w-5 h-5" />
        Add
        <ChevronDown className="w-4 h-4" />
      </button>

      {showAddMenu && (
        <div className="absolute top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-10">
          <button
            onClick={onUploadClick}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload file
          </button>
          <button
            onClick={onNewFolderClick}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
            Add folder
          </button>
        </div>
      )}
    </div>
  );
};

export const SearchBar: React.FC<{
  value: string;
  onChange: (value: string) => void;
  isSearching?: boolean;
}> = ({ value, onChange, isSearching }) => {
  return (
    <div className="flex-1 relative">
      <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
      <input
        type="text"
        placeholder="Search files and folders..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7c5cff] focus:border-transparent shadow-sm"
      />
      {isSearching && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-[#7c5cff] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};
