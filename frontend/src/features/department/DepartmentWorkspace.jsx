import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { fetchProjects } from "../../api/projects.js";
import { fetchAlerts, officerMarkAlertResolved, createAlert } from "../../api/alerts.js";
import { useAuthStore } from "../../store/authStore.js";
import Card from "../../components/Card.jsx";
import StatCard from "../../components/StatCard.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import ProgressBar from "../../components/ProgressBar.jsx";
import {
  Building2,
  FolderKanban,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Edit3,
  MapPin,
  ExternalLink,
  MessageSquare,
  X,
  Send,
  Bell,
  BadgeCheck,
  User,
  PlusCircle,
} from "lucide-react";

export default function DepartmentWorkspace() {
  const user = useAuthStore((s) => s.user);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState("all");

  // Alerts for this officer's department that have authority decisions
  const [myAlerts, setMyAlerts] = useState([]);

  // Report bottleneck modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportProjectId, setReportProjectId] = useState("");
  const [reportSeverity, setReportSeverity] = useState("High");
  const [reportMessage, setReportMessage] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  // Mark-fixed modal
  const [officerResolveTarget, setOfficerResolveTarget] = useState(null);
  const [officerNote, setOfficerNote] = useState("");
  const [submittingOfficerResolve, setSubmittingOfficerResolve] = useState(false);

  const loadData = () => {
    const deptId = user?.department?._id;
    fetchProjects({ department: deptId })
      .then((data) => {
        setProjects(data || []);
        if (data?.length && !reportProjectId) {
          setReportProjectId(data[0]._id);
        }
      })
      .catch(() => toast.error("Could not load your department projects"))
      .finally(() => setLoading(false));

    // Fetch unresolved alerts for this officer's department
    if (deptId) {
      fetchAlerts({ resolved: false, departmentId: deptId })
        .then(setMyAlerts)
        .catch(() => {});
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener("alertsUpdated", handleUpdate);
    return () => window.removeEventListener("alertsUpdated", handleUpdate);
  }, [user]);

  // Alerts that have a posted decision from the authority and are NOT yet officer-resolved
  const pendingDecisionAlerts = useMemo(
    () =>
      myAlerts.filter(
        (a) =>
          a.authorityDecision &&
          !a.officerResolved &&
          !a.isResolved
      ),
    [myAlerts]
  );

  // Alerts where officer already marked fixed but authority hasn't closed yet
  const awaitingSignoffAlerts = useMemo(
    () => myAlerts.filter((a) => a.officerResolved && !a.isResolved),
    [myAlerts]
  );

  // Compute department-specific metrics across all assigned projects
  const deptStats = useMemo(() => {
    const myDeptId = String(user?.department?._id);
    let totalPending = 0;
    let totalCompleted = 0;
    let actionRequired = 0;

    projects.forEach((p) => {
      const mine = p.departments?.find(
        (d) => String(d.department?._id || d.department) === myDeptId
      );
      if (mine) {
        totalPending += mine.pendingCases || 0;
        totalCompleted += mine.completedCases || 0;
        if (["AtRisk", "Delayed"].includes(mine.status)) {
          actionRequired++;
        }
      }
    });

    return { totalPending, totalCompleted, actionRequired };
  }, [projects, user]);

  // Filter projects by selected tab
  const filteredProjects = useMemo(() => {
    const myDeptId = String(user?.department?._id);
    if (filterTab === "all") return projects;
    return projects.filter((p) => {
      const mine = p.departments?.find(
        (d) => String(d.department?._id || d.department) === myDeptId
      );
      if (!mine) return false;
      if (filterTab === "action") return ["AtRisk", "Delayed"].includes(mine.status);
      if (filterTab === "healthy") return ["OnTrack", "Completed"].includes(mine.status);
      return true;
    });
  }, [projects, user, filterTab]);

  // ── Officer report bottleneck handler ─────────────────────────────────
  const handleOpenReportModal = (projectId = "") => {
    if (projectId) setReportProjectId(projectId);
    else if (projects.length && !reportProjectId) setReportProjectId(projects[0]._id);
    setReportMessage("");
    setReportSeverity("High");
    setReportModalOpen(true);
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportProjectId || !reportMessage.trim()) {
      toast.error("Please select a project and describe the bottleneck");
      return;
    }
    setSubmittingReport(true);
    try {
      const created = await createAlert({
        projectId: reportProjectId,
        departmentId: user?.department?._id,
        type: "Bottleneck",
        severity: reportSeverity,
        message: reportMessage.trim(),
      });
      toast.success("Bottleneck reported! Higher authority has been alerted to issue directives.");
      setMyAlerts((prev) => [created, ...prev]);
      setReportModalOpen(false);
      window.dispatchEvent(new Event("alertsUpdated"));
    } catch {
      toast.error("Could not submit bottleneck report");
    } finally {
      setSubmittingReport(false);
    }
  };

  // ── Officer mark-fixed handler ─────────────────────────────────────────
  const handleOpenOfficerResolve = (alert) => {
    setOfficerResolveTarget(alert);
    setOfficerNote("");
  };

  const handleSubmitOfficerResolve = async (e) => {
    e.preventDefault();
    if (!officerResolveTarget) return;
    setSubmittingOfficerResolve(true);
    try {
      const updated = await officerMarkAlertResolved(officerResolveTarget._id, officerNote);
      setMyAlerts((prev) =>
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

  return (
    <div className="space-y-6">
      {/* Department Header Banner */}
      <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-ochre-500 to-ochre-700 text-white shadow-lg shadow-ochre-500/20">
              <Building2 size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-ink-900">
                  {user?.department?.displayName || "Department"} Workspace
                </h1>
                <span className="rounded-full bg-ochre-100 border border-ochre-300 px-2.5 py-0.5 text-xs font-bold text-ochre-800">
                  Weight: {user?.department?.weight}%
                </span>
              </div>
              <p className="text-xs font-medium text-ink-400 mt-0.5">
                Officer: <span className="font-bold text-ink-700">{user?.name}</span> · Assigned
                statutory stage milestone management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenReportModal()}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-rose-600/20 hover:from-rose-700 hover:to-rose-800 transition-all"
            >
              <PlusCircle size={14} />
              <span>Report Bottleneck</span>
            </button>
            <span className="rounded-xl bg-ink-50 px-3 py-2 font-mono text-xs font-bold text-ink-700 border border-ink-200">
              SIH Stage #{user?.department?.order || "—"} of 6
            </span>
          </div>
        </div>
      </div>

      {/* ── Authority Decision Notifications ── */}
      {pendingDecisionAlerts.length > 0 && (
        <div className="rounded-2xl border border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 shadow-sm">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Bell size={16} />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white animate-pulse">
                {pendingDecisionAlerts.length}
              </span>
            </div>
            <div>
              <p className="text-sm font-black text-blue-900">
                {pendingDecisionAlerts.length} New Higher-Authority Decision{pendingDecisionAlerts.length > 1 ? "s" : ""} Require Your Action
              </p>
              <p className="text-xs text-blue-700">
                A senior officer has reviewed your bottleneck alert and posted a corrective directive. Implement the decision and mark the issue as fixed.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {pendingDecisionAlerts.map((a) => (
              <div
                key={a._id}
                className="rounded-xl border border-blue-200 bg-white p-4 space-y-3 shadow-sm"
              >
                {/* Alert info */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="rounded-md bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                        {a.type}
                      </span>
                      <span className="rounded bg-ink-100 px-2 py-0.5 text-[10px] font-bold text-ink-700">
                        {a.projectName || a.project?.name}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-ink-900">{a.message}</p>
                  </div>
                  <Link
                    to={`/projects/${a.project?._id || a.project}`}
                    className="shrink-0 text-[11px] font-bold text-ochre-600 hover:underline flex items-center gap-1"
                  >
                    Dossier <ExternalLink size={11} />
                  </Link>
                </div>

                {/* Authority Decision */}
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-blue-900">
                    <MessageSquare size={13} className="text-blue-700" />
                    <span>Directive from {a.authorityDecidedBy?.name || "Higher Authority"}:</span>
                  </div>
                  <p className="text-blue-950 font-medium pl-5 leading-relaxed text-[13px]">
                    {a.authorityDecision}
                  </p>
                  <div className="pl-5 text-[10px] text-blue-600">
                    Posted on {new Date(a.authorityDecidedAt).toLocaleDateString()}
                    {a.authorityDecidedBy?.role && (
                      <span> · {a.authorityDecidedBy.role.replace(/([A-Z])/g, " $1").trim()}</span>
                    )}
                  </div>
                </div>

                {/* Mark Fixed Button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => handleOpenOfficerResolve(a)}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:from-emerald-700 hover:to-teal-800 transition-all"
                  >
                    <CheckCircle2 size={14} />
                    I've Fixed This — Notify Authority
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Awaiting Authority Sign-off ── */}
      {awaitingSignoffAlerts.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-xs">
          <div className="flex items-center gap-2 font-bold text-amber-900 mb-2">
            <Clock size={15} className="text-amber-600" />
            <span>{awaitingSignoffAlerts.length} Alert{awaitingSignoffAlerts.length > 1 ? "s" : ""} Awaiting Senior Officer Sign-off</span>
          </div>
          <div className="space-y-2">
            {awaitingSignoffAlerts.map((a) => (
              <div
                key={a._id}
                className="flex items-center justify-between rounded-xl border border-amber-200 bg-white px-3 py-2"
              >
                <div>
                  <p className="font-bold text-ink-800">{a.message}</p>
                  <p className="text-ink-400 text-[11px]">
                    You reported this fixed on {new Date(a.officerResolvedAt).toLocaleDateString()}. Waiting for the higher authority to verify and close.
                  </p>
                </div>
                <BadgeCheck size={18} className="shrink-0 text-amber-500 ml-3" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick KPI Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Assigned Projects"
          value={projects.length}
          sublabel="Parcels requiring stage clearance"
          accent="#0b1c2d"
          icon={FolderKanban}
        />
        <StatCard
          label="Action Required"
          value={deptStats.actionRequired}
          sublabel="Behind schedule or bottlenecked"
          accent={deptStats.actionRequired > 0 ? "#dc2626" : "#059669"}
          icon={AlertTriangle}
          trend={deptStats.actionRequired > 0 ? "Needs Update" : "Clear"}
          trendType={deptStats.actionRequired > 0 ? "negative" : "positive"}
        />
        <StatCard
          label="Pending Cases"
          value={deptStats.totalPending}
          sublabel="Backlog awaiting verification"
          accent="#d97706"
          icon={Clock}
        />
        <StatCard
          label="Completed Cases"
          value={deptStats.totalCompleted}
          sublabel="Successfully verified & passed"
          accent="#059669"
          icon={CheckCircle2}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-ink-100 pb-3">
        <button
          onClick={() => setFilterTab("all")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            filterTab === "all"
              ? "bg-ink-900 text-white shadow-sm"
              : "bg-white text-ink-600 hover:bg-ink-50 border border-ink-100"
          }`}
        >
          All Assigned ({projects.length})
        </button>
        <button
          onClick={() => setFilterTab("action")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            filterTab === "action"
              ? "bg-rose-600 text-white shadow-sm"
              : "bg-white text-ink-600 hover:bg-ink-50 border border-ink-100"
          }`}
        >
          Needs Action ({deptStats.actionRequired})
        </button>
        <button
          onClick={() => setFilterTab("healthy")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            filterTab === "healthy"
              ? "bg-emerald-700 text-white shadow-sm"
              : "bg-white text-ink-600 hover:bg-ink-50 border border-ink-100"
          }`}
        >
          On Track / Done
        </button>
      </div>

      {/* Project Cards Grid */}
      {loading ? (
        <div className="rounded-2xl border border-ink-100 bg-white p-12 text-center text-ink-400">
          <p className="text-sm font-semibold">Loading assigned parcels…</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="rounded-2xl border border-ink-100 bg-white p-12 text-center">
          <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
          <p className="text-base font-bold text-ink-900">No Projects in this Category</p>
          <p className="text-xs text-ink-400 mt-1">
            All assigned projects are operating within expected timelines.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {filteredProjects.map((p) => {
            const myDeptId = String(user?.department?._id);
            const mine = p.departments?.find(
              (d) => String(d.department?._id || d.department) === myDeptId
            );

            // Find any unresolved alert for this project in this dept that has an authority decision
            const relevantAlert = myAlerts.find(
              (a) =>
                String(a.project?._id || a.project) === String(p._id) &&
                a.authorityDecision &&
                !a.officerResolved &&
                !a.isResolved
            );

            return (
              <Card
                key={p._id}
                className="flex flex-col justify-between hover:shadow-cardHover transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="rounded bg-ink-50 px-2 py-0.5 font-mono text-[11px] font-bold text-ink-600">
                        {p.code}
                      </span>
                      <Link
                        to={`/projects/${p._id}`}
                        className="mt-1.5 block text-base font-bold text-ink-900 hover:text-ochre-600 transition-colors line-clamp-1"
                      >
                        {p.name}
                      </Link>
                      <p className="flex items-center gap-1.5 text-xs text-ink-400 mt-0.5">
                        <MapPin size={12} />
                        <span>
                          {p.district}, {p.state}
                        </span>
                      </p>
                    </div>
                    <StatusBadge status={mine?.status || "NotStarted"} size="sm" />
                  </div>

                  {/* Stage Progress Bar */}
                  <div className="mt-4 rounded-xl bg-ink-50/70 p-3.5 border border-ink-100">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-ink-800">
                        {user?.department?.displayName} Progress
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-black data-figure text-ink-900">
                          {mine?.actualProgress ?? 0}%
                        </span>
                        <span className="text-[10px] text-ink-400">
                          / {mine?.plannedProgress ?? 0}% planned
                        </span>
                      </div>
                    </div>
                    <ProgressBar
                      value={mine?.actualProgress ?? 0}
                      status={mine?.status || "NotStarted"}
                      size="sm"
                    />
                  </div>

                  {/* Case counts */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl border border-ink-100 bg-white p-2.5">
                      <span className="text-[10px] uppercase font-bold text-ink-400 block">
                        Pending Backlog
                      </span>
                      <span className="text-base font-extrabold data-figure text-amber-600">
                        {mine?.pendingCases ?? 0} cases
                      </span>
                    </div>
                    <div className="rounded-xl border border-ink-100 bg-white p-2.5">
                      <span className="text-[10px] uppercase font-bold text-ink-400 block">
                        Completed
                      </span>
                      <span className="text-base font-extrabold data-figure text-emerald-600">
                        {mine?.completedCases ?? 0} cases
                      </span>
                    </div>
                  </div>

                  {/* Delay Reason alert if present */}
                  {mine?.delayReason && (
                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/80 p-2.5 text-xs text-amber-900">
                      <span className="font-bold block">Active Bottleneck Notice:</span>
                      <p className="mt-0.5">{mine.delayReason}</p>
                    </div>
                  )}

                  {/* ── Authority Decision inline card ── */}
                  {relevantAlert && (
                    <div className="mt-3 rounded-xl border border-blue-300 bg-blue-50 p-3 text-xs space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-blue-900">
                        <MessageSquare size={13} className="text-blue-700" />
                        <span>Authority Directive Pending Your Action:</span>
                      </div>
                      <p className="text-blue-950 leading-relaxed">
                        {relevantAlert.authorityDecision}
                      </p>
                      <button
                        onClick={() => handleOpenOfficerResolve(relevantAlert)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-700 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm hover:from-emerald-700 hover:to-teal-800 transition-all"
                      >
                        <CheckCircle2 size={12} />
                        Mark Fixed &amp; Notify Authority
                      </button>
                    </div>
                  )}
                </div>

                {/* Footer Link */}
                <div className="mt-5 pt-3 border-t border-ink-100 flex items-center justify-between">
                  <Link
                    to={`/projects/${p._id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-ink-500 hover:text-ink-800"
                  >
                    View Parcel Dossier <ExternalLink size={12} />
                  </Link>

                  <Link
                    to={`/projects/${p._id}/update`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-ochre-500 to-ochre-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-ochre-500/20 hover:from-ochre-600 hover:to-ochre-700 transition-all"
                  >
                    <Edit3 size={13} />
                    <span>Submit Update</span>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Officer Mark-Fixed Modal ── */}
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
                  <h2 className="text-base font-black">Confirm Problem Fixed</h2>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    Notify the higher authority that you've resolved this bottleneck
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

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-ink-700 mb-1">
                  What Action Did You Take? (Optional)
                </label>
                <textarea
                  rows={3}
                  value={officerNote}
                  onChange={(e) => setOfficerNote(e.target.value)}
                  placeholder="e.g. Cleared 32 pending verification cases, re-surveyed parcel 44B with DGPS, submitted updated records to Tahsildar on 12 Sep 2026."
                  className="input resize-none text-xs font-medium"
                />
                <p className="text-[10px] text-ink-400 mt-1">
                  A notification will appear on the higher authority's alerts page. They will review and officially close this alert.
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
                      <Send size={14} />
                      Confirm Fixed — Notify Authority
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Report Bottleneck Modal ── */}
      {reportModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm"
          onClick={() => !submittingReport && setReportModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-rose-600 to-rose-800 px-6 py-5 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                  <AlertTriangle size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base font-black">Report Bottleneck for {user?.department?.displayName}</h2>
                  <p className="text-xs text-rose-100 mt-0.5">
                    Alerts the higher authority so they can issue corrective directives
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

            <form onSubmit={handleReportSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-ink-700 mb-1">
                  Select Affected Project <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={reportProjectId}
                  onChange={(e) => setReportProjectId(e.target.value)}
                  className="input text-xs font-semibold"
                >
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.code}) — {p.district}, {p.state}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-ink-700 mb-1">
                  Severity Level
                </label>
                <select
                  value={reportSeverity}
                  onChange={(e) => setReportSeverity(e.target.value)}
                  className="input text-xs font-semibold"
                >
                  <option value="High">High Severity (Immediate Attention)</option>
                  <option value="Medium">Medium Severity</option>
                  <option value="Low">Low Severity</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-ink-700 mb-1">
                  Bottleneck / Delay Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={reportMessage}
                  onChange={(e) => setReportMessage(e.target.value)}
                  placeholder="Detail the exact ground obstruction or delay: e.g. 'Survey delayed due to boundary dispute with private landowners on Survey Nos. 142/A & 143/B. 24 pending notices awaiting joint measurement with Tahsildar.'"
                  className="input resize-none text-xs font-medium border-rose-300 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/20"
                />
                <p className="text-[10px] text-ink-400 mt-1">
                  Higher authority will receive an alert and post an actionable decision.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-ink-100">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  disabled={submittingReport}
                  className="rounded-xl border border-ink-200 px-4 py-2 text-xs font-bold text-ink-600 hover:bg-ink-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 px-5 py-2 text-xs font-bold text-white shadow-md shadow-rose-600/20 hover:from-rose-700 hover:to-rose-800 transition-all disabled:opacity-60"
                >
                  {submittingReport ? (
                    <>
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Report to Higher Authority
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
