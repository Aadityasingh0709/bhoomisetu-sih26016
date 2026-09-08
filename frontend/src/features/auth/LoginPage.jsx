import { useState } from "react";
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
} from "lucide-react";
import { loginRequest } from "../../api/auth.js";
import { useAuthStore } from "../../store/authStore.js";
import { DEMO_ACCOUNTS } from "../../utils/demoAccounts.js";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const executeLogin = async (email, password) => {
    setLoading(true);
    try {
      const { token, user } = await loginRequest(email, password);
      setSession(token, user);
      toast.success(`Welcome, ${user.name}`);
      navigate(user.role === "DepartmentOfficer" ? "/department" : "/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (values) => {
    executeLogin(values.email, values.password);
  };

  const handleQuickPersona = (account) => {
    setSelectedPersona(account.email);
    setValue("email", account.email);
    setValue("password", account.password);
    executeLogin(account.email, account.password);
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
        {/* Subtle Background Elements */}
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
            <span>Smart Real-Time Land Acquisition Lifecycle</span>
          </div>

          <h2 className="text-3xl font-extrabold text-white leading-tight tracking-tight max-w-lg">
            Inter-Departmental Synchronization, Weighted Progress &amp; GIS Intelligence.
          </h2>

          <p className="mt-4 text-sm text-ink-300 leading-relaxed max-w-md">
            Digitizing the multi-stage land acquisition workflow across Survey, Legal Verification,
            Compensation, Rehabilitation, Approvals, and Possession with automated bottleneck
            and dependency detection.
          </p>

          {/* 6-Stage Weight Pipeline Visual */}
          <div className="mt-8 rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ochre-400 mb-3 flex items-center gap-2">
              <Layers size={14} /> Lifecycle Stages &amp; Weighted Impact
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
            <span>Role-Based Access Control · GeoJSON GIS Support</span>
          </div>
          <span className="text-ink-400 font-mono">v1.0.0</span>
        </div>
      </div>

      {/* Right Column: Login Form & 1-Click Persona Switcher */}
      <div className="flex flex-1 flex-col justify-center items-center p-6 sm:p-10 bg-slate-950 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-ochre-500 text-white mb-2 shadow-lg">
              <Landmark size={24} />
            </div>
            <h1 className="text-xl font-bold text-white">BhoomiSetu</h1>
            <p className="text-xs text-ink-400">National Land Acquisition &amp; Management System</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Portal Authentication</h2>
            <p className="mt-1 text-sm text-ink-400">
              Select a demo persona for instant access, or sign in with credentials.
            </p>
          </div>

          {/* Quick Demo Personas (1-Click Login) */}
          <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-wider text-ochre-400 flex items-center gap-1.5">
                <Sparkles size={13} /> Quick 1-Click Demo Login
              </p>
              <span className="text-[10px] text-ink-400">Click to enter</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => {
                const isCurrent = selectedPersona === acc.email;
                return (
                  <button
                    key={acc.email}
                    type="button"
                    disabled={loading}
                    onClick={() => handleQuickPersona(acc)}
                    className={`group flex items-center justify-between rounded-xl border p-2.5 text-left transition-all ${
                      isCurrent
                        ? "border-ochre-500 bg-ochre-500/20 text-white"
                        : "border-ink-800 bg-ink-900/80 text-ink-200 hover:border-ochre-500/50 hover:bg-ink-800/90"
                    }`}
                  >
                    <div className="truncate">
                      <p className="text-xs font-bold text-white truncate">{acc.label}</p>
                      <p className="text-[10px] text-ink-400 truncate">{acc.badge}</p>
                    </div>
                    <ArrowRight
                      size={13}
                      className="shrink-0 text-ink-400 group-hover:text-ochre-400 group-hover:translate-x-0.5 transition-transform"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Standard Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="rounded-2xl border border-ink-800 bg-ink-900/40 p-6 shadow-xl space-y-4"
          >
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-ink-300">
                Official Email Address
              </label>
              <input
                type="email"
                {...register("email")}
                placeholder="officer@landacquisition.gov.in"
                className="w-full rounded-xl border border-ink-700 bg-ink-950 px-3.5 py-2.5 text-sm text-white placeholder-ink-400 outline-none focus:border-ochre-500 focus:ring-1 focus:ring-ochre-500"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-300">
                  Password
                </label>
                <span className="text-[11px] text-ink-400">Demo: password123</span>
              </div>
              <input
                type="password"
                {...register("password")}
                placeholder="••••••••"
                className="w-full rounded-xl border border-ink-700 bg-ink-950 px-3.5 py-2.5 text-sm text-white placeholder-ink-400 outline-none focus:border-ochre-500 focus:ring-1 focus:ring-ochre-500"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-rose-400">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-ochre-500 to-ochre-600 py-3 text-sm font-bold text-white shadow-lg shadow-ochre-500/25 transition-all hover:from-ochre-600 hover:to-ochre-700 disabled:opacity-60"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : "Sign In to Portal"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

