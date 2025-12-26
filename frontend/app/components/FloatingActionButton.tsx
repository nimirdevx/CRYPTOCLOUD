"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, Upload, FolderPlus, X } from "lucide-react";

interface FloatingActionButtonProps {
  onUploadClick: () => void;
  onNewFolderClick: () => void;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onUploadClick,
  onNewFolderClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  // Check if screen is mobile (< 768px)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Initialize position from localStorage or use default
  useEffect(() => {
    const savedPosition = localStorage.getItem("fabPosition");
    if (savedPosition) {
      setPosition(JSON.parse(savedPosition));
    } else {
      // Default position: bottom-24 right-6 (96px from bottom, 24px from right)
      setPosition({ x: window.innerWidth - 80, y: window.innerHeight - 120 });
    }
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();

    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;

    // Keep button within screen bounds
    const maxX = window.innerWidth - 56; // 56px is button width
    const maxY = window.innerHeight - 56;

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  };

  const handleTouchEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      // Save position to localStorage
      localStorage.setItem("fabPosition", JSON.stringify(position));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // Keep button within screen bounds
    const maxX = window.innerWidth - 56;
    const maxY = window.innerHeight - 56;

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      // Save position to localStorage
      localStorage.setItem("fabPosition", JSON.stringify(position));
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  const handleMainClick = () => {
    if (!isDragging) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleUpload = () => {
    onUploadClick();
    setIsExpanded(false);
  };

  const handleNewFolder = () => {
    onNewFolderClick();
    setIsExpanded(false);
  };

  // Don't render on tablet/desktop
  if (!isMobile) {
    return null;
  }

  return (
    <div
      ref={buttonRef}
      className="fixed z-40"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: "none",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Backdrop when expanded */}
      {isExpanded && (
        <div
          className="fixed inset-0 -z-10"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Action Menu */}
      <div
        className={`flex flex-col-reverse gap-3 mb-3 transition-all duration-200 ${
          isExpanded
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {/* Upload File Button */}
        <button
          onClick={handleUpload}
          className="flex items-center gap-3 bg-white text-gray-700 px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all group"
        >
          <Upload className="w-5 h-5" />
          <span className="font-medium text-sm">Upload file</span>
        </button>

        {/* New Folder Button */}
        <button
          onClick={handleNewFolder}
          className="flex items-center gap-3 bg-white text-gray-700 px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all group"
        >
          <FolderPlus className="w-5 h-5" />
          <span className="font-medium text-sm">New folder</span>
        </button>
      </div>

      {/* Main FAB */}
      <button
        onMouseDown={handleMouseDown}
        onClick={handleMainClick}
        className={`w-14 h-14 bg-[#7c5cff] text-white rounded-full shadow-lg hover:shadow-xl hover:bg-[#6b4ce6] transition-all flex items-center justify-center ${
          isExpanded ? "rotate-45" : "rotate-0"
        } ${isDragging ? "cursor-move" : "cursor-pointer"}`}
      >
        {isExpanded ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </button>
    </div>
  );
};
