import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Bell,
  Building2,
  FileSpreadsheet,
  Info,
  ChevronRight,
  X,
  Landmark,
} from "lucide-react";
import { useAuthStore } from "../store/authStore.js";

const links = [
  {
    to: "/dashboard",
    label: "National Overview",
    sublabel: "GIS & Weighted Metrics",
    icon: LayoutDashboard,
    roles: ["Administrator", "SeniorOfficer", "ProjectManager"],
  },
  {
    to: "/projects",
    label: "Project Portfolio",
    sublabel: "All Land Parcels",
    icon: FolderKanban,
    roles: ["Administrator", "SeniorOfficer", "ProjectManager", "DepartmentOfficer", "DistrictOfficer"],
  },
  {
    to: "/department",
    label: "Department Workspace",
    sublabel: "Updates & Pending Cases",
    icon: Building2,
    roles: ["DepartmentOfficer"],
  },
  {
    to: "/alerts",
    label: "Bottleneck Alerts",
    sublabel: "Dependency Intelligence",
    icon: Bell,
    roles: ["Administrator", "SeniorOfficer", "ProjectManager"],
  },
];

export default function Sidebar({ isOpen = false, onClose }) {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-ink-950/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container: Fixed drawer on mobile/tablet, static flex item on desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col justify-between border-r border-ink-800 bg-ink-950 text-ink-100 select-none shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:w-64 lg:shrink-0 lg:shadow-none lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Nav List */}
        <div className="p-3.5 space-y-4 overflow-y-auto">
          {/* Mobile Drawer Header with Close Button */}
          <div className="flex items-center justify-between pb-2 border-b border-ink-800/80 lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ochre-500 text-white">
                <Landmark size={18} />
              </div>
              <span className="font-bold text-white text-sm">BhoomiSetu Menu</span>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-800 hover:text-white transition-colors"
              aria-label="Close Navigation"
            >
              <X size={18} />
            </button>
          </div>

          {/* Department Info Widget for Officers */}
          {role === "DepartmentOfficer" && user?.department && (
            <div className="rounded-xl border border-ochre-500/30 bg-gradient-to-b from-ochre-500/15 to-ochre-500/5 p-3 text-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ochre-400">
                Active Stage Assignment
              </p>
              <p className="mt-1 font-bold text-white text-sm">
                {user.department.displayName}
              </p>
              <p className="mt-0.5 text-ink-300 text-[11px]">
                Weight in National Score: <span className="text-ochre-300 font-mono font-bold">{user.department.weight}%</span>
              </p>
            </div>
          )}

          <div className="space-y-1">
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              Navigation
            </p>

            {links
              .filter((l) => l.roles.includes(role))
              .map(({ to, label, sublabel, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-ochre-600 to-ochre-500 text-white shadow-md shadow-ochre-600/30"
                        : "text-ink-300 hover:bg-white/5 hover:text-white"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                            isActive ? "bg-white/20 text-white" : "bg-white/5 text-ink-400 group-hover:text-white"
                          }`}
                        >
                          <Icon size={16} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold leading-snug">{label}</p>
                          <p className={`text-[10px] ${isActive ? "text-white/80" : "text-ink-400"}`}>
                            {sublabel}
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        size={14}
                        className={`transition-transform duration-200 ${
                          isActive ? "text-white translate-x-0.5" : "text-ink-600 group-hover:text-ink-300"
                        }`}
                      />
                    </>
                  )}
                </NavLink>
              ))}
          </div>
        </div>

        {/* Bottom Info Card */}
        <div className="p-3 border-t border-ink-900">
          <div className="rounded-xl bg-ink-900/90 border border-ink-800 p-3">
            <div className="flex items-center gap-2">
              <Info size={14} className="text-ochre-400" />
              <span className="text-[11px] font-bold text-white">SIH 2026 · PS 26016</span>
            </div>
            <p className="mt-1 text-[10px] text-ink-400 leading-relaxed">
              Real-Time Land Acquisition Lifecycle &amp; Inter-Departmental Sync
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-[9px] text-ink-400 border-t border-ink-800/80 pt-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>DoLR, Min. of Rural Dev.</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}


