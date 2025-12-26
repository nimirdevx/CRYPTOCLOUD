import React, { useState } from "react";
import {
  Cloud,
  Folder,
  FileText,
  ImageIcon,
  Link2,
  Share2,
} from "lucide-react";
import { formatBytes, formatRelativeDate, getFileType } from "../../utils";
import { StorageQuotaBar } from "../StorageQuotaBar";
import PublicLinkModal from "../PublicLinkModal";
import { ShareModal } from "../ShareModal";

interface FileMetadata {
  id: string;
  filename: string;
  isFolder: boolean;
  file_size?: number;
  upload_time: string;
  itemCount?: number;
  calculatedSize?: number;
  encryptedFileKey?: string | null;
}

interface StorageUsage {
  used: number;
  quota: number;
}

interface DetailsPanelProps {
  selectedFileMetadata: FileMetadata | null;
  currentFolderMetadata: FileMetadata | null;
  storageUsage: StorageUsage | null;
}

export const DetailsPanel: React.FC<DetailsPanelProps> = ({
  selectedFileMetadata,
  currentFolderMetadata,
  storageUsage,
}) => {
  const [showPublicLinkModal, setShowPublicLinkModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  if (selectedFileMetadata) {
    return (
      <aside className="lg:w-72 md:w-64 w-full h-full bg-white lg:rounded-3xl md:rounded-2xl rounded-none shadow-sm flex flex-col overflow-y-auto lg:p-6 md:p-4 p-3">
        {/* File Preview */}
        <div className="flex justify-center mb-6">
          <div className="lg:w-28 lg:h-28 md:w-20 md:h-20 w-20 h-20 bg-[#E8E4FF] rounded-2xl flex items-center justify-center">
            {selectedFileMetadata.isFolder ? (
              <Folder className="lg:w-14 lg:h-14 md:w-10 md:h-10 w-10 h-10 text-[#7c5cff]" />
            ) : getFileType(selectedFileMetadata.filename, false) ===
              "Image" ? (
              <ImageIcon className="lg:w-14 lg:h-14 md:w-10 md:h-10 w-10 h-10 text-[#7c5cff]" />
            ) : (
              <FileText className="lg:w-14 lg:h-14 md:w-10 md:h-10 w-10 h-10 text-[#7c5cff]" />
            )}
          </div>
        </div>

        {/* File Name */}
        <h3 className="lg:text-[1.3rem] md:text-base text-base lg:leading-8 md:leading-6 leading-6 font-semibold text-gray-900 text-center lg:mb-8 md:mb-4 mb-4 wrap-break-word">
          {selectedFileMetadata.filename}
        </h3>

        {/* File/Folder Details */}
        <div className="space-y-3 lg:text-base md:text-sm text-sm">
          <div>
            <span className="text-gray-500 font-medium lg:text-sm md:text-xs text-xs">
              Type
            </span>
            <p className="text-gray-900 mt-1 lg:text-base md:text-sm text-sm">
              {getFileType(
                selectedFileMetadata.filename,
                selectedFileMetadata.isFolder
              )}
            </p>
          </div>

          {selectedFileMetadata.isFolder ? (
            <>
              <div>
                <span className="text-gray-500 font-medium text-[1rem]">
                  Items
                </span>
                <p className="text-gray-900 mt-1 text-[1.1rem]">
                  {selectedFileMetadata.itemCount !== undefined
                    ? `${selectedFileMetadata.itemCount} item${
                        selectedFileMetadata.itemCount !== 1 ? "s" : ""
                      }`
                    : "Unknown"}
                </p>
              </div>

              <div>
                <span className="text-gray-500 font-medium text-[1rem]">
                  Total Size
                </span>
                <p className="text-gray-900 mt-1 text-[1.1rem]">
                  {selectedFileMetadata.calculatedSize !== undefined
                    ? formatBytes(selectedFileMetadata.calculatedSize)
                    : "—"}
                </p>
              </div>

              <div>
                <span className="text-gray-500 font-medium text-[1rem]">
                  Created
                </span>
                <p className="text-gray-900 mt-1 text-[1.1rem]">
                  {formatRelativeDate(selectedFileMetadata.upload_time)}
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <span className="text-gray-500 font-medium text-[1rem]">
                  Size
                </span>
                <p className="text-gray-900 mt-1 text-[1.1rem]">
                  {formatBytes(selectedFileMetadata.file_size || 0)}
                </p>
              </div>

              <div>
                <span className="text-gray-500 font-medium text-[1rem]">
                  Date modified
                </span>
                <p className="text-gray-900 mt-1 text-[1.1rem]">
                  {formatRelativeDate(selectedFileMetadata.upload_time)}
                </p>
              </div>
            </>
          )}
        </div>

        {!selectedFileMetadata.isFolder && (
          <>
            <div className="mt-8 pt-6 border-t border-gray-100">
              <span className="text-gray-500 font-medium text-sm">
                Share & Access
              </span>
              <div className="mt-3 space-y-2">
                <button
                  onClick={() => setShowPublicLinkModal(true)}
                  className="w-full py-2.5 px-4 bg-[#7c5cff] text-white rounded-xl text-sm font-medium hover:bg-[#6b4de6] transition-colors flex items-center justify-center gap-2"
                >
                  <Link2 className="w-4 h-4" />
                  Get Public Link
                </button>

                <button
                  onClick={() => setShowShareModal(true)}
                  className="w-full py-2.5 px-4 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share with Users
                </button>
              </div>
            </div>

            {/* Public Link Modal */}
            {selectedFileMetadata.encryptedFileKey && (
              <PublicLinkModal
                isOpen={showPublicLinkModal}
                onClose={() => setShowPublicLinkModal(false)}
                fileId={selectedFileMetadata.id}
                filename={selectedFileMetadata.filename}
                encryptedFileKey={selectedFileMetadata.encryptedFileKey}
              />
            )}

            {/* Share with Users Modal */}
            {showShareModal && (
              <ShareModal
                file={{
                  id: selectedFileMetadata.id,
                  filename: selectedFileMetadata.filename,
                  encryptedFileKey:
                    selectedFileMetadata.encryptedFileKey || null,
                }}
                onClose={() => setShowShareModal(false)}
              />
            )}
          </>
        )}
      </aside>
    );
  }

  if (currentFolderMetadata) {
    return (
      <aside className="lg:w-72 md:w-64 w-full h-full bg-white lg:rounded-3xl md:rounded-2xl rounded-none shadow-sm flex flex-col overflow-y-auto lg:p-6 md:p-4 p-3">
        {/* Folder Preview */}
        <div className="flex justify-center mb-6 mt-8">
          <div className="lg:w-28 lg:h-28 md:w-20 md:h-20 w-20 h-20 bg-[#E8E4FF] rounded-2xl flex items-center justify-center">
            <Folder className="lg:w-14 lg:h-14 md:w-10 md:h-10 w-10 h-10 text-[#7c5cff]" />
          </div>
        </div>

        {/* Folder Name */}
        <h3 className="lg:text-[1.3rem] md:text-base text-base lg:leading-8 md:leading-6 leading-6 font-semibold text-gray-900 text-center lg:mb-8 md:mb-4 mb-4 wrap-break-word">
          {currentFolderMetadata.filename}
        </h3>

        {/* Folder Details */}
        <div className="space-y-3 lg:text-base md:text-sm text-sm">
          <div>
            <span className="text-gray-500 font-medium lg:text-sm md:text-xs text-xs">
              Type
            </span>
            <p className="text-gray-900 mt-1 lg:text-base md:text-sm text-sm">
              Folder
            </p>
          </div>

          <div>
            <span className="text-gray-500 font-medium lg:text-sm md:text-xs text-xs">
              Items
            </span>
            <p className="text-gray-900 mt-1 lg:text-base md:text-sm text-sm">
              {currentFolderMetadata.itemCount !== undefined
                ? `${currentFolderMetadata.itemCount} item${
                    currentFolderMetadata.itemCount !== 1 ? "s" : ""
                  }`
                : "Unknown"}
            </p>
          </div>

          <div>
            <span className="text-gray-500 font-medium lg:text-[1rem] md:text-sm text-xs">
              Total Size
            </span>
            <p className="text-gray-900 mt-1 lg:text-[1.1rem] md:text-base text-sm">
              {currentFolderMetadata.calculatedSize !== undefined
                ? formatBytes(currentFolderMetadata.calculatedSize)
                : "—"}
            </p>
          </div>

          <div>
            <span className="text-gray-500 font-medium lg:text-[1rem] md:text-sm text-xs">
              Created
            </span>
            <p className="text-gray-900 mt-1 lg:text-[1.1rem] md:text-base text-sm">
              {formatRelativeDate(currentFolderMetadata.upload_time)}
            </p>
          </div>
        </div>
      </aside>
    );
  }

  // Default: Show "My Files" at root
  return (
    <aside className="lg:w-72 md:w-64 w-full h-full bg-white lg:rounded-3xl md:rounded-2xl rounded-none shadow-sm flex flex-col overflow-y-auto lg:p-6 md:p-4 p-3">
      <div className="flex justify-center mb-6 mt-8">
        <div className="lg:w-28 lg:h-28 md:w-20 md:h-20 w-20 h-20 bg-[#E8E4FF] rounded-2xl flex items-center justify-center">
          <Cloud className="lg:w-14 lg:h-14 md:w-10 md:h-10 w-10 h-10 text-[#7c5cff]" />
        </div>
      </div>

      <h3 className="lg:text-[1.375rem] md:text-base text-base lg:leading-7 md:leading-6 leading-5 font-bold text-gray-900 text-center mb-4">
        My files
      </h3>

      <div className="space-y-3 lg:text-base md:text-sm text-xs">
        <div>
          <span className="text-gray-500 font-medium lg:text-sm md:text-xs text-xs">
            Type
          </span>
          <p className="text-gray-900 mt-1 lg:text-base md:text-sm text-xs">
            Cloud storage
          </p>
        </div>

        {storageUsage && (
          <div>
            <span className="text-gray-500 font-medium lg:text-sm md:text-xs text-xs">
              Size
            </span>
            <p className="text-gray-900 mt-1 lg:text-base md:text-sm text-xs">
              {formatBytes(storageUsage.used)} /{" "}
              {formatBytes(storageUsage.quota)} (Used / Total)
            </p>
          </div>
        )}
        <StorageQuotaBar usage={storageUsage} />
      </div>
    </aside>
  );
};
