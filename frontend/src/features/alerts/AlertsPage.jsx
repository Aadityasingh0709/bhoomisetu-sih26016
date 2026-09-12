import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import {
  fetchAlerts,
  createAlert,
  resolveAlert,
  postAlertDecision,
  officerMarkAlertResolved,
} from "../../api/alerts.js";
import { fetchProjects } from "../../api/projects.js";
import { fetchDepartments } from "../../api/departments.js";
import { useAuthStore } from "../../store/authStore.js";
import Card from "../../components/Card.jsx";
import StatCard from "../../components/StatCard.jsx";
import AIRecommendationPanel from "../../components/AIRecommendationPanel.jsx";
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
  MessageSquare,
  Send,
  BadgeCheck,
  Clock,
  Bell,
  User,
  PlusCircle,
  Building2,
} from "lucide-react";

export default function AlertsPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;

  // Roles that are "higher authority" – they post decisions and close alerts
  const isAuthority = ["Administrator", "SeniorOfficer", "ProjectManager"].includes(role);
  // Department officer – they read decisions and mark issues as fixed
  const isOfficer = role === "DepartmentOfficer";

  const [activeAlerts, setActiveAlerts] = useState([]);
  const [resolvedAlerts, setResolvedAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState("active");
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");

  // ── Report New Bottleneck Modal ─────────────────────────────────────────
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [projectsList, setProjectsList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [newProjectId, setNewProjectId] = useState("");
  const [newDeptId, setNewDeptId] = useState("");
  const [newAlertType, setNewAlertType] = useState("Bottleneck");
  const [newAlertSeverity, setNewAlertSeverity] = useState("High");
  const [newAlertMessage, setNewAlertMessage] = useState("");
  const [submittingNewAlert, setSubmittingNewAlert] = useState(false);

  // ── Authority Decision Modal ────────────────────────────────────────────
  const [decisionTarget, setDecisionTarget] = useState(null);
  const [decisionText, setDecisionText] = useState("");
  const [submittingDecision, setSubmittingDecision] = useState(false);

  // ── Final Resolve Modal (authority closes the loop) ────────────────────
  const [resolveTarget, setResolveTarget] = useState(null);
  const [resolveNotes, setResolveNotes] = useState("");
  const [submittingResolve, setSubmittingResolve] = useState(false);

  // ── Officer Mark-Resolved Modal ────────────────────────────────────────
  const [officerResolveTarget, setOfficerResolveTarget] = useState(null);
  const [officerResolveNote, setOfficerResolveNote] = useState("");
  const [submittingOfficerResolve, setSubmittingOfficerResolve] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([fetchAlerts({ resolved: false }), fetchAlerts({ resolved: true })])
      .then(([active, resolved]) => {
        setActiveAlerts(active);
        setResolvedAlerts(resolved);
      })
      .catch(() => toast.error("Could not load alerts"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    fetchProjects().then((p) => {
      setProjectsList(p || []);
      if (p?.length && !newProjectId) setNewProjectId(p[0]._id);
    }).catch(() => {});

    fetchDepartments().then((d) => {
      setDepartmentsList(d || []);
      if (d?.length && !newDeptId) {
        setNewDeptId(user?.department?._id || d[0]._id);
      }
    }).catch(() => {});
  }, [user]);

  // ── Report Bottleneck Submit ───────────────────────────────────────────
  const handleOpenReportModal = () => {
    setNewDeptId(user?.department?._id || (departmentsList[0]?._id || ""));
    setNewAlertMessage("");
    setNewAlertType("Bottleneck");
    setNewAlertSeverity("High");
    setReportModalOpen(true);
  };

  const handleCreateAlertSubmit = async (e) => {
    e.preventDefault();
    if (!newProjectId || !newAlertMessage.trim()) {
      toast.error("Please select a project and provide the bottleneck details");
      return;
    }
    setSubmittingNewAlert(true);
    try {
      const created = await createAlert({
        projectId: newProjectId,
        departmentId: newDeptId || user?.department?._id,
        type: newAlertType,
        severity: newAlertSeverity,
        message: newAlertMessage.trim(),
      });
      toast.success("Bottleneck alert raised! Higher authorities have been notified.");
      setActiveAlerts((prev) => [created, ...prev]);
      setReportModalOpen(false);
      window.dispatchEvent(new Event("alertsUpdated"));
    } catch {
      toast.error("Could not post bottleneck alert");
    } finally {
      setSubmittingNewAlert(false);
    }
  };

  // ── Authority: post decision ───────────────────────────────────────────
  const handleOpenDecisionModal = (alert) => {
    setDecisionTarget(alert);
    setDecisionText(alert.authorityDecision || "");
  };

  const handleSubmitDecision = async (e) => {
    e.preventDefault();
    if (!decisionTarget) return;
    setSubmittingDecision(true);
    try {
      const updated = await postAlertDecision(decisionTarget._id, decisionText);
      setActiveAlerts((prev) =>
        prev.map((a) => (a._id === updated._id ? updated : a))
      );
      toast.success("Decision posted — the responsible officer will now see your directive.");
      setDecisionTarget(null);
      window.dispatchEvent(new Event("alertsUpdated"));
    } catch {
      toast.error("Could not post decision");
    } finally {
      setSubmittingDecision(false);
    }
  };

  // ── Authority: fully close alert ──────────────────────────────────────
  const handleOpenResolveModal = (alert) => {
    setResolveTarget(alert);
    setResolveNotes(alert.resolutionNotes || "");
  };

  const handleConfirmResolve = async (e) => {
    e.preventDefault();
    if (!resolveTarget) return;
    setSubmittingResolve(true);
    try {
      const updated = await resolveAlert(resolveTarget._id, { resolutionNotes: resolveNotes });
      toast.success("Alert closed and logged in project dossier");
      setActiveAlerts((prev) => prev.filter((a) => a._id !== resolveTarget._id));
      setResolvedAlerts((prev) => [updated, ...prev]);
      setResolveTarget(null);
      window.dispatchEvent(new Event("alertsUpdated"));
    } catch {
      toast.error("Could not resolve alert");
    } finally {
      setSubmittingResolve(false);
    }
  };

  // ── Officer: mark problem as fixed ────────────────────────────────────
  const handleOpenOfficerResolve = (alert) => {
    setOfficerResolveTarget(alert);
    setOfficerResolveNote("");
  };

  const handleSubmitOfficerResolve = async (e) => {
    e.preventDefault();
    if (!officerResolveTarget) return;
    setSubmittingOfficerResolve(true);
    try {
      const updated = await officerMarkAlertResolved(officerResolveTarget._id, officerResolveNote);
      setActiveAlerts((prev) =>
        prev.map((a) => (a._id === updated._id ? updated : a))
      );
      toast.success(
        "Problem marked as resolved — the higher authority has been notified."
      );
      setOfficerResolveTarget(null);
      window.dispatchEvent(new Event("alertsUpdated"));
    } catch {
      toast.error("Could not mark as resolved");
    } finally {
      setSubmittingOfficerResolve(false);
    }
  };

  // ── Filtering ─────────────────────────────────────────────────────────
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

  // Alerts that have a pending officer-resolved notification for authority to close
  const pendingOfficerNotifications = activeAlerts.filter(
    (a) => a.officerResolved && !a.isResolved
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-ink-900">
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

        {/* Action Button: Report Bottleneck */}
        <button
          onClick={handleOpenReportModal}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-600/20 hover:from-rose-700 hover:to-rose-800 transition-all shrink-0"
        >
          <PlusCircle size={15} />
          <span>Report Bottleneck / Obstacle</span>
        </button>
      </div>

      {isOfficer && (
        <div className="flex items-center gap-3 rounded-2xl border border-ochre-200 bg-ochre-50/80 p-4 shadow-sm">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ochre-500 text-white font-bold">
            <ShieldCheck size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-ochre-900">
              Project-Scoped Alert Intelligence
            </h4>
            <p className="text-[11px] text-ochre-700 mt-0.5">
              Showing bottleneck and dependency alerts strictly for{" "}
              <span className="font-semibold text-ochre-900">
                {user?.activeProject?.name || user?.activeProject?.code || "your assigned project"}
              </span>
              . Alerts from other projects are isolated in accordance with project privacy and security standards.
            </p>
          </div>
        </div>
      )}

      {/* KPI Counters */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Unresolved"
          value={activeAlerts.length}
          sublabel="Pending senior officer attention"
          accent="#0b1c2d"
          icon={ShieldAlert}
          active={activeTab === "active" && typeFilter === "All"}
          onClick={() => { setActiveTab("active"); setTypeFilter("All"); }}
        />
        <StatCard
          label="Bottleneck Alerts"
          value={bottleneckCount}
          sublabel="Pending cases > 20 and progress < 60%"
          accent="#dc2626"
          icon={AlertTriangle}
          active={activeTab === "active" && typeFilter === "Bottleneck"}
          onClick={() => { setActiveTab("active"); setTypeFilter(typeFilter === "Bottleneck" ? "All" : "Bottleneck"); }}
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
          onClick={() => { setActiveTab("active"); setTypeFilter(typeFilter === "Dependency" ? "All" : "Dependency"); }}
          trend="Cross-Stage Risk"
          trendType="warning"
        />
      </div>

      {/* ── AI Recommendation Panel ───────────────────────────────────── */}
      <AIRecommendationPanel />

      {/* ── Officer Action Required Banner (for DepartmentOfficer) ── */}
      {isOfficer && (() => {
        const myDeptId = String(user?.department?._id);
        const pendingForMe = activeAlerts.filter(
          (a) =>
            ((String(a.department?._id || a.department || "") === myDeptId) ||
             (String(a.raisedBy?._id || a.raisedBy || "") === String(user?._id || ""))) &&
            !!a.authorityDecision &&
            !a.officerResolved &&
            !a.isResolved
        );
        if (pendingForMe.length === 0) return null;
        return (
          <div className="rounded-2xl border border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 shadow-sm">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <MessageSquare size={16} />
              </div>
              <div>
                <p className="text-sm font-black text-blue-900">
                  {pendingForMe.length} Directive{pendingForMe.length > 1 ? "s" : ""} Waiting for Your Action
                </p>
                <p className="text-xs text-blue-700">
                  The higher authority has reviewed the bottleneck and posted a corrective-action directive for you to implement.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {pendingForMe.map((a) => (
                <div
                  key={a._id}
                  className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 rounded-xl border border-blue-200 bg-white px-3.5 py-2.5"
                >
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-ink-900">{a.message}</p>
                    <p className="text-ink-500">
                      <span className="font-semibold">{a.projectName}</span> · {a.department?.displayName}
                    </p>
                    <div className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-2 space-y-0.5">
                      <p className="text-[10px] font-black uppercase tracking-wider text-blue-700">
                        Authority's Directive:
                      </p>
                      <p className="text-blue-900 font-medium leading-relaxed">
                        {a.authorityDecision}
                      </p>
                      <p className="text-[10px] text-blue-600 pt-0.5">
                        — <strong>{a.authorityDecidedBy?.name || "Authority"}</strong>
                        {a.authorityDecidedBy?.role && (
                          <span> ({a.authorityDecidedBy.role.replace(/([A-Z])/g, " $1").trim()})</span>
                        )}
                        {" "}on {new Date(a.authorityDecidedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenOfficerResolve(a)}
                    className="shrink-0 flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:from-blue-700 hover:to-indigo-800 transition-all"
                  >
                    <CheckCircle2 size={14} />
                    Mark Fixed ✓
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── Officer-Resolved Notification Banner (for authority) ── */}
      {isAuthority && pendingOfficerNotifications.length > 0 && (
        <div className="rounded-2xl border border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 shadow-sm">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
              <Bell size={16} />
            </div>
            <div>
              <p className="text-sm font-black text-emerald-900">
                {pendingOfficerNotifications.length} Alert{pendingOfficerNotifications.length > 1 ? "s" : ""} Marked Fixed by Officers
              </p>
              <p className="text-xs text-emerald-700">
                Responsible officers have implemented your directive and reported the problem solved. Review and close the loop.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {pendingOfficerNotifications.map((a) => (
              <div
                key={a._id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border border-emerald-200 bg-white px-3.5 py-2.5"
              >
                <div className="text-xs space-y-0.5">
                  <p className="font-bold text-ink-900">{a.message}</p>
                  <p className="text-ink-500">
                    <span className="font-semibold">{a.projectName || a.project?.name}</span> · {a.department?.displayName}
                  </p>
                  {a.officerResolvedNote && (
                    <p className="text-emerald-700 italic">
                      Officer note: "{a.officerResolvedNote}"
                    </p>
                  )}
                  <p className="text-[10px] text-ink-400">
                    Fixed by: <strong>{a.officerResolvedBy?.name || "Officer"}</strong> on{" "}
                    {new Date(a.officerResolvedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleOpenResolveModal(a)}
                  className="shrink-0 flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:from-emerald-700 hover:to-teal-800 transition-all"
                >
                  <BadgeCheck size={14} />
                  Close Alert
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
              const hasDecision = !!a.authorityDecision;
              const officerFixed = !!a.officerResolved;
              const myDeptId = String(user?.department?._id);
              const alertDeptId = String(a.department?._id || a.department || "");
              const isMyAlert = isOfficer && myDeptId === alertDeptId;
              const isAuthor = isOfficer && String(a.raisedBy?._id || a.raisedBy || "") === String(user?._id || "");

              return (
                <li
                  key={a._id}
                  className="flex flex-col gap-3 py-4 hover:bg-ink-50/50 p-4 rounded-2xl transition-colors"
                >
                  {/* Row 1: Badges + actions */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
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
                      {hasDecision && (
                        <span className="inline-flex items-center gap-1 rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                          <MessageSquare size={10} />
                          Decision Posted
                        </span>
                      )}
                      {officerFixed && (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          <CheckCircle2 size={10} />
                          Officer Fixed ✓
                        </span>
                      )}
                      {a.isResolved && (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          <BadgeCheck size={10} />
                          Closed
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {/* Authority: Post / Edit Decision */}
                      {isAuthority && !a.isResolved && (
                        <button
                          onClick={() => handleOpenDecisionModal(a)}
                          className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-700 shadow-sm hover:bg-blue-100 hover:border-blue-300 transition-all"
                        >
                          <MessageSquare size={13} className="text-blue-600" />
                          {hasDecision ? "Update Decision" : "Post Decision"}
                        </button>
                      )}

                      {/* Authority: Close Alert */}
                      {isAuthority && !a.isResolved && (
                        <button
                          onClick={() => handleOpenResolveModal(a)}
                          className="flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3.5 py-1.5 text-xs font-bold text-ink-700 shadow-sm hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-all"
                        >
                          <BadgeCheck size={14} className="text-emerald-600" />
                          Close Alert
                        </button>
                      )}

                      {/* Officer: Mark as Fixed (only when a decision exists and they own the dept or raised the alert) */}
                      {(isMyAlert || isAuthor) && hasDecision && !a.officerResolved && !a.isResolved && (
                        <button
                          onClick={() => handleOpenOfficerResolve(a)}
                          className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700 shadow-sm hover:bg-emerald-100 transition-all"
                        >
                          <CheckCircle2 size={14} className="text-emerald-600" />
                          Mark Fixed ✓
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Alert Message */}
                  <p className="text-sm font-bold text-ink-900 leading-snug">{a.message}</p>

                  {/* ── Authority Decision Block (Visible to Higher Authority, Alert's Department Officer, and the Officer who raised the alert) ── */}
                  {hasDecision && (isAuthority || isMyAlert || isAuthor) && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-blue-900">
                        <MessageSquare size={14} className="text-blue-700" />
                        <span>Higher Authority Directive:</span>
                      </div>
                      <p className="text-blue-950 font-medium pl-5 leading-relaxed">
                        {a.authorityDecision}
                      </p>
                      <div className="flex items-center gap-2 pt-1 text-[11px] text-blue-700 pl-5">
                        <User size={11} />
                        <span>
                          Directive by: <strong>{a.authorityDecidedBy?.name || "Higher Authority"}</strong>
                          {a.authorityDecidedBy?.role && (
                            <span className="text-blue-500"> ({a.authorityDecidedBy.role.replace(/([A-Z])/g, " $1").trim()})</span>
                          )}
                        </span>
                        <span>·</span>
                        <Clock size={11} />
                        <span>{new Date(a.authorityDecidedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}

                  {/* For other departments: show private badge when directive exists */}
                  {a.isDecisionConfidential && !isAuthority && !isMyAlert && (
                    <div className="rounded-xl border border-ink-100 bg-ink-50/60 p-2.5 text-xs text-ink-500 flex items-center gap-2">
                      <span className="font-semibold text-ink-700">🔒 Directive Active:</span>
                      <span>Higher authority corrective action issued to {a.department?.displayName || "department"} (Department Internal).</span>
                    </div>
                  )}

                  {/* ── Officer Fixed Note ── */}
                  {officerFixed && (
                    <div className={`rounded-xl border p-3.5 text-xs space-y-1 ${
                      a.isResolved
                        ? "border-emerald-200 bg-emerald-50/60"
                        : "border-amber-200 bg-amber-50/60"
                    }`}>
                      <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        <span>Officer Reported Problem Fixed:</span>
                        {!a.isResolved && (
                          <span className="ml-auto rounded-full bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 text-[10px] font-bold">
                            Awaiting Authority Sign-off
                          </span>
                        )}
                      </div>
                      {a.officerResolvedNote && (
                        <p className="text-emerald-950 font-medium pl-5 leading-relaxed">
                          {a.officerResolvedNote}
                        </p>
                      )}
                      <div className="flex items-center gap-2 pt-1 text-[11px] text-emerald-700 pl-5">
                        <span>Marked by: <strong>{a.officerResolvedBy?.name || "Officer"}</strong></span>
                        <span>·</span>
                        <span>On: {new Date(a.officerResolvedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}

                  {/* ── Final Resolution Note for Closed Alerts ── */}
                  {a.isResolved && a.resolutionNotes && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                        <ShieldCheck size={14} className="text-emerald-700" />
                        <span>Official Closure Note:</span>
                      </div>
                      <p className="text-emerald-950 font-medium pl-5 leading-relaxed">
                        {a.resolutionNotes}
                      </p>
                      <div className="flex items-center gap-2 pt-1 text-[11px] text-emerald-800 pl-5">
                        <span>Closed by: <strong>{a.resolvedBy?.name || "Authority"}</strong></span>
                        <span>·</span>
                        <span>On: {new Date(a.resolvedAt || a.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}

                  {/* Project meta */}
                  <div className="flex items-center gap-2 text-xs text-ink-400 pt-0.5">
                    <span className="font-semibold text-ink-700">{a.projectName}</span>
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

      {/* ── Authority: Post Decision Modal ── */}
      {decisionTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm"
          onClick={() => !submittingDecision && setDecisionTarget(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-5 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                  <MessageSquare size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base font-black">Post Authority Decision</h2>
                  <p className="text-xs text-blue-200 mt-0.5">
                    Your directive will be visible to the responsible department officer
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDecisionTarget(null)}
                className="rounded-lg p-1 text-blue-200 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitDecision} className="p-6 space-y-4">
              {/* Alert context */}
              <div className="rounded-xl border border-ink-100 bg-ink-50 p-3 text-xs space-y-1">
                <div className="flex items-center justify-between text-ink-400 font-medium">
                  <span>{decisionTarget.department?.displayName || "Department Stage"}</span>
                  <span className="font-bold text-rose-600">{decisionTarget.severity} Priority</span>
                </div>
                <p className="font-bold text-ink-800">{decisionTarget.message}</p>
                <p className="text-ink-500 text-[11px]">{decisionTarget.projectName}</p>
              </div>

              {/* Decision textarea */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-ink-700 mb-1">
                  Your Corrective-Action Decision <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={5}
                  required
                  value={decisionText}
                  onChange={(e) => setDecisionText(e.target.value)}
                  placeholder="State the specific corrective action the officer must take to unblock this bottleneck. e.g.: 'Conduct joint hearing with the Tahsildar by 15 Sep, resolve the 44B boundary overlap, and clear 30 pending cases within 10 days. Escalate if court order is required.'"
                  className="input resize-none text-xs font-medium border-blue-300 focus:border-blue-500 focus:ring-blue-500 bg-blue-50/20"
                />
                <p className="text-[10px] text-ink-400 mt-1">
                  This directive will be saved and shown prominently to the responsible officer.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-ink-100">
                <button
                  type="button"
                  onClick={() => setDecisionTarget(null)}
                  disabled={submittingDecision}
                  className="rounded-xl border border-ink-200 px-4 py-2 text-xs font-bold text-ink-600 hover:bg-ink-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDecision}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:from-blue-700 hover:to-indigo-800 transition-all disabled:opacity-60"
                >
                  {submittingDecision ? (
                    <>
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Posting…
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Post Decision
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Officer: Mark Fixed Modal ── */}
      {officerResolveTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm"
          onClick={() => !submittingOfficerResolve && setOfficerResolveTarget(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-5 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                  <CheckCircle2 size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base font-black">Mark Problem as Fixed</h2>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    Confirm you have implemented the authority's decision
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOfficerResolveTarget(null)}
                className="rounded-lg p-1 text-emerald-200 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitOfficerResolve} className="p-6 space-y-4">
              {/* Alert context + decision */}
              <div className="rounded-xl border border-ink-100 bg-ink-50 p-3 text-xs space-y-2">
                <p className="font-bold text-ink-800">{officerResolveTarget.message}</p>
                {officerResolveTarget.authorityDecision && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-2.5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-blue-700 mb-0.5">
                      Authority's Directive to Implement:
                    </p>
                    <p className="text-blue-900 font-medium text-xs leading-relaxed">
                      {officerResolveTarget.authorityDecision}
                    </p>
                  </div>
                )}
              </div>

              {/* Officer note */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-ink-700 mb-1">
                  What Did You Do to Fix It? (Optional)
                </label>
                <textarea
                  rows={3}
                  value={officerResolveNote}
                  onChange={(e) => setOfficerResolveNote(e.target.value)}
                  placeholder="Briefly describe what action you took: e.g. 'Cleared 32 pending verification cases, re-surveyed parcel 44B with DGPS, submitted updated records to Tahsildar on 12 Sep 2026.'"
                  className="input resize-none text-xs font-medium"
                />
                <p className="text-[10px] text-ink-400 mt-1">
                  A notification will be sent to the higher authority to verify and close this alert.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-ink-100">
                <button
                  type="button"
                  onClick={() => setOfficerResolveTarget(null)}
                  disabled={submittingOfficerResolve}
                  className="rounded-xl border border-ink-200 px-4 py-2 text-xs font-bold text-ink-600 hover:bg-ink-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOfficerResolve}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-800 transition-all disabled:opacity-60"
                >
                  {submittingOfficerResolve ? (
                    <>
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      Confirm Fixed — Notify Authority
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Authority: Final Close Alert Modal ── */}
      {resolveTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm"
          onClick={() => !submittingResolve && setResolveTarget(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-5 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                  <BadgeCheck size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base font-black">Close Alert & Log Resolution</h2>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    Final sign-off — saves to project dossier &amp; audit trail
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResolveTarget(null)}
                className="rounded-lg p-1 text-emerald-200 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmResolve} className="p-6 space-y-4">
              <div className="rounded-xl border border-ink-100 bg-ink-50 p-3 text-xs space-y-1">
                <div className="flex items-center justify-between text-ink-400 font-medium">
                  <span>{resolveTarget.department?.displayName || "Department Stage"}</span>
                  <span className="font-bold text-rose-600">{resolveTarget.severity} Priority</span>
                </div>
                <p className="font-bold text-ink-800">{resolveTarget.message}</p>
                {resolveTarget.officerResolvedNote && (
                  <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2">
                    <p className="text-[10px] font-bold text-emerald-700 mb-0.5">Officer's fix note:</p>
                    <p className="text-emerald-900 text-xs">{resolveTarget.officerResolvedNote}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-ink-700 mb-1">
                  Official Closure Note <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="Write the final closure narrative for the audit dossier: confirm what was done, verify the fix, and note any follow-up actions…"
                  className="input resize-none text-xs font-medium border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500 bg-emerald-50/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-ink-100">
                <button
                  type="button"
                  onClick={() => setResolveTarget(null)}
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
                      Closing…
                    </>
                  ) : (
                    <>
                      <BadgeCheck size={14} />
                      Confirm &amp; Close Alert
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ── Report Bottleneck / Obstruction Modal ── */}
      {reportModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm"
          onClick={() => !submittingNewAlert && setReportModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-rose-600 to-rose-800 px-6 py-5 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                  <AlertTriangle size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base font-black">Report Bottleneck / Obstruction</h2>
                  <p className="text-xs text-rose-100 mt-0.5">
                    Alerts higher authority and informs cross-department tracking
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className="rounded-lg p-1 text-rose-200 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAlertSubmit} className="p-6 space-y-4">
              {/* Select Project */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-ink-700 mb-1">
                  Select Project <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={newProjectId}
                  onChange={(e) => setNewProjectId(e.target.value)}
                  className="input text-xs font-semibold"
                >
                  {projectsList.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.code}) — {p.district}, {p.state}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department & Severity Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-ink-700 mb-1">
                    Department / Stage
                  </label>
                  <select
                    value={newDeptId}
                    onChange={(e) => setNewDeptId(e.target.value)}
                    disabled={isOfficer}
                    className="input text-xs font-semibold"
                  >
                    {departmentsList.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-ink-700 mb-1">
                    Severity Level
                  </label>
                  <select
                    value={newAlertSeverity}
                    onChange={(e) => setNewAlertSeverity(e.target.value)}
                    className="input text-xs font-semibold"
                  >
                    <option value="High">High Severity</option>
                    <option value="Medium">Medium Severity</option>
                    <option value="Low">Low Severity</option>
                  </select>
                </div>
              </div>

              {/* Alert Type */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-ink-700 mb-1">
                  Alert Category
                </label>
                <select
                  value={newAlertType}
                  onChange={(e) => setNewAlertType(e.target.value)}
                  className="input text-xs font-semibold"
                >
                  <option value="Bottleneck">Bottleneck (Backlog / Stage Stall)</option>
                  <option value="Dispute">Dispute (Land Title / Boundary Overlap)</option>
                  <option value="Dependency">Dependency (Waiting on Upstream Agency)</option>
                  <option value="Delay">Delay (Milestone Past Deadline)</option>
                </select>
              </div>

              {/* Bottleneck description */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-ink-700 mb-1">
                  Bottleneck Description &amp; Ground Obstacle <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={newAlertMessage}
                  onChange={(e) => setNewAlertMessage(e.target.value)}
                  placeholder="Describe the issue in detail: e.g. 'Survey boundary overlap with state forest department between Chainage 42+000 and 46+500. 38 field verification notices pending Tahsildar signature.'"
                  className="input resize-none text-xs font-medium border-rose-300 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/20"
                />
                <p className="text-[10px] text-ink-400 mt-1">
                  The higher authority will review this bottleneck and post a corrective directive for your department.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-ink-100">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  disabled={submittingNewAlert}
                  className="rounded-xl border border-ink-200 px-4 py-2 text-xs font-bold text-ink-600 hover:bg-ink-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingNewAlert}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 px-5 py-2 text-xs font-bold text-white shadow-md shadow-rose-600/20 hover:from-rose-700 hover:to-rose-800 transition-all disabled:opacity-60"
                >
                  {submittingNewAlert ? (
                    <>
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Posting Alert…
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Raise Bottleneck Alert
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
