"use client";

import { useState } from "react";
import { useMyShares } from "@/app/hooks/useMyShares";
import { formatBytes } from "@/app/utils/format";
import { FileItemSkeleton } from "@/app/components/SkeletonLoader";
import { RevokeConfirmationModal } from "@/app/components/RevokeConfirmationModal";

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

export default function MySharesPage() {
  const { myShares, isFetching, error, isLoading, revokeShare, setError } =
    useMyShares();

  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [shareToRevoke, setShareToRevoke] = useState<{
    shareId: string;
    username: string;
    filename: string;
  } | null>(null);
  const [selectedFile, setSelectedFile] = useState<any | null>(null);

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
  };

  const cancelUnshare = () => {
    setShowRevokeModal(false);
    setShareToRevoke(null);
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Column 2: Main Content Area */}
      <div style={{ flex: 1, overflowY: "auto", backgroundColor: "#fff" }}>
        <div style={{ padding: "2rem" }}>
          {/* Error Message */}
          {error && (
            <div
              style={{
                padding: "1rem",
                backgroundColor: "#fee2e2",
                border: "1px solid #fca5a5",
                borderRadius: "0.5rem",
                color: "#991b1b",
                fontSize: "0.875rem",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <svg
                  style={{ width: "1.25rem", height: "1.25rem" }}
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
                style={{
                  color: "#dc2626",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <svg
                  style={{ width: "1.25rem", height: "1.25rem" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Files Count */}
          <div style={{ marginBottom: "1rem" }}>
            <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
              {myShares.length} {myShares.length === 1 ? "file" : "files"}{" "}
              shared
            </p>
          </div>

          {/* Files List */}
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "0.5rem",
              overflow: "hidden",
              border: "1px solid #e5e7eb",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: "#f9fafb",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <th
                    style={{
                      padding: "0.75rem 1rem",
                      textAlign: "left",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "#6b7280",
                      textTransform: "uppercase",
                    }}
                  >
                    File Name
                  </th>
                  <th
                    style={{
                      padding: "0.75rem 1rem",
                      textAlign: "left",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "#6b7280",
                      textTransform: "uppercase",
                    }}
                  >
                    Size
                  </th>
                  <th
                    style={{
                      padding: "0.75rem 1rem",
                      textAlign: "left",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "#6b7280",
                      textTransform: "uppercase",
                    }}
                  >
                    Recipients
                  </th>
                </tr>
              </thead>
              <tbody>
                {isFetching ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td colSpan={3} style={{ padding: "1rem" }}>
                        <FileItemSkeleton />
                      </td>
                    </tr>
                  ))
                ) : myShares.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      style={{ padding: "3rem", textAlign: "center" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "1rem",
                        }}
                      >
                        <div
                          style={{
                            width: "4rem",
                            height: "4rem",
                            backgroundColor: "#f3f4f6",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <svg
                            style={{
                              width: "2rem",
                              height: "2rem",
                              color: "#9ca3af",
                            }}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                            />
                          </svg>
                        </div>
                        <p style={{ color: "#6b7280", fontWeight: 500 }}>
                          No shared files
                        </p>
                        <p style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
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
                      style={{
                        borderBottom: "1px solid #e5e7eb",
                        cursor: "pointer",
                        backgroundColor:
                          selectedFile?.file_id === file.file_id
                            ? "#f3f4f6"
                            : "#fff",
                      }}
                      onMouseEnter={(e) => {
                        if (selectedFile?.file_id !== file.file_id) {
                          e.currentTarget.style.backgroundColor = "#f9fafb";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedFile?.file_id !== file.file_id) {
                          e.currentTarget.style.backgroundColor = "#fff";
                        }
                      }}
                    >
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                          }}
                        >
                          {getFileIcon(file.filename)}
                          <span
                            style={{ fontSize: "0.875rem", color: "#111827" }}
                          >
                            {file.filename}
                          </span>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "0.75rem 1rem",
                          fontSize: "0.875rem",
                          color: "#6b7280",
                        }}
                      >
                        {formatBytes(file.file_size)}
                      </td>
                      <td
                        style={{
                          padding: "0.75rem 1rem",
                          fontSize: "0.875rem",
                          color: "#6b7280",
                        }}
                      >
                        {file.shares.length}{" "}
                        {file.shares.length === 1 ? "person" : "people"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Column 3: Right Panel */}
      <div
        style={{
          width: "350px",
          backgroundColor: "#fff",
          borderLeft: "1px solid rgba(27, 27, 27, 0.15)",
          overflowY: "auto",
          padding: "2rem",
        }}
      >
        {selectedFile ? (
          <>
            <h3
              style={{
                fontSize: "1.125rem",
                fontWeight: 600,
                marginBottom: "1.5rem",
                color: "#111827",
              }}
            >
              Share Recipients
            </h3>

            <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
              <div
                style={{
                  width: "6rem",
                  height: "6rem",
                  margin: "0 auto 1rem",
                  backgroundColor: "#f3f4f6",
                  borderRadius: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {getFileIcon(selectedFile.filename)}
              </div>
              <p
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#111827",
                  wordBreak: "break-all",
                }}
              >
                {selectedFile.filename}
              </p>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "#6b7280",
                  marginTop: "0.25rem",
                }}
              >
                {formatBytes(selectedFile.file_size)}
              </p>
            </div>

            <div
              style={{ borderTop: "1px solid #e5e7eb", paddingTop: "1.5rem" }}
            >
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "#6b7280",
                  marginBottom: "0.75rem",
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                Shared With ({selectedFile.shares.length})
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                {selectedFile.shares.map((share: any) => (
                  <div
                    key={share.share_id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.75rem",
                      backgroundColor: "#f9fafb",
                      borderRadius: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                      }}
                    >
                      <div
                        style={{
                          width: "2rem",
                          height: "2rem",
                          backgroundColor: "#7c3aed",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span
                          style={{
                            color: "#fff",
                            fontSize: "0.875rem",
                            fontWeight: 600,
                          }}
                        >
                          {share.recipient_username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: "0.875rem",
                          color: "#111827",
                          fontWeight: 500,
                        }}
                      >
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
                      disabled={isLoading}
                      style={{
                        padding: "0.25rem",
                        color: "#ef4444",
                        background: "none",
                        border: "none",
                        cursor: isLoading ? "not-allowed" : "pointer",
                        opacity: isLoading ? 0.5 : 1,
                      }}
                      title="Revoke access"
                    >
                      <svg
                        style={{ width: "1.25rem", height: "1.25rem" }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                borderTop: "1px solid #e5e7eb",
                paddingTop: "1.5rem",
                marginTop: "1.5rem",
              }}
            >
              <button
                onClick={() => setSelectedFile(null)}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                  border: "none",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Close Details
              </button>
            </div>
          </>
        ) : (
          <>
            <h3
              style={{
                fontSize: "1.125rem",
                fontWeight: 600,
                marginBottom: "1.5rem",
                color: "#111827",
              }}
            >
              Sharing Summary
            </h3>

            <div
              style={{
                padding: "1rem",
                backgroundColor: "#f9fafb",
                borderRadius: "0.5rem",
                marginBottom: "1rem",
              }}
            >
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "#6b7280",
                  lineHeight: 1.6,
                }}
              >
                Select a file to manage share recipients and permissions.
              </p>
            </div>

            <div
              style={{
                borderTop: "1px solid #e5e7eb",
                paddingTop: "1.5rem",
                marginTop: "1.5rem",
              }}
            >
              <div style={{ marginBottom: "1rem" }}>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "#6b7280",
                    marginBottom: "0.25rem",
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}
                >
                  Total Shared Files
                </p>
                <p
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  {myShares.length}
                </p>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "#6b7280",
                    marginBottom: "0.25rem",
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}
                >
                  Total Recipients
                </p>
                <p
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  {myShares.reduce((acc, file) => acc + file.shares.length, 0)}
                </p>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "#6b7280",
                    marginBottom: "0.25rem",
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}
                >
                  Total Size
                </p>
                <p
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  {formatBytes(
                    myShares.reduce((acc, file) => acc + file.file_size, 0)
                  )}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Revoke Confirmation Modal */}
      {showRevokeModal && shareToRevoke && (
        <RevokeConfirmationModal
          recipientUsername={shareToRevoke.username}
          filename={shareToRevoke.filename}
          onConfirm={confirmUnshare}
          onCancel={cancelUnshare}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
