/**
 * Formatting Utilities
 * Helper functions for formatting data for display
 */

/**
 * Format bytes to human-readable string
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "1.5 MB")
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

/**
 * Format date to relative time or absolute date
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Less than a minute
  if (diffInSeconds < 60) {
    return "Just now";
  }

  // Less than an hour
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  }

  // Less than a day
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }

  // Less than a week
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }

  // Otherwise, return formatted date
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Format date to full string
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export const formatFullDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Get MIME type from file extension
 * @param filename - File name
 * @returns MIME type string
 */
export const getMimeType = (filename: string): string => {
  const ext = filename.split(".").pop()?.toLowerCase() || "";

  const mimeTypes: { [key: string]: string } = {
    // Images
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    svg: "image/svg+xml",
    webp: "image/webp",
    bmp: "image/bmp",
    ico: "image/x-icon",

    // Documents
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",

    // Text
    txt: "text/plain",
    csv: "text/csv",
    json: "application/json",
    xml: "application/xml",
    html: "text/html",
    css: "text/css",
    js: "application/javascript",
    ts: "application/typescript",

    // Archives
    zip: "application/zip",
    rar: "application/x-rar-compressed",
    "7z": "application/x-7z-compressed",
    tar: "application/x-tar",
    gz: "application/gzip",

    // Media
    mp3: "audio/mpeg",
    mp4: "video/mp4",
    avi: "video/x-msvideo",
    mov: "video/quicktime",
    wav: "audio/wav",
  };

  return mimeTypes[ext] || "application/octet-stream";
};

/**
 * Check if file is previewable
 * @param filename - File name
 * @returns Boolean indicating if file can be previewed
 */
export const isPreviewable = (filename: string): boolean => {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const previewableExtensions = [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "svg",
    "webp",
    "bmp",
    "pdf",
  ];
  return previewableExtensions.includes(ext);
};

/**
 * Get file icon based on extension
 * @param filename - File name
 * @returns Icon name/class
 */
export const getFileIcon = (filename: string): string => {
  const ext = filename.split(".").pop()?.toLowerCase() || "";

  const iconMap: { [key: string]: string } = {
    // Images
    jpg: "image",
    jpeg: "image",
    png: "image",
    gif: "image",
    svg: "image",
    webp: "image",
    bmp: "image",

    // Documents
    pdf: "document",
    doc: "document",
    docx: "document",
    txt: "document",

    // Spreadsheets
    xls: "spreadsheet",
    xlsx: "spreadsheet",
    csv: "spreadsheet",

    // Presentations
    ppt: "presentation",
    pptx: "presentation",

    // Code
    js: "code",
    ts: "code",
    jsx: "code",
    tsx: "code",
    html: "code",
    css: "code",
    json: "code",
    xml: "code",

    // Archives
    zip: "archive",
    rar: "archive",
    "7z": "archive",
    tar: "archive",
    gz: "archive",

    // Media
    mp3: "audio",
    mp4: "video",
    avi: "video",
    mov: "video",
    wav: "audio",
  };

  return iconMap[ext] || "file";
};

/**
 * Truncate filename if too long
 * @param filename - File name
 * @param maxLength - Maximum length before truncation (default: 30)
 * @returns Truncated filename
 */
export const truncateFilename = (
  filename: string,
  maxLength: number = 30
): string => {
  if (filename.length <= maxLength) {
    return filename;
  }

  const extension = filename.split(".").pop() || "";
  const nameWithoutExt = filename.substring(
    0,
    filename.length - extension.length - 1
  );

  const truncatedName = nameWithoutExt.substring(
    0,
    maxLength - extension.length - 4
  );
  return `${truncatedName}...${extension}`;
};

/**
 * Calculate storage percentage
 * @param used - Used storage in bytes
 * @param quota - Total quota in bytes
 * @returns Percentage (0-100)
 */
export const calculateStoragePercentage = (
  used: number,
  quota: number
): number => {
  if (quota === 0) return 0;
  return Math.min(Math.round((used / quota) * 100), 100);
};

/**
 * Get storage color based on usage percentage
 * @param percentage - Usage percentage (0-100)
 * @returns Color class name
 */
export const getStorageColor = (percentage: number): string => {
  if (percentage >= 90) return "text-red-500";
  if (percentage >= 70) return "text-yellow-500";
  return "text-green-500";
};

/**
 * Validate file size
 * @param fileSize - File size in bytes
 * @param maxSize - Maximum allowed size in bytes
 * @returns Boolean indicating if file size is valid
 */
export const isValidFileSize = (fileSize: number, maxSize: number): boolean => {
  return fileSize <= maxSize;
};

/**
 * Convert progress to display percentage
 * @param progress - Progress value (0-1)
 * @returns Percentage string (e.g., "75%")
 */
export const formatProgress = (progress: number): string => {
  return `${Math.round(progress * 100)}%`;
};
