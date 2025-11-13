interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: "indigo" | "purple" | "green" | "yellow";
  text?: string;
  subtext?: string;
}

export default function LoadingSpinner({
  size = "md",
  color = "indigo",
  text,
  subtext,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const colorClasses = {
    indigo: "border-indigo-500/30 border-t-indigo-500",
    purple: "border-purple-500/30 border-t-purple-500",
    green: "border-green-500/30 border-t-green-500",
    yellow: "border-yellow-500/30 border-t-yellow-500",
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`${sizeClasses[size]} border-4 ${colorClasses[color]} rounded-full animate-spin`}
      ></div>
      {text && (
        <div className="text-center">
          <p className="text-lg font-semibold text-white">{text}</p>
          {subtext && <p className="text-sm text-gray-400 mt-1">{subtext}</p>}
        </div>
      )}
    </div>
  );
}
