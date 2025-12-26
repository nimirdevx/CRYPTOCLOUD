"use client";

import React from "react";
import { Cloud, Share2, User } from "lucide-react";
import Avatar from "./Avatar";
import type { User as UserType } from "../types";

interface MobileBottomNavProps {
  currentView: "files" | "shared" | "profile";
  onViewChange: (view: "files" | "shared" | "profile") => void;
  currentUser: UserType | null;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onViewChange,
  currentUser,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex items-center justify-around px-4 py-3 safe-area-pb">
        {/* Files Tab */}
        <button
          onClick={() => onViewChange("files")}
          className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all ${
            currentView === "files"
              ? "bg-[#7c5cff]/10 text-[#7c5cff]"
              : "text-slate-600"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentView === "files"
                ? "bg-[#7c5cff] text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            <Cloud className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium">Files</span>
        </button>

        {/* Shared Tab */}
        <button
          onClick={() => onViewChange("shared")}
          className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all ${
            currentView === "shared"
              ? "bg-[#7c5cff]/10 text-[#7c5cff]"
              : "text-slate-600"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentView === "shared"
                ? "bg-[#7c5cff] text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            <Share2 className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium">Shared</span>
        </button>

        {/* Profile Tab */}
        <button
          onClick={() => onViewChange("profile")}
          className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all ${
            currentView === "profile"
              ? "bg-[#7c5cff]/10 text-[#7c5cff]"
              : "text-slate-600"
          }`}
        >
          <Avatar
            username={currentUser?.username}
            profilePictureUrl={currentUser?.profile_picture_url}
            size="sm"
            className={
              currentView === "profile"
                ? "ring-2 ring-[#7c5cff] ring-offset-1"
                : ""
            }
          />
          <span className="text-xs font-medium">Profile</span>
        </button>
      </div>
    </nav>
  );
};
