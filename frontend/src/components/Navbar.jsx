import { useState, useEffect, useRef } from "react";
import { LogOut, Landmark, Bell, Shield, User, ChevronDown, Check, Sparkles } from "lucide-react";
import { useAuthStore } from "../store/authStore.js";
import { useNavigate, Link } from "react-router-dom";
import { DEMO_ACCOUNTS } from "../utils/demoAccounts.js";
import { loginRequest } from "../api/auth.js";
import { fetchAlerts } from "../api/alerts.js";
import toast from "react-hot-toast";

export default function Navbar() {
  const { user, logout, setSession } = useAuthStore();
  const navigate = useNavigate();

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [alertsMenuOpen, setAlertsMenuOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [switchingRole, setSwitchingRole] = useState(false);

  const roleMenuRef = useRef(null);
  const alertsMenuRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target)) {
        setRoleMenuOpen(false);
      }
      if (alertsMenuRef.current && !alertsMenuRef.current.contains(event.target)) {
        setAlertsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch unresolved alerts and handle live refresh
  const loadAlerts = () => {
    if (!user) return;
    fetchAlerts({ resolved: false })
      .then((data) => setAlerts(data || []))
      .catch(() => {});
  };

  useEffect(() => {
    loadAlerts();
    const timer = setInterval(loadAlerts, 10000);
    const handleUpdate = () => loadAlerts();
    window.addEventListener("alertsUpdated", handleUpdate);
    return () => {
      clearInterval(timer);
      window.removeEventListener("alertsUpdated", handleUpdate);
    };
  }, [user]);

  const isAuthority = ["Administrator", "SeniorOfficer", "ProjectManager"].includes(user?.role);
  const myDeptId = String(user?.department?._id || user?.department || "");

  // Authority actions needed:
  const pendingDecisionForAuthority = isAuthority
    ? alerts.filter((a) => !a.authorityDecision && !a.isResolved)
    : [];
  const pendingClosureForAuthority = isAuthority
    ? alerts.filter((a) => a.officerResolved && !a.isResolved)
    : [];

  // Officer actions needed:
  const directivesForMyDept = !isAuthority
    ? alerts.filter(
        (a) =>
          String(a.department?._id || a.department || "") === myDeptId &&
          a.authorityDecision &&
          !a.officerResolved &&
          !a.isResolved
      )
    : [];
  const myDeptBottlenecks = !isAuthority
    ? alerts.filter(
        (a) =>
          String(a.department?._id || a.department || "") === myDeptId &&
          !a.authorityDecision &&
          !a.isResolved
      )
    : [];
  const otherDeptAlerts = !isAuthority
    ? alerts.filter(
        (a) => String(a.department?._id || a.department || "") !== myDeptId && !a.isResolved
      )
    : [];

  const handleRoleSwitch = async (account) => {
    if (user?.email === account.email) {
      setRoleMenuOpen(false);
      return;
    }
    setSwitchingRole(true);
    try {
      const { token, user: newUser } = await loginRequest(account.email, account.password);
      setSession(token, newUser);
      toast.success(`Switched role to ${account.label}`);
      setRoleMenuOpen(false);
      navigate(newUser.role === "DepartmentOfficer" ? "/department" : "/dashboard");
    } catch {
      toast.error("Could not switch role");
    } finally {
      setSwitchingRole(false);
    }
  };

  const currentInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "GOI";

  // Compute action badge count
  const actionCount = isAuthority
    ? pendingDecisionForAuthority.length + pendingClosureForAuthority.length
    : directivesForMyDept.length || alerts.length;

  return (
    <header className="relative z-40 bg-white border-b border-ink-100 shadow-sm">
      {/* Tricolor Government Top Strip */}
      <div className="h-1 w-full tricolor-stripe" />

      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Brand & Emblem */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-ochre-500 to-ochre-700 text-white shadow-md shadow-ochre-500/20 group-hover:scale-105 transition-transform">
              <Landmark size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-ink-900">
                  BhoomiSetu
                </span>
              </div>
              <p className="text-[11px] font-medium text-ink-400 leading-tight">
                National Land Acquisition &amp; Management Portal
              </p>
            </div>
          </Link>

          {/* System status pill */}
          <div className="hidden xl:flex items-center gap-1.5 ml-4 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>National GIS Live</span>
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick 1-Click Role Switcher */}
          <div className="relative" ref={roleMenuRef}>
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              disabled={switchingRole}
              className="flex items-center gap-2 rounded-xl border border-ochre-200 bg-ochre-50/70 hover:bg-ochre-100/80 px-3 py-1.5 text-xs font-semibold text-ochre-900 shadow-sm transition-all"
              title="Switch demo persona (Admin, Senior Officer, Department Officers)"
            >
              <Sparkles size={14} className="text-ochre-600 animate-spin-slow" />
              <span className="hidden md:inline">Demo Persona:</span>
              <span className="max-w-[130px] truncate text-ochre-800 font-bold">
                {user?.role === "DepartmentOfficer"
                  ? `${user?.department?.displayName || "Officer"}`
                  : user?.role === "Administrator"
                  ? "Admin"
                  : "Senior Officer"}
              </span>
              <ChevronDown size={14} className={`transition-transform ${roleMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-ink-100 bg-white p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="border-b border-ink-100 pb-2 px-3 pt-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-400">
                    Switch Demo Persona
                  </p>
                  <p className="text-[11px] text-ink-500">
                    One-click login as any project stakeholder:
                  </p>
                </div>
                <div className="max-h-72 overflow-y-auto py-1 space-y-0.5">
                  {DEMO_ACCOUNTS.map((acc) => {
                    const isSelected = user?.email === acc.email;
                    return (
                      <button
                        key={acc.email}
                        onClick={() => handleRoleSwitch(acc)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                          isSelected
                            ? "bg-ochre-50 text-ochre-900 font-semibold"
                            : "hover:bg-ink-50 text-ink-700"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-ink-900">{acc.label}</span>
                          <span className="text-[10px] text-ink-400">{acc.departmentName} · {acc.badge}</span>
                        </div>
                        {isSelected && <Check size={16} className="text-ochre-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick Notifications Bell */}
          <div className="relative" ref={alertsMenuRef}>
            <button
              onClick={() => setAlertsMenuOpen(!alertsMenuOpen)}
              className="relative rounded-xl border border-ink-100 bg-white p-2 text-ink-500 hover:bg-ink-50 hover:text-ink-900 transition-colors shadow-sm"
              title="System Alerts & Bottlenecks"
            >
              <Bell size={18} />
              {alerts.length > 0 && (
                <span className={`absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white shadow-sm animate-pulse ${
                  directivesForMyDept.length > 0 || pendingDecisionForAuthority.length > 0
                    ? "bg-rose-600 ring-2 ring-rose-200"
                    : "bg-amber-500"
                }`}>
                  {alerts.length}
                </span>
              )}
            </button>

            {alertsMenuOpen && (
              <div className="absolute right-0 mt-2 w-88 sm:w-[400px] rounded-2xl border border-ink-100 bg-white p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between border-b border-ink-100 pb-2 px-1">
                  <div className="flex items-center gap-1.5">
                    <Shield size={16} className="text-rose-500" />
                    <h4 className="text-xs font-bold text-ink-900">
                      Alerts &amp; Directives ({alerts.length})
                    </h4>
                  </div>
                  <Link
                    to="/alerts"
                    onClick={() => setAlertsMenuOpen(false)}
                    className="text-xs font-bold text-ochre-600 hover:underline"
                  >
                    View Center →
                  </Link>
                </div>

                <div className="max-h-80 overflow-y-auto py-2 space-y-2">
                  {alerts.length === 0 ? (
                    <p className="py-6 text-center text-xs text-ink-400">
                      No active alerts. All stages are operating within normal parameters.
                    </p>
                  ) : (
                    <>
                      {/* Officer View: Directives Waiting for Action */}
                      {!isAuthority && directivesForMyDept.length > 0 && (
                        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-2.5 space-y-1.5">
                          <p className="text-[10px] font-black uppercase tracking-wider text-blue-800 flex items-center gap-1">
                            <span>⚡ Higher Authority Directives for You ({directivesForMyDept.length})</span>
                          </p>
                          {directivesForMyDept.map((a) => (
                            <Link
                              key={a._id}
                              to="/department"
                              onClick={() => setAlertsMenuOpen(false)}
                              className="block rounded-lg bg-white p-2 border border-blue-200 hover:bg-blue-50/50 transition-colors"
                            >
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-bold text-blue-900 truncate">{a.projectName || a.project?.name}</span>
                                <span className="text-blue-600 font-semibold">Action Required</span>
                              </div>
                              <p className="text-xs text-ink-800 font-medium mt-0.5 line-clamp-1">{a.message}</p>
                              <p className="text-[11px] text-blue-700 font-medium mt-0.5 line-clamp-1">
                                ↳ <em>Directive:</em> "{a.authorityDecision}"
                              </p>
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Authority View: Pending Decisions */}
                      {isAuthority && pendingDecisionForAuthority.length > 0 && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-2.5 space-y-1.5">
                          <p className="text-[10px] font-black uppercase tracking-wider text-rose-800">
                            🚨 Bottlenecks Pending Your Directive ({pendingDecisionForAuthority.length})
                          </p>
                          {pendingDecisionForAuthority.slice(0, 3).map((a) => (
                            <Link
                              key={a._id}
                              to="/alerts"
                              onClick={() => setAlertsMenuOpen(false)}
                              className="block rounded-lg bg-white p-2 border border-rose-200 hover:bg-rose-50 transition-colors"
                            >
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-bold text-rose-900">{a.department?.displayName || "Stage"}</span>
                                <span className="text-ink-400">{a.projectName || a.project?.name}</span>
                              </div>
                              <p className="text-xs text-ink-800 font-medium mt-0.5 line-clamp-1">{a.message}</p>
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Authority View: Fixed by Officers */}
                      {isAuthority && pendingClosureForAuthority.length > 0 && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-2.5 space-y-1.5">
                          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                            ✅ Marked Fixed by Officers ({pendingClosureForAuthority.length})
                          </p>
                          {pendingClosureForAuthority.slice(0, 3).map((a) => (
                            <Link
                              key={a._id}
                              to="/alerts"
                              onClick={() => setAlertsMenuOpen(false)}
                              className="block rounded-lg bg-white p-2 border border-emerald-200 hover:bg-emerald-50 transition-colors"
                            >
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-bold text-emerald-900">{a.department?.displayName}</span>
                                <span className="text-ink-400">{a.projectName || a.project?.name}</span>
                              </div>
                              <p className="text-xs text-ink-800 font-medium mt-0.5 line-clamp-1">{a.message}</p>
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* General Active Bottlenecks List */}
                      <div className="space-y-1 pt-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400 px-1">
                          {isAuthority ? "All Active Telemetry Alerts" : "Cross-Department Telemetry Alerts"}
                        </p>
                        {alerts.slice(0, 4).map((a) => (
                          <Link
                            key={a._id}
                            to="/alerts"
                            onClick={() => setAlertsMenuOpen(false)}
                            className="block py-1.5 px-2 hover:bg-ink-50 rounded-lg transition-colors"
                          >
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-bold uppercase tracking-wider text-rose-600">
                                {a.type} · {a.department?.displayName || "General"}
                              </span>
                              <span className="text-ink-400">{a.severity}</span>
                            </div>
                            <p className="text-xs font-medium text-ink-800 line-clamp-1 mt-0.5">
                              {a.message}
                            </p>
                            <p className="text-[10px] text-ink-400">{a.projectName || a.project?.name}</p>
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Card */}
          <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-ink-100">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-900 text-white font-bold text-xs shadow-inner">
              {currentInitials}
            </div>
            <div className="text-left leading-none">
              <p className="text-xs font-bold text-ink-900">{user?.name}</p>
              <p className="text-[11px] font-medium text-ink-400 mt-0.5">
                {user?.role?.replace(/([A-Z])/g, " $1").trim()}
              </p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="flex items-center justify-center rounded-xl border border-ink-100 bg-white p-2 text-ink-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm"
            title="Log out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}

