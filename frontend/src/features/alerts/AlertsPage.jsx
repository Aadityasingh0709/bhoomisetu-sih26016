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
  Scale,
  FileText,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  X,
} from "lucide-react";

export default function AlertsPage() {
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [resolvedAlerts, setResolvedAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState("active"); // "active" | "resolved"
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("All"); // "All" | "Bottleneck" | "Dependency"
  const [severityFilter, setSeverityFilter] = useState("All"); // "All" | "High" | "Medium"

  // Resolution modal state
  const [resolveTargetAlert, setResolveTargetAlert] = useState(null);
  const [resolveNotes, setResolveNotes] = useState("");
  const [submittingResolve, setSubmittingResolve] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetchAlerts({ resolved: false }),
      fetchAlerts({ resolved: true }),
    ])
      .then(([active, resolved]) => {
        setActiveAlerts(active);
        setResolvedAlerts(resolved);
      })
      .catch(() => toast.error("Could not load alerts"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleOpenResolveModal = (alert) => {
    setResolveTargetAlert(alert);
    setResolveNotes("");
  };

  const handleConfirmResolve = async (e) => {
    e.preventDefault();
    if (!resolveTargetAlert) return;
    setSubmittingResolve(true);
    try {
      const updated = await resolveAlert(resolveTargetAlert._id, {
        resolutionNotes: resolveNotes,
      });
      toast.success("Bottleneck resolved and recorded in project dossier");
      setActiveAlerts((prev) => prev.filter((a) => a._id !== resolveTargetAlert._id));
      setResolvedAlerts((prev) => [updated, ...prev]);
      setResolveTargetAlert(null);
    } catch {
      toast.error("Could not resolve alert");
    } finally {
      setSubmittingResolve(false);
    }
  };

  // Filtered alerts
  const currentAlertList = activeTab === "active" ? activeAlerts : resolvedAlerts;
  const filteredAlerts = useMemo(() => {
    return currentAlertList.filter((a) => {
      const matchType = typeFilter === "All" || a.type === typeFilter;
      const matchSeverity = severityFilter === "All" || a.severity === severityFilter;
      return matchType && matchSeverity;
    });
  }, [currentAlertList, typeFilter, severityFilter]);

  const bottleneckCount = activeAlerts.filter((a) => a.type === "Bottleneck").length;
  const dependencyCount = activeAlerts.filter((a) => a.type === "Dependency").length;

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
          value={activeAlerts.length}
          sublabel="Pending senior officer attention"
          accent="#0b1c2d"
          icon={ShieldAlert}
          active={activeTab === "active" && typeFilter === "All"}
          onClick={() => {
            setActiveTab("active");
            setTypeFilter("All");
          }}
        />
        <StatCard
          label="Bottleneck Alerts"
          value={bottleneckCount}
          sublabel="Pending cases > 20 and progress < 60%"
          accent="#dc2626"
          icon={AlertTriangle}
          active={activeTab === "active" && typeFilter === "Bottleneck"}
          onClick={() => {
            setActiveTab("active");
            setTypeFilter(typeFilter === "Bottleneck" ? "All" : "Bottleneck");
          }}
          trend="Departmental Stall"
          trendType="negative"
        />
        <StatCard
          label="Dependency Cascades"
          value={dependencyCount}
          sublabel="Upstream delay threatening downstream stage"
          accent="#d97706"
          icon={GitPullRequest}
          active={activeTab === "active" && typeFilter === "Dependency"}
          onClick={() => {
            setActiveTab("active");
            setTypeFilter(typeFilter === "Dependency" ? "All" : "Dependency");
          }}
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

      {/* Active vs Resolved Tab Switcher */}
      <div className="flex border-b border-ink-200">
        <button
          onClick={() => setActiveTab("active")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition-all ${
            activeTab === "active"
              ? "border-ochre-500 text-ochre-600 bg-ochre-50/30"
              : "border-transparent text-ink-500 hover:text-ink-900"
          }`}
        >
          <ShieldAlert size={15} />
          <span>Active Telemetry Alerts</span>
          <span className="rounded-full bg-rose-100 text-rose-800 px-2 py-0.5 text-[10px] font-mono font-bold">
            {activeAlerts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("resolved")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition-all ${
            activeTab === "resolved"
              ? "border-ochre-500 text-ochre-600 bg-ochre-50/30"
              : "border-transparent text-ink-500 hover:text-ink-900"
          }`}
        >
          <CheckCircle2 size={15} />
          <span>Resolved Bottlenecks &amp; Audit Trail</span>
          <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-mono font-bold">
            {resolvedAlerts.length}
          </span>
        </button>
      </div>

      {/* Filter Bar */}
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
              {t === "All" ? "All Types" : `${t} Alerts`}
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
            <p className="text-base font-bold text-ink-900">
              {activeTab === "active" ? "Zero Active Alerts" : "No Resolved Records Found"}
            </p>
            <p className="text-xs text-ink-400 mt-0.5">
              {activeTab === "active"
                ? "All departments and stages are currently operating within acceptable velocity parameters."
                : "When bottleneck alerts are resolved, their resolution notes and audit records will appear here."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-ink-100">
            {filteredAlerts.map((a) => {
              const isBottleneck = a.type === "Bottleneck";
              return (
                <li
                  key={a._id}
                  className="flex flex-col gap-3 py-4 hover:bg-ink-50/50 p-4 rounded-2xl transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
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
                      {a.isResolved && (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          <CheckCircle2 size={10} />
                          <span>Resolved</span>
                        </span>
                      )}
                    </div>

                    {/* Action button for active alerts */}
                    {!a.isResolved && (
                      <button
                        onClick={() => handleOpenResolveModal(a)}
                        className="flex shrink-0 items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3.5 py-1.5 text-xs font-bold text-ink-700 shadow-sm hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-all"
                      >
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        <span>Resolve Bottleneck</span>
                      </button>
                    )}
                  </div>

                  <p className="text-sm font-bold text-ink-900 leading-snug">{a.message}</p>

                  {/* Highlighted Resolution Note for Resolved Alerts */}
                  {a.isResolved && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                        <ShieldCheck size={14} className="text-emerald-700" />
                        <span>How He Resolved This Bottleneck (Official Note):</span>
                      </div>
                      <p className="text-emerald-950 font-medium pl-5 leading-relaxed">
                        {a.resolutionNotes || "Bottleneck cleared following departmental milestone review and backlog clearance."}
                      </p>
                      <div className="flex items-center gap-2 pt-1 text-[11px] text-emerald-800 pl-5">
                        <span>Resolved by: <strong>{a.resolvedBy?.name || "Assigned Officer"}</strong></span>
                        <span>·</span>
                        <span>On: {new Date(a.resolvedAt || a.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}

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
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Resolution Prompt Modal */}
      {resolveTargetAlert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm"
          onClick={() => !submittingResolve && setResolveTargetAlert(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-5 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                  <CheckCircle2 size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base font-black">Resolve Bottleneck Alert</h2>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    Document how this bottleneck or dispute was resolved
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResolveTargetAlert(null)}
                className="rounded-lg p-1 text-emerald-200 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmResolve} className="p-6 space-y-4">
              {/* Alert context */}
              <div className="rounded-xl border border-ink-100 bg-ink-50 p-3 text-xs space-y-1">
                <div className="flex items-center justify-between text-ink-400 font-medium">
                  <span>{resolveTargetAlert.department?.displayName || "Department Stage"}</span>
                  <span className="font-bold text-rose-600">{resolveTargetAlert.severity} Priority</span>
                </div>
                <p className="font-bold text-ink-800">{resolveTargetAlert.message}</p>
                <p className="text-ink-500 text-[11px]">{resolveTargetAlert.project?.name}</p>
              </div>

              {/* Resolution narrative textarea */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-ink-700 mb-1">
                  How Did You Resolve This Bottleneck / Dispute? <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="Explain the corrective action taken to unblock progress: e.g. Conducted joint hearing with Tahsildar, settled landowner objections, cleared pending compensation backlog under Section 28, or released administrative clearances..."
                  className="input resize-none text-xs font-medium border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500 bg-emerald-50/20"
                />
                <p className="text-[10px] text-ink-400 mt-1">
                  This narrative will be saved to both this alert and the project's official Dispute &amp; Bottleneck Resolution log.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-ink-100">
                <button
                  type="button"
                  onClick={() => setResolveTargetAlert(null)}
                  disabled={submittingResolve}
                  className="rounded-xl border border-ink-200 px-4 py-2 text-xs font-bold text-ink-600 hover:bg-ink-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingResolve}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-800 transition-all disabled:opacity-60"
                >
                  {submittingResolve ? (
                    <>
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Saving Resolution…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      Confirm &amp; Log Resolution
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
