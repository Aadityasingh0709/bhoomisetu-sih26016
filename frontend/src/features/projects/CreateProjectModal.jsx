import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import {
  X,
  Loader2,
  KeyRound,
  Copy,
  Check,
  Building,
  ShieldCheck,
  Sparkles,
  MapPin,
  Scale,
  Coins,
  Home,
  FileCheck,
  Flag,
  UserCheck,
  MessageCircle,
  Mail,
  Phone,
  Send,
} from "lucide-react";
import { createProject, fetchDepartments, dispatchOfficerCredentials } from "../../api/projects.js";

const STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa",
  "Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala",
  "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland",
  "Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
  "Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu and Kashmir","Ladakh",
];

const DEPT_ICONS = {
  Survey: MapPin,
  LegalVerification: Scale,
  Compensation: Coins,
  Rehabilitation: Home,
  Approvals: FileCheck,
  Possession: Flag,
};

const schema = z.object({
  name: z.string().min(3, "Project name must be at least 3 characters"),
  code: z.string().min(2, "Project code is required (e.g. NH44-P2-2026)"),
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
  const [departments, setDepartments] = useState([]);
  const [officerCredentials, setOfficerCredentials] = useState([]);
  const [createdProjectSummary, setCreatedProjectSummary] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [dispatching, setDispatching] = useState({});

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const watchedCode = watch("code");

  useEffect(() => {
    fetchDepartments()
      .then((depts) => {
        const sorted = (depts || []).sort((a, b) => a.order - b.order);
        setDepartments(sorted);
        initOfficerCredentials(sorted, watchedCode || "PROJ");
      })
      .catch(() => {});
  }, []);

  const initOfficerCredentials = (deptList, codeStr) => {
    const cleanCode = (codeStr || "PROJ").toLowerCase().replace(/[^a-z0-9]/g, "");
    const initial = deptList.map((d) => {
      const deptSlug = d.name.toLowerCase();
      return {
        departmentId: d._id,
        departmentName: d.name,
        displayName: d.displayName,
        weight: d.weight,
        name: `${d.displayName} Lead Officer`,
        email: `${deptSlug}.${cleanCode || "proj"}@landacquisition.gov.in`,
        password: `${d.name}@2026Secure!`,
        phone: "",
        notificationEmail: "",
      };
    });
    setOfficerCredentials(initial);
  };

  // When project code changes, update suggested emails
  useEffect(() => {
    if (watchedCode && departments.length) {
      const cleanCode = watchedCode.toLowerCase().replace(/[^a-z0-9]/g, "");
      setOfficerCredentials((prev) =>
        prev.map((item) => ({
          ...item,
          email: `${item.departmentName.toLowerCase()}.${cleanCode || "proj"}@landacquisition.gov.in`,
        }))
      );
    }
  }, [watchedCode]);

  const handleOfficerChange = (index, field, value) => {
    setOfficerCredentials((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleGenerateRandomPasswords = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    setOfficerCredentials((prev) =>
      prev.map((item) => {
        let pass = item.departmentName.slice(0, 3) + "@2026";
        for (let i = 0; i < 4; i++) {
          pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return { ...item, password: pass };
      })
    );
    toast.success("Generated new departmental passwords!");
  };

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
        departmentOfficers: officerCredentials.map((oc) => ({
          departmentId: oc.departmentId,
          departmentName: oc.departmentName,
          name: oc.name,
          email: oc.email,
          password: oc.password,
          phone: oc.phone,
          notificationEmail: oc.notificationEmail,
        })),
      });

      toast.success(`Project "${project.name}" created successfully!`);
      setCreatedProjectSummary({
        project,
        credentials: officerCredentials,
      });
      if (onCreated) onCreated(project);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create project");
      setSubmitting(false);
    }
  };

  const copyCredentialsToClipboard = () => {
    if (!createdProjectSummary) return;
    const text = [
      `=====================================================`,
      `BHOOMISETU PROJECT CREDENTIALS DOSSIER`,
      `Project Name: ${createdProjectSummary.project.name}`,
      `Project Code / ID: ${createdProjectSummary.project.code}`,
      `Jurisdiction: ${createdProjectSummary.project.district}, ${createdProjectSummary.project.state}`,
      `=====================================================`,
      `DEPARTMENTAL OFFICER LOGIN CREDENTIALS:`,
      `Note: Officers must enter the Project ID "${createdProjectSummary.project.code}" on login.`,
      `-----------------------------------------------------`,
      ...createdProjectSummary.credentials.map(
        (c) =>
          `[${c.displayName}] (${c.weight}% Weight)\nOfficer Name: ${c.name}\nEmail / User ID: ${c.email}\nPassword: ${c.password}${c.phone ? `\nWhatsApp/Phone: ${c.phone}` : ""}${c.notificationEmail ? `\nNotification Email: ${c.notificationEmail}` : ""}\n`
      ),
      `=====================================================`,
    ].join("\n");

    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    toast.success("All Project Credentials copied to clipboard!");
    setTimeout(() => setCopiedAll(false), 3000);
  };

  // Build and open WhatsApp message for a single officer
  const dispatchWhatsApp = (c, projectCode) => {
    const rawPhone = c.phone || "";
    // Strip non-numeric characters, add country code if missing
    const cleaned = rawPhone.replace(/\D/g, "");
    const phone = cleaned.startsWith("91") ? cleaned : cleaned ? `91${cleaned}` : "";
    if (!phone) {
      toast.error(`No WhatsApp number set for ${c.displayName} Officer`);
      return;
    }
    const msg = [
      `🏗️ *BhoomiSetu – Project Login Credentials*`,
      ``,
      `Dear *${c.name}*,`,
      ``,
      `Your login credentials for the land acquisition project have been created on the BhoomiSetu platform.`,
      ``,
      `📋 *Project ID:* \`${projectCode}\``,
      `🏢 *Department:* ${c.displayName}`,
      `📧 *Login Email / User ID:* ${c.email}`,
      `🔑 *Password:* ${c.password}`,
      ``,
      `*Steps to Login:*`,
      `1. Go to the BhoomiSetu portal`,
      `2. Enter Project ID: *${projectCode}*`,
      `3. Enter your Email and Password above`,
      ``,
      `Please change your password after first login.`,
      ``,
      `— System Administrator, BhoomiSetu`,
    ].join("\n");
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
    setDispatching((prev) => ({ ...prev, [`wa_${c.departmentName}`]: true }));
    toast.success(`WhatsApp opened for ${c.displayName} Officer!`);
    setTimeout(() => setDispatching((prev) => ({ ...prev, [`wa_${c.departmentName}`]: false })), 3000);
  };

  // Build and open Email client for a single officer
  const dispatchEmail = (c, projectCode) => {
    const toEmail = c.notificationEmail || c.email;
    const subject = encodeURIComponent(`BhoomiSetu Login Credentials – Project ${projectCode}`);
    const body = encodeURIComponent(
      [
        `Dear ${c.name},`,
        ``,
        `Your login credentials for the BhoomiSetu Land Acquisition Monitoring System have been created.`,
        ``,
        `Project ID: ${projectCode}`,
        `Department: ${c.displayName}`,
        `Login Email / User ID: ${c.email}`,
        `Password: ${c.password}`,
        ``,
        `Steps to Login:`,
        `1. Visit the BhoomiSetu portal`,
        `2. Enter Project ID: ${projectCode}`,
        `3. Enter your Email and Password as above`,
        ``,
        `Please change your password after your first login for security.`,
        ``,
        `Regards,`,
        `System Administrator`,
        `BhoomiSetu – SIH 26016`,
      ].join("\n")
    );
    window.open(`mailto:${toEmail}?subject=${subject}&body=${body}`, "_blank");
    setDispatching((prev) => ({ ...prev, [`em_${c.departmentName}`]: true }));
    toast.success(`Email client opened for ${c.displayName} Officer!`);
    setTimeout(() => setDispatching((prev) => ({ ...prev, [`em_${c.departmentName}`]: false })), 3000);
  };

  const [autoDispatching, setAutoDispatching] = useState(false);
  const [directSent, setDirectSent] = useState({});

  // Direct automated background dispatch via backend notification service
  const directAutoDispatch = async (deptId = null) => {
    if (!createdProjectSummary) return;
    const { project } = createdProjectSummary;
    setAutoDispatching(true);
    try {
      const res = await dispatchOfficerCredentials(project._id, { departmentId: deptId });
      toast.success(res.message || "Credentials dispatched directly via Email & WhatsApp!");

      // Auto-open WhatsApp web if server returned WhatsApp links and not using paid cloud API
      if (res.reports && res.reports.length > 0) {
        res.reports.forEach((rep) => {
          const waResult = (rep.dispatchResults || []).find((r) => r.channel === "whatsapp");
          if (waResult?.whatsappUrl && waResult?.mode === "Automated Gateway Direct Dispatch") {
            window.open(waResult.whatsappUrl, "_blank");
          }
          const emResult = (rep.dispatchResults || []).find((r) => r.channel === "email");
          if (emResult?.previewUrl) {
            console.log(`[BhoomiSetu] Live Email Preview for ${rep.officerName}: ${emResult.previewUrl}`);
          }
        });
      }

      if (deptId) {
        setDirectSent((prev) => ({ ...prev, [deptId]: true }));
        setTimeout(() => setDirectSent((prev) => ({ ...prev, [deptId]: false })), 4000);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Automated dispatch service failed");
    } finally {
      setAutoDispatching(false);
    }
  };

  // Dispatch all credentials via WhatsApp and Email at once (client-side fallback)
  const dispatchAll = () => {
    if (!createdProjectSummary) return;
    const { credentials, project } = createdProjectSummary;
    let dispatched = 0;
    credentials.forEach((c) => {
      if (c.phone) { dispatchWhatsApp(c, project.code); dispatched++; }
      if (c.notificationEmail || c.email) { dispatchEmail(c, project.code); dispatched++; }
    });
    if (dispatched === 0) toast.error("No contact info found. Please add phone/email before dispatching.");
  };

  // If created, render Credentials Distribution Screen
  if (createdProjectSummary) {
    const { project, credentials } = createdProjectSummary;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 backdrop-blur-sm p-3 sm:p-4">
        <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-emerald-100 bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4 text-white">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                <ShieldCheck size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold">Project Created &amp; Credentials Generated</h2>
                <p className="text-xs text-emerald-100">
                  Project ID: <span className="font-mono font-bold">{project.code}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-emerald-100 hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-xs font-bold text-emerald-900">
                  🚀 Automated Direct Background Dispatch Activated
                </p>
              </div>
              <p className="text-[11px] text-emerald-700">
                Official credentials have been automatically dispatched directly to each departmental officer's email address and WhatsApp phone number via the background notification service. You do not need to manually send or open anything!
              </p>
            </div>

            {/* Bulk dispatch banner */}
            <div className="flex flex-wrap gap-2 items-center justify-between rounded-xl border border-ink-200 bg-ink-50 px-4 py-3">
              <div>
                <p className="text-xs font-bold text-ink-900">Direct Automated Dispatch Control</p>
                <p className="text-[11px] text-ink-500">Re-send credentials directly to all officers via server in 1 click.</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={copyCredentialsToClipboard}
                  className="flex items-center gap-1.5 rounded-xl bg-ink-900 px-3 py-2 text-xs font-bold text-white hover:bg-ink-800 transition-all"
                >
                  {copiedAll ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copiedAll ? "Copied!" : "Copy All"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => directAutoDispatch()}
                  disabled={autoDispatching}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-2 text-xs font-bold text-white shadow hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50"
                >
                  <Send size={13} />
                  <span>{autoDispatching ? "Dispatching Directly..." : "Auto-Dispatch All Directly"}</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-500">
                Assigned Department Officers (6 Stages):
              </p>
              <div className="grid grid-cols-1 gap-3">
                {credentials.map((c) => {
                  const Icon = DEPT_ICONS[c.departmentName] || Building;
                  const waDone = dispatching[`wa_${c.departmentName}`];
                  const emDone = dispatching[`em_${c.departmentName}`];
                  return (
                    <div
                      key={c.departmentName}
                      className="rounded-xl border border-ink-100 bg-ink-50/50 p-3.5 text-xs space-y-2"
                    >
                      {/* Header row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-ink-900">
                          <Icon size={14} className="text-ochre-600" />
                          <span>{c.displayName}</span>
                        </div>
                        <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-bold text-ink-600">
                          {c.weight}% wt
                        </span>
                      </div>

                      {/* Credential details */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                        <div>
                          <span className="text-[10px] uppercase text-ink-400 font-bold">Login Email</span>
                          <p className="font-mono font-bold text-ink-900 truncate">{c.email}</p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase text-ink-400 font-bold">Password</span>
                          <p className="font-mono font-bold text-ink-900">{c.password}</p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase text-ink-400 font-bold">Notification Email</span>
                          <p className="font-mono text-ink-700 truncate">{c.notificationEmail || <span className="italic text-ink-300">—</span>}</p>
                        </div>
                      </div>

                      {/* Contact + Dispatch row */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-ink-100">
                        {c.phone ? (
                          <span className="flex items-center gap-1 text-[10px] text-ink-500">
                            <Phone size={10} /> {c.phone}
                          </span>
                        ) : (
                          <span className="text-[10px] italic text-ink-300">No phone set</span>
                        )}

                        <div className="ml-auto flex flex-wrap gap-1.5">
                          {/* Direct Automated Dispatch */}
                          <button
                            type="button"
                            onClick={() => directAutoDispatch(c.departmentId)}
                            disabled={autoDispatching}
                            title="Directly send credentials via background Email & WhatsApp service without manual apps"
                            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                              directSent[c.departmentId]
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-ink-900 text-white hover:bg-ink-800"
                            }`}
                          >
                            <Send size={11} />
                            {directSent[c.departmentId] ? "Dispatched!" : "Direct Send"}
                          </button>

                          {/* WhatsApp Manual Fallback */}
                          <button
                            type="button"
                            onClick={() => dispatchWhatsApp(c, project.code)}
                            disabled={!c.phone}
                            title={c.phone ? `Open WhatsApp Web to ${c.phone}` : "No phone number set"}
                            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-all ${
                              c.phone
                                ? waDone
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-green-600 text-white hover:bg-green-700"
                                : "bg-ink-100 text-ink-300 cursor-not-allowed"
                            }`}
                          >
                            <MessageCircle size={11} />
                            {waDone ? "Sent!" : "WhatsApp"}
                          </button>

                          {/* Email Manual Fallback */}
                          <button
                            type="button"
                            onClick={() => dispatchEmail(c, project.code)}
                            title={`Open email client for ${c.notificationEmail || c.email}`}
                            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-all ${
                              emDone
                                ? "bg-blue-100 text-blue-700"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
                          >
                            <Mail size={11} />
                            {emDone ? "Opened!" : "Email"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-ink-100">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-gradient-to-r from-ochre-500 to-ochre-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:from-ochre-600 hover:to-ochre-700"
              >
                Done / View in Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 backdrop-blur-sm p-3 sm:p-4">
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-100 bg-white px-4 sm:px-6 py-3.5 sm:py-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-ink-900">Create New Project &amp; Issue Department IDs</h2>
            <p className="text-xs text-ink-400">Land acquisition project under SIH 26016 with project-scoped department accounts</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-ink-400 hover:bg-ink-50 hover:text-ink-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-4 sm:px-6 py-4 sm:py-5">
          {/* Basic info */}
          <Section title="1. Project Details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Project Name" error={errors.name?.message} className="sm:col-span-2">
                <input
                  {...register("name")}
                  placeholder="e.g. NH-44 Highway Expansion — Phase 2"
                  className="input"
                />
              </Field>
              <Field label="Project ID / Code (Unique Key)" error={errors.code?.message}>
                <input
                  {...register("code")}
                  placeholder="e.g. NH44-P2-2026"
                  className="input font-mono font-bold uppercase"
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

          {/* Department Officer ID & Password Setup */}
          <Section
            title="2. Department Officer Accounts & Passwords (Project-Scoped)"
            action={
              <button
                type="button"
                onClick={handleGenerateRandomPasswords}
                className="flex items-center gap-1 rounded-lg border border-ochre-300 bg-ochre-50 px-2.5 py-1 text-[11px] font-bold text-ochre-800 hover:bg-ochre-100 transition-colors"
              >
                <Sparkles size={12} />
                <span>Generate Passwords</span>
              </button>
            }
          >
            <p className="text-xs text-ink-500 mb-3">
              Configure credentials for officers handling each stage. They will use the{" "}
              <strong>Project ID ({watchedCode || "CODE"})</strong> and these credentials to log in.
              Add the officer's <strong>current phone/WhatsApp</strong> and{" "}
              <strong>notification email</strong> so credentials can be dispatched directly.
            </p>

            <div className="space-y-3">
              {officerCredentials.map((oc, idx) => {
                const Icon = DEPT_ICONS[oc.departmentName] || Building;
                return (
                  <div
                    key={oc.departmentName}
                    className="rounded-xl border border-ink-200 bg-ink-50/40 p-3.5 space-y-2.5 hover:border-ink-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-ochre-500/10 text-ochre-700">
                          <Icon size={14} />
                        </div>
                        <span className="text-xs font-bold text-ink-900">
                          Stage #{idx + 1}: {oc.displayName}
                        </span>
                        <span className="rounded bg-white border border-ink-200 px-1.5 py-0.5 text-[10px] font-bold text-ink-600">
                          {oc.weight}% Weight
                        </span>
                      </div>
                    </div>

                    {/* Row 1: Name, Login Email, Password */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-ink-400 block mb-0.5">
                          Officer Name
                        </label>
                        <input
                          type="text"
                          value={oc.name}
                          onChange={(e) => handleOfficerChange(idx, "name", e.target.value)}
                          placeholder="Officer Name"
                          className="input text-xs py-1.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-ink-400 block mb-0.5">
                          Login Email / User ID
                        </label>
                        <input
                          type="email"
                          value={oc.email}
                          onChange={(e) => handleOfficerChange(idx, "email", e.target.value)}
                          placeholder="officer@email.gov.in"
                          className="input text-xs py-1.5 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-ink-400 block mb-0.5">
                          Password
                        </label>
                        <input
                          type="text"
                          value={oc.password}
                          onChange={(e) => handleOfficerChange(idx, "password", e.target.value)}
                          placeholder="Password"
                          className="input text-xs py-1.5 font-mono"
                        />
                      </div>
                    </div>

                    {/* Row 2: Notification Email + WhatsApp/Phone — NEW */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-ink-100">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-ink-400 block mb-0.5 flex items-center gap-1">
                          <Mail size={9} className="text-blue-500" />
                          Officer's Current Notification Email
                        </label>
                        <input
                          type="email"
                          value={oc.notificationEmail}
                          onChange={(e) => handleOfficerChange(idx, "notificationEmail", e.target.value)}
                          placeholder="personal@gmail.com (for sending credentials)"
                          className="input text-xs py-1.5"
                        />
                        <p className="text-[9px] text-ink-400 mt-0.5">
                          Credentials will be sent here. Leave blank to use login email.
                        </p>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-ink-400 block mb-0.5 flex items-center gap-1">
                          <MessageCircle size={9} className="text-green-500" />
                          WhatsApp / Mobile Number
                        </label>
                        <input
                          type="tel"
                          value={oc.phone}
                          onChange={(e) => handleOfficerChange(idx, "phone", e.target.value)}
                          placeholder="e.g. +91 98765 43210"
                          className="input text-xs py-1.5"
                        />
                        <p className="text-[9px] text-ink-400 mt-0.5">
                          Credentials will be sent via WhatsApp after project creation.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Land & Family Data */}
          <Section title="3. Land &amp; Family Data">
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
          <Section title="4. GIS Location Coordinates">
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

          <div className="flex justify-end gap-3 pt-3 border-t border-ink-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-bold text-ink-600 hover:bg-ink-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-ochre-500 to-ochre-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-ochre-500/20 hover:from-ochre-600 hover:to-ochre-700 disabled:opacity-60 transition-all"
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              {submitting ? "Creating Project & Credentials…" : "Create Project & Generate IDs"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Section({ title, action, children }) {
  return (
    <div className="border-t border-ink-100 pt-4 first:border-0 first:pt-0">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-wider text-ink-600">{title}</p>
        {action}
      </div>
      {children}
    </div>
  );
}

function Field({ label, error, children, className = "" }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-ink-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
    </div>
  );
}
