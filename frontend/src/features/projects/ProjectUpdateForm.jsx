import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { fetchProject, updateDepartmentProgress } from "../../api/projects.js";
import { useAuthStore } from "../../store/authStore.js";
import Card from "../../components/Card.jsx";

const schema = z.object({
  status: z.enum(["NotStarted", "OnTrack", "AtRisk", "Delayed", "Completed"]),
  actualProgress: z.coerce.number().min(0).max(100),
  plannedProgress: z.coerce.number().min(0).max(100),
  pendingCases: z.coerce.number().min(0),
  completedCases: z.coerce.number().min(0),
  delayReason: z.string().optional(),
  expectedCompletionDate: z.string().optional(),
});

// This is the "Department update form" from the frontend dev's task list:
// status selection, progress entry, pending work, reasons, expected dates.
export default function ProjectUpdateForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [project, setProject] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    fetchProject(id).then((p) => {
      setProject(p);
      const mine = p.departments.find((d) => String(d.department._id) === String(user?.department?._id));
      if (mine) {
        reset({
          status: mine.status,
          actualProgress: mine.actualProgress,
          plannedProgress: mine.plannedProgress,
          pendingCases: mine.pendingCases,
          completedCases: mine.completedCases,
          delayReason: mine.delayReason,
          expectedCompletionDate: mine.expectedCompletionDate
            ? mine.expectedCompletionDate.slice(0, 10)
            : "",
        });
      }
    });
  }, [id, user, reset]);

  if (!project) return <p className="text-sm text-ink-300">Loading…</p>;

  const myEntry = project.departments.find((d) => String(d.department._id) === String(user?.department?._id));
  if (!myEntry) {
    return <p className="text-sm text-status-delayed">Your department is not assigned to this project.</p>;
  }

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      await updateDepartmentProgress(project._id, myEntry.department._id, values);
      toast.success("Update submitted successfully");
      navigate(`/projects/${project._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not submit update");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-ink-300">{project.code}</p>
        <h1 className="text-xl font-bold text-ink-900">Update: {myEntry.department.displayName}</h1>
        <p className="text-sm text-ink-300">{project.name}</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Field label="Status" error={errors.status?.message}>
            <select {...register("status")} className="input">
              {["NotStarted", "OnTrack", "AtRisk", "Delayed", "Completed"].map((s) => (
                <option key={s} value={s}>
                  {s.replace(/([A-Z])/g, " $1").trim()}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Actual progress (%)" error={errors.actualProgress?.message}>
              <input type="number" min={0} max={100} {...register("actualProgress")} className="input" />
            </Field>
            <Field label="Planned progress (%)" error={errors.plannedProgress?.message}>
              <input type="number" min={0} max={100} {...register("plannedProgress")} className="input" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Pending cases" error={errors.pendingCases?.message}>
              <input type="number" min={0} {...register("pendingCases")} className="input" />
            </Field>
            <Field label="Completed cases" error={errors.completedCases?.message}>
              <input type="number" min={0} {...register("completedCases")} className="input" />
            </Field>
          </div>

          <Field label="Reason for delay (if any)">
            <textarea rows={3} {...register("delayReason")} className="input" placeholder="e.g. Landowner verification pending" />
          </Field>

          <Field label="Expected completion date">
            <input type="date" {...register("expectedCompletionDate")} className="input" />
          </Field>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-ink-500 hover:bg-ink-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit update"}
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
      <label className="mb-1 block text-sm font-medium text-ink-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-status-delayed">{error}</p>}
    </div>
  );
}
