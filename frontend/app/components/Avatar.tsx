"use client";

import React, { useState } from "react";

interface AvatarProps {
  username?: string | null;
  profilePictureUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  onClick?: () => void;
}

/**
 * Avatar Component
 * Displays user profile picture if available, otherwise shows initials
 *
 * @param username - User's username (used for initials fallback)
 * @param profilePictureUrl - URL to the user's profile picture
 * @param size - Size of the avatar (xs: 24px, sm: 32px, md: 40px, lg: 48px, xl: 64px)
 * @param className - Additional CSS classes
 * @param onClick - Click handler for the avatar
 */
export default function Avatar({
  username = "",
  profilePictureUrl,
  size = "md",
  className = "",
  onClick,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  // Get initials from username
  const getInitials = (name?: string | null): string => {
    if (!name || name.trim() === "") return "U";

    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      // First name + Last name initials
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    // Single word - take first 2 characters or just 1
    return name.substring(0, 2).toUpperCase();
  };

  // Size mappings
  const sizeClasses = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
    xl: "w-16 h-16 text-2xl",
  };

  const initials = getInitials(username);
  const shouldShowImage = profilePictureUrl && !imageError;

  // Reset image error when URL changes
  React.useEffect(() => {
    setImageError(false);
  }, [profilePictureUrl]);

  return (
    <div
      className={`${
        sizeClasses[size]
      } rounded-full flex items-center justify-center overflow-hidden bg-linear-to-br from-[#7c5cff] to-[#6a4de6] text-white font-semibold select-none ${
        onClick ? "cursor-pointer hover:opacity-90 transition-opacity" : ""
      } ${className}`}
      onClick={onClick}
      title={username || "User"}
    >
      {shouldShowImage ? (
        <img
          key={profilePictureUrl} // Force re-render when URL changes
          src={profilePictureUrl}
          alt={`${username}'s avatar`}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
          loading="lazy"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
