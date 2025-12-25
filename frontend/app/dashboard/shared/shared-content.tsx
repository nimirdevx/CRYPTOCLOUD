"use client";

import { useState } from "react";
import { useMyShares } from "@/app/hooks/useMyShares";
import { useSharedFiles } from "@/app/hooks/useSharedFiles";
import { usePublicLinks } from "@/app/hooks/usePublicLinks";
import { formatBytes } from "@/app/utils/format";
import { FileItemSkeleton } from "@/app/components/SkeletonLoader";
import { RevokeConfirmationModal } from "@/app/components/RevokeConfirmationModal";
import { useAuth } from "@/app/context/AuthContext";
import { decryptFileKey } from "@/app/lib/crypto";
import { API_URL } from "@/app/config/constants";
import {
  Share2,
  Users,
  Download,
  X,
  Folder,
  Link2,
  Copy,
  Trash2,
  Clock,
  Eye,
} from "lucide-react";

type ShareTab = "shared-with-me" | "shared-by-me" | "public-links";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getFileIcon = (filename: string) => {
  const ext = filename.split(".").pop()?.toLowerCase();

  if (["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp"].includes(ext || "")) {
    return (
      <svg
        className="w-5 h-5 text-blue-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    );
  }

  if (ext === "pdf") {
    return (
      <svg
        className="w-5 h-5 text-red-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      </svg>
    );
  }

  return (
    <svg
      className="w-5 h-5 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    </svg>
  );
};

export default function SharedContent() {
  const { encryptionKey } = useAuth();
  const [activeTab, setActiveTab] = useState<ShareTab>("shared-with-me");
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [shareToRevoke, setShareToRevoke] = useState<{
    shareId: string;
    username: string;
    filename: string;
  } | null>(null);
  const [copyingLink, setCopyingLink] = useState<string | null>(null);

  // Hooks for both types
  const {
    sharedFiles,
    isFetching: isFetchingSharedWithMe,
    error: sharedWithMeError,
    loadingFileId,
    downloadSharedFile,
    setError: setSharedWithMeError,
  } = useSharedFiles();

  const {
    myShares,
    isFetching: isFetchingMyShares,
    error: mySharesError,
    isLoading: isRevoking,
    revokeShare,
    setError: setMySharesError,
  } = useMyShares();

  const {
    publicLinks,
    isFetching: isFetchingPublicLinks,
    error: publicLinksError,
    isRevoking: isRevokingPublicLink,
    revokeLink: revokePublicLink,
    setError: setPublicLinksError,
  } = usePublicLinks();

  const isFetching =
    activeTab === "shared-with-me"
      ? isFetchingSharedWithMe
      : activeTab === "shared-by-me"
      ? isFetchingMyShares
      : isFetchingPublicLinks;

  const error =
    activeTab === "shared-with-me"
      ? sharedWithMeError
      : activeTab === "shared-by-me"
      ? mySharesError
      : publicLinksError;

  const setError =
    activeTab === "shared-with-me"
      ? setSharedWithMeError
      : activeTab === "shared-by-me"
      ? setMySharesError
      : setPublicLinksError;

  const handleUnshareClick = (
    shareId: string,
    username: string,
    filename: string
  ) => {
    setShareToRevoke({ shareId, username, filename });
    setShowRevokeModal(true);
  };

  const confirmUnshare = async () => {
    if (!shareToRevoke) return;
    await revokeShare(shareToRevoke.shareId);
    setShowRevokeModal(false);
    setShareToRevoke(null);
    // Clear selection if the revoked share was selected
    if (selectedFile) {
      setSelectedFile(null);
    }
  };

  const cancelUnshare = () => {
    setShowRevokeModal(false);
    setShareToRevoke(null);
  };

  const handleTabChange = (tab: ShareTab) => {
    setActiveTab(tab);
    setSelectedFile(null);
  };

  const copyPublicLink = async (link: any) => {
    if (!encryptionKey) {
      setPublicLinksError("Encryption key not available");
      return;
    }

    setCopyingLink(link.token);
    try {
      // 1. Fetch the file data to get the encrypted_file_key
      const jwt = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/files/${link.file_id}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch file data");
      }

      const fileData = await response.json();

      // 2. Decrypt the file key
      const fileKey = await decryptFileKey(
        encryptionKey,
        fileData.encryptedFileKey
      );

      // 3. Build the complete URL with the key fragment
      // Use URL-safe base64 encoding (no padding, replace +/ with -_)
      const keyBuffer = await crypto.subtle.exportKey("raw", fileKey);
      const keyArray = Array.from(new Uint8Array(keyBuffer));
      const keyBase64 = btoa(String.fromCharCode(...keyArray))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");

      const fullUrl = `${window.location.origin}/share/${link.token}#key=${keyBase64}`;

      // 4. Copy to clipboard
      await navigator.clipboard.writeText(fullUrl);

      // Show success feedback (optional - could add a toast notification)
      console.log("Link copied:", fullUrl);
    } catch (err: any) {
      setPublicLinksError(err.message || "Failed to copy link");
    } finally {
      setCopyingLink(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6">
      {/* Header with title and logo */}
      <div className="flex items-center justify-between px-2 pt-6">
        <h3 className="text-[2.5rem] leading-12 font-bold text-gray-900">
          Shared
        </h3>
        <Folder className="w-10 h-10 text-[#7c5cff]" />
      </div>

      {/* Main content area with columns */}
      <div className="flex-1 flex gap-4">
        {/* Column 1: Share Type Selection */}
        <aside className="w-64 bg-[#F4F5F7] flex flex-col overflow-hidden p-6">
          <div className="space-y-2 mb-6">
            <button
              onClick={() => handleTabChange("shared-with-me")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                activeTab === "shared-with-me"
                  ? "bg-[#7c5cff]/10 text-gray-900"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="font-medium text-[1.1rem]">Shared with me</span>
            </button>
            <button
              onClick={() => handleTabChange("shared-by-me")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                activeTab === "shared-by-me"
                  ? "bg-[#7c5cff]/10 text-gray-900"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Share2 className="w-5 h-5" />
              <span className="font-medium text-[1.1rem]">Shared by me</span>
            </button>
            <button
              onClick={() => handleTabChange("public-links")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                activeTab === "public-links"
                  ? "bg-[#7c5cff]/10 text-gray-900"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Link2 className="w-5 h-5" />
              <span className="font-medium text-[1.1rem]">Public Links</span>
            </button>
          </div>

          <div className="flex-1" />

          {/* Info banner */}
          <div className="mt-auto pt-6 border-t border-gray-100">
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <svg
                className="w-5 h-5 text-[#7c5cff] mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-xs text-gray-600">
                {activeTab === "shared-with-me"
                  ? "Files that others have shared with you appear here."
                  : activeTab === "shared-by-me"
                  ? "Manage files you've shared with others."
                  : "Public links expire after 24 hours and can be revoked anytime."}
              </p>
            </div>
          </div>
        </aside>

        {/* Column 2: Files List */}
        <div className="flex-1 bg-white rounded-3xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-6">
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{error}</span>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            {/* Files Count */}
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                {activeTab === "shared-with-me"
                  ? `${sharedFiles.length} ${
                      sharedFiles.length === 1 ? "file" : "files"
                    } shared with you`
                  : activeTab === "shared-by-me"
                  ? `${myShares.length} ${
                      myShares.length === 1 ? "file" : "files"
                    } you've shared`
                  : `${publicLinks.length} public ${
                      publicLinks.length === 1 ? "link" : "links"
                    }`}
              </p>
            </div>

            {/* Files Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-[1rem] font-semibold text-gray-500 uppercase">
                      File Name
                    </th>
                    <th className="px-4 py-3 text-left text-[1rem] font-semibold text-gray-500 uppercase">
                      Size
                    </th>
                    <th className="px-4 py-3 text-left text-[1rem] font-semibold text-gray-500 uppercase">
                      {activeTab === "shared-with-me"
                        ? "Shared By"
                        : activeTab === "shared-by-me"
                        ? "Recipients"
                        : "Downloads"}
                    </th>
                    {activeTab === "public-links" && (
                      <th className="px-4 py-3 text-left text-[1rem] font-semibold text-gray-500 uppercase">
                        Status
                      </th>
                    )}
                    {(activeTab === "shared-with-me" ||
                      activeTab === "public-links") && (
                      <th className="px-4 py-3 text-right text-[1rem] font-semibold text-gray-500 uppercase">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {isFetching ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td
                          colSpan={activeTab === "shared-with-me" ? 4 : 3}
                          className="p-4"
                        >
                          <FileItemSkeleton />
                        </td>
                      </tr>
                    ))
                  ) : activeTab === "shared-with-me" ? (
                    sharedFiles.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                              <Users className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-600 font-medium">
                              No files shared with you
                            </p>
                            <p className="text-sm text-gray-400">
                              Files that others share with you will appear here
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      sharedFiles.map((file) => {
                        const isDownloading = loadingFileId === file.file_id;
                        return (
                          <tr
                            key={file.file_id}
                            onClick={() => setSelectedFile(file)}
                            className={`border-b border-gray-100 cursor-pointer transition-colors ${
                              selectedFile?.file_id === file.file_id
                                ? "bg-[#7c5cff]/5"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {getFileIcon(file.filename)}
                                <span className="text-[1.2rem] font-medium text-gray-700 block max-w-lg overflow-x-auto whitespace-nowrap hide-scrollbar">
                                  {file.filename}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-[1.1rem] text-gray-500 whitespace-nowrap">
                              {formatBytes(file.file_size)}
                            </td>
                            <td className="px-4 py-3 text-[1.1rem] text-gray-500 whitespace-nowrap">
                              {file.owner_username}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadSharedFile(file);
                                }}
                                disabled={isDownloading}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#7c5cff] text-white text-sm font-medium rounded-lg hover:bg-[#6a4de6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isDownloading ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Downloading...</span>
                                  </>
                                ) : (
                                  <>
                                    <Download className="w-4 h-4" />
                                    <span>Download</span>
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )
                  ) : activeTab === "shared-by-me" ? (
                    myShares.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-12 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                              <Share2 className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-600 font-medium">
                              No shared files
                            </p>
                            <p className="text-sm text-gray-400">
                              Start sharing files from My Files
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      myShares.map((file) => (
                        <tr
                          key={file.file_id}
                          onClick={() => setSelectedFile(file)}
                          className={`border-b border-gray-100 cursor-pointer transition-colors ${
                            selectedFile?.file_id === file.file_id
                              ? "bg-[#7c5cff]/5"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {getFileIcon(file.filename)}
                              <span className="text-[1.2rem] font-medium text-gray-700 block max-w-lg overflow-x-auto whitespace-nowrap hide-scrollbar">
                                {file.filename}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[1.1rem] text-gray-500 whitespace-nowrap">
                            {formatBytes(file.file_size)}
                          </td>
                          <td className="px-4 py-3 text-[1.1rem] text-gray-500 whitespace-nowrap">
                            {file.shares.length}{" "}
                            {file.shares.length === 1 ? "person" : "people"}
                          </td>
                        </tr>
                      ))
                    )
                  ) : publicLinks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <Link2 className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-gray-600 font-medium">
                            No public links created
                          </p>
                          <p className="text-sm text-gray-400">
                            Create public links from the file details panel
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    publicLinks.map((link) => {
                      const isExpired = new Date(link.expires_at) < new Date();
                      const canDownload =
                        !link.max_downloads ||
                        link.download_count < link.max_downloads;

                      return (
                        <tr
                          key={link.id}
                          onClick={() => setSelectedFile(link)}
                          className={`border-b border-gray-100 cursor-pointer transition-colors ${
                            selectedFile?.id === link.id
                              ? "bg-[#7c5cff]/5"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {getFileIcon(link.filename)}
                              <span className="text-[1.2rem] font-medium text-gray-700 block max-w-lg overflow-x-auto whitespace-nowrap hide-scrollbar">
                                {link.filename}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[1.1rem] text-gray-500 whitespace-nowrap">
                            {formatBytes(link.file_size)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="text-[1.1rem] text-gray-500">
                                {link.download_count}{" "}
                                {link.download_count === 1
                                  ? "download"
                                  : "downloads"}
                              </span>
                              {link.max_downloads && (
                                <span className="text-xs text-gray-400">
                                  Max: {link.max_downloads}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {isExpired ? (
                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                                  Expired
                                </span>
                              ) : !link.is_active ? (
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                  Revoked
                                </span>
                              ) : !canDownload ? (
                                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                                  Limit reached
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                  Active
                                </span>
                              )}
                              {link.password_protected && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                  🔒
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyPublicLink(link);
                                }}
                                disabled={copyingLink === link.token}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                                title="Copy full link with encryption key"
                              >
                                {copyingLink === link.token ? (
                                  <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Copy className="w-4 h-4 text-gray-600" />
                                )}
                              </button>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (
                                    confirm(
                                      `Revoke public link for "${link.filename}"?`
                                    )
                                  ) {
                                    try {
                                      await revokePublicLink(link.token);
                                    } catch (err) {
                                      // Error handled by hook
                                    }
                                  }
                                }}
                                disabled={isRevokingPublicLink}
                                className="p-2 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                                title="Revoke link"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Column 3: File Details Panel */}
        <aside className="w-72 bg-white rounded-3xl shadow-sm flex flex-col overflow-hidden p-6">
          {selectedFile ? (
            activeTab === "shared-with-me" ? (
              // Shared with me - file details
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  File Details
                </h3>

                <div className="mb-6 text-center">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-xl flex items-center justify-center">
                    {getFileIcon(selectedFile.filename)}
                  </div>
                  <p className="text-[1.2rem] font-medium text-gray-700 break-all">
                    {selectedFile.filename}
                  </p>
                </div>

                <div className="border-t border-gray-100 pt-6 space-y-4">
                  <div>
                    <p className="text-[1rem] text-gray-500 uppercase font-semibold mb-1">
                      Size
                    </p>
                    <p className="text-[1.1rem] text-gray-900">
                      {formatBytes(selectedFile.file_size)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[1rem] text-gray-500 uppercase font-semibold mb-1">
                      Shared By
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[#7c5cff] rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {selectedFile.owner_username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[1.1rem] text-gray-900">
                        {selectedFile.owner_username}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                      Shared Date
                    </p>
                    <p className="text-sm text-gray-900">
                      {formatDate(selectedFile.shared_at)}
                    </p>
                  </div>
                </div>

                <div className="mt-auto pt-6 border-t border-gray-100">
                  <button
                    onClick={() => downloadSharedFile(selectedFile)}
                    disabled={loadingFileId === selectedFile.file_id}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#7c5cff] text-white font-medium rounded-xl hover:bg-[#6a4de6] transition-colors disabled:opacity-50"
                  >
                    {loadingFileId === selectedFile.file_id ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Downloading...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        <span>Download File</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : activeTab === "shared-by-me" ? (
              // Shared by me - recipients list
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Share Recipients
                </h3>

                <div className="mb-6 text-center">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-xl flex items-center justify-center">
                    {getFileIcon(selectedFile.filename)}
                  </div>
                  <p className="text-sm font-medium text-gray-700 break-all">
                    {selectedFile.filename}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatBytes(selectedFile.file_size)}
                  </p>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-3">
                    Shared With ({selectedFile.shares.length})
                  </p>

                  <div className="space-y-2">
                    {selectedFile.shares.map((share: any) => (
                      <div
                        key={share.share_id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#7c5cff] rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-semibold">
                              {share.recipient_username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm text-gray-900 font-medium">
                            {share.recipient_username}
                          </span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnshareClick(
                              share.share_id,
                              share.recipient_username,
                              selectedFile.filename
                            );
                          }}
                          disabled={isRevoking}
                          className="p-1 text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
                          title="Revoke access"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-auto pt-6 border-t border-gray-100">
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Close Details
                  </button>
                </div>
              </>
            ) : (
              // Public Links - link details
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Public Link Details
                </h3>

                <div className="mb-6 text-center">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-xl flex items-center justify-center">
                    {getFileIcon(selectedFile.filename)}
                  </div>
                  <p className="text-sm font-medium text-gray-700 break-all">
                    {selectedFile.filename}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatBytes(selectedFile.file_size)}
                  </p>
                </div>

                <div className="border-t border-gray-100 pt-6 space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                      Status
                    </p>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const isExpired =
                          new Date(selectedFile.expires_at) < new Date();
                        const canDownload =
                          !selectedFile.max_downloads ||
                          selectedFile.download_count <
                            selectedFile.max_downloads;

                        if (isExpired) {
                          return (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                              Expired
                            </span>
                          );
                        } else if (!selectedFile.is_active) {
                          return (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                              Revoked
                            </span>
                          );
                        } else if (!canDownload) {
                          return (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                              Limit reached
                            </span>
                          );
                        } else {
                          return (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                              Active
                            </span>
                          );
                        }
                      })()}
                      {selectedFile.password_protected && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          🔒 Protected
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                      Downloads
                    </p>
                    <p className="text-sm text-gray-900">
                      {selectedFile.download_count}{" "}
                      {selectedFile.download_count === 1
                        ? "download"
                        : "downloads"}
                      {selectedFile.max_downloads && (
                        <span className="text-gray-500">
                          {" "}
                          / {selectedFile.max_downloads} max
                        </span>
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                      Created
                    </p>
                    <p className="text-sm text-gray-900">
                      {formatDate(selectedFile.created_at)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                      Expires
                    </p>
                    <p className="text-sm text-gray-900">
                      {formatDate(selectedFile.expires_at)}
                    </p>
                  </div>
                </div>

                <div className="mt-auto pt-6 border-t border-gray-100 space-y-2">
                  <button
                    onClick={() => copyPublicLink(selectedFile)}
                    disabled={copyingLink === selectedFile.token}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#7c5cff] text-white font-medium rounded-xl hover:bg-[#6a4de6] transition-colors disabled:opacity-50"
                  >
                    {copyingLink === selectedFile.token ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Copying...</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={async () => {
                      if (
                        confirm(
                          `Revoke public link for "${selectedFile.filename}"?`
                        )
                      ) {
                        try {
                          await revokePublicLink(selectedFile.token);
                          setSelectedFile(null);
                        } catch (err) {
                          // Error handled by hook
                        }
                      }
                    }}
                    disabled={isRevokingPublicLink}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Revoke Link</span>
                  </button>
                </div>
              </>
            )
          ) : (
            // No file selected
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                {activeTab === "shared-with-me"
                  ? "File Details"
                  : activeTab === "shared-by-me"
                  ? "Share Details"
                  : "Link Details"}
              </h3>

              <div className="p-4 bg-gray-50 rounded-xl mb-6">
                <p className="text-sm text-gray-600 leading-relaxed">
                  {activeTab === "shared-with-me"
                    ? "Select a file to view its details and download it."
                    : activeTab === "shared-by-me"
                    ? "Select a file to manage share recipients and permissions."
                    : "Select a public link to view its details and manage it."}
                </p>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <div className="mb-4">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                    {activeTab === "public-links"
                      ? "Total Links"
                      : "Total Files"}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {activeTab === "shared-with-me"
                      ? sharedFiles.length
                      : activeTab === "shared-by-me"
                      ? myShares.length
                      : publicLinks.length}
                  </p>
                </div>

                {activeTab === "shared-by-me" && myShares.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                      Total Recipients
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {myShares.reduce(
                        (acc, file) => acc + file.shares.length,
                        0
                      )}
                    </p>
                  </div>
                )}

                {activeTab === "public-links" && publicLinks.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                      Total Downloads
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {publicLinks.reduce(
                        (acc, link) => acc + link.download_count,
                        0
                      )}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </aside>
      </div>

      {/* Revoke Confirmation Modal */}
      {showRevokeModal && shareToRevoke && (
        <RevokeConfirmationModal
          recipientUsername={shareToRevoke.username}
          filename={shareToRevoke.filename}
          onConfirm={confirmUnshare}
          onCancel={cancelUnshare}
          isLoading={isRevoking}
        />
      )}
    </div>
  );
}
