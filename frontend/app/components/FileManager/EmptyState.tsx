import React from "react";
import {
  Cloud,
  Upload,
  FileText,
  Image as ImageIcon,
  Lock,
  ShieldCheck,
  Plus,
} from "lucide-react";

interface EmptyStateProps {
  onUploadClick: () => void;
  onNewFolderClick: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onUploadClick,
  onNewFolderClick,
}) => {
  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center p-8 overflow-hidden">
      {/* 1. Background Dot Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.4]"
        style={{
          backgroundImage: `radial-gradient(#cfc5ff 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />

      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#7c5cff]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Glass Card */}
      <div className="relative z-10 w-full max-w-2xl">
        <div className="bg-white/40 backdrop-blur-sm border border-white/50 p-12 rounded-[3rem] shadow-xl shadow-slate-200/50 flex flex-col items-center">
          {/* Animated Illustration */}
          <div className="relative w-64 h-64 mb-6 flex items-center justify-center">
            {/* Floating Files */}
            <div className="absolute top-0 left-0 animate-[float_6s_ease-in-out_infinite]">
              <div className="bg-white p-4 rounded-2xl border border-indigo-50 shadow-lg shadow-[#7c5cff]/10 -rotate-12">
                <FileText className="w-8 h-8 text-orange-400" />
              </div>
            </div>

            <div className="absolute top-4 right-0 animate-[float_5s_ease-in-out_infinite_1s]">
              <div className="bg-white p-4 rounded-2xl border border-indigo-50 shadow-lg shadow-[#7c5cff]/10 rotate-12">
                <ImageIcon className="w-8 h-8 text-rose-400" />
              </div>
            </div>

            <div className="absolute bottom-8 -right-4 animate-[float_7s_ease-in-out_infinite_0.5s]">
              <div className="bg-white p-3 rounded-xl border border-indigo-50 shadow-lg shadow-[#7c5cff]/10 -rotate-6">
                <ShieldCheck className="w-6 h-6 text-green-500" />
              </div>
            </div>

            {/* Center Cloud */}
            <div className="relative z-10 group cursor-default">
              <div className="absolute inset-0 rounded-full border border-[#7c5cff]/20 scale-[1.3] group-hover:scale-[1.4] transition-transform duration-700" />
              <div className="absolute inset-0 rounded-full border border-[#7c5cff]/10 scale-[1.6] group-hover:scale-[1.7] transition-transform duration-1000" />

              <div className="w-32 h-32 bg-linear-to-br from-white to-[#f0edff] rounded-full shadow-2xl shadow-[#7c5cff]/20 flex items-center justify-center border border-white relative">
                <Cloud
                  className="w-14 h-14 text-[#7c5cff] fill-[#7c5cff]/5"
                  strokeWidth={1.5}
                />
                <div className="absolute -top-1 -right-1 bg-[#7c5cff] text-white p-2 rounded-full border-4 border-white shadow-sm">
                  <Lock className="w-3 h-3" />
                </div>
              </div>
            </div>

            {/* Curved Arrow SVG */}
            <svg
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 pointer-events-none opacity-30"
              viewBox="0 0 200 200"
            >
              <path
                d="M 30 70 Q 100 20 170 70"
                fill="none"
                stroke="#7c5cff"
                strokeWidth="2"
                strokeDasharray="6 6"
                className="animate-pulse"
              />
              <path
                d="M 170 70 L 160 60 M 170 70 L 175 60"
                fill="none"
                stroke="#7c5cff"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Text Content */}
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              Secure Cloud Storage
            </h2>
            <p className="text-gray-700 text-base max-w-sm mx-auto leading-relaxed">
              Your vault is empty. Upload files to encrypt and store them with
              zero-knowledge privacy.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-center w-full gap-4">
            <button
              onClick={onUploadClick}
              className="relative w-full max-w-[200px] py-3.5 bg-[#7c5cff] hover:bg-[#6b4ce6] text-white rounded-xl font-semibold shadow-lg shadow-[#7c5cff]/30 hover:shadow-[#7c5cff]/50 hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <span className="flex items-center justify-center gap-2">
                <Upload className="w-5 h-5" />
                Upload File
              </span>
            </button>

            {/* Visual Divider */}
            <div className="flex items-center gap-3 w-full justify-center opacity-50">
              <div className="h-px w-12 bg-gray-300"></div>
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                or
              </span>
              <div className="h-px w-12 bg-gray-300"></div>
            </div>

            {/* Secondary Action */}
            <button
              onClick={onNewFolderClick}
              className="text-gray-500 hover:text-[#7c5cff] text-sm font-medium flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-[#7c5cff]/5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create new folder
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(var(--tw-rotate)); }
          50% { transform: translateY(-15px) rotate(var(--tw-rotate)); }
        }
      `}</style>
    </div>
  );
};
