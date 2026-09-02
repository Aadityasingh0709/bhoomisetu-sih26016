export default function Card({ title, action, children, className = "" }) {
  return (
    <div className={`rounded-xl border border-ink-100 bg-white p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {title && <h3 className="text-sm font-semibold text-ink-700">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
