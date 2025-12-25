/**
 * Format a date string to a human-readable relative time
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60)
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/**
 * Get the file type based on filename and folder status
 */
export const getFileType = (filename: string, isFolder: boolean): string => {
  if (isFolder) return "Folder";
  const ext = filename.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp"].includes(ext || ""))
    return "Image";
  if (ext === "pdf") return "PDF";
  if (["doc", "docx", "txt"].includes(ext || "")) return "Document";
  return "File";
};

/**
 * Get file icon based on file type
 */
export const getFileIcon = (filename: string, isFolder: boolean) => {
  const type = getFileType(filename, isFolder);
  return type;
};
