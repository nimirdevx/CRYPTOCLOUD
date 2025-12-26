"use client";

import { useState, useEffect } from "react";
import { User, SettingsIcon, Shield, Folder, LogOut } from "lucide-react";
import { useSecurity } from "@/app/hooks/useSecurity";
import { useAuth } from "@/app/context/AuthContext";
import BackupCodesModal from "@/app/components/BackupCodesModal";
import { StorageQuotaBar } from "@/app/components/StorageQuotaBar";
import { useFileManager } from "@/app/hooks/useFileManager";
import { formatBytes } from "@/app/utils/format";
import Avatar from "@/app/components/Avatar";
import { ResponsiveTabs, TabItem } from "@/app/components/ResponsiveTabs";

// type ProfileTab = "account" | "settings" | "security";
type ProfileTab = "account" | "security";

export default function SecurityContent() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("account");
  const security = useSecurity();
  const { logout } = useAuth();
  const { storageUsage } = useFileManager();

  // Define profile tabs
  const profileTabs: TabItem[] = [
    { id: "account", label: "Account", icon: User },
    { id: "security", label: "Security", icon: Shield },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as ProfileTab);
  };

  useEffect(() => {
    security.getCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { used, quota } = storageUsage || { used: 0, quota: 0 };
  const percentUsed = quota > 0 ? (used / quota) * 100 : 0;

  return (
    <div className="flex-1 flex flex-col lg:gap-6 md:gap-4 gap-3 h-full overflow-hidden">
      {/* Header */}
      <div className="lg:hidden px-3 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-900">Profile</h3>
          <Folder className="w-8 h-8 text-[#7c5cff]" />
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:flex items-center justify-between px-2 pt-6">
        <h3 className="text-3xl font-bold text-gray-900">Profile</h3>
        <Folder className="w-10 h-10 text-[#7c5cff]" />
      </div>

      {/* Tabs for mobile and tablet */}
      <div className="lg:hidden sticky top-0 z-10 bg-gray-100 pt-2 -mx-2 px-2">
        <div className="max-w-full overflow-x-auto pb-1 no-scrollbar">
          <div className="inline-flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {profileTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as ProfileTab)}
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
            {profileTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as ProfileTab)}
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
            tabs={profileTabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </div>

        {/* Content Area - Takes remaining space */}
        <div className="flex-1 bg-white lg:rounded-br-3xl lg:rounded-bl-none rounded-lg shadow-sm flex flex-col overflow-hidden">
          <div className="lg:p-8 md:p-6 p-4 overflow-y-auto h-full">
            {activeTab === "account" && (
              <>
                <h2
                  style={{
                    fontSize: "1.375rem",
                    lineHeight: "1.75rem",
                    fontWeight: 700,
                  }}
                  className="text-gray-900 mb-6"
                >
                  Account
                </h2>
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-2">
                    CryptoCloud Account
                  </p>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="relative group">
                      <Avatar
                        username={security.currentUser?.username}
                        profilePictureUrl={
                          security.currentUser?.profile_picture_url
                        }
                        size="lg"
                      />
                      {/* Hidden file input */}
                      <input
                        type="file"
                        id="profile-picture-upload"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            security.uploadProfilePicture(file);
                          }
                          // Reset input so the same file can be selected again
                          e.target.value = "";
                        }}
                        disabled={security.isUploadingProfilePicture}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {security.currentUser?.username || "Loading..."}
                      </p>
                      <p className="text-sm text-gray-700">
                        {security.currentUser?.email || "Loading..."}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <label
                          htmlFor="profile-picture-upload"
                          className={`text-xs text-[#7c5cff] font-medium hover:underline cursor-pointer ${
                            security.isUploadingProfilePicture
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          {security.isUploadingProfilePicture
                            ? "Uploading..."
                            : "Change photo"}
                        </label>
                        {security.currentUser?.profile_picture_url && (
                          <>
                            <span className="text-xs text-gray-400">•</span>
                            <button
                              onClick={security.deleteProfilePicture}
                              disabled={security.isUploadingProfilePicture}
                              className={`text-xs text-red-500 font-medium hover:underline ${
                                security.isUploadingProfilePicture
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                            >
                              Remove photo
                            </button>
                          </>
                        )}
                      </div>
                      {security.profilePictureError && (
                        <p className="text-xs text-red-500 mt-1">
                          {security.profilePictureError}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-2">Username</p>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <input
                      type="text"
                      value={security.newUsername}
                      onChange={(e) => security.setNewUsername(e.target.value)}
                      className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7c5cff]/20 focus:border-[#7c5cff] transition-all"
                      placeholder="Enter new username"
                    />
                    <button
                      onClick={security.updateUsername}
                      disabled={
                        !security.newUsername ||
                        security.newUsername === security.currentUser?.username
                      }
                      className="px-4 py-2.5 bg-[#7c5cff] text-white text-sm font-medium rounded-lg hover:bg-[#6a4de6] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      Update
                    </button>
                  </div>
                  {security.updateUsernameError && (
                    <p className="text-red-500 text-sm mt-2">
                      {security.updateUsernameError}
                    </p>
                  )}
                  {security.message && (
                    <p className="text-green-500 text-sm mt-2">
                      {security.message}
                    </p>
                  )}
                </div>

                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-2">Storage</p>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          Storage Usage
                        </span>
                        <span className="text-sm font-medium text-gray-600">
                          {percentUsed.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-2.5 rounded-full bg-[#7c5cff]"
                          style={{
                            width: `${percentUsed > 100 ? 100 : percentUsed}%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatBytes(used)} of {formatBytes(quota)} used
                      </p>
                    </div>
                    <button className="text-[#7c5cff] text-sm font-medium hover:underline ml-4">
                      Upgrade storage
                    </button>
                  </div>
                </div>
                    {/* Logout Button */}
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-2">Account Actions</p>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <button
                      onClick={() => {
                        logout();
                        window.location.href = '/';
                      }}
                      className="w-full px-4 py-2.5 text-left text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log out</span>
                    </button>
                    
                  </div>
                </div>
              </>
            )}

            {/* {activeTab === "settings" && (
            <>
              <h2
                style={{
                  fontSize: "1.375rem",
                  lineHeight: "1.75rem",
                  fontWeight: 700,
                }}
                className="text-gray-900 mb-6"
              >
                Settings
              </h2>
              <p className="text-gray-500">Settings content coming soon...</p>
            </>
          )} */}

            {activeTab === "security" && (
              <>
                <h2
                  style={{
                    fontSize: "1.375rem",
                    lineHeight: "1.75rem",
                    fontWeight: 700,
                  }}
                  className="text-gray-900 mb-6"
                >
                  Security
                </h2>

                {/* Success/Error Messages */}
                {security.message && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
                    {security.message}
                  </div>
                )}
                {security.error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    {security.error}
                  </div>
                )}

                {/* Two-Factor Authentication Section */}
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-2">
                    Two-Factor Authentication
                  </p>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          Authenticator App
                        </p>
                        <p className="text-sm text-gray-500">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          security.is2FAEnabled
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {security.is2FAEnabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>

                    {!security.is2FAEnabled ? (
                      <button
                        onClick={security.generate2FA}
                        className="px-4 py-2 bg-[#7c5cff] text-white text-sm font-medium rounded-lg hover:bg-[#6a4de6] transition-colors"
                      >
                        Enable 2FA
                      </button>
                    ) : (
                      <button
                        onClick={() => security.setShowDisable2FAModal(true)}
                        className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Disable 2FA
                      </button>
                    )}
                  </div>
                </div>

                {/* Backup Codes Section - Only show when 2FA is enabled */}
                {security.is2FAEnabled && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-2">Backup Codes</p>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="mb-3">
                        <p className="font-medium text-gray-900">
                          Recovery Codes
                        </p>
                        <p className="text-sm text-gray-500">
                          Generate backup codes to access your account if you
                          lose your authenticator device
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          security.setShowBackupCodesPasswordModal(true)
                        }
                        className="px-4 py-2 bg-[#7c5cff] text-white text-sm font-medium rounded-lg hover:bg-[#6a4de6] transition-colors"
                      >
                        Generate New Codes
                      </button>
                    </div>
                  </div>
                )}

                {/* Danger Zone */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <p className="text-sm text-red-600 font-medium mb-2">
                    Danger Zone
                  </p>
                  <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                    <div className="mb-3">
                      <p className="font-medium text-gray-900">
                        Delete Account
                      </p>
                      <p className="text-sm text-gray-500">
                        Permanently delete your account and all associated data
                      </p>
                    </div>
                    <button
                      onClick={() => security.setShowDeleteModal(true)}
                      className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2FA Setup Modal */}
      {security.qrCode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-scale-up">
            {/* Header with Icon */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-green-500/10 rounded-xl flex items-center justify-center shrink-0">
                <svg
                  className="w-7 h-7 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Enable Two-Factor Authentication
                </h3>
                <p className="text-[1rem] text-gray-600 mt-1">
                  Scan QR code with your authenticator app
                </p>
              </div>
            </div>

            {/* QR Code Display */}
            <div className="bg-linear-to-br from-[#7c5cff]/5 to-blue-500/5 rounded-xl p-6 mb-6 border-2 border-[#7c5cff]/20">
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-xl shadow-lg">
                  <img
                    src={security.qrCode || "/placeholder.svg"}
                    alt="QR Code"
                    className="w-48 h-48"
                  />
                </div>
              </div>
            </div>

            {/* Verification Code Input */}
            <div className="mb-6">
              <label className="block text-[1rem] font-semibold text-gray-900 mb-3 text-center">
                Enter 6-Digit Verification Code
              </label>
              <input
                type="text"
                value={security.totpCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  security.setTotpCode(value);
                }}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-center text-2xl tracking-[0.5em] font-mono text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7c5cff]/20 focus:border-[#7c5cff] transition-all"
              />
            </div>

            {/* Error Message */}
            {security.error && (
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
                  <p className="text-[1rem] text-red-700">{security.error}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={security.cancel2FASetup}
                className="flex-1 px-5 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all text-[1rem]"
              >
                Cancel
              </button>
              <button
                onClick={security.verify2FA}
                disabled={security.totpCode.length !== 6}
                className="flex-1 px-5 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all text-[1rem] shadow-lg shadow-green-600/20"
              >
                Verify & Enable
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {security.showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-scale-up">
            {/* Warning Icon Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-red-500/10 rounded-xl flex items-center justify-center shrink-0">
                <svg
                  className="w-7 h-7 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Delete Account
                </h3>
                <p className="text-[1rem] text-gray-600 mt-1">
                  This action is permanent
                </p>
              </div>
            </div>

            {/* Warning Message */}
            <div className="bg-red-50 rounded-xl p-5 mb-6 border-2 border-red-200">
              <p className="text-[1rem] text-gray-900 font-semibold mb-2">
                This action cannot be undone
              </p>
              <p className="text-[1rem] text-gray-700">
                All your files and data will be permanently deleted. This
                includes all encrypted files, shared links, and account
                settings.
              </p>
            </div>

            {/* Password Input */}
            <div className="mb-6">
              <label className="block text-[1rem] font-semibold text-gray-900 mb-3">
                Enter your password to confirm deletion
              </label>
              <input
                type="password"
                value={security.deletePassword}
                onChange={(e) => security.setDeletePassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-[1rem] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
              />
            </div>

            {/* Error Message */}
            {security.deleteError && (
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
                  <p className="text-[1rem] text-red-700">
                    {security.deleteError}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  security.setShowDeleteModal(false);
                  security.setDeletePassword("");
                }}
                className="flex-1 px-5 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all text-[1rem]"
              >
                Cancel
              </button>
              <button
                onClick={security.deleteAccount}
                disabled={!security.deletePassword}
                className="flex-1 px-5 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all text-[1rem] shadow-lg shadow-red-600/20"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disable 2FA Modal */}
      {security.showDisable2FAModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-scale-up">
            {/* Header with Warning Icon */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-red-500/10 rounded-xl flex items-center justify-center shrink-0">
                <svg
                  className="w-7 h-7 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Disable Two-Factor Authentication
                </h3>
                <p className="text-[1rem] text-gray-600 mt-1">
                  Remove extra security from your account
                </p>
              </div>
            </div>

            {/* Warning Message */}
            <div className="bg-red-50 rounded-xl p-5 mb-6 border-2 border-red-200">
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
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <p className="text-[1rem] text-gray-900 font-semibold mb-1">
                    Warning: This will reduce your account security
                  </p>
                  <p className="text-[1rem] text-gray-700">
                    Your account will be protected only by your password. We
                    strongly recommend keeping 2FA enabled.
                  </p>
                </div>
              </div>
            </div>

            {/* Password Input */}
            <div className="mb-6">
              <label className="block text-[1rem] font-semibold text-gray-900 mb-3">
                Enter your password to confirm
              </label>
              <input
                type="password"
                value={security.disable2FAPassword}
                onChange={(e) => security.setDisable2FAPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-[1rem] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
              />
            </div>

            {/* Error Message */}
            {security.disable2FAError && (
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
                  <p className="text-[1rem] text-red-700">
                    {security.disable2FAError}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  security.setShowDisable2FAModal(false);
                  security.setDisable2FAPassword("");
                }}
                className="flex-1 px-5 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all text-[1rem]"
              >
                Cancel
              </button>
              <button
                onClick={security.disable2FA}
                disabled={!security.disable2FAPassword}
                className="flex-1 px-5 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all text-[1rem] shadow-lg shadow-red-600/20"
              >
                Disable 2FA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backup Codes Password Modal */}
      {security.showBackupCodesPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-scale-up">
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Generate Backup Codes
                </h3>
                <p className="text-[1rem] text-gray-600 mt-1">
                  Secure your account with recovery codes
                </p>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 rounded-xl p-5 mb-6 border-2 border-blue-200">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-blue-600 shrink-0 mt-0.5"
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
                <p className="text-[1rem] text-gray-700 leading-relaxed">
                  These codes can be used to access your account if you lose
                  your authenticator device. Save them in a secure location.
                </p>
              </div>
            </div>

            {/* Password Input */}
            <div className="mb-6">
              <label className="block text-[1rem] font-semibold text-gray-900 mb-3">
                Enter your password to continue
              </label>
              <input
                type="password"
                value={security.backupCodesPassword}
                onChange={(e) =>
                  security.setBackupCodesPassword(e.target.value)
                }
                placeholder="Enter your password"
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-[1rem] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7c5cff]/20 focus:border-[#7c5cff] transition-all"
              />
            </div>

            {/* Error Message */}
            {security.backupCodesPasswordError && (
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
                  <p className="text-[1rem] text-red-700">
                    {security.backupCodesPasswordError}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  security.setShowBackupCodesPasswordModal(false);
                  security.setBackupCodesPassword("");
                }}
                className="flex-1 px-5 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all text-[1rem]"
              >
                Cancel
              </button>
              <button
                onClick={security.generateBackupCodes}
                disabled={!security.backupCodesPassword}
                className="flex-1 px-5 py-3 bg-[#7c5cff] text-white font-semibold rounded-xl hover:bg-[#6b4ce6] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all text-[1rem] shadow-lg shadow-[#7c5cff]/20"
              >
                Generate Codes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backup Codes Display Modal */}
      {security.generatedBackupCodes && (
        <BackupCodesModal
          codes={security.generatedBackupCodes}
          onClose={() => security.setGeneratedBackupCodes(null)}
        />
      )}
    </div>
  );
}
