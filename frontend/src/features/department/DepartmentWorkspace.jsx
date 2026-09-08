import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { fetchProjects } from "../../api/projects.js";
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
} from "lucide-react";

export default function DepartmentWorkspace() {
  const user = useAuthStore((s) => s.user);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState("all"); // "all" | "action" | "healthy"

  useEffect(() => {
    fetchProjects({ department: user?.department?._id })
      .then(setProjects)
      .catch(() => toast.error("Could not load your department projects"))
      .finally(() => setLoading(false));
  }, [user]);

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
      if (filterTab === "action") {
        return ["AtRisk", "Delayed"].includes(mine.status);
      }
      if (filterTab === "healthy") {
        return ["OnTrack", "Completed"].includes(mine.status);
      }
      return true;
    });
  }, [projects, user, filterTab]);

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

          <div className="text-left sm:text-right">
            <span className="rounded-xl bg-ink-50 px-3 py-1.5 font-mono text-xs font-bold text-ink-700 border border-ink-200">
              SIH Stage #{user?.department?.order || "—"} of 6
            </span>
          </div>
        </div>
      </div>

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
    </div>
  );
}

