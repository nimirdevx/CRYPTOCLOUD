/**
 * Application-wide constants
 * Centralized configuration values used across the application
 */

// API Configuration
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Storage Limits
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB in bytes
export const STORAGE_QUOTA = 5 * 1024 * 1024 * 1024; // 5GB in bytes

// File Preview Configuration
export const PREVIEWABLE_TYPES = {
  images: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ],
  videos: ["video/mp4", "video/webm", "video/ogg"],
  audio: ["audio/mpeg", "audio/ogg", "audio/wav"],
  documents: ["application/pdf", "text/plain"],
} as const;

// Cryptography Configuration
export const RSA_KEY_SIZE = 2048;
export const AES_KEY_LENGTH = 256;
export const PBKDF2_ITERATIONS = 100000;

// UI Configuration
export const TOAST_DURATION = 3000; // milliseconds
export const DEBOUNCE_DELAY = 300; // milliseconds

// Date Format
export const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection.",
  UNAUTHORIZED: "Your session has expired. Please login again.",
  FILE_TOO_LARGE: `File size exceeds the maximum limit of ${
    MAX_FILE_SIZE / 1024 / 1024
  }MB.`,
  STORAGE_QUOTA_EXCEEDED: "Storage quota exceeded. Please delete some files.",
  INVALID_FILE_TYPE: "Invalid file type.",
  GENERIC_ERROR: "An error occurred. Please try again.",
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  FILE_UPLOADED: "File uploaded successfully",
  FILE_DELETED: "File deleted successfully",
  FILE_SHARED: "File shared successfully",
  SHARE_REVOKED: "Share access revoked",
  SETTINGS_UPDATED: "Settings updated successfully",
  PASSWORD_CHANGED: "Password changed successfully",
} as const;
