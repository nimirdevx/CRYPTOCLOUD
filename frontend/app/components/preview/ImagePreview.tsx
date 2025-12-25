import { useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

interface ImagePreviewProps {
  previewUrl: string;
  filename: string;
  rotation: number;
}

export const ImagePreview = ({
  previewUrl,
  filename,
  rotation,
}: ImagePreviewProps) => {
  const [isLoading, setIsLoading] = useState(true);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className="w-full h-full flex items-center justify-center relative">
      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#7c5cff]"></div>
        </div>
      )}

      {/* Zoom/Pan Wrapper */}
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={4}
        centerOnInit
        wheel={{ step: 0.1 }}
        limitToBounds={false}
        centerZoomedOut={true}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Zoom Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-10 bg-white rounded-lg shadow-lg p-2">
              <button
                onClick={() => zoomIn()}
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
                onClick={() => resetTransform()}
                className="p-2 text-gray-600 hover:text-[#7c5cff] hover:bg-purple-50 rounded-lg transition-all text-xs font-semibold"
                title="Reset Zoom"
              >
                1:1
              </button>
              <button
                onClick={() => zoomOut()}
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

            {/* Image with Pan/Zoom */}
            <TransformComponent
              wrapperClass="w-full h-full"
              wrapperStyle={{
                width: "100%",
                height: "100%",
              }}
              contentStyle={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "100%",
                minHeight: "100%",
              }}
            >
              <img
                src={previewUrl}
                alt={filename}
                onLoad={handleImageLoad}
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: "transform 0.3s ease",
                  maxWidth: "100%",
                  maxHeight: "100%",
                  width: "auto",
                  height: "auto",
                  display: "block",
                }}
                className="object-contain rounded-xl shadow-2xl border-2 border-gray-200"
              />
            </TransformComponent>
          </>
        )}
      </TransformWrapper>

      {/* Hint Text */}
      {!isLoading && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-sm px-4 py-2 rounded-lg pointer-events-none">
          Scroll to zoom • Drag to pan
        </div>
      )}
    </div>
  );
};
