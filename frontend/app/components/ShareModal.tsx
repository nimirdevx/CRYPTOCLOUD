"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { decryptFileKey, importPublicKey, wrapFileKey } from "../lib/crypto";

const API_URL = "http://127.0.0.1:8000";

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
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

export const ShareModal = ({ file, onClose, authFetch }: ShareModalProps) => {
  const { encryptionKey } = useAuth(); // This is the user's Master Key
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

    const delayDebounce = setTimeout(async () => {
      try {
        const response = await authFetch(
          `${API_URL}/share/users/search?username=${searchQuery}`
        );
        if (!response.ok) throw new Error("Search failed");
        const data: UserSearchResult[] = await response.json();
        setSearchResults(data);
      } catch (err) {
        console.error(err);
      }
    }, 300); // 300ms delay

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, authFetch]);

  const handleShare = async () => {
    if (!file || !selectedUser || !encryptionKey) {
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
      // --- This is the Core Sharing Crypto Flow ---
      // 1. Decrypt the file's AES key using *our* master key
      const fileKey = await decryptFileKey(
        encryptionKey,
        file.encryptedFileKey
      );

      // 2. Import the *recipient's* public key
      const recipientPublicKey = await importPublicKey(selectedUser.publicKey);

      // 3. Re-encrypt the file key using the recipient's public key
      const sharedKey = await wrapFileKey(recipientPublicKey, fileKey);
      // ---------------------------------------------

      // 4. Send the new shared key to the server
      const response = await authFetch(
        `${API_URL}/share/files/${file.id}/share`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipientUsername: selectedUser.username,
            encryptedFileKey: sharedKey,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Failed to share file.");
      }

      setMessage(`Successfully shared with ${selectedUser.username}!`);
      setTimeout(onClose, 2000); // Close modal on success
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!file) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-up border border-indigo-500/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <svg
              className="w-6 h-6 text-cyan-400"
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
            Share File
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
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

        <p className="text-gray-300 mb-4">
          Sharing file:{" "}
          <span className="font-semibold text-white">{file.filename}</span>
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Search for user
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedUser(null); // Clear selection when typing
            }}
            placeholder="Enter username..."
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
            autoFocus
          />
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-4 max-h-40 overflow-y-auto space-y-2 border border-gray-700 rounded-lg p-2 bg-gray-800/50">
            {searchResults.map((user) => (
              <div
                key={user.id}
                onClick={() => {
                  setSelectedUser(user);
                  setSearchQuery(user.username); // Lock in the username
                  setSearchResults([]); // Close results
                }}
                className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors flex items-center gap-2"
              >
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="text-white">{user.username}</span>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 rounded-lg">
            <p className="text-green-400 text-sm">{message}</p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            disabled={isLoading || !selectedUser}
            className="flex-1 px-6 py-3 font-semibold text-white bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {isLoading
              ? "Sharing..."
              : `Share with ${selectedUser?.username || "..."}`}
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 font-semibold text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
