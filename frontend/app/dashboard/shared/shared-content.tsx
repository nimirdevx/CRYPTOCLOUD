"use client";

import { useState, useEffect } from "react";
import { useMyShares } from "@/app/hooks/useMyShares";
import { useSharedFiles } from "@/app/hooks/useSharedFiles";
import { usePublicLinks } from "@/app/hooks/usePublicLinks";
import { formatBytes } from "@/app/utils/format";
import { copyPublicLinkToClipboard } from "@/app/utils/copyLinkUtils";
import { FileItemSkeleton } from "@/app/components/SkeletonLoader";
import { RevokeConfirmationModal } from "@/app/components/RevokeConfirmationModal";
import { ResponsiveTabs, TabItem } from "@/app/components/ResponsiveTabs";
import { useAuth } from "@/app/context/AuthContext";
import {
  Share2,
  Users,
  Download,
  X,
  Folder,
  Link2,
  Copy,
  Trash2,
} from "lucide-react";

// Components
import { SharedFileDetails } from "@/app/components/Shared/SharedFileDetails";
import { SharedMobileList } from "@/app/components/Shared/SharedMobileList";
import { SharedDetailsPlaceholder } from "@/app/components/Shared/SharedDetailsPlaceholder";

// --- TYPES (Define these to fix TS errors) ---
// You should ideally import these from your types file, but defining interfaces helps TS here.
interface BaseFile {
  filename: string;
  file_size: number;
}

interface SharedFile extends BaseFile {
  file_id: string;
  owner_username: string;
  shared_at: string;
  encryptedFileKey: string;
}

interface MyShare extends BaseFile {
  file_id: string;
  shares: Array<{ share_id: string; recipient_username: string }>;
}

interface PublicLink extends BaseFile {
  id: string;
  token: string;
  file_id: string; // The error log shows file_id exists in public links too
  download_count: number;
  max_downloads?: number;
  is_active: boolean;
  expires_at: string;
  created_at: string;
  password_protected?: boolean;
}

type AnySharedItem = SharedFile | MyShare | PublicLink;
type ShareTab = "shared-with-me" | "shared-by-me" | "public-links";

const getFileIcon = (filename: string) => {
  const ext = filename?.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext)) {
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

  // Use 'any' temporarily or the union type if you want strictness,
  // but casting is often easier when mixing distinct types in one state variable.
  const [selectedFile, setSelectedFile] = useState<any | null>(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [shareToRevoke, setShareToRevoke] = useState<{
    shareId: string;
    username: string;
    filename: string;
  } | null>(null);
  const [copyingLink, setCopyingLink] = useState<string | null>(null);

  const shareTabs: TabItem[] = [
    { id: "shared-with-me", label: "Shared with me", icon: Users },
    { id: "shared-by-me", label: "Shared by me", icon: Share2 },
    { id: "public-links", label: "Public Links", icon: Link2 },
  ];

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

  // Type assertion here helps TS understand what's in the array
  const currentFiles = (
    activeTab === "shared-with-me"
      ? sharedFiles
      : activeTab === "shared-by-me"
      ? myShares
      : publicLinks
  ) as any[];

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
    if (selectedFile && isDetailsModalOpen) {
      // Close modal if item modified
      setIsDetailsModalOpen(false);
    }
  };

  const handleTabChange = (tab: ShareTab) => {
    setActiveTab(tab);
    setSelectedFile(null);
  };

  const handleFileSelect = (file: any) => {
    setSelectedFile(file);
    if (window.innerWidth < 1024) {
      setIsDetailsModalOpen(true);
    }
  };

  const copyPublicLink = async (link: any) => {
    if (!encryptionKey) {
      setPublicLinksError("Encryption key not available");
      return;
    }
    setCopyingLink(link.token);
    try {
      await copyPublicLinkToClipboard(link.file_id, encryptionKey, link.token);
    } catch (err: any) {
      setPublicLinksError(err.message || "Failed to copy link");
    } finally {
      setCopyingLink(null);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsDetailsModalOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Helper to safely get unique ID
  const getItemId = (item: any) => {
    if (!item) return null;
    if (activeTab === "public-links") return item.id || item._id; // Handle potential mongo _id
    return item.file_id;
  };

  return (
    <div className="flex-1 flex flex-col lg:gap-6 md:gap-4 gap-3 h-full overflow-hidden">
      {/* Header */}
      {/* Header - Different for mobile/desktop */}
      <div className="lg:hidden px-3 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-900">Shared</h3>
          <Folder className="w-8 h-8 text-[#7c5cff]" />
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:flex items-center justify-between px-2 pt-6">
        <h3 className="text-3xl font-bold text-gray-900">Shared</h3>
        <Folder className="w-10 h-10 text-[#7c5cff]" />
      </div>

      {/* Tabs for mobile and tablet */}
      <div className="lg:hidden sticky top-0 z-10 bg-gray-100 pt-2 -mx-2 px-2">
        <div className="max-w-full overflow-x-auto pb-1 no-scrollbar">
          <div className="inline-flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {shareTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as ShareTab)}
                className={`px-3 py-2 text-sm font-medium whitespace-nowrap rounded-md transition-colors ${
                  activeTab === tab.id
                    ? "bg-white shadow-sm text-[#7c5cff]"
                    : "text-gray-600 hover:bg-white/50"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {tab.icon && <tab.icon className="w-4 h-4 shrink-0" />}
                  <span className="text-xs sm:text-sm">{tab.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Tabs - Only visible on lg screens */}
      <div className="hidden lg:block bg-gray-100">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-4">
            {shareTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as ShareTab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-[#7c5cff] text-[#7c5cff]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex lg:gap-4 gap-0 min-h-0 overflow-hidden relative">
        {/* Desktop Sidebar (lg+) */}
        <div className="hidden lg:block">
          <ResponsiveTabs
            tabs={shareTabs}
            activeTab={activeTab}
            onTabChange={(tabId) => handleTabChange(tabId as ShareTab)}
          />
        </div>

        {/* Main Files Area */}
        <div className="flex-1 bg-white lg:rounded-3xl md:rounded-2xl rounded-none shadow-sm flex flex-col overflow-hidden min-w-0">
          <div className="lg:p-6 md:p-4 p-0 h-full flex flex-col">
            {/* Error Message */}
            {error && (
              <div className="m-4 lg:mx-0 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
                <button onClick={() => setError(null)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* --- TABLE VIEW (Desktop & Tablet) --- */}
            <div className="hidden md:flex bg-white rounded-xl border border-gray-200 overflow-hidden flex-1 flex-col h-full">
              <div className="overflow-x-auto overflow-y-auto flex-1 h-0 min-h-full">
                <table className="w-full lg:table-fixed md:w-full">
                  <thead className="sticky top-0 bg-gray-50 z-10 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 uppercase w-1/2 md:w-2/5">
                        <span className="truncate">File Name</span>
                      </th>
                      <th className="hidden lg:table-cell px-3 py-3 text-left text-sm font-medium text-gray-500 uppercase w-[120px]">
                        Size
                      </th>
                      <th className="hidden md:table-cell px-3 py-3 text-left text-sm font-medium text-gray-500 uppercase w-[180px] 2xl:w-[220px]">
                        {activeTab === "shared-with-me"
                          ? "Shared By"
                          : activeTab === "shared-by-me"
                          ? "Recipients"
                          : "Downloads"}
                      </th>
                      {activeTab === "public-links" && (
                        <th className="hidden xl:table-cell px-3 py-3 text-center text-sm font-medium text-gray-500 uppercase w-[100px]">
                          Status
                        </th>
                      )}
                      <th className="px-3 py-3 text-right text-sm font-medium text-gray-500 uppercase w-[100px]">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isFetching ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i} className="border-b border-gray-100">
                          <td colSpan={5} className="p-4">
                            <FileItemSkeleton />
                          </td>
                        </tr>
                      ))
                    ) : currentFiles.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-12 text-center text-gray-500"
                        >
                          No files found
                        </td>
                      </tr>
                    ) : (
                      currentFiles.map((file) => (
                        <tr
                          key={getItemId(file)}
                          onClick={() => handleFileSelect(file)}
                          className={`border-b border-gray-100 cursor-pointer transition-colors ${
                            getItemId(selectedFile) === getItemId(file)
                              ? "bg-[#7c5cff]/5"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          {/* Name Column - More space on mobile */}
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2 md:gap-3 min-w-0">
                              <div className="shrink-0">
                                {getFileIcon(file.filename)}
                              </div>
                              <span className="text-sm md:text-base font-medium text-gray-700 truncate">
                                {file.filename}
                              </span>
                            </div>
                          </td>

                          {/* Size Column - Hidden on md, visible on lg+ */}
                          <td className="hidden lg:table-cell px-3 py-3 text-sm text-gray-500 whitespace-nowrap">
                            {formatBytes(file.file_size)}
                          </td>

                          {/* Info Column - Hidden on mobile */}
                          <td className="hidden md:table-cell px-3 py-3 text-sm text-gray-500 whitespace-nowrap">
                            {activeTab === "shared-with-me" ? (
                              <span className="truncate block">
                                {file.owner_username}
                              </span>
                            ) : activeTab === "shared-by-me" ? (
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4 shrink-0" />
                                <span>{file.shares?.length || 0} people</span>
                              </span>
                            ) : (
                              <div className="text-center">
                                {file.download_count}
                              </div>
                            )}
                          </td>

                          {/* Status Column - Only for public links */}
                          {activeTab === "public-links" && (
                            <td className="hidden xl:table-cell px-3 py-3 text-center">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  file.is_active
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {file.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                          )}

                          {/* Actions Column */}
                          <td className="px-3 py-3 text-right whitespace-nowrap">
                            <div className="flex justify-end items-center gap-1">
                              {activeTab === "shared-with-me" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadSharedFile(file);
                                  }}
                                  className="p-1.5 hover:bg-gray-100 rounded-full text-[#7c5cff]"
                                  title="Download"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              )}

                              {activeTab === "public-links" && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyPublicLink(file);
                                    }}
                                    className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600"
                                    title="Copy link"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUnshareClick(
                                        file.id,
                                        "public",
                                        file.filename
                                      );
                                    }}
                                    className="p-1.5 hover:bg-red-50 rounded-full text-red-500"
                                    title="Revoke link"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}

                              {activeTab === "shared-by-me" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (file.shares?.[0]?.share_id) {
                                      handleUnshareClick(
                                        file.shares[0].share_id,
                                        file.shares[0].recipient_username ||
                                          "recipient",
                                        file.filename
                                      );
                                    }
                                  }}
                                  className="p-1.5 hover:bg-red-50 rounded-full text-red-500"
                                  title="Revoke share"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* --- FLOATING LIST VIEW (xs → md) --- */}
            <div className="lg:hidden flex-1 overflow-y-auto -mx-1 px-1 pb-4">
              {isFetching ? (
                <div className="space-y-2 px-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse bg-white/90 rounded-xl p-3 shadow-sm"
                    >
                      <div className="h-5 bg-gray-100 rounded-lg w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : currentFiles.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <div className="p-3 mb-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-sm">
                    {activeTab === "shared-with-me" ? (
                      <Users className="w-6 h-6 text-gray-600" />
                    ) : activeTab === "shared-by-me" ? (
                      <Share2 className="w-6 h-6 text-gray-600" />
                    ) : (
                      <Link2 className="w-6 h-6 text-gray-600" />
                    )}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    {activeTab === "shared-with-me"
                      ? "No files shared with you"
                      : activeTab === "shared-by-me"
                      ? "No shared files yet"
                      : "No public links"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {activeTab === "shared-with-me"
                      ? "Files shared with you will appear here"
                      : activeTab === "shared-by-me"
                      ? "Share files to see them here"
                      : "Create a public link to share files with anyone"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 p-1">
                  {currentFiles.map((file) => (
                    <div
                      key={getItemId(file)}
                      onClick={() => handleFileSelect(file)}
                      className="relative bg-white/95 backdrop-blur-sm rounded-xl p-3 transition-all duration-200
                        hover:bg-white hover:shadow-sm active:scale-[0.99] active:bg-gray-50
                        border border-gray-100/80 hover:border-gray-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-1.5 bg-white rounded-lg shadow-sm border border-gray-100">
                            {getFileIcon(file.filename)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {file.filename}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                              {activeTab === "shared-with-me" ? (
                                <>
                                  <span className="truncate">
                                    From {file.owner_username}
                                  </span>
                                  <span>•</span>
                                  <span>{formatBytes(file.file_size)}</span>
                                </>
                              ) : activeTab === "shared-by-me" ? (
                                <>
                                  <Users className="w-3 h-3 inline" />
                                  <span>{file.shares?.length || 0} people</span>
                                  <span>•</span>
                                  <span>{formatBytes(file.file_size)}</span>
                                </>
                              ) : (
                                <>
                                  <span>{file.download_count} downloads</span>
                                  {file.max_downloads && (
                                    <>
                                      <span>•</span>
                                      <span>{file.max_downloads} max</span>
                                    </>
                                  )}
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {activeTab === "shared-with-me" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadSharedFile(file);
                              }}
                              className="p-1.5 text-[#7c5cff] hover:bg-[#7c5cff]/10 rounded-full transition-colors"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                          {activeTab === "public-links" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyPublicLink(file);
                              }}
                              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          )}
                          {(activeTab === "shared-by-me" ||
                            activeTab === "public-links") && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const shareId = file.shares?.[0]?.share_id;
                                if (shareId) {
                                  handleUnshareClick(
                                    shareId,
                                    file.shares[0].recipient_username ||
                                      "recipient",
                                    file.filename
                                  );
                                } else {
                                  // Handle public link revoke
                                  handleUnshareClick(
                                    file.id,
                                    "public",
                                    file.filename
                                  );
                                }
                              }}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- DESKTOP DETAILS SIDEBAR (lg only) --- */}
        <aside className="hidden lg:flex w-72 bg-white rounded-3xl shadow-sm flex-col overflow-hidden p-6 shrink-0">
          {selectedFile ? (
            <SharedFileDetails
              selectedFile={selectedFile}
              activeTab={activeTab}
              loadingFileId={loadingFileId}
              onDownload={downloadSharedFile}
              onClose={() => setSelectedFile(null)}
              onUnshare={handleUnshareClick}
              isRevoking={isRevoking}
              onCopyLink={copyPublicLink}
              copyingLink={copyingLink}
              onRevokeLink={async (token) => {
                try {
                  await revokePublicLink(token);
                  setSelectedFile(null);
                } catch (e) {}
              }}
              isRevokingPublicLink={isRevokingPublicLink}
            />
          ) : (
            <SharedDetailsPlaceholder
              activeTab={activeTab}
              sharedFiles={sharedFiles}
              myShares={myShares}
              publicLinks={publicLinks}
            />
          )}
        </aside>
      </div>

      {/* --- MODAL (Mobile & Tablet) --- */}
      {isDetailsModalOpen && selectedFile && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4 lg:hidden">
          <div className="bg-white w-full max-w-sm md:max-w-md rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Details</h3>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <SharedFileDetails
              selectedFile={selectedFile}
              activeTab={activeTab}
              loadingFileId={loadingFileId}
              onDownload={downloadSharedFile}
              onClose={() => setIsDetailsModalOpen(false)}
              onUnshare={handleUnshareClick}
              isRevoking={isRevoking}
              onCopyLink={copyPublicLink}
              copyingLink={copyingLink}
              onRevokeLink={async (token) => {
                try {
                  await revokePublicLink(token);
                  setIsDetailsModalOpen(false);
                } catch (e) {}
              }}
              isRevokingPublicLink={isRevokingPublicLink}
            />
          </div>
        </div>
      )}

      {/* Revoke Confirmation Modal */}
      {showRevokeModal && shareToRevoke && (
        <RevokeConfirmationModal
          recipientUsername={shareToRevoke.username}
          filename={shareToRevoke.filename}
          onConfirm={confirmUnshare}
          onCancel={() => setShowRevokeModal(false)}
          isLoading={isRevoking}
        />
      )}
    </div>
  );
}
