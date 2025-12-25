import React from "react";
import { ChevronRight, MoreVertical, FolderPlus, Upload } from "lucide-react";

interface BreadcrumbItem {
  id: string | null;
  name: string;
}

interface BreadcrumbsProps {
  folderPath: BreadcrumbItem[];
  currentFolderId: string | null;
  openDropdownId: string | null;
  onBreadcrumbClick: (index: number) => void;
  onToggleDropdown: (id: string) => void;
  onNewFolder: () => void;
  onUploadClick: () => void;
  onDownload?: () => void;
  onRename?: () => void;
  onMove?: () => void;
  onDelete?: () => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  folderPath,
  currentFolderId,
  openDropdownId,
  onBreadcrumbClick,
  onToggleDropdown,
  onNewFolder,
  onUploadClick,
  onDownload,
  onRename,
  onMove,
  onDelete,
}) => {
  return (
    <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
      <div className="flex items-center gap-2">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-[1.2rem]">
          {folderPath.map((crumb, index) => (
            <div key={index} className="flex items-center gap-1">
              <button
                onClick={() => onBreadcrumbClick(index)}
                className={`font-medium hover:text-[#7c5cff] transition-colors ${
                  index === folderPath.length - 1
                    ? "text-gray-900"
                    : "text-gray-500"
                }`}
              >
                {crumb.name}
              </button>
              {index < folderPath.length - 1 && (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* More options */}
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleDropdown("breadcrumb-actions");
          }}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <MoreVertical className="w-5 h-5 text-gray-600" />
        </button>

        {/* Dropdown Menu for Folder/Root Actions */}
        {openDropdownId === "breadcrumb-actions" && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
            {currentFolderId === null ? (
              /* Root "My Files" actions */
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNewFolder();
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <FolderPlus className="w-4 h-4" />
                  New Folder
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUploadClick();
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <Upload className="w-4 h-4" />
                  Upload File
                </button>
              </>
            ) : (
              /* Current folder actions */
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNewFolder();
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <FolderPlus className="w-4 h-4" />
                  New Folder
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUploadClick();
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <Upload className="w-4 h-4" />
                  Upload File
                </button>
                {onRename && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRename();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                  >
                    <Upload className="w-4 h-4" />
                    Rename
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                  >
                    <Upload className="w-4 h-4" />
                    Delete
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
