import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { fetchProjects } from "../../api/projects.js";
import StatusBadge from "../../components/StatusBadge.jsx";
import ProgressBar from "../../components/ProgressBar.jsx";
import toast from "react-hot-toast";

const STATUS_OPTIONS = ["All", "OnTrack", "AtRisk", "Delayed", "Completed"];

export default function ProjectListPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  useEffect(() => {
    setLoading(true);
    fetchProjects({ search: search || undefined, status: status === "All" ? undefined : status })
      .then(setProjects)
      .catch(() => toast.error("Could not load projects"))
      .finally(() => setLoading(false));
  }, [search, status]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink-900">Projects</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects…"
              className="rounded-lg border border-ink-100 py-2 pl-9 pr-3 text-sm outline-none focus:border-ochre-500 focus:ring-1 focus:ring-ochre-500"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-ink-100 py-2 px-3 text-sm outline-none focus:border-ochre-500"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === "OnTrack" ? "On Track" : s === "AtRisk" ? "At Risk" : s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-ink-100 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-300">
            <tr>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Progress</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-ink-300">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && projects.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-ink-300">
                  No projects match these filters.
                </td>
              </tr>
            )}
            {projects.map((p) => (
              <tr key={p._id} className="hover:bg-ink-50">
                <td className="px-4 py-3">
                  <Link to={`/projects/${p._id}`} className="font-medium text-ink-900 hover:text-ochre-600">
                    {p.name}
                  </Link>
                  <p className="text-xs text-ink-300">{p.code}</p>
                </td>
                <td className="px-4 py-3 text-ink-500">
                  {p.district}, {p.state}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-28">
                      <ProgressBar value={p.overallProgress} status={p.overallStatus} size="sm" />
                    </div>
                    <span className="data-figure text-xs text-ink-500">{p.overallProgress}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.overallStatus} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
