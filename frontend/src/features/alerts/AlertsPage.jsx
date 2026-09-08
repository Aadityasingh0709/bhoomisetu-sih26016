import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { fetchAlerts, resolveAlert } from "../../api/alerts.js";
import Card from "../../components/Card.jsx";
import StatCard from "../../components/StatCard.jsx";
import {
  ShieldAlert,
  AlertTriangle,
  GitPullRequest,
  CheckCircle2,
  Clock,
  ExternalLink,
  Layers,
  Sparkles,
  Filter,
} from "lucide-react";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("All"); // "All" | "Bottleneck" | "Dependency"
  const [severityFilter, setSeverityFilter] = useState("All"); // "All" | "High" | "Medium"
  const [resolvingId, setResolvingId] = useState(null);

  const load = () => {
    setLoading(true);
    fetchAlerts({ resolved: false })
      .then(setAlerts)
      .catch(() => toast.error("Could not load alerts"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleResolve = async (id) => {
    setResolvingId(id);
    try {
      await resolveAlert(id);
      toast.success("Alert resolved successfully");
      setAlerts((prev) => prev.filter((a) => a._id !== id));
    } catch {
      toast.error("Could not resolve alert");
    } finally {
      setResolvingId(null);
    }
  };

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      const matchType = typeFilter === "All" || a.type === typeFilter;
      const matchSeverity = severityFilter === "All" || a.severity === severityFilter;
      return matchType && matchSeverity;
    });
  }, [alerts, typeFilter, severityFilter]);

  const bottleneckCount = alerts.filter((a) => a.type === "Bottleneck").length;
  const dependencyCount = alerts.filter((a) => a.type === "Dependency").length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black tracking-tight text-ink-900">
            Bottleneck &amp; Dependency Intelligence Center
          </h1>
          <span className="rounded-full bg-rose-100 border border-rose-300 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-800">
            Automated Logic
          </span>
        </div>
        <p className="text-xs font-medium text-ink-400 mt-0.5">
          Real-time algorithmic risk detection: flags departmental velocity stall and downstream chain cascade
        </p>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Unresolved"
          value={alerts.length}
          sublabel="Pending senior officer attention"
          accent="#0b1c2d"
          icon={ShieldAlert}
          active={typeFilter === "All"}
          onClick={() => setTypeFilter("All")}
        />
        <StatCard
          label="Bottleneck Alerts"
          value={bottleneckCount}
          sublabel="Pending cases > 20 and progress < 60%"
          accent="#dc2626"
          icon={AlertTriangle}
          active={typeFilter === "Bottleneck"}
          onClick={() => setTypeFilter(typeFilter === "Bottleneck" ? "All" : "Bottleneck")}
          trend="Departmental Stall"
          trendType="negative"
        />
        <StatCard
          label="Dependency Cascades"
          value={dependencyCount}
          sublabel="Upstream delay threatening downstream stage"
          accent="#d97706"
          icon={GitPullRequest}
          active={typeFilter === "Dependency"}
          onClick={() => setTypeFilter(typeFilter === "Dependency" ? "All" : "Dependency")}
          trend="Cross-Stage Risk"
          trendType="warning"
        />
      </div>

      {/* Algorithm Rules Callout */}
      <div className="rounded-2xl border border-ink-200/80 bg-white p-4 shadow-sm text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold text-ink-900">
          <Sparkles size={16} className="text-ochre-500" />
          <span>How BhoomiSetu Raises Intelligent Alerts (SIH PS 26016)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-ink-600">
          <div className="rounded-xl bg-ink-50/70 p-3 border border-ink-100">
            <span className="font-bold text-rose-800 block mb-0.5">1. Bottleneck Rule</span>
            <p className="text-[11px] leading-relaxed">
              When any individual department accumulates <strong>&gt;20 pending cases</strong> while overall progress is <strong>&lt;60%</strong>, a high-severity Bottleneck alert is raised.
            </p>
          </div>
          <div className="rounded-xl bg-ink-50/70 p-3 border border-ink-100">
            <span className="font-bold text-amber-800 block mb-0.5">2. Dependency Cascade Rule</span>
            <p className="text-[11px] leading-relaxed">
              Whenever an upstream stage (e.g. <em>Survey</em>) is delayed or at risk, the system automatically alerts downstream dependent departments (e.g. <em>Legal Verification</em>) before failure occurs.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 pb-3">
        <div className="flex items-center gap-2">
          {["All", "Bottleneck", "Dependency"].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                typeFilter === t
                  ? "bg-ink-900 text-white shadow-sm"
                  : "bg-white text-ink-600 hover:bg-ink-50 border border-ink-100"
              }`}
            >
              {t === "All" ? "All Alerts" : `${t} Alerts`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-400 font-medium">Severity:</span>
          {["All", "High", "Medium"].map((s) => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                severityFilter === s
                  ? "bg-ink-100 text-ink-900 font-bold border border-ink-300"
                  : "text-ink-500 hover:text-ink-900"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      <Card>
        {loading ? (
          <p className="py-8 text-center text-xs text-ink-400">Scanning system telemetry for alerts…</p>
        ) : filteredAlerts.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-2">
              <CheckCircle2 size={24} />
            </div>
            <p className="text-base font-bold text-ink-900">Zero Active Alerts</p>
            <p className="text-xs text-ink-400 mt-0.5">
              All departments and stages are currently operating within acceptable velocity parameters.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-ink-100">
            {filteredAlerts.map((a) => {
              const isBottleneck = a.type === "Bottleneck";
              return (
                <li
                  key={a._id}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between hover:bg-ink-50/50 p-3 rounded-xl transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                          isBottleneck
                            ? "bg-rose-100 text-rose-800 border border-rose-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {a.type}
                      </span>
                      <span
                        className={`text-xs font-bold ${
                          a.severity === "High" ? "text-rose-600" : "text-amber-600"
                        }`}
                      >
                        {a.severity} Priority
                      </span>
                      {a.department?.displayName && (
                        <span className="rounded bg-ink-100 px-2 py-0.5 text-[10px] font-bold text-ink-700">
                          {a.department.displayName}
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-bold text-ink-900 leading-snug">{a.message}</p>

                    <div className="flex items-center gap-2 text-xs text-ink-400 pt-0.5">
                      <span className="font-semibold text-ink-700">{a.project?.name}</span>
                      <span>·</span>
                      <span>
                        {a.project?.district}, {a.project?.state}
                      </span>
                      <span>·</span>
                      <Link
                        to={`/projects/${a.project?._id}`}
                        className="font-bold text-ochre-600 hover:underline inline-flex items-center gap-1"
                      >
                        Open Dossier <ExternalLink size={11} />
                      </Link>
                    </div>
                  </div>

                  <button
                    onClick={() => handleResolve(a._id)}
                    disabled={resolvingId === a._id}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-xs font-bold text-ink-700 shadow-sm hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-all disabled:opacity-60"
                  >
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span>{resolvingId === a._id ? "Resolving…" : "Mark Resolved"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

