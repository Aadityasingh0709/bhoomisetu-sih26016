import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchAlerts, resolveAlert } from "../../api/alerts.js";
import Card from "../../components/Card.jsx";
import { CheckCircle2 } from "lucide-react";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    fetchAlerts({ resolved: false })
      .then(setAlerts)
      .catch(() => toast.error("Could not load alerts"))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const handleResolve = async (id) => {
    try {
      await resolveAlert(id);
      toast.success("Alert resolved");
      setAlerts((prev) => prev.filter((a) => a._id !== id));
    } catch {
      toast.error("Could not resolve alert");
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-ink-900">Bottleneck &amp; Dependency Alerts</h1>
        <p className="text-sm text-ink-300">
          Automatically generated when a department stalls or a delay threatens downstream stages.
        </p>
      </div>

      <Card>
        {loading ? (
          <p className="text-sm text-ink-300">Loading…</p>
        ) : alerts.length === 0 ? (
          <p className="text-sm text-ink-300">No active alerts. Everything is on track.</p>
        ) : (
          <ul className="divide-y divide-ink-100">
            {alerts.map((a) => (
              <li key={a._id} className="flex items-start justify-between gap-4 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-ink-50 px-2 py-0.5 text-xs font-semibold text-ink-500">
                      {a.type}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        a.severity === "High" ? "text-status-delayed" : "text-status-atRisk"
                      }`}
                    >
                      {a.severity} severity
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-ink-900">{a.message}</p>
                  <p className="mt-1 text-xs text-ink-300">
                    {a.project?.name} · {a.project?.district}, {a.project?.state}
                  </p>
                </div>
                <button
                  onClick={() => handleResolve(a._id)}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-ink-100 px-3 py-1.5 text-xs font-medium text-ink-500 hover:bg-ink-50"
                >
                  <CheckCircle2 size={14} />
                  Mark resolved
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
