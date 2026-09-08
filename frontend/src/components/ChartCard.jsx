import Card from "./Card.jsx";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { AlertTriangle, PieChart as PieIcon, Layers } from "lucide-react";

// 1. Horizontal bottleneck ranking chart: which departments are stalling the most projects.
export default function BottleneckChart({ data = [] }) {
  const hasBottlenecks = data.some((d) => d.count > 0);

  return (
    <Card
      title="Bottlenecks by Department"
      subtitle="Departments with pending cases >20 and progress <60%"
      icon={AlertTriangle}
    >
      {!hasBottlenecks ? (
        <div className="flex h-64 flex-col items-center justify-center text-center p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-2">
            <AlertTriangle size={24} />
          </div>
          <p className="text-sm font-bold text-ink-900">No Stage Bottlenecks</p>
          <p className="text-xs text-ink-400 mt-1 max-w-xs">
            All departments are currently executing within acceptable velocity limits.
          </p>
        </div>
      ) : (
        <div className="h-64 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="bottleneckGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#d97706" />
                  <stop offset="100%" stopColor="#dc2626" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={{ stroke: "#e2e8f0" }}
              />
              <YAxis
                dataKey="department"
                type="category"
                width={120}
                tick={{ fontSize: 11, fill: "#1e293b", fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value) => [`${value} projects affected`, "Bottleneck Severity"]}
                contentStyle={{
                  borderRadius: 12,
                  borderColor: "#e2e8f0",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" fill="url(#bottleneckGradient)" radius={[0, 6, 6, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

// 2. Status Distribution Donut Chart
export function StatusDonutChart({ totals }) {
  if (!totals) return null;

  const data = [
    { name: "On Track", value: totals.onTrack, color: "#059669" },
    { name: "At Risk", value: totals.atRisk, color: "#d97706" },
    { name: "Delayed", value: totals.delayed, color: "#dc2626" },
    { name: "Completed", value: totals.completed || 0, color: "#2563eb" },
  ].filter((d) => d.value > 0);

  return (
    <Card
      title="Portfolio Health"
      subtitle="National project status distribution"
      icon={PieIcon}
    >
      <div className="h-64 relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              formatter={(val, name) => [`${val} projects`, name]}
              contentStyle={{
                borderRadius: 12,
                borderColor: "#e2e8f0",
                fontSize: 12,
              }}
            />
            <Pie
              data={data}
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value) => <span className="text-xs text-ink-700 font-medium">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Total Count */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[65%] text-center pointer-events-none">
          <span className="block text-2xl font-black data-figure text-ink-900">
            {totals.total}
          </span>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-400">
            Projects
          </span>
        </div>
      </div>
    </Card>
  );
}

// 3. Stage Planned vs Actual Progress Comparison Chart
export function StageComparisonChart({ stageData = [] }) {
  return (
    <Card
      title="Stage-Wise Performance Analysis"
      subtitle="Planned milestone velocity vs verified actual progress"
      icon={Layers}
    >
      <div className="h-72 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stageData} margin={{ left: 0, right: 10, top: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#475569" }}
              angle={-15}
              textAnchor="end"
              interval={0}
            />
            <YAxis
              unit="%"
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={{ stroke: "#e2e8f0" }}
            />
            <Tooltip
              formatter={(val) => [`${val}%`, ""]}
              contentStyle={{
                borderRadius: 12,
                borderColor: "#e2e8f0",
                fontSize: 12,
              }}
            />
            <Legend verticalAlign="top" height={36} />
            <Bar dataKey="planned" name="Planned Progress" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={14} />
            <Bar dataKey="actual" name="Actual Progress" fill="#c05621" radius={[4, 4, 0, 0]} barSize={14} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

