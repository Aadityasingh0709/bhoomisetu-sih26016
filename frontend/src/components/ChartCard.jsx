import Card from "./Card.jsx";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// Horizontal bottleneck ranking chart: which departments are stalling the most projects.
export default function BottleneckChart({ data = [] }) {
  return (
    <Card title="Main Bottlenecks by Department">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef2f6" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "#8fa3ba" }} />
          <YAxis dataKey="department" type="category" width={130} tick={{ fontSize: 12, fill: "#1c3552" }} />
          <Tooltip
            formatter={(value) => [`${value} projects`, "Affected"]}
            contentStyle={{ borderRadius: 8, borderColor: "#d7e0ea", fontSize: 12 }}
          />
          <Bar dataKey="count" fill="#c17817" radius={[0, 4, 4, 0]} barSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
