"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import PasswordPrompt from "../components/PasswordPrompt";
import Avatar from "../components/Avatar";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { API_URL } from "../config/constants";
import type { User } from "../types";

type View = "files" | "shared" | "profile";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { jwt, encryptionKey, isInitialized, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [currentView, setCurrentView] = useState<View>("files");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    if (pathname === "/dashboard") {
      setCurrentView("files");
    } else if (pathname?.includes("/shared")) {
      setCurrentView("shared");
    } else if (pathname?.includes("/security")) {
      setCurrentView("profile");
    }
  }, [pathname]);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }
    if (!jwt) {
      router.push("/auth/login");
    }
  }, [jwt, isInitialized, router]);

  // Fetch current user data
  useEffect(() => {
    const fetchUserData = () => {
      if (jwt) {
        fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        })
          .then((res) => res.json())
          .then((data) => setCurrentUser(data))
          .catch((err) => console.error("Failed to fetch user data:", err));
      }
    };

    fetchUserData();

    // Listen for profile picture update events
    const handleProfileUpdate = () => {
      fetchUserData();
    };

    window.addEventListener("profilePictureUpdated", handleProfileUpdate);

    return () => {
      window.removeEventListener("profilePictureUpdated", handleProfileUpdate);
    };
  }, [jwt]);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F4F5F7]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#7c5cff] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-700">Loading...</p>
        </div>
      </div>
    );
  }

  if (!jwt) {
    return null;
  }

  if (jwt && !encryptionKey) {
    return (
      <>
        <PasswordPrompt />
        <div className="blur-sm grayscale pointer-events-none">{children}</div>
      </>
    );
  }

  const handleViewChange = (view: View) => {
    setCurrentView(view);
    switch (view) {
      case "files":
        router.push("/dashboard");
        break;
      case "shared":
        router.push("/dashboard/shared");
        break;
      case "profile":
        router.push("/dashboard/security");
        break;
    }
  };

  return (
    <div className="w-screen h-screen bg-[#F4F5F7] overflow-hidden">
      <div className="flex w-full h-full lg:p-4 md:p-3 p-0 lg:gap-4 md:gap-3 gap-0">
        {/* Desktop/Tablet Sidebar - Hidden on mobile */}
        <aside className="hidden lg:flex lg:w-24 md:flex md:w-16 bg-white lg:rounded-3xl md:rounded-2xl shadow-sm border border-slate-100 lg:p-4 md:p-2 flex-col items-center lg:gap-5 md:gap-3">
          <button
            onClick={() => handleViewChange("profile")}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              currentView === "profile"
                ? "bg-[#7c5cff]/10 text-[#7c5cff]"
                : "text-slate-600 hover:bg-slate-100"
            }`}
            title="Profile"
          >
            <Avatar
              username={currentUser?.username}
              profilePictureUrl={currentUser?.profile_picture_url}
              size="md"
              className={
                currentView === "profile"
                  ? "ring-2 ring-[#7c5cff] ring-offset-2"
                  : ""
              }
            />
            <span className="lg:block md:hidden text-xs font-medium">
              Profile
            </span>
          </button>

          <button
            onClick={() => handleViewChange("files")}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              currentView === "files"
                ? "bg-[#7c5cff]/10 text-[#7c5cff]"
                : "text-slate-600 hover:bg-slate-100"
            }`}
            title="My files"
          >
            <div
              className={`lg:w-10 lg:h-10 md:w-8 md:h-8 rounded-full flex items-center justify-center ${
                currentView === "files"
                  ? "bg-[#7c5cff] text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              <svg
                className="lg:w-5 lg:h-5 md:w-4 md:h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                />
              </svg>
            </div>
            <span className="lg:block md:hidden text-xs font-medium">
              My files
            </span>
          </button>

          <button
            onClick={() => handleViewChange("shared")}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              currentView === "shared"
                ? "bg-[#7c5cff]/10 text-[#7c5cff]"
                : "text-slate-600 hover:bg-slate-100"
            }`}
            title="Shared"
          >
            <div
              className={`lg:w-10 lg:h-10 md:w-8 md:h-8 rounded-full flex items-center justify-center ${
                currentView === "shared"
                  ? "bg-[#7c5cff] text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              <svg
                className="lg:w-5 lg:h-5 md:w-4 md:h-4"
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
            <span className="lg:block md:hidden text-xs font-medium">
              Shared
            </span>
          </button>

          <div className="flex-1" />

          <button
            onClick={() => {
              logout();
              router.push("/auth/login");
            }}
            className="flex flex-col items-center gap-1 p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-all"
            title="Log out"
          >
            <div className="lg:w-10 lg:h-10 md:w-8 md:h-8 rounded-full bg-slate-100 flex items-center justify-center">
              <svg
                className="lg:w-5 lg:h-5 md:w-4 md:h-4"
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
            <span className="lg:block md:hidden text-xs font-medium">
              Log out
            </span>
          </button>
        </aside>

        {children}
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        currentView={currentView}
        onViewChange={handleViewChange}
        currentUser={currentUser}
      />
    </div>
  );
}
