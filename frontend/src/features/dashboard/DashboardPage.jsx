import { useEffect, useState, useMemo } from "react";
import { fetchDashboardSummary, fetchMapData } from "../../api/dashboard.js";
import { fetchProjects } from "../../api/projects.js";
import { resolveAlert } from "../../api/alerts.js";
import StatCard from "../../components/StatCard.jsx";
import Card from "../../components/Card.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import ProgressBar from "../../components/ProgressBar.jsx";
import BottleneckChart, { StatusDonutChart } from "../../components/ChartCard.jsx";
import MapView from "../../components/MapView.jsx";
import { formatDate } from "../../utils/status.js";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/authStore.js";
import {
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Filter,
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
  MapPin,
  FileCheck,
  Search,
  X,
  Building,
  KeyRound,
} from "lucide-react";

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isOfficer = user?.role === "DepartmentOfficer";
  const [summary, setSummary] = useState(null);
  const [mapPoints, setMapPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [stateFilter, setStateFilter] = useState("All");
  const [resolvingId, setResolvingId] = useState(null);

  // Project ID Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [summaryData, map] = await Promise.all([fetchDashboardSummary(), fetchMapData()]);
      setSummary(summaryData);
      setMapPoints(map);
      if (isManual) toast.success("Live telemetry refreshed");
    } catch {
      toast.error("Could not load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Project ID search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await fetchProjects({ search: searchQuery.trim() });
        setSearchResults(results || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleResolveAlert = async (alertId) => {
    setResolvingId(alertId);
    try {
      await resolveAlert(alertId);
      toast.success("Alert resolved");
      setSummary((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          activeAlerts: prev.activeAlerts.filter((a) => a._id !== alertId),
        };
      });
    } catch {
      toast.error("Could not resolve alert");
    } finally {
      setResolvingId(null);
    }
  };

  // Compute available states from map points
  const availableStates = useMemo(() => {
    const states = new Set(mapPoints.map((p) => p.state).filter(Boolean));
    return ["All", ...Array.from(states)];
  }, [mapPoints]);

  // Filtered map points based on user selections
  const filteredMapPoints = useMemo(() => {
    return mapPoints.filter((p) => {
      const matchesStatus = statusFilter === "All" || p.status === statusFilter;
      const matchesState = stateFilter === "All" || p.state === stateFilter;
      return matchesStatus && matchesState;
    });
  }, [mapPoints, statusFilter, stateFilter]);

  // Filtered delayed/at risk projects
  const filteredDelayedProjects = useMemo(() => {
    if (!summary?.delayedProjects) return [];
    return summary.delayedProjects.filter((p) => {
      const matchesStatus = statusFilter === "All" || p.overallStatus === statusFilter;
      const matchesState = stateFilter === "All" || p.state === stateFilter;
      return matchesStatus && matchesState;
    });
  }, [summary?.delayedProjects, statusFilter, stateFilter]);

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-3">
        <RefreshCw size={32} className="animate-spin text-ochre-500" />
        <p className="text-sm font-semibold text-ink-500">Loading National Land Telemetry…</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="rounded-2xl border border-ink-100 bg-white p-8 text-center">
        <AlertTriangle size={32} className="mx-auto text-amber-500" />
        <p className="mt-2 text-base font-bold text-ink-900">Dashboard Unavailable</p>
        <p className="text-xs text-ink-400 mt-1">Unable to connect to BhoomiSetu telemetry services.</p>
        <button
          onClick={() => loadData(true)}
          className="mt-4 rounded-xl bg-ink-900 px-4 py-2 text-xs font-semibold text-white"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { totals, bottlenecks, activeAlerts } = summary;

  return (
    <div className="space-y-6">
      {/* Top Banner: Mission Control Header & Controls */}
      <div className="flex flex-col gap-4">
        {isOfficer && (
          <div className="flex items-center gap-3 rounded-2xl border border-ochre-200 bg-ochre-50/80 p-4 shadow-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ochre-500 text-white font-bold">
              <FolderKanban size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-ochre-900">
                Department Officer Scoped Telemetry
              </h4>
              <p className="text-[11px] text-ochre-700 mt-0.5">
                Dashboard metrics, pipeline velocity, and active alerts are isolated to{" "}
                <span className="font-semibold text-ochre-900">
                  {user?.activeProject?.name || user?.activeProject?.code || "your assigned project"}
                </span>
                .
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-ink-900">
                {isOfficer ? "Project Operations Overview" : "National Land Acquisition Overview"}
              </h1>
              <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                Live GIS
              </span>
            </div>
            <p className="text-xs font-medium text-ink-400 mt-0.5">
              {isOfficer
                ? `DoLR lifecycle telemetry for ${user?.activeProject?.name || "Assigned Project"} · velocity `
                : `DoLR weighted lifecycle telemetry · ${totals.total} active national parcels · velocity `}
              <span className="font-bold text-ink-800 font-mono">{totals.avgProgress}%</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* State Filter */}
            <div className="flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-ink-700 shadow-sm">
              <Filter size={13} className="text-ink-400" />
              <span>State:</span>
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="bg-transparent outline-none font-bold text-ink-900 cursor-pointer text-xs"
              >
                {availableStates.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 shadow-sm hover:bg-ink-50 hover:text-ink-900 transition-all disabled:opacity-60"
              title="Refresh latest telemetry from all departments"
            >
              <RefreshCw size={13} className={`${refreshing ? "animate-spin text-ochre-600" : ""}`} />
              <span>{refreshing ? "Syncing…" : "Refresh"}</span>
            </button>
          </div>
        </div>

        {/* Administrator Search by Project ID / Code Bar */}
        <div className="relative rounded-2xl border border-ink-200 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ochre-600" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects by Project ID / Code (e.g. NH44, EFC-LP-2026, Belagavi, Patna)..."
                className="w-full rounded-xl border border-ink-100 bg-ink-50/70 py-2.5 pl-10 pr-9 text-xs font-semibold text-ink-900 outline-none focus:border-ochre-500 focus:bg-white focus:ring-1 focus:ring-ochre-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            {searching && <RefreshCw size={15} className="animate-spin text-ochre-600 mr-2" />}
          </div>

          {/* Live Search Results Dropdown */}
          {searchQuery.trim() && (
            <div className="mt-3 border-t border-ink-100 pt-3 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-ink-400 font-bold uppercase tracking-wider">
                <span>Matching Projects ({searchResults.length})</span>
                <span>Click project to open dossier &amp; officer credentials</span>
              </div>

              {searchResults.length === 0 && !searching ? (
                <p className="py-2 text-xs text-ink-400 text-center">
                  No projects found with Project ID / Name "{searchQuery}".
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                  {searchResults.map((p) => (
                    <Link
                      key={p._id}
                      to={`/projects/${p._id}`}
                      className="group flex items-start justify-between gap-2 rounded-xl border border-ink-100 bg-ink-50/50 p-3 hover:border-ochre-400 hover:bg-ochre-50/30 transition-all text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-ochre-700 bg-ochre-100/70 px-1.5 py-0.2 rounded text-[10px]">
                            {p.code}
                          </span>
                          <StatusBadge status={p.overallStatus} size="sm" />
                        </div>
                        <p className="font-bold text-ink-900 group-hover:text-ochre-700 transition-colors mt-1 line-clamp-1">
                          {p.name}
                        </p>
                        <p className="text-[10px] text-ink-400 flex items-center gap-1 mt-0.5">
                          <MapPin size={10} />
                          <span>{p.district}, {p.state}</span>
                          <span>·</span>
                          <span className="font-bold text-ink-700">{p.overallProgress}% progress</span>
                        </p>
                      </div>
                      <ArrowUpRight size={14} className="shrink-0 text-ink-400 group-hover:text-ochre-600 group-hover:translate-x-0.5 transition-transform mt-1" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* KPI Stat Cards (Clickable to Filter) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Projects"
          value={totals.total}
          sublabel={`Average progress: ${totals.avgProgress}%`}
          accent="#0b1c2d"
          icon={FolderKanban}
          active={statusFilter === "All"}
          onClick={() => setStatusFilter("All")}
          trend="100% tracked"
          trendType="neutral"
        />
        <StatCard
          label="On Track"
          value={totals.onTrack}
          sublabel="Progress within SLA target"
          accent="#059669"
          icon={CheckCircle2}
          active={statusFilter === "OnTrack"}
          onClick={() => setStatusFilter(statusFilter === "OnTrack" ? "All" : "OnTrack")}
          trend={`${Math.round(((totals.onTrack || 0) / (totals.total || 1)) * 100)}%`}
          trendType="positive"
        />
        <StatCard
          label="At Risk"
          value={totals.atRisk}
          sublabel="10%+ behind schedule"
          accent="#d97706"
          icon={AlertTriangle}
          active={statusFilter === "AtRisk"}
          onClick={() => setStatusFilter(statusFilter === "AtRisk" ? "All" : "AtRisk")}
          trend={totals.atRisk > 0 ? "Stage Warning" : "Zero"}
          trendType="warning"
        />
        <StatCard
          label="Delayed"
          value={totals.delayed}
          sublabel="Requires senior intervention"
          accent="#dc2626"
          icon={Clock}
          active={statusFilter === "Delayed"}
          onClick={() => setStatusFilter(statusFilter === "Delayed" ? "All" : "Delayed")}
          trend={totals.delayed > 0 ? "Critical SLA" : "Zero"}
          trendType="negative"
        />
      </div>

      {/* Main Interactive Row: GIS Map (Left) + Analytics (Right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card
          title="National GIS Geo-Tagged Parcels"
          subtitle={`Interactive map plotting ${filteredMapPoints.length} parcels across states`}
          className="lg:col-span-2"
          action={
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono font-semibold text-ink-500">
                {filteredMapPoints.length} parcels visible
              </span>
            </div>
          }
        >
          <MapView points={filteredMapPoints} height="430px" />
        </Card>

        {/* Bottleneck Analysis & Portoflio Donut */}
        <div className="space-y-6">
          <BottleneckChart data={bottlenecks} />
          <StatusDonutChart totals={totals} />
        </div>
      </div>

      {/* Lower Row: Projects Requiring Attention (Left) + Active Alerts (Right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Attention Projects */}
        <Card
          title="Projects Needing Intervention"
          subtitle="Parcels identified with schedule slippage or bottlenecks"
          icon={AlertTriangle}
          action={
            <Link
              to="/projects"
              className="inline-flex items-center gap-1 text-xs font-bold text-ochre-600 hover:text-ochre-700 hover:underline"
            >
              All Projects <ArrowUpRight size={14} />
            </Link>
          }
        >
          {filteredDelayedProjects.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-2">
                <CheckCircle2 size={24} />
              </div>
              <p className="text-sm font-bold text-ink-900">All Parcels Operational</p>
              <p className="text-xs text-ink-400 mt-0.5">
                No delayed or at-risk projects matching current filters.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-ink-100">
              {filteredDelayedProjects.map((p) => (
                <li key={p.id} className="py-3.5 group transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        to={`/projects/${p.id}`}
                        className="text-sm font-bold text-ink-900 group-hover:text-ochre-600 transition-colors"
                      >
                        {p.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-ink-400 flex items-center gap-1.5">
                        <MapPin size={12} />
                        <span>
                          {p.district}, {p.state}
                        </span>
                        <span>·</span>
                        <span>Due {formatDate(p.plannedCompletionDate)}</span>
                      </p>
                    </div>
                    <StatusBadge status={p.overallStatus} size="sm" />
                  </div>

                  <div className="mt-2.5 flex items-center gap-3">
                    <div className="flex-1">
                      <ProgressBar value={p.overallProgress} status={p.overallStatus} size="sm" />
                    </div>
                    <span className="data-figure text-xs font-bold text-ink-700">
                      {p.overallProgress}%
                    </span>
                    <Link
                      to={`/projects/${p.id}`}
                      className="rounded-lg bg-ink-50 px-2.5 py-1 text-xs font-semibold text-ink-700 hover:bg-ochre-50 hover:text-ochre-700 transition-colors"
                    >
                      Dossier
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Active Alerts Panel */}
        <Card
          title="Active Bottleneck & Dependency Alerts"
          subtitle="Real-time multi-department escalation queue"
          icon={ShieldAlert}
          action={
            <Link
              to="/alerts"
              className="inline-flex items-center gap-1 text-xs font-bold text-ochre-600 hover:text-ochre-700 hover:underline"
            >
              Alert Center <ArrowUpRight size={14} />
            </Link>
          }
        >
          {activeAlerts.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-2">
                <CheckCircle2 size={24} />
              </div>
              <p className="text-sm font-bold text-ink-900">Zero Unresolved Alerts</p>
              <p className="text-xs text-ink-400 mt-0.5">
                No active bottlenecks or cross-stage dependencies flagging delays.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {activeAlerts.slice(0, 4).map((a) => (
                <li
                  key={a._id}
                  className="rounded-xl border border-ink-100 bg-ink-50/50 p-3.5 hover:bg-white hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${a.type === "Bottleneck"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                          }`}
                      >
                        {a.type}
                      </span>
                      <span
                        className={`text-xs font-bold ${a.severity === "High" ? "text-rose-600" : "text-amber-600"
                          }`}
                      >
                        {a.severity} Priority
                      </span>
                    </div>

                    <button
                      onClick={() => handleResolveAlert(a._id)}
                      disabled={resolvingId === a._id}
                      className="flex items-center gap-1 rounded-lg border border-ink-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-ink-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors"
                      title="Mark resolved"
                    >
                      <CheckCircle2 size={12} />
                      <span>{resolvingId === a._id ? "…" : "Resolve"}</span>
                    </button>
                  </div>

                  <p className="mt-1.5 text-xs font-semibold text-ink-900 leading-snug">
                    {a.message}
                  </p>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-ink-400 border-t border-ink-100/80 pt-1.5">
                    <span>{a.projectName || a.project?.name}</span>
                    <Link
                      to={`/projects/${a.project?._id || a.project}`}
                      className="font-bold text-ochre-600 hover:underline"
                    >
                      View parcel →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

