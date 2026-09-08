import { statusMeta } from "../utils/status.js";

export default function ProgressBar({
  value = 0,
  status = "OnTrack",
  size = "md",
  showLabel = false,
  className = "",
}) {
  const meta = statusMeta(status);
  const clamped = Math.min(100, Math.max(0, Math.round(value)));

  const height =
    size === "xs"
      ? "h-1.5"
      : size === "sm"
      ? "h-2"
      : size === "lg"
      ? "h-3.5"
      : "h-2.5";

  // Dynamic gradient based on status
  const gradientMap = {
    OnTrack: "from-emerald-500 to-teal-600",
    AtRisk: "from-amber-500 to-orange-600",
    Delayed: "from-rose-500 to-red-600",
    Completed: "from-blue-600 to-indigo-600",
    NotStarted: "from-slate-400 to-slate-500",
  };

  const gradientClass = gradientMap[status] || "from-ochre-500 to-amber-600";

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="mb-1 flex justify-between text-xs">
          <span className="font-medium text-ink-600">Progress</span>
          <span className="data-figure font-bold text-ink-900">{clamped}%</span>
        </div>
      )}
      <div className={`w-full ${height} rounded-full bg-ink-100/90 overflow-hidden shadow-inner`}>
        <div
          className={`${height} rounded-full bg-gradient-to-r ${gradientClass} transition-all duration-700 ease-out`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

