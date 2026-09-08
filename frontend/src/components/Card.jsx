export default function Card({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  className = "",
  hover = false,
  glass = false,
}) {
  return (
    <div
      className={`rounded-2xl border border-ink-100/80 p-5 transition-all duration-300 ${
        glass ? "glass-panel" : "bg-white shadow-card"
      } ${hover ? "hover:shadow-cardHover hover:-translate-y-0.5" : ""} ${className}`}
    >
      {(title || subtitle || action || Icon) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-50 text-ink-700">
                <Icon size={16} />
              </div>
            )}
            <div>
              {title && (
                <h3 className="text-sm font-bold tracking-tight text-ink-900">{title}</h3>
              )}
              {subtitle && (
                <p className="text-xs text-ink-400 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

