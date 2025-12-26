import React from "react";
import {
  ChevronRight,
  MoreVertical,
  FolderPlus,
  Upload,
  Pencil,
  Trash2,
  X,
  Eye,
  Download,
  Share2,
  Folder,
  FolderOpen,
  FileText,
  ImageIcon,
  Link,
} from "lucide-react";
import { FileMetadata } from "../../types";
import { formatBytes, formatRelativeDate, getFileType } from "../../utils";
import { EmptyState } from "./EmptyState";
import { PaginationControls } from "./PaginationControls";
import { DragDropOverlay } from "./DragDropOverlay";

interface Breadcrumb {
  id: string | null;
  name: string;
}

interface DraggedItem {
  id: string;
  isFolder: boolean;
}

interface FileTableProps {
  // Data
  displayItems: FileMetadata[];
  folderPath: Breadcrumb[];
  selectedFiles: string[];
  openDropdownId: string | null;
  currentFolderId: string | null;
  currentFolderMetadata: FileMetadata | null;

  // Loading/Messages
  isFetchingFiles: boolean;
  message: string | null;
  error: string | null;
  isUploading: boolean;
  uploadProgress: number;

  // Drag & Drop state (for external file uploads)
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;

  // Drag & Drop state (for internal file/folder moves)
  draggedItem?: DraggedItem | null;
  dropTargetId?: string | null;
  onItemDragStart?: (
    e: React.DragEvent,
    fileId: string,
    isFolder: boolean
  ) => void;
  onItemDragEnd?: (e: React.DragEvent) => void;
  onFolderDrop?: (e: React.DragEvent, folderId: string) => void;
  onFolderDragOver?: (e: React.DragEvent, folderId: string) => void;
  onFolderDragLeave?: (e: React.DragEvent) => void;

  // Breadcrumb actions
  onBreadcrumbClick: (index: number) => void;

  // Dropdown actions
  onToggleDropdown: (id: string | null) => void;
  onShowNewFolderModal: () => void;
  onFileInputClick: () => void;

  // File actions
  onFileClick: (file: FileMetadata) => void;
  onFileDoubleClick: (file: FileMetadata) => void;
  onClearSelection: () => void;

  // Toolbar actions (when files selected)
  onPreview: () => void;
  onDownload: () => void;
  onRename: () => void;
  onShare: () => void;
  onDelete: () => void;

  // Dropdown menu actions
  onPreviewFromDropdown: (file: FileMetadata) => void;
  onDownloadFromDropdown: (file: FileMetadata) => void;
  onRenameFromDropdown: (file: FileMetadata) => void;
  onShareFromDropdown: (file: FileMetadata) => void;
  onCopyLinkFromDropdown: (file: FileMetadata) => void;
  onDeleteFromDropdown: (file: FileMetadata) => void;
  onNavigateToFolder: (file: FileMetadata) => void;

  // Pagination
  currentPage: number;
  totalPages: number;
  totalItems: number;
  filesCount: number;
  onPageChange: (page: number) => void;

  // Mobile
  onShowMobileDetails?: (file: FileMetadata) => void;
}

export const FileTable: React.FC<FileTableProps> = ({
  displayItems,
  folderPath,
  selectedFiles,
  openDropdownId,
  currentFolderId,
  currentFolderMetadata,
  isFetchingFiles,
  message,
  error,
  isUploading,
  uploadProgress,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  draggedItem,
  dropTargetId,
  onItemDragStart,
  onItemDragEnd,
  onFolderDrop,
  onFolderDragOver,
  onFolderDragLeave,
  onBreadcrumbClick,
  onToggleDropdown,
  onShowNewFolderModal,
  onFileInputClick,
  onFileClick,
  onFileDoubleClick,
  onClearSelection,
  onPreview,
  onDownload,
  onRename,
  onShare,
  onDelete,
  onPreviewFromDropdown,
  onDownloadFromDropdown,
  onRenameFromDropdown,
  onShareFromDropdown,
  onCopyLinkFromDropdown,
  onDeleteFromDropdown,
  onNavigateToFolder,
  currentPage,
  totalPages,
  totalItems,
  filesCount,
  onPageChange,
  onShowMobileDetails,
}) => {
  const selectedFileMetadata =
    selectedFiles.length === 1
      ? displayItems.find((f) => f.id === selectedFiles[0])
      : null;

  return (
    <div
      className={`flex-1 bg-white lg:rounded-3xl md:rounded-2xl rounded-none shadow-sm flex flex-col overflow-hidden relative transition-all duration-200 min-h-0 ${
        isDragging
          ? "ring-4 ring-[#7c5cff]/50 shadow-2xl shadow-[#7c5cff]/20"
          : ""
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Drag & Drop Overlay */}
      <DragDropOverlay isDragging={isDragging} />

      {/* Breadcrumb & Actions */}
      <div className="lg:px-6 md:px-4 px-3 lg:py-4 md:py-3 py-2 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 lg:text-[1.2rem] md:text-base text-sm overflow-x-auto hide-scrollbar">
            {folderPath.map((crumb, index) => (
              <div key={index} className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onBreadcrumbClick(index)}
                  className={`font-medium hover:text-[#7c5cff] transition-colors truncate ${
                    index === folderPath.length - 1
                      ? "text-gray-900"
                      : "text-gray-500"
                  }`}
                >
                  {crumb.name}
                </button>
                {index < folderPath.length - 1 && (
                  <ChevronRight className="lg:w-5 lg:h-5 md:w-4 md:h-4 w-3 h-3 text-gray-400 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* More options */}
        <div className="relative shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleDropdown(
                openDropdownId === "breadcrumb-actions"
                  ? null
                  : "breadcrumb-actions"
              );
            }}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MoreVertical className="lg:w-5 lg:h-5 md:w-4 md:h-4 w-4 h-4 text-gray-600" />
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
                      onShowNewFolderModal();
                      onToggleDropdown(null);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                  >
                    <FolderPlus className="w-4 h-4" />
                    New Folder
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onFileInputClick();
                      onToggleDropdown(null);
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
                      onShowNewFolderModal();
                      onToggleDropdown(null);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                  >
                    <FolderPlus className="w-4 h-4" />
                    New Folder
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onFileInputClick();
                      onToggleDropdown(null);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                  >
                    <Upload className="w-4 h-4" />
                    Upload File
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (currentFolderMetadata) {
                        onRenameFromDropdown(currentFolderMetadata);
                      }
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                  >
                    <Pencil className="w-4 h-4" />
                    Rename Folder
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (currentFolderMetadata) {
                        onDeleteFromDropdown(currentFolderMetadata);
                      }
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Folder
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="mx-6 mt-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm">
          {message}
        </div>
      )}
      {error && (
        <div className="mx-6 mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
          {error}
        </div>
      )}
      {isUploading && (
        <div className="mx-6 mt-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-sm">
          <div className="flex items-center justify-between mb-2">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-[#7c5cff] h-2 rounded-full transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* File List */}
      <div className="flex-1 overflow-y-auto thin-scrollbar min-h-0 md:pb-0 pb-20">
        {isFetchingFiles ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-[#7c5cff] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : displayItems.length === 0 ? (
          <EmptyState
            onUploadClick={onFileInputClick}
            onNewFolderClick={onShowNewFolderModal}
          />
        ) : (
          /* File Table - Desktop/Tablet */
          <>
            <table className="w-full hidden md:table">
              <thead className="sticky top-0 bg-white z-10">
                {selectedFiles.length > 0 ? (
                  /* Action Header when files are selected */
                  <tr className="border-b border-gray-100">
                    <th className="px-6 py-3 text-left">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={onClearSelection}
                          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5 text-gray-500" />
                        </button>
                        <span className="text-md text-gray-600 font-normal whitespace-nowrap">
                          {selectedFiles.length} item
                          {selectedFiles.length > 1 ? "s" : ""} selected
                        </span>
                        <div className="flex items-center gap-2 ml-8">
                          <button
                            onClick={onPreview}
                            className="p-2 hover:bg-gray-200 rounded-xl transition-colors bg-gray-50"
                            title="Preview"
                            disabled={selectedFileMetadata?.isFolder}
                          >
                            <Eye className="w-5 h-5 text-gray-700" />
                          </button>
                          <button
                            onClick={onDownload}
                            className="p-2 hover:bg-gray-200 rounded-xl transition-colors bg-gray-50"
                            title="Download"
                            disabled={selectedFileMetadata?.isFolder}
                          >
                            <Download className="w-5 h-5 text-gray-700" />
                          </button>
                          <button
                            onClick={onRename}
                            className="p-2 hover:bg-gray-200 rounded-xl transition-colors bg-gray-50"
                            title="Rename"
                          >
                            <Pencil className="w-5 h-5 text-gray-700" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onShare();
                            }}
                            className="p-2 hover:bg-gray-200 rounded-xl transition-colors bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Share"
                            disabled={selectedFileMetadata?.isFolder}
                          >
                            <Share2 className="w-5 h-5 text-gray-700" />
                          </button>
                          <button
                            onClick={onDelete}
                            className="p-2 hover:bg-red-100 rounded-xl transition-colors bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5 text-red-600" />
                          </button>
                        </div>
                      </div>
                    </th>
                    <th className="px-6 py-3 lg:table-cell hidden"></th>
                    <th className="px-6 py-3 lg:table-cell hidden"></th>
                    <th className="px-6 py-3"></th>
                  </tr>
                ) : (
                  /* Normal Header */
                  <tr className="border-b border-gray-100">
                    <th className="px-6 py-3 text-left lg:text-[1rem] md:text-sm text-[1rem] font-semibold text-gray-500 uppercase">
                      Title
                    </th>
                    <th className="lg:table-cell hidden px-6 py-3 text-left lg:text-[1rem] md:text-sm text-[1rem] font-semibold text-gray-500 uppercase">
                      Date modified
                    </th>
                    <th className="lg:table-cell hidden px-6 py-3 text-left lg:text-[1rem] md:text-sm text-[1rem] font-semibold text-gray-500 uppercase">
                      Size
                    </th>
                    <th className="px-6 py-3"></th>
                  </tr>
                )}
              </thead>
              <tbody>
                {displayItems.map((file) => (
                  <tr
                    key={file.id}
                    draggable={!!onItemDragStart}
                    onDragStart={(e) =>
                      onItemDragStart?.(e, file.id, file.isFolder)
                    }
                    onDragEnd={onItemDragEnd}
                    onDragOver={(e) => {
                      if (file.isFolder && onFolderDragOver) {
                        onFolderDragOver(e, file.id);
                      }
                    }}
                    onDragLeave={(e) => {
                      if (file.isFolder && onFolderDragLeave) {
                        onFolderDragLeave(e);
                      }
                    }}
                    onDrop={(e) => {
                      if (file.isFolder && onFolderDrop) {
                        onFolderDrop(e, file.id);
                      }
                    }}
                    onClick={() => onFileClick(file)}
                    onDoubleClick={() => onFileDoubleClick(file)}
                    className={`border-b border-gray-50 cursor-pointer transition-colors group ${
                      selectedFiles.includes(file.id)
                        ? "bg-[#7c5cff]/10"
                        : dropTargetId === file.id && file.isFolder
                        ? "bg-[#7c5cff]/20 border-[#7c5cff]"
                        : draggedItem?.id === file.id
                        ? "opacity-50"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {file.isFolder ? (
                          <Folder className="w-5 h-5 text-[#7c5cff] shrink-0" />
                        ) : getFileType(file.filename, file.isFolder) ===
                          "Image" ? (
                          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center shrink-0">
                            <ImageIcon className="w-4 h-4 text-gray-400" />
                          </div>
                        ) : (
                          <FileText className="w-5 h-5 text-gray-400 shrink-0" />
                        )}
                        <span className="lg:text-[1.2rem] md:text-base text-[1.2rem] lg:leading-7 md:leading-6 leading-7 font-medium text-gray-700 truncate lg:max-w-none md:max-w-[250px] max-w-none">
                          {file.filename}
                        </span>
                      </div>
                    </td>
                    <td className="lg:table-cell hidden px-6 py-3 lg:text-[1.1rem] md:text-sm text-[1.1rem] lg:leading-6 md:leading-5 leading-6 text-gray-500 whitespace-nowrap">
                      {formatRelativeDate(file.upload_time)}
                    </td>
                    <td className="lg:table-cell hidden px-6 py-3 lg:text-[1.1rem] md:text-sm text-[1.1rem] lg:leading-6 md:leading-5 leading-6 text-gray-500 whitespace-nowrap">
                      {file.isFolder
                        ? file.calculatedSize !== undefined &&
                          file.calculatedSize > 0
                          ? formatBytes(file.calculatedSize)
                          : file.itemCount !== undefined
                          ? `${file.itemCount} item${
                              file.itemCount !== 1 ? "s" : ""
                            }`
                          : "Empty"
                        : formatBytes(file.file_size)}
                    </td>
                    <td className="px-6 py-3 text-right relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleDropdown(
                            openDropdownId === file.id ? null : file.id
                          );
                        }}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors group-hover:opacity-100"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-600" />
                      </button>

                      {/* Dropdown Menu */}
                      {openDropdownId === file.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                          {file.isFolder ? (
                            /* Folder-specific actions */
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNavigateToFolder(file);
                                  onToggleDropdown(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                              >
                                <FolderOpen className="w-4 h-4" />
                                Open
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRenameFromDropdown(file);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                              >
                                <Pencil className="w-4 h-4" />
                                Rename
                              </button>
                              <div className="border-t border-gray-100 my-1"></div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteFromDropdown(file);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete Folder
                              </button>
                            </>
                          ) : (
                            /* File-specific actions */
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPreviewFromDropdown(file);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                              >
                                <Eye className="w-4 h-4" />
                                Preview
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDownloadFromDropdown(file);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                              >
                                <Download className="w-4 h-4" />
                                Download
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRenameFromDropdown(file);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                              >
                                <Pencil className="w-4 h-4" />
                                Rename
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onShareFromDropdown(file);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                              >
                                <Share2 className="w-4 h-4" />
                                Share
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCopyLinkFromDropdown(file);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                              >
                                <Link className="w-4 h-4" />
                                Copy Link
                              </button>
                              <div className="border-t border-gray-100 my-1"></div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteFromDropdown(file);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile List View */}
            <div className="md:hidden">
              {displayItems.map((file) => (
                <div
                  key={file.id}
                  onClick={() => onFileClick(file)}
                  onDoubleClick={() => onFileDoubleClick(file)}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-gray-50 active:bg-gray-50 transition-colors ${
                    selectedFiles.includes(file.id) ? "bg-[#7c5cff]/10" : ""
                  }`}
                >
                  {/* Icon */}
                  <div className="shrink-0">
                    {file.isFolder ? (
                      <Folder className="w-6 h-6 text-[#7c5cff]" />
                    ) : getFileType(file.filename, file.isFolder) ===
                      "Image" ? (
                      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-gray-400" />
                      </div>
                    ) : (
                      <FileText className="w-6 h-6 text-gray-400" />
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.filename}
                    </p>
                    <p className="text-xs text-gray-500">
                      {file.isFolder
                        ? file.itemCount !== undefined
                          ? `${file.itemCount} item${
                              file.itemCount !== 1 ? "s" : ""
                            }`
                          : "Empty"
                        : formatBytes(file.file_size)}{" "}
                      · {formatRelativeDate(file.upload_time)}
                    </p>
                  </div>

                  {/* Three-dot menu button */}
                  <div className="relative shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleDropdown(
                          openDropdownId === file.id ? null : file.id
                        );
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>

                    {/* Dropdown Menu */}
                    {openDropdownId === file.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                        {file.isFolder ? (
                          /* Folder-specific actions */
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigateToFolder(file);
                                onToggleDropdown(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                            >
                              <FolderOpen className="w-4 h-4" />
                              Open
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRenameFromDropdown(file);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                            >
                              <Pencil className="w-4 h-4" />
                              Rename
                            </button>
                            <div className="border-t border-gray-100 my-1"></div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteFromDropdown(file);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete Folder
                            </button>
                          </>
                        ) : (
                          /* File-specific actions */
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onPreviewFromDropdown(file);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                            >
                              <Eye className="w-4 h-4" />
                              Preview
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDownloadFromDropdown(file);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRenameFromDropdown(file);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                            >
                              <Pencil className="w-4 h-4" />
                              Rename
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onShareFromDropdown(file);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                            >
                              <Share2 className="w-4 h-4" />
                              Share
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onCopyLinkFromDropdown(file);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                            >
                              <Link className="w-4 h-4" />
                              Copy Link
                            </button>
                            <div className="border-t border-gray-100 my-1"></div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteFromDropdown(file);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination Controls */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsCount={filesCount}
        onPageChange={onPageChange}
      />
    </div>
  );
};
