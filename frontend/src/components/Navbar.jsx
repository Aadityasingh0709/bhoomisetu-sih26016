import { LogOut, Landmark } from "lucide-react";
import { useAuthStore } from "../store/authStore.js";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <header className="flex h-16 items-center justify-between border-b border-ink-100 bg-white px-6">
      <div className="flex items-center gap-2">
        <Landmark size={20} className="text-ink-700" />
        <div>
          <p className="text-sm font-bold leading-none text-ink-900">BhoomiSetu</p>
          <p className="text-[11px] leading-none text-ink-300 mt-0.5">
            National Land Acquisition &amp; Management System
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-ink-900">{user?.name}</p>
          <p className="text-xs text-ink-300">{user?.role?.replace(/([A-Z])/g, " $1").trim()}</p>
        </div>
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="rounded-lg p-2 text-ink-300 hover:bg-ink-50 hover:text-ink-700"
          title="Log out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
