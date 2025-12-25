interface UnsupportedPreviewProps {
  fileExtension: string;
}

export const UnsupportedPreview = ({
  fileExtension,
}: UnsupportedPreviewProps) => {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-10 h-10 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Preview Not Available
        </h3>
        <p className="text-[1rem] text-gray-600 mb-1">
          This file type cannot be previewed in the browser.
        </p>
        <p className="text-sm text-gray-500">
          File type: <span className="font-semibold">.{fileExtension}</span>
        </p>
      </div>
    </div>
  );
};
