export const getFileExtension = (filename: string): string => {
  return filename.split(".").pop()?.toLowerCase() || "";
};

export const getFileType = (filename: string) => {
  const ext = getFileExtension(filename);

  const fileTypes = {
    image: ["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp"],
    pdf: ["pdf"],
    video: ["mp4", "webm", "mov", "avi", "mkv"],
    audio: ["mp3", "wav", "ogg", "m4a", "flac"],
    code: [
      "js",
      "jsx",
      "ts",
      "tsx",
      "py",
      "java",
      "cpp",
      "c",
      "h",
      "css",
      "scss",
      "html",
      "json",
      "xml",
      "yaml",
      "yml",
      "md",
      "sh",
      "bash",
    ],
    document: ["docx", "doc"],
    spreadsheet: ["xlsx", "xls", "csv"],
    text: ["txt", "log"],
  };

  for (const [type, extensions] of Object.entries(fileTypes)) {
    if (extensions.includes(ext)) {
      return type;
    }
  }

  return "unsupported";
};

export const getFileIcon = (type: string) => {
  const icons = {
    image: {
      color: "text-blue-600",
      bg: "bg-blue-500/10",
      path: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
    },
    pdf: {
      color: "text-red-600",
      bg: "bg-red-500/10",
      path: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z",
    },
    video: {
      color: "text-purple-600",
      bg: "bg-purple-500/10",
      path: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
    },
    audio: {
      color: "text-green-600",
      bg: "bg-green-500/10",
      path: "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3",
    },
    code: {
      color: "text-indigo-600",
      bg: "bg-indigo-500/10",
      path: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
    },
    document: {
      color: "text-blue-600",
      bg: "bg-blue-500/10",
      path: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    },
    spreadsheet: {
      color: "text-green-600",
      bg: "bg-green-500/10",
      path: "M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
    },
    text: {
      color: "text-gray-600",
      bg: "bg-gray-500/10",
      path: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    },
  };

  return (
    icons[type as keyof typeof icons] || {
      color: "text-gray-600",
      bg: "bg-gray-500/10",
      path: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
    }
  );
};

export const getFileTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    image: "Image Preview",
    pdf: "PDF Document",
    video: "Video Player",
    audio: "Audio Player",
    code: "Code Preview",
    document: "Document Preview",
    spreadsheet: "Spreadsheet Preview",
    text: "Text Preview",
    unsupported: "File Preview",
  };

  return labels[type] || "File Preview";
};
