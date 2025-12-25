import React, { useState } from "react";
import { HardDrive, Folder, FolderOpen } from "lucide-react";

interface FolderItem {
  id: string;
  filename: string;
}

interface FolderTreeProps {
  currentFolderId: string | null;
  folders: FolderItem[];
  onFolderClick: (folderId: string | null) => void;
  onFolderDrop?: (e: React.DragEvent, folderId: string | null) => void;
  draggedItem?: { id: string; isFolder: boolean } | null;
}

export const FolderTree: React.FC<FolderTreeProps> = ({
  currentFolderId,
  folders,
  onFolderClick,
  onFolderDrop,
  draggedItem,
}) => {
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();

    // Only allow drop if we're dragging an internal item and not dropping on itself
    const isInternalDrag = e.dataTransfer.types.includes("application/file-id");
    if (isInternalDrag && draggedItem && draggedItem.id !== folderId) {
      setDropTargetId(folderId);
      e.dataTransfer.dropEffect = "move";
    } else {
      e.dataTransfer.dropEffect = "none";
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDropTargetId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTargetId(null);

    if (onFolderDrop) {
      onFolderDrop(e, folderId);
    }
  };

  return (
    <div className="flex-1 space-y-1 overflow-y-auto thin-scrollbar">
      <button
        onClick={() => onFolderClick(null)}
        onDragOver={(e) => handleDragOver(e, null)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, null)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
          currentFolderId === null
            ? "bg-[#7c5cff]/10 text-gray-900"
            : dropTargetId === null && draggedItem
            ? "bg-[#7c5cff]/20 text-gray-900 ring-2 ring-[#7c5cff]"
            : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        <HardDrive
          className={`w-5 h-5 ${
            currentFolderId === null
              ? "text-[#7c5cff] fill-[#7c5cff]"
              : "text-gray-500"
          }`}
        />
        <span className="text-[1.1rem] leading-6 font-medium">My Files</span>
      </button>

      {folders.map((folder) => (
        <button
          key={folder.id}
          onClick={() => onFolderClick(folder.id)}
          onDragOver={(e) => handleDragOver(e, folder.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, folder.id)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
            currentFolderId === folder.id
              ? "bg-[#7c5cff]/10 text-gray-900"
              : dropTargetId === folder.id
              ? "bg-[#7c5cff]/20 text-gray-900 ring-2 ring-[#7c5cff]"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {currentFolderId === folder.id ? (
            <FolderOpen className="w-5 h-5 text-[#7c5cff] fill-[#7c5cff]" />
          ) : (
            <Folder className="w-5 h-5 text-gray-500" />
          )}
          <span className="text-[1.1rem] leading-6 font-normal truncate">
            {folder.filename}
          </span>
        </button>
      ))}
    </div>
  );
};
