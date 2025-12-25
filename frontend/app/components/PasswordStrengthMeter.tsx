"use client";

import React, { useMemo } from "react";
import zxcvbn from "zxcvbn";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface PasswordStrengthMeterProps {
  password: string;
  showFeedback?: boolean;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password,
  showFeedback = true,
}) => {
  const result = useMemo(() => {
    if (!password) {
      return null;
    }
    return zxcvbn(password);
  }, [password]);

  if (!password || !result) {
    return null;
  }

  const score = result.score; // 0-4 (0: too weak, 4: very strong)

  // Strength labels and colors
  const strengthConfig = {
    0: {
      label: "Very Weak",
      color: "bg-red-500",
      textColor: "text-red-600",
      width: "w-1/5",
    },
    1: {
      label: "Weak",
      color: "bg-orange-500",
      textColor: "text-orange-600",
      width: "w-2/5",
    },
    2: {
      label: "Fair",
      color: "bg-yellow-500",
      textColor: "text-yellow-600",
      width: "w-3/5",
    },
    3: {
      label: "Strong",
      color: "bg-green-500",
      textColor: "text-green-600",
      width: "w-4/5",
    },
    4: {
      label: "Very Strong",
      color: "bg-emerald-500",
      textColor: "text-emerald-600",
      width: "w-full",
    },
  };

  const strength = strengthConfig[score as keyof typeof strengthConfig];

  return (
    <div className="mt-3 space-y-3">
      {/* Strength Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600">
            Password Strength
          </span>
          <span className={`text-xs font-semibold ${strength.textColor}`}>
            {strength.label}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${strength.color} transition-all duration-300 ease-out ${strength.width}`}
          />
        </div>
      </div>

      {/* Feedback and Requirements */}
      {showFeedback && (
        <div className="space-y-2">
          {/* zxcvbn Feedback */}
          {result.feedback.warning && (
            <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{result.feedback.warning}</span>
            </div>
          )}

          {result.feedback.suggestions.length > 0 && (
            <div className="flex items-start gap-2 text-xs text-blue-600 bg-blue-50 p-2 rounded-lg">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="space-y-1">
                {result.feedback.suggestions.map((suggestion, index) => (
                  <div key={index}>{suggestion}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Estimated Crack Time */}
      {score >= 3 && (
        <div className="text-xs text-gray-500 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
          <span>
            Estimated crack time:{" "}
            <span className="font-medium text-gray-700">
              {result.crack_times_display.offline_slow_hashing_1e4_per_second}
            </span>
          </span>
        </div>
      )}
    </div>
  );
};
