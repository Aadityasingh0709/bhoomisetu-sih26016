export default function StatCard({
  label,
  value,
  sublabel,
  accent = "#0b1c2d",
  icon: Icon,
  trend,
  trendType = "neutral",
  onClick,
  active = false,
  className = "",
}) {
  const trendColors = {
    positive: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    negative: "bg-rose-50 text-rose-700 border-rose-200",
    neutral: "bg-ink-50 text-ink-600 border-ink-200",
  };

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border p-3.5 sm:p-5 transition-all duration-300 ${
        onClick ? "cursor-pointer select-none" : ""
      } ${
        active
          ? "border-ochre-500 bg-white ring-2 ring-ochre-500/20 shadow-glow"
          : "border-ink-100/90 bg-white shadow-card hover:shadow-cardHover hover:-translate-y-0.5"
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-1">
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-ink-400 truncate">{label}</p>
        {Icon && (
          <div
            className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl transition-colors duration-300"
            style={{
              backgroundColor: `${accent}12`,
              color: accent,
            }}
          >
            <Icon size={16} className="sm:w-[18px] sm:h-[18px]" />
          </div>
        )}
      </div>

      <div className="mt-2 sm:mt-3 flex flex-wrap items-baseline gap-1.5 sm:gap-2">
        <p className="text-2xl sm:text-3xl font-extrabold data-figure tracking-tight" style={{ color: accent }}>
          {value}
        </p>
        {trend && (
          <span
            className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] sm:text-[11px] font-semibold ${
              trendColors[trendType] || trendColors.neutral
            }`}
          >
            {trend}
          </span>
        )}
      </div>

      {sublabel && (
        <p className="mt-1 text-[11px] sm:text-xs text-ink-400 font-medium line-clamp-1 sm:line-clamp-none">{sublabel}</p>
      )}

      {/* Subtle bottom accent line */}
      <div
        className="absolute bottom-0 left-0 h-1 w-full opacity-75 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: accent }}
      />
    </div>
  );
}

