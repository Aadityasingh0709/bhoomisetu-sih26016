import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { fetchProject, deleteProject } from "../../api/projects.js";
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
} from "lucide-react";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStageIndex, setSelectedStageIndex] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const role = useAuthStore((s) => s.user?.role);
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
      <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-md bg-ink-900 px-2.5 py-0.5 font-mono text-xs font-bold text-white">
                {project.code}
              </span>
              <StatusBadge status={project.overallStatus} size="md" />
              <span className="rounded-full bg-ink-50 border border-ink-200 px-2.5 py-0.5 text-xs font-medium text-ink-600">
                {project.district}, {project.state}
              </span>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-ink-900 sm:text-3xl">
              {project.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-ink-500 pt-1">
              <span className="flex items-center gap-1.5">
                <Building size={14} className="text-ink-400" />
                <span className="font-semibold text-ink-800">{project.implementingAgency}</span>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-ink-400" />
                <span>Target: {formatDate(project.plannedCompletionDate)}</span>
              </span>
              {project.location?.coordinates && (
                <>
                  <span>·</span>
                  <span className="font-mono text-ink-400">
                    {project.location.coordinates[1].toFixed(4)}°N, {project.location.coordinates[0].toFixed(4)}°E
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Big Overall Velocity Gauge */}
          <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-ink-950 to-slate-900 p-5 text-white shadow-xl min-w-[220px]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-ochre-400">
                Weighted Progress
              </p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-3xl font-black data-figure text-white">
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
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50/80 p-4 text-amber-900 shadow-sm">
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
      )}

      {/* Interactive 6-Stage Lifecycle Stepper */}
      <Card
        title="Land Acquisition Lifecycle Pipeline"
        subtitle="Click any stage below to inspect verified progress, pending backlog & delay diagnostics"
        icon={Layers}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 pt-2">
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
    </div>

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
