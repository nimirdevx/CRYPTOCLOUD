"use client";

import { useState } from "react";

interface BackupCodesModalProps {
  codes: string[];
  onClose: () => void;
}

export default function BackupCodesModal({
  codes,
  onClose,
}: BackupCodesModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const codesText = codes.join("\n");
    navigator.clipboard.writeText(codesText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="glass p-8 rounded-2xl shadow-2xl max-w-2xl w-full border-2 border-indigo-500/30 animate-slide-up">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-indigo-500/20 rounded-xl flex items-center justify-center shrink-0">
            <svg
              className="w-8 h-8 text-indigo-400"
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
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">Your Backup Codes</h2>
            <p className="text-gray-400 text-sm mt-1">
              Save these codes somewhere safe
            </p>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-yellow-400 shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <h3 className="text-white font-semibold mb-1">
                Important: Save these codes now!
              </h3>
              <p className="text-gray-300 text-sm">
                You will only see these backup codes once. Each code can be used
                only one time as an alternative to your 6-digit authenticator
                code. Store them in a safe place.
              </p>
            </div>
          </div>
        </div>

        {/* Codes Display */}
        <div className="bg-gray-700/30 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-2 gap-3">
            {codes.map((code, index) => (
              <div
                key={index}
                className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 border border-gray-600 flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-indigo-400 font-bold text-sm">
                    {index + 1}
                  </span>
                </div>
                <div className="font-mono text-white text-lg tracking-wider">
                  {code}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            className="flex-1 px-6 py-3 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 group"
          >
            {copied ? (
              <>
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5 group-hover:scale-110 transition-transform"
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
                Copy All Codes
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2"
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
                d="M5 13l4 4L19 7"
              />
            </svg>
            I've Saved These Codes
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-6 bg-gray-700/20 rounded-lg p-4 border border-gray-600/50">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-gray-400 shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-gray-400 text-sm">
              <strong className="text-gray-300">Pro tip:</strong> Print these
              codes or save them in a password manager. They can help you regain
              access to your account if you lose your authenticator device.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
