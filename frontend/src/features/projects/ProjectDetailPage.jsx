import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { fetchProject } from "../../api/projects.js";
import Card from "../../components/Card.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import ProgressBar from "../../components/ProgressBar.jsx";
import MapView from "../../components/MapView.jsx";
import { formatDate, formatINR } from "../../utils/status.js";
import { useAuthStore } from "../../store/authStore.js";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const role = useAuthStore((s) => s.user?.role);

  useEffect(() => {
    fetchProject(id)
      .then(setProject)
      .catch(() => toast.error("Could not load project"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-sm text-ink-300">Loading project…</p>;
  if (!project) return <p className="text-sm text-ink-300">Project not found.</p>;

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

  // Find the first at-risk/delayed stage so we can show "recommended attention"
  const bottleneckDept = project.departments.find((d) => ["AtRisk", "Delayed"].includes(d.status));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-ink-300">{project.code}</p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-bold text-ink-900">{project.name}</h1>
          <StatusBadge status={project.overallStatus} />
        </div>
        <p className="mt-1 text-sm text-ink-300">
          {project.district}, {project.state} · {project.implementingAgency}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Overall Progress" className="lg:col-span-2">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="data-figure text-3xl font-bold text-ink-900">{project.overallProgress}%</span>
            <span className="text-xs text-ink-300">Planned completion {formatDate(project.plannedCompletionDate)}</span>
          </div>
          <ProgressBar value={project.overallProgress} status={project.overallStatus} />

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Metric label="Area Notified" value={`${project.areaNotified} ha`} />
            <Metric label="Area Acquired" value={`${project.areaAcquired} ha`} />
            <Metric label="Affected Families" value={project.affectedFamilies} />
            <Metric label="Displaced Families" value={project.displacedFamilies} />
            <Metric label="Compensation Assessed" value={formatINR(project.compensationAssessed)} />
            <Metric label="Compensation Disbursed" value={formatINR(project.compensationDisbursed)} />
          </div>
        </Card>

        <Card title="Parcel Location">
          <MapView points={mapPoint} center={[mapPoint[0]?.lat ?? 22.97, mapPoint[0]?.lng ?? 78.65]} zoom={9} height="280px" />
        </Card>
      </div>

      {bottleneckDept && (
        <div className="rounded-xl border border-status-atRisk/30 bg-ochre-400/10 p-4">
          <p className="text-sm font-semibold text-ink-900">Recommended attention</p>
          <p className="mt-1 text-sm text-ink-700">
            {bottleneckDept.delayReason || "This stage is behind schedule"} — {bottleneckDept.pendingCases} pending
            cases. Because later stages depend on this one, downstream stages may also be affected.
          </p>
        </div>
      )}

      <Card title="Stage-wise Progress">
        <div className="divide-y divide-ink-100">
          {project.departments.map((dp) => (
            <div key={dp.department._id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="sm:w-48">
                <p className="text-sm font-medium text-ink-900">{dp.department.displayName}</p>
                <p className="text-xs text-ink-300">Weight {dp.department.weight}%</p>
              </div>
              <div className="flex-1">
                <ProgressBar value={dp.actualProgress} status={dp.status} size="sm" />
              </div>
              <div className="flex items-center gap-4 sm:w-64 sm:justify-end">
                <span className="data-figure text-sm text-ink-500">{dp.actualProgress}%</span>
                <StatusBadge status={dp.status} />
                {role === "DepartmentOfficer" && (
                  <Link
                    to={`/projects/${project._id}/update`}
                    className="text-xs font-medium text-ochre-600 hover:underline"
                  >
                    Update
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div>
      <p className="text-xs text-ink-300">{label}</p>
      <p className="data-figure text-sm font-semibold text-ink-900">{value}</p>
    </div>
  );
}
