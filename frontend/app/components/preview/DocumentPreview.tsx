import { useState, useEffect } from "react";
import mammoth from "mammoth";

interface DocumentPreviewProps {
  previewUrl: string;
  filename: string;
}

export const DocumentPreview = ({
  previewUrl,
  filename,
}: DocumentPreviewProps) => {
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);

  // Fetch and convert Word document
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await fetch(previewUrl);
        if (!response.ok) {
          throw new Error("Failed to load document");
        }

        const arrayBuffer = await response.arrayBuffer();

        // Convert Word document to HTML using mammoth
        const result = await mammoth.convertToHtml(
          { arrayBuffer },
          {
            styleMap: [
              "p[style-name='Heading 1'] => h1:fresh",
              "p[style-name='Heading 2'] => h2:fresh",
              "p[style-name='Heading 3'] => h3:fresh",
              "p[style-name='Title'] => h1.title:fresh",
            ],
          }
        );

        setHtmlContent(result.value);

        // Log any warnings from mammoth
        if (result.messages.length > 0) {
          console.warn("Mammoth conversion warnings:", result.messages);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load document"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [previewUrl]);

  const handleZoomIn = () => setZoom(Math.min(200, zoom + 10));
  const handleZoomOut = () => setZoom(Math.max(50, zoom - 10));
  const handleResetZoom = () => setZoom(100);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#7c5cff] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document...</p>
          <p className="text-sm text-gray-500 mt-2">
            Converting to readable format
          </p>
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
            Failed to Load Document
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
        <div className="flex items-center gap-3">
          {/* Document Icon */}
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-blue-600"
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

          {/* Title */}
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase">
              Word Document
            </p>
            <p
              className="text-sm font-bold text-gray-900 truncate max-w-[200px]"
              title={filename}
            >
              {filename}
            </p>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 50}
            className="p-2 text-gray-600 hover:text-[#7c5cff] hover:bg-purple-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom out"
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
              />
            </svg>
          </button>

          <button
            onClick={handleResetZoom}
            className="px-3 py-1 text-sm font-semibold text-gray-700 hover:text-[#7c5cff] hover:bg-purple-50 rounded-lg transition-all min-w-16"
            title="Reset zoom"
          >
            {zoom}%
          </button>

          <button
            onClick={handleZoomIn}
            disabled={zoom >= 200}
            className="p-2 text-gray-600 hover:text-[#7c5cff] hover:bg-purple-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom in"
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Document Content */}
      <div className="flex-1 overflow-auto bg-gray-50 border-x-2 border-b-2 border-gray-200 rounded-b-2xl">
        <div className="p-8 max-w-4xl mx-auto">
          <div
            className="bg-white shadow-lg rounded-lg p-8 sm:p-12"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top center",
              transition: "transform 0.2s ease",
            }}
          >
            <div
              className="prose prose-slate max-w-none
                prose-headings:font-bold prose-headings:text-gray-900
                prose-h1:text-3xl prose-h1:mb-4 prose-h1:mt-0
                prose-h2:text-2xl prose-h2:mb-3 prose-h2:mt-6
                prose-h3:text-xl prose-h3:mb-2 prose-h3:mt-4
                prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
                prose-strong:text-gray-900 prose-strong:font-semibold
                prose-em:text-gray-700 prose-em:italic
                prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4
                prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-4
                prose-li:text-gray-700 prose-li:mb-1
                prose-a:text-[#7c5cff] prose-a:no-underline hover:prose-a:underline
                prose-blockquote:border-l-4 prose-blockquote:border-[#7c5cff] prose-blockquote:pl-4 prose-blockquote:italic
                prose-code:text-sm prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-lg
                prose-img:rounded-lg prose-img:shadow-md
                prose-table:border-collapse prose-table:w-full
                prose-th:bg-gray-100 prose-th:p-2 prose-th:border prose-th:border-gray-300
                prose-td:p-2 prose-td:border prose-td:border-gray-300"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
