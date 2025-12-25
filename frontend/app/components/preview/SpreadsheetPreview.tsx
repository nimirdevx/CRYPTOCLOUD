import { useState, useEffect } from "react";
import * as XLSX from "xlsx";

interface SpreadsheetPreviewProps {
  previewUrl: string;
  filename: string;
}

type SheetData = (string | number | boolean | null)[][];

export const SpreadsheetPreview = ({
  previewUrl,
  filename,
}: SpreadsheetPreviewProps) => {
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>("");
  const [sheetData, setSheetData] = useState<SheetData>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);

  // Fetch and parse spreadsheet
  useEffect(() => {
    const fetchSpreadsheet = async () => {
      try {
        const response = await fetch(previewUrl);
        if (!response.ok) {
          throw new Error("Failed to load spreadsheet");
        }

        const arrayBuffer = await response.arrayBuffer();

        // Parse the file with xlsx
        const wb = XLSX.read(arrayBuffer, { type: "array" });

        setWorkbook(wb);
        setSheetNames(wb.SheetNames);

        // Set first sheet as active
        if (wb.SheetNames.length > 0) {
          const firstSheet = wb.SheetNames[0];
          setActiveSheet(firstSheet);
          loadSheetData(wb, firstSheet);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load spreadsheet"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSpreadsheet();
  }, [previewUrl]);

  const loadSheetData = (wb: XLSX.WorkBook, sheetName: string) => {
    const worksheet = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
    }) as SheetData;
    setSheetData(data);
  };

  const handleSheetChange = (sheetName: string) => {
    if (workbook) {
      setActiveSheet(sheetName);
      loadSheetData(workbook, sheetName);
    }
  };

  const handleZoomIn = () => setZoom(Math.min(150, zoom + 10));
  const handleZoomOut = () => setZoom(Math.max(60, zoom - 10));
  const handleResetZoom = () => setZoom(100);

  const exportToCSV = () => {
    if (!workbook) return;

    const worksheet = workbook.Sheets[activeSheet];
    const csv = XLSX.utils.sheet_to_csv(worksheet);

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeSheet}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#7c5cff] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading spreadsheet...</p>
          <p className="text-sm text-gray-500 mt-2">Parsing data</p>
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
            Failed to Load Spreadsheet
          </h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const rowCount = sheetData.length;
  const colCount =
    rowCount > 0 ? Math.max(...sheetData.map((row) => row.length)) : 0;

  return (
    <div className="flex flex-col h-full min-h-[400px]">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 bg-white border-2 border-gray-200 rounded-t-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Spreadsheet Icon */}
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>

            {/* Stats */}
            <div className="hidden sm:flex items-center gap-4">
              <div>
                <p className="text-xs text-gray-500">Rows</p>
                <p className="text-sm font-semibold text-gray-900">
                  {rowCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Columns</p>
                <p className="text-sm font-semibold text-gray-900">
                  {colCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Cells</p>
                <p className="text-sm font-semibold text-gray-900">
                  {rowCount * colCount}
                </p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 60}
              className="p-2 text-gray-600 hover:text-[#7c5cff] hover:bg-purple-50 rounded-lg transition-all disabled:opacity-50"
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
            >
              {zoom}%
            </button>

            <button
              onClick={handleZoomIn}
              disabled={zoom >= 150}
              className="p-2 text-gray-600 hover:text-[#7c5cff] hover:bg-purple-50 rounded-lg transition-all disabled:opacity-50"
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

            {/* Export Button */}
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-[#7c5cff] text-white rounded-lg font-semibold hover:bg-[#6a4de6] transition-all"
              title="Export to CSV"
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              <span className="hidden sm:inline text-sm">Export</span>
            </button>
          </div>
        </div>

        {/* Sheet Tabs */}
        {sheetNames.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {sheetNames.map((sheetName) => (
              <button
                key={sheetName}
                onClick={() => handleSheetChange(sheetName)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
                  activeSheet === sheetName
                    ? "bg-[#7c5cff] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {sheetName}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto bg-white border-x-2 border-b-2 border-gray-200 rounded-b-2xl">
        <div className="p-4">
          <div
            className="inline-block min-w-full"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top left",
              transition: "transform 0.2s ease",
            }}
          >
            <table className="border-collapse border border-gray-300 shadow-sm">
              <tbody>
                {sheetData.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={rowIndex === 0 ? "bg-gray-100" : ""}
                  >
                    {row.map((cell, colIndex) => (
                      <td
                        key={colIndex}
                        className={`border border-gray-300 px-3 py-2 text-sm ${
                          rowIndex === 0
                            ? "font-semibold text-gray-900"
                            : "text-gray-700"
                        }`}
                        style={{ minWidth: "100px" }}
                      >
                        {String(cell ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
