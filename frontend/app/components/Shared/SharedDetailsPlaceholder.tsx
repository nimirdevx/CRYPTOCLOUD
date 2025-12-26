"use client";

import React from "react";
import { formatBytes } from "@/app/utils/format";

interface SharedDetailsPlaceholderProps {
  activeTab: "shared-with-me" | "shared-by-me" | "public-links";
  sharedFiles: any[];
  myShares: any[];
  publicLinks: any[];
}

export const SharedDetailsPlaceholder = ({
  activeTab,
  sharedFiles,
  myShares,
  publicLinks,
}: SharedDetailsPlaceholderProps) => {
  return (
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
            {activeTab === "public-links" ? "Total Links" : "Total Files"}
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
              {myShares.reduce((acc, file) => acc + file.shares.length, 0)}
            </p>
          </div>
        )}

        {activeTab === "public-links" && publicLinks.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
              Total Downloads
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {publicLinks.reduce((acc, link) => acc + link.download_count, 0)}
            </p>
          </div>
        )}
      </div>
    </>
  );
};
