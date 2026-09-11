import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { fetchProject, fetchDepartments, updateDepartmentProgress } from "../../api/projects.js";
import { createAlert } from "../../api/alerts.js";
import { useAuthStore } from "../../store/authStore.js";
import Card from "../../components/Card.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import ProgressBar from "../../components/ProgressBar.jsx";
import {
  ArrowLeft,
  Building,
  Calendar,
  AlertTriangle,
  Info,
  CheckCircle2,
  Sliders,
  Send,
} from "lucide-react";

const schema = z.object({
  departmentId: z.string().min(1, "Please select a department"),
  status: z.enum(["NotStarted", "OnTrack", "AtRisk", "Delayed", "Completed"]),
  actualProgress: z.coerce.number().min(0).max(100),
  plannedProgress: z.coerce.number().min(0).max(100),
  pendingCases: z.coerce.number().min(0),
  completedCases: z.coerce.number().min(0),
  delayReason: z.string().optional(),
  resolutionNotes: z.string().optional(),
  expectedCompletionDate: z.string().optional(),
});

export default function ProjectUpdateForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [project, setProject] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const isOfficer = user?.role === "DepartmentOfficer";

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const selectedDeptId = watch("departmentId");
  const currentActual = watch("actualProgress") ?? 0;
  const currentPlanned = watch("plannedProgress") ?? 0;
  const currentPending = watch("pendingCases") ?? 0;
  const currentStatus = watch("status") || "NotStarted";

  useEffect(() => {
    Promise.all([fetchProject(id), fetchDepartments()]).then(([p, depts]) => {
      setProject(p);
      setDepartments(depts);

      const myDeptId = isOfficer
        ? String(user?.department?._id || user?.department || "")
        : String(depts[0]?._id || "");

      const mine = p.departments.find(
        (d) => String(d.department?._id || d.department) === myDeptId
      );

      reset({
        departmentId: myDeptId,
        status: mine?.status || "NotStarted",
        actualProgress: mine?.actualProgress ?? 0,
        plannedProgress: mine?.plannedProgress ?? 0,
        pendingCases: mine?.pendingCases ?? 0,
        completedCases: mine?.completedCases ?? 0,
        delayReason: mine?.delayReason || "",
        resolutionNotes: mine?.resolutionNotes || "",
        expectedCompletionDate: mine?.expectedCompletionDate
          ? mine.expectedCompletionDate.slice(0, 10)
          : "",
      });
    });
  }, [id, user, reset, isOfficer]);

  useEffect(() => {
    if (!project || !selectedDeptId) return;
    const entry = project.departments.find(
      (d) => String(d.department?._id || d.department) === selectedDeptId
    );
    if (entry) {
      reset({
        departmentId: selectedDeptId,
        status: entry.status || "NotStarted",
        actualProgress: entry.actualProgress ?? 0,
        plannedProgress: entry.plannedProgress ?? 0,
        pendingCases: entry.pendingCases ?? 0,
        completedCases: entry.completedCases ?? 0,
        delayReason: entry.delayReason || "",
        resolutionNotes: entry.resolutionNotes || "",
        expectedCompletionDate: entry.expectedCompletionDate
          ? entry.expectedCompletionDate.slice(0, 10)
          : "",
      });
    }
  }, [selectedDeptId, project, reset]);

  if (!project) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-sm font-semibold text-ink-400">Loading update form…</p>
      </div>
    );
  }

  if (isOfficer) {
    const myEntry = project.departments.find(
      (d) =>
        String(d.department?._id || d.department) ===
        String(user?.department?._id || user?.department || "")
    );
    if (!myEntry) {
      return (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-800">
          <AlertTriangle size={32} className="mx-auto text-rose-500 mb-2" />
          <p className="font-bold">Access Denied</p>
          <p className="text-xs mt-1">Your department is not assigned to this project parcel.</p>
          <Link to="/department" className="mt-4 inline-block rounded-xl bg-ink-900 px-4 py-2 text-xs font-bold text-white">
            Back to Workspace
          </Link>
        </div>
      );
    }
  }

  const activeDept = departments.find((d) => String(d._id) === selectedDeptId);

  // Live Rule Intelligence preview
  const willBeAtRisk = currentPlanned - currentActual >= 10 && currentStatus !== "Delayed" && currentStatus !== "Completed";
  const willBeBottleneck = currentPending > 20 && currentActual < 60;

  const onSubmit = async (values) => {
    setSubmitting(true);
    const { departmentId, expectedCompletionDate, delayReason, resolutionNotes, ...rest } = values;
    try {
      await updateDepartmentProgress(project._id, departmentId, {
        ...rest,
        expectedCompletionDate: expectedCompletionDate || null,
      });

      if (delayReason && delayReason.trim()) {
        try {
          await createAlert({
            projectId: project._id,
            departmentId: departmentId || user?.department?._id,
            type: "Delay",
            severity: "High",
            message: delayReason.trim(),
          });
          toast.success("Delay reason submitted and authority notified");
        } catch {
          toast.error("Progress updated, but could not notify authority");
        }
      } else {
        toast.success("Progress update submitted and weighted score recalculated");
      }

      window.dispatchEvent(new Event("alertsUpdated"));
      navigate(`/projects/${project._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not submit update");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <Link
          to={`/projects/${project._id}`}
          className="flex items-center gap-1.5 text-xs font-semibold text-ink-400 hover:text-ochre-600 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Project Dossier
        </Link>
        <span className="font-mono text-xs font-bold text-ink-600 bg-ink-100 px-2.5 py-0.5 rounded-md">
          {project.code}
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-black tracking-tight text-ink-900">
          Update Stage: {activeDept?.displayName || "Department"}
        </h1>
        <p className="text-xs font-medium text-ink-400 mt-0.5">
          {project.name} · {project.district}, {project.state}
        </p>
      </div>

      {/* Live Simulation / Business Rules Preview Banner */}
      {(willBeAtRisk || willBeBottleneck) && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-4 text-xs text-amber-900 shadow-sm space-y-1">
          <div className="flex items-center gap-2 font-bold text-amber-950">
            <AlertTriangle size={16} className="text-amber-600" />
            <span>SIH 26016 Automated Rule Trigger Preview</span>
          </div>
          {willBeAtRisk && (
            <p>
              • Actual progress ({currentActual}%) trails planned ({currentPlanned}%) by ≥10 points. The system will flag this department as <strong className="text-amber-800">At Risk</strong>.
            </p>
          )}
          {willBeBottleneck && (
            <p>
              • Pending cases ({currentPending}) &gt; 20 and actual progress ({currentActual}%) &lt; 60%. The system will raise a <strong className="text-rose-700">Bottleneck Alert</strong> on the National Dashboard.
            </p>
          )}
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Department selector (Admin/PM only) */}
          {!isOfficer && (
            <Field label="Target Department Stage" error={errors.departmentId?.message}>
              <select {...register("departmentId")} className="input font-semibold">
                {departments.map((d) => (
                  <option key={d._id} value={String(d._id)}>
                    {d.displayName} (Weight: {d.weight}%)
                  </option>
                ))}
              </select>
            </Field>
          )}

          {/* Status Selection */}
          <Field label="Current Milestone Status" error={errors.status?.message}>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {["NotStarted", "OnTrack", "AtRisk", "Delayed", "Completed"].map((s) => {
                const isSelected = currentStatus === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setValue("status", s)}
                    className={`rounded-xl border p-2.5 text-center text-xs font-bold transition-all ${
                      isSelected
                        ? "border-ochre-500 bg-ochre-50 text-ochre-900 ring-2 ring-ochre-500/20 shadow-sm"
                        : "border-ink-100 bg-white text-ink-600 hover:bg-ink-50"
                    }`}
                  >
                    {s.replace(/([A-Z])/g, " $1").trim()}
                  </button>
                );
              })}
            </div>
            <input type="hidden" {...register("status")} />
          </Field>

          {/* Progress Sliders & Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 rounded-2xl bg-ink-50/60 p-4 border border-ink-100">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-ink-700">
                  Actual Verified Progress
                </label>
                <span className="font-black data-figure text-sm text-ochre-600">
                  {currentActual}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                {...register("actualProgress")}
                className="w-full accent-ochre-600 cursor-pointer"
              />
              <input
                type="number"
                min={0}
                max={100}
                {...register("actualProgress")}
                className="input mt-2 font-mono font-bold"
              />
              {errors.actualProgress && (
                <p className="mt-1 text-xs text-rose-500">{errors.actualProgress.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-ink-700">
                  Planned Target Progress
                </label>
                <span className="font-black data-figure text-sm text-ink-700">
                  {currentPlanned}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                {...register("plannedProgress")}
                className="w-full accent-ink-800 cursor-pointer"
              />
              <input
                type="number"
                min={0}
                max={100}
                {...register("plannedProgress")}
                className="input mt-2 font-mono font-bold"
              />
              {errors.plannedProgress && (
                <p className="mt-1 text-xs text-rose-500">{errors.plannedProgress.message}</p>
              )}
            </div>
          </div>

          {/* Cases count */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Pending Cases Backlog" error={errors.pendingCases?.message}>
              <input
                type="number"
                min={0}
                {...register("pendingCases")}
                className="input font-mono font-bold"
                placeholder="0"
              />
              <p className="text-[10px] text-ink-400 mt-1">Cases currently pending action or dispute</p>
            </Field>

            <Field label="Completed Cases" error={errors.completedCases?.message}>
              <input
                type="number"
                min={0}
                {...register("completedCases")}
                className="input font-mono font-bold"
                placeholder="0"
              />
              <p className="text-[10px] text-ink-400 mt-1">Successfully cleared/disbursed cases</p>
            </Field>
          </div>

          {/* Delay reason */}
          <Field label="Reason for Delay or Issue (Optional)">
            <textarea
              rows={2}
              {...register("delayReason")}
              className="input resize-none"
              placeholder="e.g. Title disputes in survey parcel #44B, waiting for Tahsildar clearance"
            />
          </Field>

          {/* Resolution Remarks */}
          <Field label="Resolution Remarks (Optional)">
            <textarea
              rows={3}
              {...register("resolutionNotes")}
              className="input resize-none border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500 bg-emerald-50/10 text-xs"
              placeholder="If you resolved an earlier bottleneck, dependency, delay, or dispute in this stage, write how it was resolved (actions taken, orders passed, settlement terms reached) to automatically log it into the project dossier."
            />
            <p className="text-[10px] text-emerald-700 mt-1 font-medium">
              ✓ Documenting how you resolved an issue will record an entry in the Resolution Center.
            </p>
          </Field>

          {/* Expected Date */}
          <Field label="Expected Stage Completion Date">
            <input
              type="date"
              {...register("expectedCompletionDate")}
              className="input font-medium"
            />
          </Field>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-ink-100">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-xl border border-ink-200 px-4 py-2.5 text-xs font-semibold text-ink-600 hover:bg-ink-50 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-ochre-500 to-ochre-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-ochre-500/20 hover:from-ochre-600 hover:to-ochre-700 transition-all disabled:opacity-60"
            >
              <Send size={14} />
              <span>{submitting ? "Submitting Telemetry…" : "Publish Stage Update"}</span>
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-700">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-rose-500 font-medium">{error}</p>}
    </div>
  );
}
