import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFPreviewProps {
  previewUrl: string;
  filename: string;
}

export const PDFPreview = ({ previewUrl, filename }: PDFPreviewProps) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfScale, setPdfScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  };

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages || 1));
  };

  const zoomIn = () => {
    setPdfScale((prev) => Math.min(prev + 0.2, 3.0));
  };

  const zoomOut = () => {
    setPdfScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const resetZoom = () => {
    setPdfScale(1.0);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full relative">
      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#7c5cff]"></div>
        </div>
      )}

      {/* PDF Controls */}
      {!isLoading && (
        <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-2 flex flex-col gap-2">
          {/* Zoom Controls */}
          <button
            onClick={zoomIn}
            className="p-2 text-gray-600 hover:text-[#7c5cff] hover:bg-purple-50 rounded-lg transition-all"
            title="Zoom In"
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
          <button
            onClick={resetZoom}
            className="p-2 text-gray-600 hover:text-[#7c5cff] hover:bg-purple-50 rounded-lg transition-all text-xs font-semibold"
            title="Reset Zoom"
          >
            {Math.round(pdfScale * 100)}%
          </button>
          <button
            onClick={zoomOut}
            className="p-2 text-gray-600 hover:text-[#7c5cff] hover:bg-purple-50 rounded-lg transition-all"
            title="Zoom Out"
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
        </div>
      )}

      {/* PDF Document */}
      <Document
        file={previewUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={null}
        error={
          <div className="text-center bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Failed to Load PDF
            </h3>
            <p className="text-gray-600">
              There was an error loading the PDF file.
            </p>
          </div>
        }
      >
        <Page
          pageNumber={pageNumber}
          scale={pdfScale}
          renderTextLayer={true}
          renderAnnotationLayer={true}
          className="shadow-2xl"
        />
      </Document>

      {/* Page Navigation */}
      {!isLoading && numPages && numPages > 1 && (
        <div className="mt-6 flex items-center gap-4 bg-white rounded-lg shadow-lg px-6 py-3">
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="p-2 text-gray-600 hover:text-[#7c5cff] hover:bg-purple-50 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            title="Previous Page"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <span className="text-sm font-semibold text-gray-700 min-w-[100px] text-center">
            Page {pageNumber} of {numPages}
          </span>

          <button
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            className="p-2 text-gray-600 hover:text-[#7c5cff] hover:bg-purple-50 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            title="Next Page"
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};
