// Single source of truth for status -> color/label mapping, used by
// badges, progress bars, and map pins so the whole app stays consistent.
export const STATUS_META = {
  OnTrack: { label: "On Track", color: "#1c7a4d", bg: "#e7f5ec" },
  AtRisk: { label: "At Risk", color: "#c17817", bg: "#fbf1e2" },
  Delayed: { label: "Delayed", color: "#b6412c", bg: "#fbeae6" },
  Completed: { label: "Completed", color: "#2f5f8a", bg: "#e8eff5" },
  NotStarted: { label: "Not Started", color: "#6b7a8c", bg: "#eef1f4" },
};

export const statusMeta = (status) => STATUS_META[status] || STATUS_META.NotStarted;

export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }) : "—";

export const formatINR = (n) =>
  n === undefined || n === null
    ? "—"
    : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
