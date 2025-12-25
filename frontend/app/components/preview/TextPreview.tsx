import { useState, useEffect } from "react";

interface TextPreviewProps {
  previewUrl: string;
  filename: string;
}

export const TextPreview = ({ previewUrl, filename }: TextPreviewProps) => {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wordWrap, setWordWrap] = useState(true);
  const [fontSize, setFontSize] = useState(14);

  // Fetch text content
  useEffect(() => {
    const fetchText = async () => {
      try {
        const response = await fetch(previewUrl);
        if (!response.ok) {
          throw new Error("Failed to load file");
        }
        const text = await response.text();
        setContent(text);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load text");
      } finally {
        setLoading(false);
      }
    };

    fetchText();
  }, [previewUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getStats = () => {
    const lines = content.split("\n").length;
    const words = content.split(/\s+/).filter((w) => w.length > 0).length;
    const chars = content.length;
    return { lines, words, chars };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#7c5cff] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading text...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg border-2 border-red-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Failed to Load Text
          </h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="flex flex-col h-full min-h-[400px]">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white border-2 border-gray-200 rounded-t-2xl p-4 shadow-sm">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>

          {/* Stats */}
          <div className="hidden sm:flex items-center gap-4">
            <div>
              <p className="text-xs text-gray-500">Lines</p>
              <p className="text-sm font-semibold text-gray-900">
                {stats.lines}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Words</p>
              <p className="text-sm font-semibold text-gray-900">
                {stats.words}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Characters</p>
              <p className="text-sm font-semibold text-gray-900">
                {stats.chars}
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Font Size */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
            <button
              onClick={() => setFontSize(Math.max(10, fontSize - 2))}
              className="p-1 text-gray-600 hover:text-[#7c5cff] transition-colors"
              title="Decrease font size"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 12H4"
                />
              </svg>
            </button>
            <span className="text-sm font-semibold text-gray-700 min-w-12 text-center">
              {fontSize}px
            </span>
            <button
              onClick={() => setFontSize(Math.min(24, fontSize + 2))}
              className="p-1 text-gray-600 hover:text-[#7c5cff] transition-colors"
              title="Increase font size"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>

          {/* Word Wrap Toggle */}
          <button
            onClick={() => setWordWrap(!wordWrap)}
            className={`p-2 rounded-lg transition-all ${
              wordWrap
                ? "bg-[#7c5cff] text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            title={wordWrap ? "Disable word wrap" : "Enable word wrap"}
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
                d="M4 6h16M4 12h16M4 18h7"
              />
            </svg>
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-[#7c5cff] text-white rounded-lg font-semibold hover:bg-[#6a4de6] transition-all"
            title="Copy text"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <span className="hidden sm:inline text-sm">Copy</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-white border-x-2 border-b-2 border-gray-200 rounded-b-2xl">
        <pre
          className="p-6 font-mono text-gray-800"
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: "1.6",
            whiteSpace: wordWrap ? "pre-wrap" : "pre",
            wordWrap: wordWrap ? "break-word" : "normal",
          }}
        >
          {content}
        </pre>
      </div>
    </div>
  );
};
