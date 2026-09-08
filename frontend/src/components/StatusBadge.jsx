import { statusMeta } from "../utils/status.js";

export default function StatusBadge({ status, size = "md", pulse = true }) {
  const meta = statusMeta(status);
  const isPulsing = pulse && (status === "AtRisk" || status === "Delayed");

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-[11px] gap-1"
      : size === "lg"
      ? "px-3 py-1.5 text-sm gap-2"
      : "px-2.5 py-1 text-xs gap-1.5";

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold border transition-colors shadow-sm ${sizeClasses}`}
      style={{
        color: meta.color,
        backgroundColor: meta.bg,
        borderColor: `${meta.color}30`,
      }}
    >
      <span className="relative flex h-2 w-2">
        {isPulsing && (
          <span
            className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
            style={{ backgroundColor: meta.color }}
          />
        )}
        <span
          className="relative inline-flex h-2 w-2 rounded-full"
          style={{ backgroundColor: meta.color }}
        />
      </span>
      <span>{meta.label}</span>
    </span>
  );
}

