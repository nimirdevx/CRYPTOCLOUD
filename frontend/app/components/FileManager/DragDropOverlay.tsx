import React from "react";
import { Upload, Lock, ShieldCheck } from "lucide-react";

interface DragDropOverlayProps {
  isDragging: boolean;
}

export const DragDropOverlay: React.FC<DragDropOverlayProps> = ({
  isDragging,
}) => {
  if (!isDragging) return null;

  return (
    <div className="absolute inset-0 z-100 bg-white/80 backdrop-blur-xl transition-all duration-300 animate-in fade-in zoom-in-95 flex items-center justify-center rounded-3xl">
      {/* 1. Active Drop Border (The 'Zone') */}
      <div className="absolute inset-4 rounded-[2.5rem] border-[6px] border-dashed border-[#7c5cff] bg-[#7c5cff]/5 animate-pulse-slow" />

      {/* 2. Floating Security Particles */}
      <div className="absolute top-1/4 left-1/4 animate-bounce-slow opacity-60">
        <div className="bg-white p-4 rounded-2xl shadow-xl shadow-[#7c5cff]/10 border border-[#7c5cff]/20">
          <ShieldCheck className="w-8 h-8 text-[#7c5cff]" />
        </div>
      </div>

      <div className="absolute bottom-1/4 right-1/4 animate-bounce-delayed opacity-60">
        <div className="bg-white p-4 rounded-2xl shadow-xl shadow-[#7c5cff]/10 border border-[#7c5cff]/20">
          <Lock className="w-8 h-8 text-[#7c5cff]" />
        </div>
      </div>

      {/* 3. Central Call to Action */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Glow effect behind the card */}
        <div className="absolute inset-0 bg-[#7c5cff] blur-3xl opacity-20 rounded-full scale-150" />

        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-[#7c5cff]/20 flex flex-col items-center border border-white/50 relative animate-bounce-subtle">
          <div className="bg-[#7c5cff] p-6 rounded-2xl mb-6 shadow-lg shadow-[#7c5cff]/30">
            <Upload className="w-12 h-12 text-white" />
          </div>

          <h3 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
            Release to Encrypt
          </h3>
          <p className="text-[#7c5cff] font-medium text-lg">
            Your files will be secured instantly
          </p>
        </div>
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes bounce-delayed {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes bounce-subtle {
           0%, 100% { transform: scale(1); }
           50% { transform: scale(1.05); }
        }
        .animate-pulse-slow { animation: pulse-slow 3s infinite; }
        .animate-bounce-slow { animation: bounce-slow 3s infinite ease-in-out; }
        .animate-bounce-delayed { animation: bounce-delayed 3.5s infinite ease-in-out 0.5s; }
        .animate-bounce-subtle { animation: bounce-subtle 2s infinite ease-in-out; }
      `}</style>
    </div>
  );
};
