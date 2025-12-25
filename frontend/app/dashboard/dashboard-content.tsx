"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { useFileManager } from "@/app/hooks/useFileManager";
import { useUploadQueue } from "@/app/hooks/useUploadQueue";
import { Folder } from "lucide-react";
import { ShareModal } from "@/app/components/ShareModal";
import { PreviewModal } from "@/app/components/PreviewModal";
import { DeleteConfirmationModal } from "@/app/components/DeleteConfirmationModal";
import UploadQueuePanel from "@/app/components/UploadQueuePanel";
import {
  DetailsPanel,
  EmptyState,
  FileTable,
  FileToolbar,
  FolderTree,
  NewFolderModal,
  PaginationControls,
  RenameModal,
  SearchBar,
} from "@/app/components/FileManager";

export default function DashboardContent() {
  const {
    files,
    storageUsage,
    isFetchingFiles,
    isUploading,
    uploadProgress,
    message,
    error,
    currentFolderId,
    folderPath,
    currentPage,
    totalPages,
    totalItems,
    fetchFiles,
    searchFiles,
    goToPage,
    uploadFile,
    downloadFile,
    deleteFile,
    renameFile,
    moveFile,
    createFolder,
    navigateToFolder,
    navigateToFolderById,
    navigateToBreadcrumb,
    setError,
    setMessage,
    previewFile,
  } = useFileManager();

  // Upload queue hook
  const {
    uploads,
    isUploading: isQueueUploading,
    addToQueue,
    cancelUpload,
    removeUpload,
    cancelAll,
    clearCompleted,
    retryUpload,
  } = useUploadQueue(() => {
    // Refresh files when upload completes
    fetchFiles();
  });

  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [selectedFileMetadata, setSelectedFileMetadata] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{
    id: string;
    isFolder: boolean;
  } | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewFilename, setPreviewFilename] = useState("");
  const [previewFileSize, setPreviewFileSize] = useState<number | undefined>(
    undefined
  );
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameInput, setRenameInput] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [allFolders, setAllFolders] = useState<any[]>([]);
  const [currentFolderMetadata, setCurrentFolderMetadata] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevSearchQuery = useRef<string>("");

  // When searching, display all files as returned by API
  // When not searching, display files normally
  const displayItems = files;

  // Handle search with debouncing
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        await searchFiles(searchQuery);
        setIsSearching(false);
        prevSearchQuery.current = searchQuery;
      } else if (prevSearchQuery.current !== "") {
        // Only fetch files if we're clearing a previous search
        // This prevents unnecessary fetches on mount or re-renders
        setIsSearching(false);
        await fetchFiles();
        prevSearchQuery.current = "";
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]); // Only depend on searchQuery, not on the functions

  // Update current folder metadata when currentFolderId changes
  useEffect(() => {
    if (currentFolderId) {
      // Find the current folder from allFolders
      const currentFolder = allFolders.find((f) => f.id === currentFolderId);
      setCurrentFolderMetadata(currentFolder || null);
    } else {
      setCurrentFolderMetadata(null);
    }
  }, [currentFolderId, allFolders]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openDropdownId) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [openDropdownId]);

  // Fetch all folders from root to display in sidebar
  useEffect(() => {
    // Collect all folders recursively from files array
    const collectAllFolders = () => {
      const foldersSet = new Map();

      // Add current level folders
      const currentFolders = files.filter((f) => f.isFolder);
      currentFolders.forEach((folder) => {
        foldersSet.set(folder.id, folder);
      });

      // Add folders from allFolders state that aren't in current view
      allFolders.forEach((folder) => {
        if (!foldersSet.has(folder.id)) {
          foldersSet.set(folder.id, folder);
        }
      });

      // Update allFolders if there are changes
      const newFolders = Array.from(foldersSet.values());
      if (
        newFolders.length !== allFolders.length ||
        newFolders.some((f) => !allFolders.find((af) => af.id === f.id))
      ) {
        setAllFolders(newFolders);
      }
    };

    const currentFolders = files.filter((f) => f.isFolder);
    if (currentFolders.length > 0) {
      collectAllFolders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  // Auto-dismiss messages after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [message, setMessage]);

  // Auto-dismiss errors after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  const handleFileClick = (file: any) => {
    // If it's a folder, navigate into it immediately
    if (file.isFolder) {
      navigateToFolder(file);
      setSelectedFiles([]);
      setSelectedFileMetadata(null);
    } else {
      // For files, just select them
      setSelectedFileMetadata(file);
      if (!selectedFiles.includes(file.id)) {
        setSelectedFiles([file.id]);
      }
    }
  };

  const handleFileDoubleClick = async (file: any) => {
    if (file.isFolder) {
      navigateToFolder(file);
      setSelectedFiles([]);
      setSelectedFileMetadata(null);
    } else {
      // Preview file on double-click
      try {
        const { url, filename } = await previewFile(file);
        setPreviewUrl(url);
        setPreviewFilename(filename);
        setPreviewFileSize(file.file_size);
        setShowPreviewModal(true);
      } catch (err) {
        console.error("Preview failed:", err);
      }
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    navigateToBreadcrumb(index);
    setSelectedFiles([]);
    setSelectedFileMetadata(null);
  };

  const handleSidebarFolderClick = (folderId: string | null) => {
    // Clear any selections first
    setSelectedFiles([]);
    setSelectedFileMetadata(null);

    if (folderId === null) {
      // Go to root
      navigateToFolderById(null, "My Files");
    } else {
      // Find the folder to get its name
      let folder = allFolders.find((f) => f.id === folderId);

      if (folder) {
        // Navigate directly to this folder (assumes root-level folder)
        navigateToFolderById(folder.id, folder.filename);
      }
    }
  };

  const clearSelection = () => {
    setSelectedFiles([]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only show upload overlay for external files (not internal moves)
    const hasFiles = e.dataTransfer.types.includes("Files");
    const isInternalDrag = e.dataTransfer.types.includes("application/file-id");

    // Only set isDragging for external file uploads
    if (hasFiles && !isInternalDrag) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only hide overlay if leaving the actual drop zone, not child elements
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (
      x <= rect.left ||
      x >= rect.right ||
      y <= rect.top ||
      y >= rect.bottom
    ) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDropTargetId(null);

    // Check if it's an internal drag (file/folder move)
    const internalItemId = e.dataTransfer.getData("application/file-id");

    if (internalItemId && draggedItem) {
      // It's an internal drag - move the file/folder
      try {
        await moveFile(internalItemId, currentFolderId);
        setDraggedItem(null);
      } catch (err: any) {
        console.error("Move failed:", err);
      }
    } else {
      // It's an external drag - upload files
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        // Add all dropped files to the upload queue
        addToQueue(droppedFiles, currentFolderId);
      }
    }
  };

  // Handle drag start for internal file/folder moves
  const handleItemDragStart = (
    e: React.DragEvent,
    fileId: string,
    isFolder: boolean
  ) => {
    e.stopPropagation();
    setDraggedItem({ id: fileId, isFolder });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/file-id", fileId);
    e.dataTransfer.setData("text/plain", fileId); // Fallback for some browsers
  };

  // Handle drag end
  const handleItemDragEnd = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedItem(null);
    setDropTargetId(null);
  };

  // Handle drop on a specific folder
  const handleFolderDrop = async (
    e: React.DragEvent,
    targetFolderId: string | null
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTargetId(null);

    const internalItemId = e.dataTransfer.getData("application/file-id");

    if (internalItemId && draggedItem) {
      // Prevent moving folder into itself
      if (targetFolderId && internalItemId === targetFolderId) {
        setError("Cannot move a folder into itself");
        setDraggedItem(null);
        return;
      }

      // Move the file/folder to the target folder (or root if null)
      try {
        await moveFile(internalItemId, targetFolderId);
        setDraggedItem(null);
      } catch (err: any) {
        console.error("Move failed:", err);
      }
    }
  };

  // Handle drag over folder (for visual feedback)
  const handleFolderDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Only show drop indicator if we're dragging an internal item
    if (draggedItem && draggedItem.id !== folderId) {
      setDropTargetId(folderId);
      e.dataTransfer.dropEffect = "move";
    } else {
      e.dataTransfer.dropEffect = "none";
    }
  };

  // Handle drag leave folder
  const handleFolderDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only clear if we're leaving the actual folder element
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDropTargetId(null);
    }
  };

  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      // Add all selected files to the upload queue
      addToQueue(Array.from(selectedFiles), currentFolderId);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
    setShowAddMenu(false);
  };

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      await createFolder(newFolderName.trim());
      setNewFolderName("");
      setShowNewFolderModal(false);
    }
  };

  const handleDownload = async () => {
    if (selectedFileMetadata && !selectedFileMetadata.isFolder) {
      await downloadFile(selectedFileMetadata);
    }
  };

  const handleDelete = async () => {
    if (selectedFileMetadata) {
      setFileToDelete(selectedFileMetadata);
      setShowDeleteModal(true);
    }
  };

  const handleDeleteFromDropdown = (file: any) => {
    setFileToDelete(file);
    setShowDeleteModal(true);
    setOpenDropdownId(null);
  };

  const handleConfirmDelete = async () => {
    if (fileToDelete) {
      setIsDeleting(true);
      await deleteFile(fileToDelete.id);
      setIsDeleting(false);
      setShowDeleteModal(false);
      setFileToDelete(null);

      // Clear selection if the deleted file was selected
      if (selectedFileMetadata?.id === fileToDelete.id) {
        setSelectedFileMetadata(null);
        setSelectedFiles([]);
      }
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setFileToDelete(null);
  };

  const handleShare = () => {
    if (selectedFileMetadata && !selectedFileMetadata.isFolder) {
      setShowShareModal(true);
    }
  };

  const handlePreview = async () => {
    if (selectedFileMetadata && !selectedFileMetadata.isFolder) {
      try {
        const { url, filename } = await previewFile(selectedFileMetadata);
        setPreviewUrl(url);
        setPreviewFilename(filename);
        setPreviewFileSize(selectedFileMetadata.file_size);
        setShowPreviewModal(true);
      } catch (err) {
        console.error("Preview failed:", err);
      }
    }
  };

  const handleRename = () => {
    if (selectedFileMetadata) {
      setRenameInput(selectedFileMetadata.filename);
      setShowRenameModal(true);
    }
  };

  const handleRenameSubmit = async () => {
    if (selectedFileMetadata && renameInput.trim()) {
      await renameFile(selectedFileMetadata.id, renameInput.trim());
      setShowRenameModal(false);
      setRenameInput("");
      // Update the selected file metadata
      setSelectedFileMetadata({
        ...selectedFileMetadata,
        filename: renameInput.trim(),
      });
    }
  };

  const handleDownloadFromDropdown = async (file: any) => {
    if (!file.isFolder) {
      await downloadFile(file);
    }
    setOpenDropdownId(null);
  };

  const handleRenameFromDropdown = (file: any) => {
    setSelectedFileMetadata(file);
    setRenameInput(file.filename);
    setShowRenameModal(true);
    setOpenDropdownId(null);
  };

  const handleShareFromDropdown = (file: any) => {
    if (!file.isFolder) {
      setSelectedFileMetadata(file);
      setShowShareModal(true);
    }
    setOpenDropdownId(null);
  };

  const handlePreviewFromDropdown = async (file: any) => {
    if (!file.isFolder) {
      try {
        const { url, filename } = await previewFile(file);
        setPreviewUrl(url);
        setPreviewFilename(filename);
        setPreviewFileSize(file.file_size);
        setShowPreviewModal(true);
      } catch (err) {
        console.error("Preview failed:", err);
      }
    }
    setOpenDropdownId(null);
  };

  const toggleDropdown = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDropdownId(openDropdownId === fileId ? null : fileId);
  };

  const closePreview = () => {
    setShowPreviewModal(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }
    setPreviewFileSize(undefined);
  };

  return (
    <div className="flex-1 flex flex-col gap-6 overflow-hidden">
      {/* Header Row: Title, Search Bar, Icon */}
      <div className="flex items-center gap-4 px-2 pt-6 shrink-0">
        {/* Left: My Files Title */}
        <h1 className="text-[2.5rem] leading-12 font-bold text-gray-900 w-64">
          My files
        </h1>

        {/* Center: Search Bar */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          isSearching={isSearching}
        />

        {/* Right: Folder Icon */}
        <div className="w-72 flex justify-end">
          <Folder className="w-10 h-10 text-[#7c5cff]" />
        </div>
      </div>

      {/* Main content area with three columns */}
      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
        {/* Column 1: Folder Tree */}
        <div className="w-64 flex flex-col gap-4 shrink-0">
          <FileToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            isSearching={isSearching}
            showAddMenu={showAddMenu}
            onToggleAddMenu={() => setShowAddMenu(!showAddMenu)}
            onUploadClick={() => {
              fileInputRef.current?.click();
              setShowAddMenu(false);
            }}
            onNewFolderClick={() => {
              setShowNewFolderModal(true);
              setShowAddMenu(false);
            }}
          />

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileInputChange}
          />

          <FolderTree
            currentFolderId={currentFolderId}
            folders={allFolders}
            onFolderClick={handleSidebarFolderClick}
            onFolderDrop={handleFolderDrop}
            draggedItem={draggedItem}
          />
        </div>

        {/* Column 2: Main Content */}
        <FileTable
          displayItems={displayItems}
          folderPath={folderPath}
          selectedFiles={selectedFiles}
          openDropdownId={openDropdownId}
          currentFolderId={currentFolderId}
          currentFolderMetadata={currentFolderMetadata}
          isFetchingFiles={isFetchingFiles}
          message={message}
          error={error}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          isDragging={isDragging}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onBreadcrumbClick={handleBreadcrumbClick}
          onToggleDropdown={setOpenDropdownId}
          onShowNewFolderModal={() => setShowNewFolderModal(true)}
          onFileInputClick={() => fileInputRef.current?.click()}
          onFileClick={handleFileClick}
          onFileDoubleClick={handleFileDoubleClick}
          onClearSelection={clearSelection}
          onPreview={handlePreview}
          onDownload={handleDownload}
          onRename={handleRename}
          onShare={handleShare}
          onDelete={handleDelete}
          onPreviewFromDropdown={handlePreviewFromDropdown}
          onDownloadFromDropdown={handleDownloadFromDropdown}
          onRenameFromDropdown={handleRenameFromDropdown}
          onShareFromDropdown={handleShareFromDropdown}
          onDeleteFromDropdown={handleDeleteFromDropdown}
          onNavigateToFolder={navigateToFolder}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          filesCount={files.length}
          onPageChange={goToPage}
          // New drag-and-drop props for internal moves
          draggedItem={draggedItem}
          dropTargetId={dropTargetId}
          onItemDragStart={handleItemDragStart}
          onItemDragEnd={handleItemDragEnd}
          onFolderDrop={handleFolderDrop}
          onFolderDragOver={handleFolderDragOver}
          onFolderDragLeave={handleFolderDragLeave}
        />

        {/* Column 3: Details Panel */}
        <DetailsPanel
          selectedFileMetadata={selectedFileMetadata}
          currentFolderMetadata={currentFolderMetadata}
          storageUsage={storageUsage}
        />
      </div>

      {/* New Folder Modal */}
      <NewFolderModal
        isOpen={showNewFolderModal}
        folderName={newFolderName}
        onFolderNameChange={setNewFolderName}
        onClose={() => {
          setShowNewFolderModal(false);
          setNewFolderName("");
        }}
        onCreate={handleCreateFolder}
      />

      {/* Rename Modal */}
      <RenameModal
        isOpen={showRenameModal}
        currentName={selectedFileMetadata?.filename || ""}
        newName={renameInput}
        isFolder={selectedFileMetadata?.isFolder || false}
        onNewNameChange={setRenameInput}
        onClose={() => {
          setShowRenameModal(false);
          setRenameInput("");
        }}
        onRename={handleRenameSubmit}
      />

      {/* Share Modal */}
      {showShareModal && selectedFileMetadata && (
        <ShareModal
          file={selectedFileMetadata}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Preview Modal */}
      {showPreviewModal && (
        <PreviewModal
          filename={previewFilename}
          previewUrl={previewUrl}
          fileSize={previewFileSize}
          onClose={closePreview}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteConfirmationModal
          file={fileToDelete}
          isLoading={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}

      {/* Upload Queue Panel */}
      <UploadQueuePanel
        uploads={uploads}
        onCancel={cancelUpload}
        onRemove={removeUpload}
        onRetry={retryUpload}
        onCancelAll={cancelAll}
        onClearCompleted={clearCompleted}
      />
    </div>
  );
}
