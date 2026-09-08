import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  MapPin,
  Building,
  Layers,
  Download,
  Calendar,
  ArrowUpDown,
  X,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { fetchProjects, deleteProject } from "../../api/projects.js";
import StatusBadge from "../../components/StatusBadge.jsx";
import ProgressBar from "../../components/ProgressBar.jsx";
import CreateProjectModal from "./CreateProjectModal.jsx";
import { useAuthStore } from "../../store/authStore.js";
import { formatDate, formatINR } from "../../utils/status.js";
import toast from "react-hot-toast";


const STATUS_TABS = [
  { key: "All", label: "All Parcels" },
  { key: "OnTrack", label: "On Track" },
  { key: "AtRisk", label: "At Risk" },
  { key: "Delayed", label: "Delayed" },
  { key: "Completed", label: "Completed" },
];

export default function ProjectListPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [stateFilter, setStateFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest"); // "newest", "progressDesc", "progressAsc", "area"
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"
  const [showCreate, setShowCreate] = useState(false);

  const role = useAuthStore((s) => s.user?.role);
  const canCreate = ["Administrator", "ProjectManager"].includes(role);
  const canDelete = role === "Administrator";

  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!projectToDelete) return;
    setDeleting(true);
    try {
      await deleteProject(projectToDelete._id);
      toast.success("Project deleted");
      setProjectToDelete(null);
      load();
    } catch {
      toast.error("Could not delete project");
    } finally {
      setDeleting(false);
    }
  };

  const load = () => {
    setLoading(true);
    fetchProjects({ search: search || undefined, status: status === "All" ? undefined : status })
      .then(setProjects)
      .catch(() => toast.error("Could not load projects"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [search, status]);

  // Extract unique states for filter
  const stateOptions = useMemo(() => {
    const set = new Set(projects.map((p) => p.state).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [projects]);

  // Client-side filtering & sorting
  const processedProjects = useMemo(() => {
    let result = [...projects];

    if (stateFilter !== "All") {
      result = result.filter((p) => p.state === stateFilter);
    }

    if (sortBy === "progressDesc") {
      result.sort((a, b) => b.overallProgress - a.overallProgress);
    } else if (sortBy === "progressAsc") {
      result.sort((a, b) => a.overallProgress - b.overallProgress);
    } else if (sortBy === "area") {
      result.sort((a, b) => (b.areaNotified || 0) - (a.areaNotified || 0));
    }

    return result;
  }, [projects, stateFilter, sortBy]);

  // Quick counts
  const counts = useMemo(() => {
    return {
      All: projects.length,
      OnTrack: projects.filter((p) => p.overallStatus === "OnTrack").length,
      AtRisk: projects.filter((p) => p.overallStatus === "AtRisk").length,
      Delayed: projects.filter((p) => p.overallStatus === "Delayed").length,
      Completed: projects.filter((p) => p.overallStatus === "Completed").length,
    };
  }, [projects]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!processedProjects.length) return;
    const headers = "Code,Name,State,District,Agency,Progress,Status,AreaNotified_Ha,AreaAcquired_Ha\n";
    const rows = processedProjects
      .map(
        (p) =>
          `"${p.code}","${p.name}","${p.state}","${p.district}","${p.implementingAgency}",${p.overallProgress},"${p.overallStatus}",${p.areaNotified},${p.areaAcquired}`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `BhoomiSetu_Projects_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success("CSV export downloaded");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-ink-900">
            Project Portfolio
          </h1>
          <p className="text-xs font-medium text-ink-400 mt-0.5">
            National repository of geo-tagged land acquisition parcels &amp; inter-agency pipelines
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 py-2 text-xs font-semibold text-ink-700 shadow-sm hover:bg-ink-50 transition-all"
            title="Download portfolio dataset as CSV"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {canCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-ochre-500 to-ochre-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-ochre-500/20 hover:from-ochre-600 hover:to-ochre-700 transition-all"
            >
              <Plus size={16} />
              <span>Create Project</span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Status Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 border-b border-ink-100 pb-3">
        {STATUS_TABS.map((tab) => {
          const isCurrent = status === tab.key;
          const count = counts[tab.key] ?? 0;
          return (
            <button
              key={tab.key}
              onClick={() => setStatus(tab.key)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                isCurrent
                  ? "bg-ink-900 text-white shadow-md shadow-ink-900/20"
                  : "bg-white text-ink-600 hover:bg-ink-50 border border-ink-100"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                  isCurrent ? "bg-white/20 text-white" : "bg-ink-100 text-ink-700"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-100 bg-white p-3 shadow-sm">
        <div className="flex flex-1 items-center gap-2 min-w-[240px]">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by project name or code…"
              className="w-full rounded-xl border border-ink-100 bg-ink-50/50 py-2 pl-10 pr-8 text-xs font-medium text-ink-900 outline-none focus:border-ochre-500 focus:bg-white focus:ring-1 focus:ring-ochre-500"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* State Filter */}
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="rounded-xl border border-ink-100 bg-ink-50/50 py-2 px-3 text-xs font-semibold text-ink-700 outline-none focus:border-ochre-500"
          >
            {stateOptions.map((s) => (
              <option key={s} value={s}>
                State: {s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort By */}
          <div className="flex items-center gap-1.5 rounded-xl border border-ink-100 px-3 py-1.5 text-xs text-ink-700">
            <ArrowUpDown size={13} className="text-ink-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent outline-none font-semibold cursor-pointer"
            >
              <option value="newest">Latest Created</option>
              <option value="progressDesc">Progress: High to Low</option>
              <option value="progressAsc">Progress: Low to High</option>
              <option value="area">Land Area (Ha)</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex rounded-xl border border-ink-100 p-0.5 bg-ink-50">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-lg p-1.5 transition-colors ${
                viewMode === "grid" ? "bg-white text-ink-900 shadow-sm" : "text-ink-400 hover:text-ink-700"
              }`}
              title="Card Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`rounded-lg p-1.5 transition-colors ${
                viewMode === "table" ? "bg-white text-ink-900 shadow-sm" : "text-ink-400 hover:text-ink-700"
              }`}
              title="Table View"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Content Rendering: Grid vs Table */}
      {loading ? (
        <div className="rounded-2xl border border-ink-100 bg-white p-12 text-center text-ink-400">
          <p className="text-sm font-semibold">Loading parcels portfolio…</p>
        </div>
      ) : processedProjects.length === 0 ? (
        <div className="rounded-2xl border border-ink-100 bg-white p-12 text-center">
          <p className="text-sm font-bold text-ink-900">No projects match the selected criteria</p>
          <p className="text-xs text-ink-400 mt-1">
            Try resetting your search term or status/state filters.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setStatus("All");
              setStateFilter("All");
            }}
            className="mt-4 rounded-xl bg-ink-900 px-4 py-2 text-xs font-bold text-white"
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* Card Grid View */
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {processedProjects.map((p) => {
            return (
              <div
                key={p._id}
                className="group relative flex flex-col justify-between rounded-2xl border border-ink-100 bg-white p-5 shadow-card hover:shadow-cardHover transition-all duration-300 hover:-translate-y-0.5"
              >
                <div>
                  {/* Top Code & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-md bg-ink-50 px-2 py-0.5 font-mono text-[11px] font-bold text-ink-600">
                      {p.code}
                    </span>
                    <StatusBadge status={p.overallStatus} size="sm" />
                  </div>

                  {/* Title & Agency */}
                  <Link to={`/projects/${p._id}`} className="mt-3 block">
                    <h3 className="text-base font-bold text-ink-900 group-hover:text-ochre-600 transition-colors line-clamp-2">
                      {p.name}
                    </h3>
                  </Link>

                  <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-400">
                    <MapPin size={13} className="shrink-0 text-ink-400" />
                    <span>
                      {p.district}, {p.state}
                    </span>
                  </p>

                  <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-400">
                    <Building size={13} className="shrink-0 text-ink-400" />
                    <span className="truncate">{p.implementingAgency}</span>
                  </p>

                  {/* Overall Progress Meter */}
                  <div className="mt-4 rounded-xl bg-ink-50/70 p-3">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-ink-700">Weighted Progress</span>
                      <span className="font-black data-figure text-sm text-ink-900">
                        {p.overallProgress}%
                      </span>
                    </div>
                    <ProgressBar value={p.overallProgress} status={p.overallStatus} size="sm" />
                  </div>

                  {/* Mini Stage Chain (6 stages) */}
                  <div className="mt-4 pt-3 border-t border-ink-100">
                    <div className="flex items-center justify-between text-[11px] text-ink-400 mb-2">
                      <span className="font-bold uppercase tracking-wider text-[10px]">
                        Stage Pipeline
                      </span>
                      <span>6 Departments</span>
                    </div>
                    <div className="grid grid-cols-6 gap-1">
                      {p.departments?.map((dp) => {
                        const statusColors = {
                          OnTrack: "bg-emerald-500",
                          AtRisk: "bg-amber-500",
                          Delayed: "bg-rose-500",
                          Completed: "bg-blue-600",
                          NotStarted: "bg-slate-200",
                        };
                        const colorClass = statusColors[dp.status] || "bg-slate-200";
                        return (
                          <div
                            key={dp.department?._id || dp._id}
                            className="group/tip relative flex flex-col items-center"
                          >
                            <div
                              className={`h-2 w-full rounded-full ${colorClass} transition-transform group-hover/tip:scale-110`}
                            />
                            {/* Hover tooltip */}
                            <span className="pointer-events-none absolute -top-7 rounded bg-ink-950 px-1.5 py-0.5 text-[9px] font-bold text-white opacity-0 group-hover/tip:opacity-100 transition-opacity whitespace-nowrap z-20">
                              {dp.department?.displayName}: {dp.actualProgress}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Land & Finance Snapshot */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-ink-50/50 p-2">
                      <span className="text-[10px] text-ink-400 block font-medium">Land Acquired</span>
                      <span className="font-bold data-figure text-ink-800">
                        {p.areaAcquired} / {p.areaNotified} ha
                      </span>
                    </div>
                    <div className="rounded-lg bg-ink-50/50 p-2">
                      <span className="text-[10px] text-ink-400 block font-medium">Target Date</span>
                      <span className="font-bold text-ink-800">
                        {formatDate(p.plannedCompletionDate)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-5 pt-3 border-t border-ink-100 flex items-center justify-between">
                  <Link
                    to={`/projects/${p._id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-ochre-600 hover:text-ochre-700"
                  >
                    Open Dossier <ExternalLink size={13} />
                  </Link>

                  <div className="flex items-center gap-1.5">
                    {canDelete && (
                      <button
                        onClick={() => setProjectToDelete(p)}
                        className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        title="Delete project"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    <Link
                      to={`/projects/${p._id}/update`}
                      className="rounded-lg bg-ink-100 px-2.5 py-1 text-xs font-bold text-ink-800 hover:bg-ochre-500 hover:text-white transition-colors"
                    >
                      Update
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Enhanced Table View */
        <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-ink-100 bg-ink-50/70 font-bold uppercase tracking-wider text-ink-400">
                <tr>
                  <th className="px-4 py-3.5">Code &amp; Parcel Name</th>
                  <th className="px-4 py-3.5">Jurisdiction</th>
                  <th className="px-4 py-3.5">Implementing Agency</th>
                  <th className="px-4 py-3.5">Progress Velocity</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Target Completion</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {processedProjects.map((p) => (
                  <tr key={p._id} className="hover:bg-ink-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <Link
                        to={`/projects/${p._id}`}
                        className="font-bold text-ink-900 hover:text-ochre-600 transition-colors block text-sm"
                      >
                        {p.name}
                      </Link>
                      <span className="font-mono text-[11px] text-ink-400">{p.code}</span>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-ink-700">
                      {p.district}, {p.state}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-ink-600">
                      {p.implementingAgency}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-24">
                          <ProgressBar value={p.overallProgress} status={p.overallStatus} size="sm" />
                        </div>
                        <span className="data-figure font-bold text-ink-800">
                          {p.overallProgress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={p.overallStatus} size="sm" />
                    </td>
                    <td className="px-4 py-3.5 font-medium text-ink-600">
                      {formatDate(p.plannedCompletionDate)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {canDelete && (
                          <button
                            onClick={() => setProjectToDelete(p)}
                            className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                            title="Delete project"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                        <Link
                          to={`/projects/${p._id}`}
                          className="rounded-lg bg-ink-100 px-2.5 py-1 text-xs font-bold text-ink-700 hover:bg-ochre-500 hover:text-white transition-colors inline-block"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={() => load()}
        />
      )}

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm"
          onClick={() => !deleting && setProjectToDelete(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-rose-500 to-rose-600 px-6 py-5 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
                <Trash2 size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-base font-black text-white">Delete Project</h2>
                <p className="text-xs text-rose-100 mt-0.5">This action cannot be undone</p>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-ink-700">You are about to permanently delete:</p>
              <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3">
                <p className="font-mono text-xs text-rose-400">{projectToDelete.code}</p>
                <p className="font-bold text-sm text-rose-900 mt-0.5">{projectToDelete.name}</p>
              </div>
              <p className="text-xs text-ink-500">
                All department progress data, alerts, and associated records will be{" "}
                <span className="font-bold text-rose-600">permanently erased</span>. This cannot be recovered.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-ink-100 px-6 py-4 bg-ink-50/50">
              <button
                onClick={() => setProjectToDelete(null)}
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
    </div>
  );
}

