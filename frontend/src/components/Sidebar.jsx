import { NavLink } from "react-router-dom";
import { LayoutDashboard, FolderKanban, Bell, Building2 } from "lucide-react";
import { useAuthStore } from "../store/authStore.js";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["Administrator", "SeniorOfficer", "ProjectManager"] },
  { to: "/projects", label: "Projects", icon: FolderKanban, roles: ["Administrator", "SeniorOfficer", "ProjectManager", "DepartmentOfficer", "DistrictOfficer"] },
  { to: "/department", label: "My Department", icon: Building2, roles: ["DepartmentOfficer"] },
  { to: "/alerts", label: "Alerts", icon: Bell, roles: ["Administrator", "SeniorOfficer", "ProjectManager"] },
];

export default function Sidebar() {
  const role = useAuthStore((s) => s.user?.role);

  return (
    <aside className="w-60 shrink-0 border-r border-ink-100 bg-ink-950 text-ink-100">
      <nav className="flex flex-col gap-1 p-3">
        {links
          .filter((l) => l.roles.includes(role))
          .map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? "bg-ochre-500 text-white" : "text-ink-100/80 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
      </nav>
    </aside>
  );
}
