import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  Landmark,
  Loader2,
  ShieldCheck,
  MapPin,
  Scale,
  Coins,
  Home,
  FileCheck,
  Flag,
  ArrowRight,
  Layers,
  Sparkles,
  Eye,
  EyeOff,
  FolderKanban,
  CheckCircle2,
  Building,
  ArrowLeft,
  Search,
  UserCheck,
  Shield,
  X,
  ChevronRight,
} from "lucide-react";
import { loginRequest, validateProjectCode, lookupProjects } from "../../api/auth.js";
import { useAuthStore } from "../../store/authStore.js";

const officerSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const adminSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function LoginPage() {
  const [authMode, setAuthMode] = useState("officer"); // "officer" | "admin"
  const [step, setStep] = useState(1); // 1 = Select/Search Project ID, 2 = Enter Officer Credentials
  const [projectCodeInput, setProjectCodeInput] = useState("");
  const [validatingProject, setValidatingProject] = useState(false);
  const [verifiedProject, setVerifiedProject] = useState(null);

  // Dynamic live projects search & lookup
  const [projectsList, setProjectsList] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchContainerRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  const {
    register: registerOfficer,
    handleSubmit: handleOfficerSubmit,
    setValue: setOfficerValue,
    formState: { errors: officerErrors },
  } = useForm({ resolver: zodResolver(officerSchema) });

  const {
    register: registerAdmin,
    handleSubmit: handleAdminSubmit,
    setValue: setAdminValue,
    formState: { errors: adminErrors },
  } = useForm({ resolver: zodResolver(adminSchema) });

  // Fetch all live projects from database on mount & refresh
  const fetchLiveProjects = async (query = "") => {
    setLoadingProjects(true);
    try {
      const data = await lookupProjects(query);
      setProjectsList(data.projects || []);
    } catch (err) {
      console.error("Failed to fetch live projects:", err);
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    fetchLiveProjects("");
  }, []);

  // Filter projects dynamically based on search query
  const filteredProjects = projectsList.filter((p) => {
    if (!projectCodeInput.trim()) return true;
    const q = projectCodeInput.toLowerCase().trim();
    return (
      p.code?.toLowerCase().includes(q) ||
      p.name?.toLowerCase().includes(q) ||
      p.district?.toLowerCase().includes(q) ||
      p.state?.toLowerCase().includes(q) ||
      p.implementingAgency?.toLowerCase().includes(q)
    );
  });

  // Handle outside click to close search suggestions
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectProject = (project) => {
    setVerifiedProject(project);
    setProjectCodeInput(project.code);
    setSearchFocused(false);
    setStep(2);
    toast.success(`Project Selected: ${project.name}`);
  };

  const handleValidateProject = async (codeToTest) => {
    const code = (codeToTest || projectCodeInput).trim();
    if (!code) {
      toast.error("Please search and select or enter a Project ID (e.g. NH44-P2-2026)");
      return;
    }

    setValidatingProject(true);
    try {
      const data = await validateProjectCode(code);
      setVerifiedProject(data.project);
      setProjectCodeInput(data.project.code);
      setSearchFocused(false);
      setStep(2);
      toast.success(`Project Verified: ${data.project.name}`);
    } catch (err) {
      toast.error(err.response?.data?.message || `Project "${code}" not found in system.`);
    } finally {
      setValidatingProject(false);
    }
  };

  const executeOfficerLogin = async (values) => {
    if (!verifiedProject) {
      toast.error("Please select your Project first.");
      setStep(1);
      return;
    }

    setLoading(true);
    try {
      const { token, user } = await loginRequest(values.email, values.password, verifiedProject.code);
      setSession(token, user);
      toast.success(`Welcome, ${user.name}`);
      navigate("/department");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const executeAdminLogin = async (values) => {
    setLoading(true);
    try {
      const { token, user } = await loginRequest(values.email, values.password);
      setSession(token, user);
      toast.success(`Welcome, ${user.name}`);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const stageIcons = [
    { name: "Survey", weight: "15%", icon: MapPin },
    { name: "Legal", weight: "15%", icon: Scale },
    { name: "Compensation", weight: "30%", icon: Coins },
    { name: "Rehabilitation", weight: "25%", icon: Home },
    { name: "Approvals", weight: "5%", icon: FileCheck },
    { name: "Possession", weight: "10%", icon: Flag },
  ];

  return (
    <div className="flex min-h-screen bg-slate-900 text-ink-100">
      {/* Left Column: Hero & Government Platform Context */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden bg-gradient-to-br from-ink-950 via-ink-900 to-slate-900 border-r border-ink-800">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-ochre-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        {/* Brand & Emblem */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-ochre-500 to-ochre-600 text-white shadow-xl shadow-ochre-500/30">
              <Landmark size={26} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-white">BhoomiSetu</span>
                <span className="rounded-full bg-ochre-500/20 border border-ochre-500/30 px-2.5 py-0.5 text-[10px] font-bold text-ochre-300">
                  SIH 26016
                </span>
              </div>
              <p className="text-xs font-medium text-ink-300">
                Ministry of Rural Development · Dept. of Land Resources (DoLR)
              </p>
            </div>
          </div>
        </div>

        {/* Center Narrative */}
        <div className="relative z-10 my-auto py-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-ochre-300 mb-6">
            <Sparkles size={14} />
            <span>Project-Scoped Multi-Department Synchronization</span>
          </div>

          <h2 className="text-3xl font-extrabold text-white leading-tight tracking-tight max-w-lg">
            Role &amp; Project Scoped Authentication for National Land Lifecycle.
          </h2>

          <p className="mt-4 text-sm text-ink-300 leading-relaxed max-w-md">
            Departmental officers search their specific infrastructure project to access their milestone and clearance workspace.
            System Administrators oversee all projects and manage departmental assignments seamlessly.
          </p>

          {/* 6-Stage Weight Pipeline Visual */}
          <div className="mt-8 rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ochre-400 mb-3 flex items-center gap-2">
              <Layers size={14} /> 6-Stage Inter-Departmental Lifecycle
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              {stageIcons.map((st) => {
                const Icon = st.icon;
                return (
                  <div
                    key={st.name}
                    className="flex items-center gap-2 rounded-xl bg-white/5 p-2.5 border border-white/5"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-ochre-500/20 text-ochre-300">
                      <Icon size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white leading-none">{st.name}</p>
                      <p className="text-[10px] font-mono text-ink-400 mt-0.5">{st.weight} weight</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Tag */}
        <div className="relative z-10 flex items-center justify-between text-[11px] text-ink-400 border-t border-white/10 pt-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>2-Step Project-Scoped Security · Role-Based Access Control</span>
          </div>
          <span className="text-ink-400 font-mono">v1.2.0</span>
        </div>
      </div>

      {/* Right Column: Dynamic Login Form */}
      <div className="flex flex-1 flex-col justify-center items-center p-6 sm:p-10 bg-slate-950 overflow-y-auto">
        <div className="w-full max-w-md space-y-5">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-ochre-500 text-white mb-2 shadow-lg">
              <Landmark size={24} />
            </div>
            <h1 className="text-xl font-bold text-white">BhoomiSetu</h1>
            <p className="text-xs text-ink-400">National Land Acquisition &amp; Management System</p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 rounded-xl bg-ink-900/80 p-1 border border-ink-800">
            <button
              type="button"
              onClick={() => {
                setAuthMode("officer");
              }}
              className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all ${
                authMode === "officer"
                  ? "bg-gradient-to-r from-ochre-500 to-ochre-600 text-white shadow-md"
                  : "text-ink-400 hover:text-white"
              }`}
            >
              <FolderKanban size={14} />
              <span>Department Officer</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("admin");
              }}
              className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all ${
                authMode === "admin"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                  : "text-ink-400 hover:text-white"
              }`}
            >
              <Shield size={14} />
              <span>Executive / Admin</span>
            </button>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              DEPARTMENT OFFICER: 2-STEP LOGIN WITH DYNAMIC PROJECT SEARCH
             ───────────────────────────────────────────────────────────── */}
          {authMode === "officer" && (
            <div className="rounded-2xl border border-ink-800 bg-ink-900/40 p-6 shadow-xl space-y-4">
              {/* Step Progress Indicators */}
              <div className="flex items-center justify-between border-b border-ink-800 pb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      step === 1
                        ? "bg-ochre-500 text-white"
                        : "bg-emerald-500 text-white"
                    }`}
                  >
                    {step === 1 ? "1" : "✓"}
                  </div>
                  <span className={`text-xs font-bold ${step === 1 ? "text-white" : "text-emerald-400"}`}>
                    1. Select Project
                  </span>
                </div>
                <div className="h-0.5 flex-1 mx-3 bg-ink-800" />
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      step === 2 ? "bg-ochre-500 text-white" : "bg-ink-800 text-ink-400"
                    }`}
                  >
                    2
                  </div>
                  <span className={`text-xs font-bold ${step === 2 ? "text-white" : "text-ink-400"}`}>
                    2. Officer Sign In
                  </span>
                </div>
              </div>

              {/* Step 1: Dynamic Live Project Search Bar */}
              {step === 1 && (
                <div className="space-y-4">
                  <div ref={searchContainerRef} className="relative">
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-ink-300">
                      Search &amp; Select Project <span className="text-ochre-400">*</span>
                    </label>
                    <p className="text-[11px] text-ink-400 mb-2">
                      Type your Project ID / Code, project name, or district to find your project.
                    </p>

                    <div className="relative">
                      <Search
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ochre-400 pointer-events-none"
                      />
                      <input
                        type="text"
                        value={projectCodeInput}
                        onFocus={() => setSearchFocused(true)}
                        onChange={(e) => {
                          setProjectCodeInput(e.target.value);
                          setSearchFocused(true);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (filteredProjects.length === 1) {
                              handleSelectProject(filteredProjects[0]);
                            } else {
                              handleValidateProject();
                            }
                          }
                        }}
                        placeholder="e.g. NH44, EFC, or search by name..."
                        className="w-full rounded-xl border border-ink-700 bg-ink-950 py-3 pl-10 pr-10 text-sm font-bold text-white placeholder-ink-500 outline-none focus:border-ochre-500 focus:ring-2 focus:ring-ochre-500/20 uppercase tracking-wide transition-all"
                      />
                      {projectCodeInput && (
                        <button
                          type="button"
                          onClick={() => {
                            setProjectCodeInput("");
                            fetchLiveProjects("");
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-white"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>

                    {/* Live Projects Dropdown List */}
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-ink-400 uppercase tracking-wider">
                        <span>
                          {filteredProjects.length} Available Project{filteredProjects.length === 1 ? "" : "s"}
                        </span>
                        {loadingProjects && (
                          <span className="flex items-center gap-1 text-ochre-400">
                            <Loader2 size={11} className="animate-spin" /> Fetching...
                          </span>
                        )}
                      </div>

                      <div className="max-h-56 overflow-y-auto space-y-1.5 pr-0.5 rounded-xl">
                        {filteredProjects.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-ink-800 bg-ink-950/40 p-4 text-center">
                            <p className="text-xs text-ink-400">No project matched "{projectCodeInput}"</p>
                            <p className="text-[10px] text-ink-500 mt-1">
                              Check your Project ID or enter the full project code.
                            </p>
                          </div>
                        ) : (
                          filteredProjects.map((p) => {
                            const isSelected = projectCodeInput.toUpperCase() === p.code.toUpperCase();
                            return (
                              <button
                                key={p.id || p.code}
                                type="button"
                                onClick={() => handleSelectProject(p)}
                                className={`group w-full flex items-center justify-between rounded-xl border p-3 text-left transition-all ${
                                  isSelected
                                    ? "border-ochre-500 bg-ochre-500/20 text-white"
                                    : "border-ink-800 bg-ink-950/80 text-ink-200 hover:border-ochre-500/60 hover:bg-ink-900"
                                }`}
                              >
                                <div className="space-y-0.5 truncate pr-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-ochre-400 tracking-wider">
                                      {p.code}
                                    </span>
                                    <span className="rounded bg-ink-800 px-1.5 py-0.2 text-[9px] font-semibold text-ink-300">
                                      {p.overallStatus || "Active"}
                                    </span>
                                  </div>
                                  <p className="text-xs font-bold text-white truncate">{p.name}</p>
                                  <p className="text-[10px] text-ink-400 truncate flex items-center gap-1">
                                    <MapPin size={10} className="text-ochre-500 shrink-0" />
                                    <span>
                                      {p.district ? `${p.district}, ` : ""}
                                      {p.state}
                                    </span>
                                    {p.implementingAgency && (
                                      <span className="text-ink-500">· {p.implementingAgency}</span>
                                    )}
                                  </p>
                                </div>
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-800/80 text-ink-400 group-hover:bg-ochre-500 group-hover:text-white transition-all shrink-0">
                                  <ChevronRight size={14} />
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Proceed button */}
                  <button
                    type="button"
                    disabled={validatingProject || !projectCodeInput.trim()}
                    onClick={() => handleValidateProject()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-ochre-500 to-ochre-600 py-3 text-sm font-bold text-white shadow-lg shadow-ochre-500/25 transition-all hover:from-ochre-600 hover:to-ochre-700 disabled:opacity-50"
                  >
                    {validatingProject ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        <span>Proceed to Officer Sign In</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Step 2: Officer Credentials with Verified Project */}
              {step === 2 && verifiedProject && (
                <form onSubmit={handleOfficerSubmit(executeOfficerLogin)} className="space-y-4">
                  {/* Selected Project Box */}
                  <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3.5 flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-emerald-400">
                            {verifiedProject.code}
                          </span>
                          <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-extrabold uppercase text-emerald-300">
                            Selected Project
                          </span>
                        </div>
                        <p className="text-xs font-bold text-white line-clamp-1 mt-0.5">
                          {verifiedProject.name}
                        </p>
                        <p className="text-[10px] text-emerald-300/80">
                          {verifiedProject.district ? `${verifiedProject.district}, ` : ""}
                          {verifiedProject.state}
                          {verifiedProject.implementingAgency ? ` · ${verifiedProject.implementingAgency}` : ""}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1);
                        fetchLiveProjects("");
                      }}
                      className="text-[11px] font-bold text-ochre-400 hover:text-ochre-300 hover:underline shrink-0"
                    >
                      Change Project
                    </button>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-ink-300">
                      Department Officer Login Email / ID <span className="text-ochre-400">*</span>
                    </label>
                    <input
                      type="email"
                      {...registerOfficer("email")}
                      placeholder="e.g. survey@landacquisition.gov.in"
                      className="w-full rounded-xl border border-ink-700 bg-ink-950 px-3.5 py-2.5 text-sm text-white placeholder-ink-400 outline-none focus:border-ochre-500 focus:ring-1 focus:ring-ochre-500"
                    />
                    {officerErrors.email && (
                      <p className="mt-1 text-xs text-rose-400">{officerErrors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-300">
                        Officer Password <span className="text-ochre-400">*</span>
                      </label>
                      <a
                        href="/forgot-password"
                        className="text-[11px] text-ochre-400 hover:text-ochre-300 transition-colors"
                      >
                        Forgot password?
                      </a>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        {...registerOfficer("password")}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-ink-700 bg-ink-950 px-3.5 py-2.5 pr-10 text-sm text-white placeholder-ink-400 outline-none focus:border-ochre-500 focus:ring-1 focus:ring-ochre-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-white transition-colors focus:outline-none"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {officerErrors.password && (
                      <p className="mt-1 text-xs text-rose-400">{officerErrors.password.message}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1);
                        fetchLiveProjects("");
                      }}
                      className="flex items-center justify-center gap-1 rounded-xl border border-ink-700 px-3 py-2.5 text-xs font-bold text-ink-300 hover:bg-ink-800 transition-all"
                    >
                      <ArrowLeft size={14} /> Change
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-ochre-500 to-ochre-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-ochre-500/25 transition-all hover:from-ochre-600 hover:to-ochre-700 disabled:opacity-60"
                    >
                      {loading ? <Loader2 size={18} className="animate-spin" /> : "Sign In to Project Workspace"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              EXECUTIVE / SYSTEM ADMINISTRATOR: DIRECT LOGIN (1-STEP)
             ───────────────────────────────────────────────────────────── */}
          {authMode === "admin" && (
            <form
              onSubmit={handleAdminSubmit(executeAdminLogin)}
              className="rounded-2xl border border-blue-900/50 bg-gradient-to-b from-blue-950/30 to-ink-900/40 p-6 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-xl p-2.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-blue-400 shrink-0" />
                  <span>Executive / Administrator Access</span>
                </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminValue("email", import.meta.env.VITE_DEMO_ADMIN_EMAIL || "admin@bhoomisetu.gov.in", { shouldValidate: true });
                      setAdminValue("password", import.meta.env.VITE_DEMO_ADMIN_PASSWORD || "", { shouldValidate: true });
                      toast.success("Auto-filled Administrator credentials");
                    }}
                    className="text-[10px] text-blue-300 hover:underline"
                  >
                    Quick Fill Admin
                  </button>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-ink-300">
                  Administrator / Executive Email
                </label>
                <input
                  type="email"
                  {...registerAdmin("email")}
                  placeholder="admin@bhoomisetu.gov.in"
                  className="w-full rounded-xl border border-ink-700 bg-ink-950 px-3.5 py-2.5 text-sm text-white placeholder-ink-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                {adminErrors.email && (
                  <p className="mt-1 text-xs text-rose-400">{adminErrors.email.message}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-300">
                    Password
                  </label>
                  <a
                    href="/forgot-password"
                    className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    {...registerAdmin("password")}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-ink-700 bg-ink-950 px-3.5 py-2.5 pr-10 text-sm text-white placeholder-ink-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-white transition-colors focus:outline-none"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {adminErrors.password && (
                  <p className="mt-1 text-xs text-rose-400">{adminErrors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : "Sign In to Mission Control"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
