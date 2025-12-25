import { useEffect, useState } from "react";
import { ImagePreview } from "./preview/ImagePreview";
import { PDFPreview } from "./preview/PDFPreview";
import { VideoPreview } from "./preview/VideoPreview";
import { AudioPreview } from "./preview/AudioPreview";
import { CodePreview } from "./preview/CodePreview";
import { DocumentPreview } from "./preview/DocumentPreview";
import { SpreadsheetPreview } from "./preview/SpreadsheetPreview";
import { TextPreview } from "./preview/TextPreview";
import { UnsupportedPreview } from "./preview/UnsupportedPreview";
import { FileInfoPanel } from "./FileInfoPanel";
import {
  getFileExtension,
  getFileType,
  getFileIcon,
  getFileTypeLabel,
} from "@/app/utils/fileTypeUtils";

interface PreviewModalProps {
  filename: string;
  previewUrl: string;
  onClose: () => void;
  fileSize?: number;
}

export const PreviewModal = ({
  filename,
  previewUrl,
  onClose,
  fileSize,
}: PreviewModalProps) => {
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  const fileExtension = getFileExtension(filename);
  const fileType = getFileType(filename);
  const fileIcon = getFileIcon(fileType);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Prevent default for keyboard shortcuts
      const activeElement = document.activeElement as HTMLElement;
      const isInputFocused =
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        activeElement?.isContentEditable;

      // Don't handle shortcuts if typing in input
      if (isInputFocused && e.key !== "Escape") return;

      switch (e.key) {
        case "Escape":
          if (showInfoPanel) {
            setShowInfoPanel(false);
          } else if (isFullscreen) {
            setIsFullscreen(false);
          } else {
            onClose();
          }
          break;
        case "i":
        case "I":
          e.preventDefault();
          setShowInfoPanel(!showInfoPanel);
          break;
        case "f":
        case "F":
          if (fileType === "image") {
            e.preventDefault();
            setIsFullscreen(!isFullscreen);
          }
          break;
        case "r":
        case "R":
          if (fileType === "image") {
            e.preventDefault();
            setRotation((prev) => (prev + 90) % 360);
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyboard);
    return () => document.removeEventListener("keydown", handleKeyboard);
  }, [onClose, isFullscreen, showInfoPanel, fileType]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in ${
        isFullscreen ? "p-0" : ""
      }`}
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full flex flex-col animate-scale-up ${
          isFullscreen
            ? "max-w-full max-h-full rounded-none"
            : "max-w-6xl max-h-[90vh]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-gray-200">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* File Type Badge */}
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${fileIcon.bg}`}
            >
              <svg
                className={`w-6 h-6 ${fileIcon.color}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={fileIcon.path}
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-gray-900 truncate">
                {filename}
              </h2>
              <p className="text-[1rem] text-gray-600 mt-1">
                {getFileTypeLabel(fileType)}
              </p>
            </div>
          </div>

          {/* Toolbar Controls */}
          <div className="flex items-center gap-2 ml-4">
            {fileType === "image" && (
              <>
                {/* Rotate Button */}
                <button
                  onClick={handleRotate}
                  className="p-2.5 text-gray-600 hover:text-[#7c5cff] hover:bg-purple-50 rounded-lg transition-all"
                  title="Rotate (90°)"
                >
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
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>

                {/* Fullscreen Button */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2.5 text-gray-600 hover:text-[#7c5cff] hover:bg-purple-50 rounded-lg transition-all"
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? (
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  ) : (
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
                        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                      />
                    </svg>
                  )}
                </button>
              </>
            )}

            {/* Info Button */}
            <button
              onClick={() => setShowInfoPanel(!showInfoPanel)}
              className={`p-2.5 rounded-lg transition-all ${
                showInfoPanel
                  ? "text-[#7c5cff] bg-purple-50"
                  : "text-gray-600 hover:text-[#7c5cff] hover:bg-purple-50"
              }`}
              title="File Info (I)"
            >
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              title="Close (Esc)"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          className={`flex-1 bg-gray-50 ${
            fileType === "image" ? "overflow-hidden" : "overflow-auto p-6"
          }`}
        >
          {fileType === "image" && (
            <ImagePreview
              previewUrl={previewUrl}
              filename={filename}
              rotation={rotation}
            />
          )}

          {fileType === "pdf" && (
            <PDFPreview previewUrl={previewUrl} filename={filename} />
          )}

          {fileType === "video" && (
            <VideoPreview previewUrl={previewUrl} filename={filename} />
          )}

          {fileType === "audio" && (
            <AudioPreview previewUrl={previewUrl} filename={filename} />
          )}

          {fileType === "code" && (
            <CodePreview previewUrl={previewUrl} filename={filename} />
          )}

          {fileType === "document" && (
            <DocumentPreview previewUrl={previewUrl} filename={filename} />
          )}

          {fileType === "spreadsheet" && (
            <SpreadsheetPreview previewUrl={previewUrl} filename={filename} />
          )}

          {fileType === "text" && (
            <TextPreview previewUrl={previewUrl} filename={filename} />
          )}

          {fileType === "unsupported" && (
            <UnsupportedPreview fileExtension={fileExtension} />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t-2 border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-3 font-semibold text-white bg-[#7c5cff] rounded-xl hover:bg-[#6b4ce6] transition-all shadow-lg shadow-[#7c5cff]/20"
          >
            Close
          </button>
        </div>
      </div>

      {/* File Info Panel */}
      <FileInfoPanel
        filename={filename}
        fileSize={fileSize}
        fileType={fileType}
        isOpen={showInfoPanel}
        onClose={() => setShowInfoPanel(false)}
      />
    </div>
  );
};
