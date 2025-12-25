"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { decryptFileKey, importPublicKey, wrapFileKey } from "../lib/crypto";
import { createShareService } from "../services/shareService";

interface FileMetadata {
  id: string;
  filename: string;
  encryptedFileKey: string | null;
  // ... any other fields FileItem needs
}

interface UserSearchResult {
  id: string;
  username: string;
  publicKey: string;
}

interface ShareModalProps {
  file: FileMetadata | null;
  onClose: () => void;
}

export const ShareModal = ({ file, onClose }: ShareModalProps) => {
  const { encryptionKey, jwt } = useAuth(); // Get both encryptionKey and jwt
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(
    null
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Debounced search effect
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    if (!jwt) {
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const shareService = createShareService(jwt);
        const data = await shareService.searchUsers(searchQuery);
        setSearchResults(data);
      } catch (err) {
        console.error(err);
      }
    }, 300); // 300ms delay

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, jwt]);

  const handleShare = async () => {
    console.log("handleShare called", {
      file,
      selectedUser,
      encryptionKey,
      jwt,
    });

    if (!file || !selectedUser || !encryptionKey || !jwt) {
      setError("Missing file, user, or master key.");
      return;
    }
    if (!file.encryptedFileKey) {
      setError("File key is missing. Cannot share.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      console.log("Starting share process...");
      // --- This is the Core Sharing Crypto Flow ---
      // 1. Decrypt the file's AES key using *our* master key
      const fileKey = await decryptFileKey(
        encryptionKey,
        file.encryptedFileKey
      );
      console.log("File key decrypted");

      // 2. Import the *recipient's* public key
      const recipientPublicKey = await importPublicKey(selectedUser.publicKey);
      console.log("Recipient public key imported");

      // 3. Re-encrypt the file key using the recipient's public key
      const sharedKey = await wrapFileKey(recipientPublicKey, fileKey);
      console.log("File key wrapped for recipient");
      // ---------------------------------------------

      // 4. Send the new shared key to the server using ShareService
      const shareService = createShareService(jwt);
      console.log("Calling shareFile API...", {
        fileId: file.id,
        username: selectedUser.username,
      });
      await shareService.shareFile(file.id, selectedUser.username, sharedKey);
      console.log("Share successful!");

      setMessage(`Successfully shared with ${selectedUser.username}!`);
      setTimeout(onClose, 2000); // Close modal on success
    } catch (err: any) {
      console.error("Share error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!file) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Icon */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-[#7c5cff]/10 rounded-xl flex items-center justify-center shrink-0">
            <svg
              className="w-7 h-7 text-[#7c5cff]"
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
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">Share File</h2>
            <p className="text-[1rem] text-gray-600 mt-1">
              Give others access to your file
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
          >
            <svg
              className="w-6 h-6"
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

        {/* File Info */}
        <div className="bg-[#7c5cff]/5 rounded-xl p-4 mb-6 border border-[#7c5cff]/20">
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-[#7c5cff]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600 mb-0.5">Sharing file:</p>
              <p className="font-semibold text-gray-900 truncate">
                {file.filename}
              </p>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="mb-4">
          <label className="block text-[1rem] font-semibold text-gray-900 mb-2">
            Search for user
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedUser(null);
              }}
              placeholder="Enter username..."
              className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-[1rem] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7c5cff]/20 focus:border-[#7c5cff] transition-all"
              autoFocus
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-4 max-h-48 overflow-y-auto space-y-2 border-2 border-gray-200 rounded-xl p-3 bg-gray-50">
            {searchResults.map((user) => (
              <div
                key={user.id}
                onClick={() => {
                  setSelectedUser(user);
                  setSearchQuery(user.username);
                  setSearchResults([]);
                }}
                className="p-3 bg-white hover:bg-[#7c5cff]/5 hover:border-[#7c5cff]/30 border border-gray-200 rounded-lg cursor-pointer transition-all flex items-center gap-3 group"
              >
                <div className="w-10 h-10 bg-linear-to-br from-[#7c5cff] to-[#6b4ce6] rounded-full flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-sm">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-[1rem] font-medium text-gray-900 group-hover:text-[#7c5cff]">
                  {user.username}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-600 shrink-0 mt-0.5"
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
              <p className="text-[1rem] text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {message && (
          <div className="mb-4 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-green-600 shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-[1rem] text-green-700">{message}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-5 py-3 bg-gray-100 rounded-xl text-[1rem] font-semibold text-gray-700 hover:bg-gray-200 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={isLoading || !selectedUser}
            className="flex-1 px-5 py-3 font-semibold text-white bg-[#7c5cff] hover:bg-[#6b4ce6] disabled:bg-gray-300 disabled:cursor-not-allowed rounded-xl transition-all shadow-lg shadow-[#7c5cff]/20 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Sharing...</span>
              </>
            ) : (
              <>
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
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                <span>
                  {selectedUser
                    ? `Share with ${selectedUser.username}`
                    : "Select User"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
