import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { X, Loader2 } from "lucide-react";
import { createProject } from "../../api/projects.js";

const STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa",
  "Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala",
  "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland",
  "Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
  "Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu and Kashmir","Ladakh",
];

const schema = z.object({
  name: z.string().min(3, "Project name must be at least 3 characters"),
  code: z.string().min(2, "Project code is required (e.g. NH-44-KA-2026)"),
  state: z.string().min(1, "Select a state"),
  district: z.string().min(2, "District is required"),
  implementingAgency: z.string().min(2, "Implementing agency is required"),
  startDate: z.string().min(1, "Start date is required"),
  plannedCompletionDate: z.string().min(1, "Planned completion date is required"),
  areaNotified: z.coerce.number().min(0).default(0),
  areaAcquired: z.coerce.number().min(0).default(0),
  affectedFamilies: z.coerce.number().min(0).default(0),
  displacedFamilies: z.coerce.number().min(0).default(0),
  compensationAssessed: z.coerce.number().min(0).default(0),
  compensationDisbursed: z.coerce.number().min(0).default(0),
  latitude: z.coerce.number().min(-90).max(90).default(22.97),
  longitude: z.coerce.number().min(-180).max(180).default(78.65),
});

export default function CreateProjectModal({ onClose, onCreated }) {
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    setSubmitting(true);
    const { latitude, longitude, ...rest } = values;
    try {
      const project = await createProject({
        ...rest,
        location: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
      });
      toast.success(`Project "${project.name}" created!`);
      onCreated(project);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create project");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-100 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-ink-900">Create New Project</h2>
            <p className="text-xs text-ink-300">Land acquisition project under SIH 26016 workflow</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-ink-300 hover:bg-ink-50 hover:text-ink-700"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-6 py-5">
          {/* Basic info */}
          <Section title="Project Details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Project Name" error={errors.name?.message} className="sm:col-span-2">
                <input
                  {...register("name")}
                  placeholder="e.g. NH-44 Highway Expansion — Phase 2"
                  className="input"
                />
              </Field>
              <Field label="Project Code" error={errors.code?.message}>
                <input
                  {...register("code")}
                  placeholder="e.g. NH44-P2-2026"
                  className="input"
                />
              </Field>
              <Field label="Implementing Agency" error={errors.implementingAgency?.message}>
                <input
                  {...register("implementingAgency")}
                  placeholder="e.g. NHAI"
                  className="input"
                />
              </Field>
              <Field label="State" error={errors.state?.message}>
                <select
                  {...register("state")}
                  onChange={(e) => {
                    const st = e.target.value;
                    const stateCoords = {
                      "Karnataka": [15.3173, 75.7139],
                      "Bihar": [25.0961, 85.3131],
                      "Maharashtra": [19.7515, 75.7139],
                      "Gujarat": [22.2587, 71.1924],
                      "Uttar Pradesh": [26.8467, 80.9462],
                      "Delhi": [28.7041, 77.1025],
                      "Tamil Nadu": [11.1271, 78.6569],
                      "Andhra Pradesh": [15.9129, 79.7400],
                      "Telangana": [18.1124, 79.0193],
                      "West Bengal": [22.9868, 87.8550],
                      "Rajasthan": [27.0238, 74.2179],
                      "Madhya Pradesh": [22.9734, 78.6569],
                    };
                    if (stateCoords[st]) {
                      setValue("latitude", stateCoords[st][0]);
                      setValue("longitude", stateCoords[st][1]);
                    }
                  }}
                  className="input font-semibold"
                >
                  <option value="">Select state…</option>
                  {STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="District" error={errors.district?.message}>
                <input
                  {...register("district")}
                  placeholder="e.g. Belagavi"
                  className="input"
                />
              </Field>
              <Field label="Start Date" error={errors.startDate?.message}>
                <input type="date" {...register("startDate")} className="input" />
              </Field>
              <Field label="Planned Completion Date" error={errors.plannedCompletionDate?.message}>
                <input type="date" {...register("plannedCompletionDate")} className="input" />
              </Field>
            </div>
          </Section>

          {/* Land & Family Data */}
          <Section title="Land &amp; Family Data">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Area Notified (ha)" error={errors.areaNotified?.message}>
                <input type="number" min={0} {...register("areaNotified")} className="input" defaultValue={0} />
              </Field>
              <Field label="Area Acquired (ha)" error={errors.areaAcquired?.message}>
                <input type="number" min={0} {...register("areaAcquired")} className="input" defaultValue={0} />
              </Field>
              <Field label="Affected Families" error={errors.affectedFamilies?.message}>
                <input type="number" min={0} {...register("affectedFamilies")} className="input" defaultValue={0} />
              </Field>
              <Field label="Displaced Families" error={errors.displacedFamilies?.message}>
                <input type="number" min={0} {...register("displacedFamilies")} className="input" defaultValue={0} />
              </Field>
              <Field label="Compensation Assessed (₹)" error={errors.compensationAssessed?.message}>
                <input type="number" min={0} {...register("compensationAssessed")} className="input" defaultValue={0} />
              </Field>
              <Field label="Compensation Disbursed (₹)" error={errors.compensationDisbursed?.message}>
                <input type="number" min={0} {...register("compensationDisbursed")} className="input" defaultValue={0} />
              </Field>
            </div>
          </Section>

          {/* GIS Coordinates */}
          <Section title="GIS Location (geo-tagging)">
            <p className="mb-3 text-xs text-ink-300">
              Enter coordinates to pin this project on the national map. You can find coordinates from Google Maps
              (right-click a location → "What's here?").
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Latitude" error={errors.latitude?.message}>
                <input
                  type="number"
                  step="any"
                  {...register("latitude")}
                  placeholder="e.g. 15.8497"
                  className="input"
                  defaultValue={22.97}
                />
              </Field>
              <Field label="Longitude" error={errors.longitude?.message}>
                <input
                  type="number"
                  step="any"
                  {...register("longitude")}
                  placeholder="e.g. 74.4977"
                  className="input"
                  defaultValue={78.65}
                />
              </Field>
            </div>
          </Section>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-ink-500 hover:bg-ink-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-ink-900 px-5 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {submitting ? "Creating…" : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-500">{title}</p>
      {children}
    </div>
  );
}

function Field({ label, error, children, className = "" }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-ink-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-status-delayed">{error}</p>}
    </div>
  );
}
