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
      <aside className="w-72 bg-white rounded-3xl shadow-sm flex flex-col overflow-hidden p-6">
        {/* File Preview */}
        <div className="flex justify-center mb-6">
          <div className="w-28 h-28 bg-[#E8E4FF] rounded-2xl flex items-center justify-center">
            {selectedFileMetadata.isFolder ? (
              <Folder className="w-14 h-14 text-[#7c5cff]" />
            ) : getFileType(selectedFileMetadata.filename, false) ===
              "Image" ? (
              <ImageIcon className="w-14 h-14 text-[#7c5cff]" />
            ) : (
              <FileText className="w-14 h-14 text-[#7c5cff]" />
            )}
          </div>
        </div>

        {/* File Name */}
        <h3 className="text-[1.3rem] leading-8 font-semibold text-gray-900 text-center mb-8 wrap-break-word">
          {selectedFileMetadata.filename}
        </h3>

        {/* File/Folder Details */}
        <div className="space-y-4 text-[1.1rem] leading-7">
          <div>
            <span className="text-gray-500 font-medium text-[1rem]">Type</span>
            <p className="text-gray-900 mt-1 text-[1.1rem]">
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
      <aside className="w-72 bg-white rounded-3xl shadow-sm flex flex-col overflow-hidden p-6">
        {/* Folder Preview */}
        <div className="flex justify-center mb-6 mt-8">
          <div className="w-28 h-28 bg-[#E8E4FF] rounded-2xl flex items-center justify-center">
            <Folder className="w-14 h-14 text-[#7c5cff]" />
          </div>
        </div>

        {/* Folder Name */}
        <h3 className="text-[1.3rem] leading-8 font-semibold text-gray-900 text-center mb-8 wrap-break-word">
          {currentFolderMetadata.filename}
        </h3>

        {/* Folder Details */}
        <div className="space-y-4 text-[1.1rem] leading-7">
          <div>
            <span className="text-gray-500 font-medium text-[1rem]">Type</span>
            <p className="text-gray-900 mt-1 text-[1.1rem]">Folder</p>
          </div>

          <div>
            <span className="text-gray-500 font-medium text-[1rem]">Items</span>
            <p className="text-gray-900 mt-1 text-[1.1rem]">
              {currentFolderMetadata.itemCount !== undefined
                ? `${currentFolderMetadata.itemCount} item${
                    currentFolderMetadata.itemCount !== 1 ? "s" : ""
                  }`
                : "Unknown"}
            </p>
          </div>

          <div>
            <span className="text-gray-500 font-medium text-[1rem]">
              Total Size
            </span>
            <p className="text-gray-900 mt-1 text-[1.1rem]">
              {currentFolderMetadata.calculatedSize !== undefined
                ? formatBytes(currentFolderMetadata.calculatedSize)
                : "—"}
            </p>
          </div>

          <div>
            <span className="text-gray-500 font-medium text-[1rem]">
              Created
            </span>
            <p className="text-gray-900 mt-1 text-[1.1rem]">
              {formatRelativeDate(currentFolderMetadata.upload_time)}
            </p>
          </div>
        </div>
      </aside>
    );
  }

  // Default: Show "My Files" at root
  return (
    <aside className="w-72 bg-white rounded-3xl shadow-sm flex flex-col overflow-hidden p-6">
      <div className="flex justify-center mb-6 mt-8">
        <div className="w-28 h-28 bg-[#E8E4FF] rounded-2xl flex items-center justify-center">
          <Cloud className="w-14 h-14 text-[#7c5cff]" />
        </div>
      </div>

      <h3 className="text-[1.375rem] leading-7 font-bold text-gray-900 text-center mb-4">
        My files
      </h3>

      <div className="space-y-4 text-[1rem] leading-6">
        <div>
          <span className="text-gray-500 font-medium text-[0.9375rem]">
            Type
          </span>
          <p className="text-gray-900 mt-1 text-[1rem]">Cloud storage</p>
        </div>

        {storageUsage && (
          <div>
            <span className="text-gray-500 font-medium text-[0.9375rem]">
              Size
            </span>
            <p className="text-gray-900 mt-1 text-[1rem]">
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
