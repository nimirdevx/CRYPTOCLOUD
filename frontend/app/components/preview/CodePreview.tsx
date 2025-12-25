import { useState, useEffect } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  vscDarkPlus,
  vs,
} from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodePreviewProps {
  previewUrl: string;
  filename: string;
}

export const CodePreview = ({ previewUrl, filename }: CodePreviewProps) => {
  const [code, setCode] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [copied, setCopied] = useState(false);

  // Detect language from file extension
  const getLanguage = (filename: string): string => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";

    const languageMap: Record<string, string> = {
      js: "javascript",
      jsx: "jsx",
      ts: "typescript",
      tsx: "tsx",
      py: "python",
      java: "java",
      cpp: "cpp",
      c: "c",
      h: "c",
      cs: "csharp",
      php: "php",
      rb: "ruby",
      go: "go",
      rs: "rust",
      swift: "swift",
      kt: "kotlin",
      css: "css",
      scss: "scss",
      sass: "sass",
      less: "less",
      html: "html",
      xml: "xml",
      json: "json",
      yaml: "yaml",
      yml: "yaml",
      md: "markdown",
      sql: "sql",
      sh: "bash",
      bash: "bash",
      zsh: "bash",
      ps1: "powershell",
      r: "r",
      dart: "dart",
      lua: "lua",
      vim: "vim",
      diff: "diff",
      dockerfile: "dockerfile",
    };

    return languageMap[ext] || "text";
  };

  const language = getLanguage(filename);

  // Fetch code content
  useEffect(() => {
    const fetchCode = async () => {
      try {
        const response = await fetch(previewUrl);
        if (!response.ok) {
          throw new Error("Failed to load file");
        }
        const text = await response.text();
        setCode(text);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load code");
      } finally {
        setLoading(false);
      }
    };

    fetchCode();
  }, [previewUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getLineCount = () => {
    return code.split("\n").length;
  };

  const getFileSize = () => {
    const bytes = new Blob([code]).size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#7c5cff] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading code...</p>
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
            Failed to Load Code
          </h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-[400px]">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white border-2 border-gray-200 rounded-t-2xl p-4 shadow-sm">
        <div className="flex items-center gap-4">
          {/* Language Badge */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">
                Language
              </p>
              <p className="text-sm font-bold text-gray-900">{language}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="hidden sm:flex items-center gap-4 pl-4 border-l-2 border-gray-200">
            <div>
              <p className="text-xs text-gray-500">Lines</p>
              <p className="text-sm font-semibold text-gray-900">
                {getLineCount()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Size</p>
              <p className="text-sm font-semibold text-gray-900">
                {getFileSize()}
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 text-gray-600 hover:text-[#7c5cff] hover:bg-purple-50 rounded-lg transition-all"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            {theme === "dark" ? (
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
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
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
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              copied
                ? "bg-green-500 text-white"
                : "bg-[#7c5cff] text-white hover:bg-[#6a4de6]"
            }`}
            title="Copy code"
          >
            {copied ? (
              <>
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-sm">Copied!</span>
              </>
            ) : (
              <>
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
                <span className="text-sm">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Editor */}
      <div className="flex-1 overflow-auto bg-white border-x-2 border-b-2 border-gray-200 rounded-b-2xl">
        <SyntaxHighlighter
          language={language}
          style={theme === "dark" ? vscDarkPlus : vs}
          showLineNumbers={true}
          wrapLines={true}
          customStyle={{
            margin: 0,
            padding: "1.5rem",
            fontSize: "0.875rem",
            lineHeight: "1.5",
            borderRadius: "0 0 1rem 1rem",
          }}
          lineNumberStyle={{
            minWidth: "3em",
            paddingRight: "1em",
            color: theme === "dark" ? "#6e7681" : "#bbb",
            userSelect: "none",
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};
