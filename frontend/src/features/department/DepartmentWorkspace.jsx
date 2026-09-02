import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { fetchProjects } from "../../api/projects.js";
import { useAuthStore } from "../../store/authStore.js";
import Card from "../../components/Card.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import ProgressBar from "../../components/ProgressBar.jsx";

// The Department Officer's landing page: only the projects their
// department is assigned to, with a direct link into the update form.
export default function DepartmentWorkspace() {
  const user = useAuthStore((s) => s.user);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects({ department: user?.department?._id })
      .then(setProjects)
      .catch(() => toast.error("Could not load your projects"))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-ink-900">{user?.department?.displayName} Workspace</h1>
        <p className="text-sm text-ink-300">Projects assigned to your department</p>
      </div>

      {loading ? (
        <p className="text-sm text-ink-300">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {projects.map((p) => {
            const mine = p.departments.find((d) => String(d.department._id) === String(user?.department?._id));
            return (
              <Card key={p._id}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-ink-300">{p.code}</p>
                    <p className="font-semibold text-ink-900">{p.name}</p>
                    <p className="text-xs text-ink-300">
                      {p.district}, {p.state}
                    </p>
                  </div>
                  <StatusBadge status={mine?.status} />
                </div>
                <div className="mt-3">
                  <ProgressBar value={mine?.actualProgress ?? 0} status={mine?.status} size="sm" />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-ink-300">
                  <span>{mine?.pendingCases ?? 0} pending cases</span>
                  <Link to={`/projects/${p._id}/update`} className="font-medium text-ochre-600 hover:underline">
                    Submit update →
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
