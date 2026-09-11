import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  fetchProject,
  deleteProject,
  addProjectResolution,
  deleteProjectResolution,
} from "../../api/projects.js";
import Card from "../../components/Card.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import ProgressBar from "../../components/ProgressBar.jsx";
import MapView from "../../components/MapView.jsx";
import { StageComparisonChart } from "../../components/ChartCard.jsx";
import { formatDate, formatINR, statusMeta } from "../../utils/status.js";
import { useAuthStore } from "../../store/authStore.js";
import {
  ArrowLeft,
  Calendar,
  Building,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Coins,
  Home,
  FileCheck,
  Scale,
  Flag,
  Share2,
  Printer,
  Trash2,
  Edit3,
  ChevronRight,
  Info,
  Layers,
  PlusCircle,
  FileText,
  AlertCircle,
  X,
  ShieldCheck,
  Award,
  ExternalLink,
  Copy,
  Check,
  KeyRound,
  Users,
} from "lucide-react";

const categoryMeta = (cat) => {
  switch (cat) {
    case "Land Title Dispute":
      return { bg: "bg-purple-100 text-purple-800 border-purple-200", label: "Land Title Dispute" };
    case "Bottleneck":
      return { bg: "bg-rose-100 text-rose-800 border-rose-200", label: "Bottleneck Unblocked" };
    case "Compensation Grievance":
      return { bg: "bg-amber-100 text-amber-800 border-amber-200", label: "Compensation Grievance" };
    case "Boundary Demarcation":
      return { bg: "bg-emerald-100 text-emerald-800 border-emerald-200", label: "Boundary Demarcation" };
    case "Clearance & NOC":
      return { bg: "bg-blue-100 text-blue-800 border-blue-200", label: "Clearance & NOC" };
    case "Inter-Agency":
      return { bg: "bg-indigo-100 text-indigo-800 border-indigo-200", label: "Inter-Agency Delay" };
    default:
      return { bg: "bg-slate-100 text-slate-800 border-slate-200", label: cat || "Dispute" };
  }
};

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStageIndex, setSelectedStageIndex] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Resolution state & modal
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [submittingResolution, setSubmittingResolution] = useState(false);
  const [resolutionFilter, setResolutionFilter] = useState("All");
  const [resolutionForm, setResolutionForm] = useState({
    title: "",
    category: "Bottleneck",
    departmentId: "",
    issueDescription: "",
    resolutionDetails: "",
    actionTakenBy: "",
    caseOrderReference: "",
    status: "Resolved",
  });

  const [copiedOfficerInfo, setCopiedOfficerInfo] = useState(false);
  const currentUser = useAuthStore((s) => s.user);
  const role = currentUser?.role;
  const canUpdate = ["DepartmentOfficer", "Administrator", "ProjectManager"].includes(role);
  const canDelete = role === "Administrator";

  useEffect(() => {
    fetchProject(id)
      .then((p) => {
        setProject(p);
        // Find first at-risk or delayed stage by default, or 0
        const badIdx = p.departments?.findIndex((d) => ["AtRisk", "Delayed"].includes(d.status));
        if (badIdx !== -1) setSelectedStageIndex(badIdx);
      })
      .catch(() => toast.error("Could not load project dossier"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteProject(project._id);
      toast.success("Project deleted successfully");
      navigate("/projects");
    } catch {
      toast.error("Could not delete project");
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleOpenResolutionModal = (defaultDeptId = "") => {
    const deptId =
      defaultDeptId ||
      currentUser?.department?._id ||
      project?.departments?.[selectedStageIndex]?.department?._id ||
      project?.departments?.[0]?.department?._id ||
      "";

    setResolutionForm({
      title: "",
      category: "Bottleneck",
      departmentId: String(deptId),
      issueDescription: "",
      resolutionDetails: "",
      actionTakenBy: currentUser?.name || "",
      caseOrderReference: "",
      status: "Resolved",
    });
    setShowResolutionModal(true);
  };

  const handleSubmitResolution = async (e) => {
    e.preventDefault();
    if (!resolutionForm.title.trim() || !resolutionForm.resolutionDetails.trim()) {
      toast.error("Please enter a title and describe how the issue was resolved");
      return;
    }
    setSubmittingResolution(true);
    try {
      const updated = await addProjectResolution(project._id, resolutionForm);
      setProject(updated);
      toast.success("Resolution record documented successfully");
      window.dispatchEvent(new Event("alertsUpdated"));
      setShowResolutionModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to record resolution");
    } finally {
      setSubmittingResolution(false);
    }
  };

  const handleDeleteResolution = async (resolutionId) => {
    if (!window.confirm("Are you sure you want to permanently remove this resolution record?")) {
      return;
    }
    try {
      const updated = await deleteProjectResolution(project._id, resolutionId);
      setProject(updated);
      toast.success("Resolution record removed");
      window.dispatchEvent(new Event("alertsUpdated"));
    } catch {
      toast.error("Could not remove resolution record");
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-sm font-semibold text-ink-400">Loading project dossier…</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="rounded-2xl border border-ink-100 bg-white p-8 text-center">
        <AlertTriangle size={32} className="mx-auto text-amber-500" />
        <p className="mt-2 text-base font-bold text-ink-900">Project Not Found</p>
        <Link to="/projects" className="mt-4 inline-block rounded-xl bg-ink-900 px-4 py-2 text-xs font-bold text-white">
          Back to Projects
        </Link>
      </div>
    );
  }

  const mapPoint = project.location?.coordinates
    ? [
        {
          id: project._id,
          name: project.name,
          district: project.district,
          state: project.state,
          status: project.overallStatus,
          progress: project.overallProgress,
          lat: project.location.coordinates[1],
          lng: project.location.coordinates[0],
        },
      ]
    : [];

  const bottleneckDept = project.departments.find((d) => ["AtRisk", "Delayed"].includes(d.status));
  const activeStage = project.departments?.[selectedStageIndex] || project.departments?.[0];

  // Stage chart data
  const stageChartData = project.departments?.map((dp) => ({
    name: dp.department?.displayName || "Stage",
    planned: dp.plannedProgress ?? 0,
    actual: dp.actualProgress ?? 0,
  }));

  const landAcquisitionPct = project.areaNotified
    ? Math.min(100, Math.round(((project.areaAcquired || 0) / project.areaNotified) * 100))
    : 0;

  const compDisbursedPct = project.compensationAssessed
    ? Math.min(100, Math.round(((project.compensationDisbursed || 0) / project.compensationAssessed) * 100))
    : 0;

  const stageIcons = {
    Survey: MapPin,
    LegalVerification: Scale,
    Compensation: Coins,
    Rehabilitation: Home,
    Approvals: FileCheck,
    Possession: Flag,
  };

  return (
    <>
    <div className="space-y-6">
      {/* Breadcrumb & Action Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-ink-400">
          <Link to="/projects" className="flex items-center gap-1 hover:text-ochre-600 transition-colors">
            <ArrowLeft size={14} /> Projects
          </Link>
          <span>/</span>
          <span className="font-mono text-ink-700 font-bold">{project.code}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 shadow-sm hover:bg-ink-50 transition-colors"
            title="Print Project Dossier"
          >
            <Printer size={13} />
            <span className="hidden sm:inline">Print Dossier</span>
          </button>

          {canUpdate && (
            <Link
              to={`/projects/${project._id}/update`}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-ochre-500 to-ochre-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-ochre-500/20 hover:from-ochre-600 hover:to-ochre-700 transition-all"
            >
              <Edit3 size={13} />
              <span>Update Progress</span>
            </Link>
          )}

          {canDelete && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all"
              title="Delete this project permanently"
            >
              <Trash2 size={13} />
              <span className="hidden sm:inline">Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Project Banner Card */}
      <div className="rounded-2xl border border-ink-100 bg-white p-4 sm:p-6 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <span className="rounded-md bg-ink-900 px-2.5 py-0.5 font-mono text-xs font-bold text-white">
                {project.code}
              </span>
              <StatusBadge status={project.overallStatus} size="md" />
              <span className="rounded-full bg-ink-50 border border-ink-200 px-2.5 py-0.5 text-xs font-medium text-ink-600">
                {project.district}, {project.state}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-ink-900">
              {project.name}
            </h1>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-ink-500 pt-1">
              <span className="flex items-center gap-1.5">
                <Building size={14} className="text-ink-400 shrink-0" />
                <span className="font-semibold text-ink-800">{project.implementingAgency}</span>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-ink-400 shrink-0" />
                <span>Target: {formatDate(project.plannedCompletionDate)}</span>
              </span>
              {project.location?.coordinates && (
                <>
                  <span className="hidden sm:inline">·</span>
                  <span className="font-mono text-ink-400 hidden sm:inline">
                    {project.location.coordinates[1].toFixed(4)}°N, {project.location.coordinates[0].toFixed(4)}°E
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Big Overall Velocity Gauge */}
          <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-ink-950 to-slate-900 p-4 sm:p-5 text-white shadow-xl min-w-0 sm:min-w-[220px]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-ochre-400">
                Weighted Progress
              </p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black data-figure text-white">
                  {project.overallProgress}%
                </span>
                <span className="text-xs text-ink-300">completed</span>
              </div>
              <p className="text-[11px] text-ink-400 mt-1">
                Calculated per SIH 26016 stage weights
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Attention Banner if Delayed or AtRisk */}
      {bottleneckDept && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-amber-300 bg-amber-50/80 p-4 text-amber-900 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="shrink-0 text-amber-600 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <p className="font-bold text-sm text-amber-950">
                Department Attention Required: {bottleneckDept.department?.displayName}
              </p>
              <p className="mt-0.5 text-amber-900">
                {bottleneckDept.delayReason || "This stage is trailing planned milestones"} with{" "}
                <span className="font-bold">{bottleneckDept.pendingCases} pending cases</span>. Upstream delays directly trigger downstream dependency alerts across subsequent lifecycle stages.
              </p>
            </div>
          </div>
          {canUpdate && (
            <button
              type="button"
              onClick={() => handleOpenResolutionModal(bottleneckDept.department?._id)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-amber-700 transition-colors shrink-0"
            >
              <CheckCircle2 size={13} />
              <span>Record Resolution</span>
            </button>
          )}
        </div>
      )}

      {/* Interactive 6-Stage Lifecycle Stepper */}
      <Card
        title="Land Acquisition Lifecycle Pipeline"
        subtitle="Click any stage below to inspect verified progress, pending backlog & delay diagnostics"
        icon={Layers}
      >
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6 pt-2">
          {project.departments?.map((dp, idx) => {
            const isSelected = selectedStageIndex === idx;
            const meta = statusMeta(dp.status);
            const deptName = dp.department?.name || "";
            const Icon = stageIcons[deptName] || Layers;

            return (
              <button
                key={dp.department?._id || dp._id}
                type="button"
                onClick={() => setSelectedStageIndex(idx)}
                className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all ${
                  isSelected
                    ? "border-ochre-500 bg-ochre-50/50 ring-2 ring-ochre-500/20 shadow-md"
                    : "border-ink-100 bg-white hover:border-ink-300 hover:bg-ink-50/40"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-ink-400">
                      #{idx + 1}
                    </span>
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-50 text-ink-700">
                      <Icon size={14} />
                    </div>
                    <span className="text-xs font-bold text-ink-900 leading-tight">
                      {dp.department?.displayName}
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-ink-400 text-[10px] font-mono">
                      Weight {dp.department?.weight}%
                    </span>
                    <span className="data-figure font-black text-ink-900">
                      {dp.actualProgress}%
                    </span>
                  </div>
                  <ProgressBar value={dp.actualProgress} status={dp.status} size="xs" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Stage Deep-Dive Inspector Card */}
        {activeStage && (
          <div className="mt-6 rounded-2xl border border-ink-200/80 bg-ink-50/60 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-ink-200/60 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-bold text-ink-900">
                    Stage Details: {activeStage.department?.displayName}
                  </h4>
                  <StatusBadge status={activeStage.status} size="sm" />
                </div>
                <p className="text-xs text-ink-400 mt-0.5">
                  Assigned weight in national progress score: <span className="font-bold text-ink-700">{activeStage.department?.weight}%</span>
                </p>
              </div>

              {canUpdate && (
                <Link
                  to={`/projects/${project._id}/update`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-ink-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-ochre-600 transition-colors"
                >
                  <Edit3 size={13} />
                  <span>Update This Stage</span>
                </Link>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 text-xs">
              <div className="rounded-xl bg-white p-3 border border-ink-100 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-ink-400 block">Actual Progress</span>
                <span className="text-xl font-black data-figure text-ink-900 mt-0.5 block">
                  {activeStage.actualProgress}%
                </span>
                <span className="text-[10px] text-ink-400">Verified by department</span>
              </div>

              <div className="rounded-xl bg-white p-3 border border-ink-100 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-ink-400 block">Planned Target</span>
                <span className="text-xl font-black data-figure text-ink-900 mt-0.5 block">
                  {activeStage.plannedProgress}%
                </span>
                <span className="text-[10px] text-ink-400">Milestone schedule</span>
              </div>

              <div className="rounded-xl bg-white p-3 border border-ink-100 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-ink-400 block">Pending Cases</span>
                <span className="text-xl font-black data-figure text-amber-600 mt-0.5 block">
                  {activeStage.pendingCases}
                </span>
                <span className="text-[10px] text-ink-400">Awaiting action</span>
              </div>

              <div className="rounded-xl bg-white p-3 border border-ink-100 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-ink-400 block">Completed Cases</span>
                <span className="text-xl font-black data-figure text-emerald-600 mt-0.5 block">
                  {activeStage.completedCases}
                </span>
                <span className="text-[10px] text-ink-400">Successfully closed</span>
              </div>
            </div>

            {/* Delay explanation */}
            {activeStage.delayReason && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-900">
                <span className="font-bold block">Documented Reason for Delay:</span>
                <p className="mt-0.5">{activeStage.delayReason}</p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Grid: Land & Compensation Metrics (Left) + GIS Parcel Map (Right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Land Acquisition Progress */}
            <Card title="Land Acquisition Progress" subtitle="Physical territory possession">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-2xl font-black data-figure text-ink-900">
                  {project.areaAcquired} / {project.areaNotified} ha
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {landAcquisitionPct}% acquired
                </span>
              </div>
              <ProgressBar value={landAcquisitionPct} status="OnTrack" size="md" />

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-t border-ink-100 pt-3">
                <div>
                  <span className="text-[10px] text-ink-400 block">Affected Families</span>
                  <span className="font-bold data-figure text-ink-800 text-sm">{project.affectedFamilies}</span>
                </div>
                <div>
                  <span className="text-[10px] text-ink-400 block">Displaced Families</span>
                  <span className="font-bold data-figure text-ink-800 text-sm">{project.displacedFamilies}</span>
                </div>
              </div>
            </Card>

            {/* Compensation Disbursement */}
            <Card title="Compensation Disbursement" subtitle="Direct beneficiary payout">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xl font-black data-figure text-ink-900">
                  {formatINR(project.compensationDisbursed)}
                </span>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {compDisbursedPct}% disbursed
                </span>
              </div>
              <ProgressBar value={compDisbursedPct} status="Completed" size="md" />

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-t border-ink-100 pt-3">
                <div>
                  <span className="text-[10px] text-ink-400 block">Total Assessed</span>
                  <span className="font-bold data-figure text-ink-800 text-xs">
                    {formatINR(project.compensationAssessed)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-ink-400 block">Pending Liability</span>
                  <span className="font-bold data-figure text-amber-700 text-xs">
                    {formatINR(Math.max(0, (project.compensationAssessed || 0) - (project.compensationDisbursed || 0)))}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Planned vs Actual Stage Velocity Chart */}
          <StageComparisonChart stageData={stageChartData} />
        </div>

        {/* GIS Parcel Location Map */}
        <div>
          <Card title="Geo-Tagged Land Parcel" subtitle="Satellite & GIS boundary verification">
            <MapView
              points={mapPoint}
              center={[mapPoint[0]?.lat ?? 22.97, mapPoint[0]?.lng ?? 78.65]}
              zoom={9}
              height="380px"
            />
          </Card>
        </div>
      </div>

      {/* Assigned Department Officers & Project ID Section */}
      <Card
        title="Project-Scoped Department Officers & Credentials"
        subtitle="Department officers assigned by the Administrator to this project"
        icon={Users}
        action={
          <button
            type="button"
            onClick={() => {
              const text = [
                `Project: ${project.name}`,
                `Project ID / Code: ${project.code}`,
                `----------------------------------------`,
                ...(project.departments || []).map(
                  (dp) =>
                    `• ${dp.department?.displayName || "Stage"} (${dp.department?.weight || 0}% wt): ${
                      dp.assignedOfficer?.name || "Assigned Officer"
                    } (${dp.assignedOfficer?.email || "officer@landacquisition.gov.in"})`
                ),
              ].join("\n");
              navigator.clipboard.writeText(text);
              setCopiedOfficerInfo(true);
              toast.success("Project Officers info copied to clipboard!");
              setTimeout(() => setCopiedOfficerInfo(false), 3000);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 shadow-sm hover:bg-ink-50 transition-colors"
          >
            {copiedOfficerInfo ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            <span>{copiedOfficerInfo ? "Copied!" : "Copy Officers Info"}</span>
          </button>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(project.departments || []).map((dp, idx) => {
            const Icon = stageIcons[dp.department?.name] || Building;
            return (
              <div
                key={dp.department?._id || idx}
                className="rounded-xl border border-ink-100 bg-ink-50/50 p-3.5 text-xs space-y-2 hover:bg-white hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-ink-900">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-ochre-500/15 text-ochre-700">
                      <Icon size={13} />
                    </div>
                    <span>{dp.department?.displayName}</span>
                  </div>
                  <StatusBadge status={dp.status} size="sm" />
                </div>

                <div className="space-y-0.5 border-t border-ink-100 pt-2 text-[11px]">
                  <p className="text-ink-500">
                    Officer: <span className="font-bold text-ink-900">{dp.assignedOfficer?.name || `${dp.department?.displayName} Officer`}</span>
                  </p>
                  <p className="text-ink-500 truncate">
                    Login ID: <span className="font-mono font-semibold text-ink-800">{dp.assignedOfficer?.email || `${dp.department?.name?.toLowerCase()}.${project.code?.toLowerCase().replace(/[^a-z0-9]/g, "")}@landacquisition.gov.in`}</span>
                  </p>
                  <p className="text-ink-400 text-[10px]">
                    Project ID: <span className="font-mono font-bold text-ochre-700">{project.code}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Bottleneck & Dispute Resolution Center Section */}
      <div id="resolution-section" className="space-y-4">
        <Card
          title="Bottleneck & Dispute Resolution Center"
          subtitle="Official audit trail of resolved obstacles, court orders, inter-agency settlements & title hearings"
          icon={Scale}
          action={
            canUpdate && (
              <button
                type="button"
                onClick={() => handleOpenResolutionModal()}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-ochre-500 to-ochre-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-ochre-500/20 hover:from-ochre-600 hover:to-ochre-700 transition-all"
              >
                <PlusCircle size={14} />
                <span>Record Resolution</span>
              </button>
            )
          }
        >
          {/* Filter Pills and Total Badge */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 pb-3 mb-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                "All",
                "Land Title Dispute",
                "Bottleneck",
                "Compensation Grievance",
                "Boundary Demarcation",
                "Clearance & NOC",
                "Inter-Agency",
                "Other",
              ].map((category) => {
                const count =
                  category === "All"
                    ? (project.resolutions || []).length
                    : (project.resolutions || []).filter((r) => r.category === category).length;
                const active = resolutionFilter === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setResolutionFilter(category)}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                      active
                        ? "bg-ink-900 text-white shadow-sm"
                        : "bg-ink-50 text-ink-600 hover:bg-ink-100"
                    }`}
                  >
                    <span>{category}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                        active ? "bg-white/20 text-white" : "bg-ink-200 text-ink-700"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <span className="text-xs text-ink-400 font-medium">
              {(project.resolutions || []).length} Resolution Record{(project.resolutions || []).length === 1 ? "" : "s"}
            </span>
          </div>

          {/* Resolutions List */}
          {(!project.resolutions || project.resolutions.length === 0) ? (
            <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50/40 p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-2">
                <Scale size={24} />
              </div>
              <p className="text-sm font-bold text-ink-900">No Bottleneck or Dispute Resolutions Recorded</p>
              <p className="text-xs text-ink-400 max-w-md mx-auto mt-1">
                Whenever title disputes, compensation grievances, or stage backlog bottlenecks are resolved, document the settlement narrative and action steps here for audit tracking.
              </p>
              {canUpdate && (
                <button
                  type="button"
                  onClick={() => handleOpenResolutionModal()}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-ink-900 px-4 py-2 text-xs font-bold text-white hover:bg-ochre-600 transition-colors shadow-sm"
                >
                  <PlusCircle size={14} />
                  <span>Record First Resolution</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {(project.resolutions || [])
                .filter((r) => resolutionFilter === "All" || r.category === resolutionFilter)
                .map((res) => {
                  const meta = categoryMeta(res.category);
                  const isResolved = res.status === "Resolved";
                  return (
                    <div
                      key={res._id}
                      className="group relative rounded-2xl border border-ink-100 bg-white p-5 shadow-sm hover:shadow-cardHover hover:border-ink-200 transition-all"
                    >
                      {/* Top Meta Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-md px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border ${meta.bg}`}
                          >
                            {meta.label}
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                              isResolved
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}
                          >
                            <CheckCircle2 size={11} className={isResolved ? "text-emerald-600" : "text-blue-600"} />
                            <span>{res.status || "Resolved"}</span>
                          </span>

                          {res.department?.displayName && (
                            <span className="rounded-md bg-ink-100/80 px-2 py-0.5 text-[10px] font-bold text-ink-700">
                              {res.department.displayName}
                            </span>
                          )}

                          {res.caseOrderReference && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-800">
                              <FileText size={10} />
                              <span>{res.caseOrderReference}</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-ink-400">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatDate(res.resolvedAt || res.createdAt)}
                          </span>
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDeleteResolution(res._id)}
                              className="rounded-lg p-1 text-ink-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
                              title="Delete resolution record"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="text-base font-bold text-ink-900 mb-2">
                        {res.title}
                      </h4>

                      {/* Issue Statement */}
                      {res.issueDescription && (
                        <div className="mb-3 rounded-xl bg-ink-50/70 border border-ink-100 p-3 text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-ink-600 mb-0.5">
                            <AlertTriangle size={13} className="text-amber-500" />
                            <span>Obstacle / Dispute Encountered:</span>
                          </div>
                          <p className="text-ink-700 leading-relaxed pl-5">
                            {res.issueDescription}
                          </p>
                        </div>
                      )}

                      {/* HOW HE RESOLVED IT (Highlighted Resolution Box) */}
                      <div className="rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 to-teal-50/40 p-4 text-xs">
                        <div className="flex items-center gap-1.5 font-black uppercase tracking-wider text-[11px] text-emerald-900 mb-1">
                          <ShieldCheck size={14} className="text-emerald-600" />
                          <span>How It Was Resolved (Corrective Action Taken):</span>
                        </div>
                        <p className="text-emerald-950 font-medium leading-relaxed pl-5 whitespace-pre-line text-[13px]">
                          {res.resolutionDetails}
                        </p>
                      </div>

                      {/* Footer: Authorized & Recorded By */}
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-ink-100/60 pt-2.5 text-[11px] text-ink-400">
                        <div>
                          {res.actionTakenBy && (
                            <span>
                              Action taken / settled by:{" "}
                              <strong className="text-ink-700">{res.actionTakenBy}</strong>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <span>Recorded by:</span>
                          <strong className="text-ink-700">
                            {res.resolvedBy?.name || "Verified Officer"}
                          </strong>
                          {res.resolvedBy?.role && (
                            <span className="text-ink-400">({res.resolvedBy.role})</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </Card>
      </div>
    </div>

      {/* Record Dispute / Bottleneck Resolution Modal */}
      {showResolutionModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm overflow-y-auto"
          onClick={() => !submittingResolution && setShowResolutionModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-ink-900 to-slate-900 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-ochre-500/20 text-ochre-400 border border-ochre-500/30">
                  <Scale size={18} className="sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-white">Record Dispute / Bottleneck Resolution</h2>
                  <p className="text-[11px] sm:text-xs text-ink-300 mt-0.5">
                    Write how a dispute, obstruction or bottleneck was resolved
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResolutionModal(false)}
                className="rounded-lg p-1 text-ink-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitResolution} className="p-4 sm:p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                  Resolution Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={resolutionForm.title}
                  onChange={(e) => setResolutionForm({ ...resolutionForm, title: e.target.value })}
                  placeholder="e.g. Survey Parcel #44B Boundary Dispute Settled"
                  className="input font-medium"
                />
              </div>

              {/* Category & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                    Issue Category
                  </label>
                  <select
                    value={resolutionForm.category}
                    onChange={(e) => setResolutionForm({ ...resolutionForm, category: e.target.value })}
                    className="input font-semibold"
                  >
                    <option value="Bottleneck">Bottleneck (Backlog / Delay)</option>
                    <option value="Land Title Dispute">Land Title Dispute</option>
                    <option value="Compensation Grievance">Compensation Grievance</option>
                    <option value="Boundary Demarcation">Boundary Demarcation</option>
                    <option value="Rehabilitation & Resettlement">Rehabilitation &amp; Resettlement</option>
                    <option value="Clearance & NOC">Clearance &amp; NOC</option>
                    <option value="Inter-Agency">Inter-Agency Obstacle</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                    Department / Lifecycle Stage
                  </label>
                  <select
                    value={resolutionForm.departmentId}
                    onChange={(e) => setResolutionForm({ ...resolutionForm, departmentId: e.target.value })}
                    className="input font-semibold"
                  >
                    <option value="">Select Department (Optional)</option>
                    {project.departments?.map((dp) => (
                      <option key={dp.department?._id} value={dp.department?._id}>
                        {dp.department?.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dispute / Issue statement */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                  Obstacle / Dispute Encountered
                </label>
                <textarea
                  rows={2}
                  value={resolutionForm.issueDescription}
                  onChange={(e) => setResolutionForm({ ...resolutionForm, issueDescription: e.target.value })}
                  placeholder="e.g. Boundary overlap between joint landholders delayed section 19 declaration"
                  className="input resize-none text-xs"
                />
              </div>

              {/* HOW HE RESOLVED IT */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-black uppercase tracking-wider text-emerald-800">
                    How Was It Resolved? (Resolution Narrative) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-ink-400 font-medium">Audit verified</span>
                </div>
                <textarea
                  rows={4}
                  required
                  value={resolutionForm.resolutionDetails}
                  onChange={(e) => setResolutionForm({ ...resolutionForm, resolutionDetails: e.target.value })}
                  placeholder="Write how the bottleneck or dispute was resolved in detail: e.g. Convened joint hearing with Tahsildar, re-surveyed parcel boundary with DGPS, reached consent award under Section 28, or released pending PFMS disbursement..."
                  className="input resize-none font-medium text-xs leading-relaxed border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500 bg-emerald-50/20"
                />
              </div>

              {/* Action Taken By & Order Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                    Action Taken By / Authorities
                  </label>
                  <input
                    type="text"
                    value={resolutionForm.actionTakenBy}
                    onChange={(e) => setResolutionForm({ ...resolutionForm, actionTakenBy: e.target.value })}
                    placeholder="e.g. Tahsildar & Legal Verification Officer"
                    className="input text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                    Order / Gazette Reference #
                  </label>
                  <input
                    type="text"
                    value={resolutionForm.caseOrderReference}
                    onChange={(e) => setResolutionForm({ ...resolutionForm, caseOrderReference: e.target.value })}
                    placeholder="e.g. REV/BLG-2026/894"
                    className="input font-mono text-xs"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                  Resolution Status
                </label>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  {["Resolved", "Mitigated", "In Hearing"].map((st) => (
                    <label key={st} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="resolutionStatus"
                        value={st}
                        checked={resolutionForm.status === st}
                        onChange={(e) => setResolutionForm({ ...resolutionForm, status: e.target.value })}
                        className="text-ochre-600 focus:ring-ochre-500"
                      />
                      <span>{st}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-ink-100">
                <button
                  type="button"
                  onClick={() => setShowResolutionModal(false)}
                  disabled={submittingResolution}
                  className="rounded-xl border border-ink-200 px-4 py-2 text-xs font-bold text-ink-600 hover:bg-ink-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingResolution}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-ochre-500 to-ochre-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-ochre-500/20 hover:from-ochre-600 hover:to-ochre-700 transition-all disabled:opacity-60"
                >
                  {submittingResolution ? (
                    <>
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Saving Resolution…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      Save Resolution Record
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm"
          onClick={() => !deleting && setShowDeleteModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Red danger header */}
            <div className="bg-gradient-to-r from-rose-500 to-rose-600 px-6 py-5 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
                <Trash2 size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-base font-black text-white">Delete Project</h2>
                <p className="text-xs text-rose-100 mt-0.5">This action cannot be undone</p>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-ink-700">
                You are about to permanently delete:
              </p>
              <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3">
                <p className="font-mono text-xs text-rose-400">{project.code}</p>
                <p className="font-bold text-sm text-rose-900 mt-0.5">{project.name}</p>
              </div>
              <p className="text-xs text-ink-500">
                All department progress data, alerts, and associated records for this project will be{" "}
                <span className="font-bold text-rose-600">permanently erased</span> from the database. This cannot be recovered.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-ink-100 px-6 py-4 bg-ink-50/50">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="rounded-xl border border-ink-200 bg-white px-4 py-2 text-xs font-bold text-ink-700 hover:bg-ink-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-rose-500/20 hover:from-rose-600 hover:to-rose-700 transition-all disabled:opacity-70"
              >
                {deleting ? (
                  <>
                    <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    Yes, Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
