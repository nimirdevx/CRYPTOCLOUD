// app/components/DeleteConfirmationModal.tsx
import React from "react";
import { BaseModal } from "./ui/BaseModal";

interface FileMetadata {
  id: string;
  filename: string;
  owner_id: string;
  upload_time: string;
  file_size: number;
}

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  file: FileMetadata | null;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isFolder?: boolean;
  isPermanentDelete?: boolean;
}

export const DeleteConfirmationModal: React.FC<
  DeleteConfirmationModalProps
> = ({
  isOpen,
  file,
  isLoading,
  onConfirm,
  onCancel,
  isFolder = false,
  isPermanentDelete = true,
}) => {
  if (!file) return null;

  const itemType = isFolder ? "folder" : "file";
  const actionText = isPermanentDelete ? "Permanently Delete" : "Move to Trash";
  const title = isPermanentDelete
    ? `Permanently Delete ${isFolder ? "Folder" : "File"}?`
    : `Move ${isFolder ? "Folder" : "File"} to Trash?`;
  const description = isPermanentDelete
    ? `This will permanently delete the ${itemType} and it cannot be recovered.`
    : `This will move the ${itemType} to the trash. You can restore it later.`;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      maxWidth="sm"
      closeOnOverlayClick={!isLoading}
    >
      <div className="mt-4">
        <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-6 w-6 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <div className="mt-3 text-center sm:mt-5">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            {file.filename}
          </h3>
          <div className="mt-2">
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
        <button
          type="button"
          className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {isLoading ? "Deleting..." : actionText}
            </>
          ) : (
            <>
              <svg
                className="-ml-1 mr-2 h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              {actionText}
            </>
          )}
        </button>
        <button
          type="button"
          className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </button>
      </div>
    </BaseModal>
  );
};
