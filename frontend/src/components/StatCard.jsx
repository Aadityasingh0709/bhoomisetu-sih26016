export default function StatCard({ label, value, sublabel, accent = "#0f2138" }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-300">{label}</p>
      <p className="mt-2 text-3xl font-bold data-figure" style={{ color: accent }}>
        {value}
      </p>
      {sublabel && <p className="mt-1 text-xs text-ink-300">{sublabel}</p>}
    </div>
  );
}
