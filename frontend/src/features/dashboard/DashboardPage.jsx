import { useEffect, useState } from "react";
import { fetchDashboardSummary, fetchMapData } from "../../api/dashboard.js";
import StatCard from "../../components/StatCard.jsx";
import Card from "../../components/Card.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import ProgressBar from "../../components/ProgressBar.jsx";
import BottleneckChart from "../../components/ChartCard.jsx";
import MapView from "../../components/MapView.jsx";
import { formatDate } from "../../utils/status.js";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [mapPoints, setMapPoints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchDashboardSummary(), fetchMapData()])
      .then(([summaryData, map]) => {
        setSummary(summaryData);
        setMapPoints(map);
      })
      .catch(() => toast.error("Could not load dashboard data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-ink-300">Loading dashboard…</p>;
  if (!summary) return <p className="text-sm text-ink-300">No data available.</p>;

  const { totals, bottlenecks, delayedProjects, activeAlerts } = summary;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink-900">National Overview</h1>
        <p className="text-sm text-ink-300">
          {totals.total} projects tracked · average progress {totals.avgProgress}%
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total Projects" value={totals.total} accent="#0f2138" />
        <StatCard label="On Track" value={totals.onTrack} accent="#1c7a4d" />
        <StatCard label="At Risk" value={totals.atRisk} accent="#c17817" />
        <StatCard label="Delayed" value={totals.delayed} accent="#b6412c" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Project Locations" className="lg:col-span-2">
          <MapView points={mapPoints} />
        </Card>
        <BottleneckChart data={bottlenecks} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Projects Needing Attention">
          {delayedProjects.length === 0 ? (
            <p className="text-sm text-ink-300">No delayed or at-risk projects right now.</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {delayedProjects.map((p) => (
                <li key={p.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <Link to={`/projects/${p.id}`} className="text-sm font-medium text-ink-900 hover:text-ochre-600">
                      {p.name}
                    </Link>
                    <StatusBadge status={p.overallStatus} />
                  </div>
                  <p className="mt-0.5 text-xs text-ink-300">
                    {p.district}, {p.state} · Planned completion {formatDate(p.plannedCompletionDate)}
                  </p>
                  <div className="mt-2">
                    <ProgressBar value={p.overallProgress} status={p.overallStatus} size="sm" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Active Alerts">
          {activeAlerts.length === 0 ? (
            <p className="text-sm text-ink-300">No active alerts.</p>
          ) : (
            <ul className="space-y-3">
              {activeAlerts.map((a) => (
                <li key={a._id} className="rounded-lg border border-ink-100 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-ink-300">{a.type}</span>
                    <span
                      className={`text-xs font-semibold ${
                        a.severity === "High" ? "text-status-delayed" : "text-status-atRisk"
                      }`}
                    >
                      {a.severity}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink-900">{a.message}</p>
                  <p className="mt-1 text-xs text-ink-300">{a.project?.name}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
