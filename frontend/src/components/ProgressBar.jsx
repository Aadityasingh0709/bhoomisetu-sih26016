import { statusMeta } from "../utils/status.js";

export default function ProgressBar({ value = 0, status = "OnTrack", size = "md" }) {
  const meta = statusMeta(status);
  const height = size === "sm" ? "h-1.5" : "h-2.5";
  return (
    <div className="w-full">
      <div className={`w-full ${height} rounded-full bg-ink-100 overflow-hidden`}>
        <div
          className={`${height} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: meta.color }}
        />
      </div>
    </div>
  );
}
