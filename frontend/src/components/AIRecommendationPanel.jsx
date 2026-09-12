import { useState } from "react";
import { getAISuggestions } from "../api/ai.js";

/* ──────────────────────────────────────────────
   Colour helpers for similarity percentage
────────────────────────────────────────────── */
const simColor = (pct) => {
  if (pct >= 70) return "#22c55e";   // green
  if (pct >= 40) return "#f59e0b";   // amber
  return "#ef4444";                   // red
};

const simBg = (pct) => {
  if (pct >= 70) return "rgba(34,197,94,0.1)";
  if (pct >= 40) return "rgba(245,158,11,0.1)";
  return "rgba(239,68,68,0.1)";
};

/* Department options that map to the dataset's task_group values */
const DEPARTMENTS = [
  "Safety",
  "Quality",
  "Site Management",
  "Design Team",
  "General",
];

const SEVERITIES = [
  "Not Applicable",
  "Behavioural Failure",
  "System Failure",
];

/* ──────────────────────────────────────────────
   Main Component
────────────────────────────────────────────── */
export default function AIRecommendationPanel({ prefill = {} }) {
  const [form, setForm] = useState({
    department: prefill.department || "Safety",
    issue_type: prefill.issue_type || "",
    issue_description: prefill.issue_description || "",
    severity: prefill.severity || "Not Applicable",
    urgency: prefill.urgency || "Not Specified",
    is_overdue: prefill.is_overdue || false,
    k: 5,
  });

  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSearch = async () => {
    if (!form.issue_description.trim()) {
      setError("Please enter an issue description to get suggestions.");
      return;
    }
    setError(null);
    setLoading(true);
    setSearched(false);
    setSuggestions([]);
    try {
      const data = await getAISuggestions(form);
      setSuggestions(data.suggestions || []);
      setSearched(true);
    } catch (err) {
      if (err.response?.status === 503) {
        setError("AI model is starting up. Please try again in a moment.");
      } else {
        setError("Could not reach the AI service. Make sure the ML server is running.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.panel}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.aiIcon}>🤖</span>
          <div>
            <h3 style={styles.title}>AI Resolution Recommender</h3>
            <p style={styles.subtitle}>
              Powered by KNN · Finds similar past cases &amp; their resolutions
            </p>
          </div>
        </div>
        <span style={styles.badge}>BETA</span>
      </div>

      {/* Form */}
      <div style={styles.formGrid}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Department</label>
          <select
            name="department"
            value={form.department}
            onChange={handleChange}
            style={styles.select}
          >
            {DEPARTMENTS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Issue Type / Category</label>
          <input
            name="issue_type"
            value={form.issue_type}
            onChange={handleChange}
            placeholder="e.g. PPE Violation, Documentation Gap"
            style={styles.input}
          />
        </div>

        <div style={{ ...styles.formGroup, gridColumn: "1 / -1" }}>
          <label style={styles.label}>Issue Description *</label>
          <textarea
            name="issue_description"
            value={form.issue_description}
            onChange={handleChange}
            placeholder="Describe the bottleneck in detail — the more detail, the better the match..."
            rows={3}
            style={{ ...styles.input, resize: "vertical", minHeight: 80 }}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Severity Classification</label>
          <select
            name="severity"
            value={form.severity}
            onChange={handleChange}
            style={styles.select}
          >
            {SEVERITIES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Number of Suggestions</label>
          <select
            name="k"
            value={form.k}
            onChange={handleChange}
            style={styles.select}
          >
            {[3, 5, 7, 10].map((n) => (
              <option key={n} value={n}>
                Top {n}
              </option>
            ))}
          </select>
        </div>

        <div style={{ ...styles.formGroup, alignSelf: "center" }}>
          <label style={{ ...styles.label, opacity: 0 }}>_</label>
          <label style={styles.checkLabel}>
            <input
              type="checkbox"
              name="is_overdue"
              checked={form.is_overdue}
              onChange={handleChange}
              style={{ marginRight: 8 }}
            />
            Overdue / Urgent
          </label>
        </div>
      </div>

      {/* Search Button */}
      <button
        onClick={handleSearch}
        disabled={loading}
        style={{
          ...styles.btn,
          opacity: loading ? 0.7 : 1,
          cursor: loading ? "wait" : "pointer",
        }}
      >
        {loading ? (
          <span style={styles.spinner}>⟳</span>
        ) : (
          "🔍 Find Similar Cases"
        )}
      </button>

      {/* Error */}
      {error && <div style={styles.errorBox}>{error}</div>}

      {/* Results */}
      {searched && suggestions.length === 0 && !error && (
        <div style={styles.emptyBox}>
          No matching cases found. Try a broader description.
        </div>
      )}

      {suggestions.length > 0 && (
        <div style={styles.resultsSection}>
          <h4 style={styles.resultsTitle}>
            {suggestions.length} Similar Cases Found
          </h4>
          <p style={styles.resultsNote}>
            Click a card to see full resolution details
          </p>

          <div style={styles.cards}>
            {suggestions.map((s, idx) => (
              <div
                key={s.case_id}
                style={{
                  ...styles.card,
                  border: `1px solid ${simColor(s.similarity)}40`,
                  boxShadow:
                    expanded === idx
                      ? `0 0 0 2px ${simColor(s.similarity)}`
                      : "none",
                }}
                onClick={() => setExpanded(expanded === idx ? null : idx)}
              >
                {/* Card top row */}
                <div style={styles.cardTop}>
                  <div style={styles.cardLeft}>
                    <span style={styles.caseNum}>#{idx + 1}</span>
                    <div>
                      <div style={styles.issueType}>{s.issue_type}</div>
                      <div style={styles.dept}>{s.department}</div>
                    </div>
                  </div>

                  {/* Similarity badge */}
                  <div
                    style={{
                      ...styles.simBadge,
                      background: simBg(s.similarity),
                      color: simColor(s.similarity),
                      border: `1px solid ${simColor(s.similarity)}50`,
                    }}
                  >
                    {s.similarity}% match
                  </div>
                </div>

                {/* Similarity bar */}
                <div style={styles.barTrack}>
                  <div
                    style={{
                      ...styles.barFill,
                      width: `${s.similarity}%`,
                      background: simColor(s.similarity),
                    }}
                  />
                </div>

                {/* Cause preview */}
                <div style={styles.causeText}>
                  <span style={styles.causeLbl}>Cause: </span>
                  {s.cause}
                </div>

                {/* Expanded: resolution details */}
                {expanded === idx && (
                  <div style={styles.expanded}>
                    <div style={styles.resolutionBox}>
                      <div style={styles.resLbl}>✅ Resolution Action Taken</div>
                      <div style={styles.resText}>{s.resolution_action}</div>
                    </div>
                    <div style={styles.metaRow}>
                      <Tag label="Classification" value={s.classification} />
                      <Tag label="Urgency" value={s.urgency} />
                      {s.was_overdue && <Tag label="Was Overdue" value="Yes" warn />}
                      {s.had_comments && (
                        <Tag label="Discussion" value="Yes" good />
                      )}
                    </div>
                    <div style={styles.caseId}>Case ID: {s.case_id}</div>
                  </div>
                )}

                <div style={styles.expandHint}>
                  {expanded === idx ? "▲ Collapse" : "▼ View resolution"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Tag({ label, value, warn, good }) {
  return (
    <span
      style={{
        ...styles.tag,
        background: warn
          ? "rgba(239,68,68,0.1)"
          : good
          ? "rgba(34,197,94,0.1)"
          : "rgba(148,163,184,0.1)",
        color: warn ? "#ef4444" : good ? "#22c55e" : "#94a3b8",
        border: `1px solid ${warn ? "#ef444440" : good ? "#22c55e40" : "#94a3b840"}`,
      }}
    >
      {label}: <strong>{value}</strong>
    </span>
  );
}

/* ──────────────────────────────────────────────
   Styles
────────────────────────────────────────────── */
const styles = {
  panel: {
    background: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(99, 102, 241, 0.25)",
    borderRadius: 16,
    padding: "28px 28px 24px",
    marginTop: 28,
    color: "#e2e8f0",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 14 },
  aiIcon: { fontSize: 36 },
  title: { margin: 0, fontSize: 18, fontWeight: 700, color: "#f1f5f9" },
  subtitle: { margin: "2px 0 0", fontSize: 12, color: "#94a3b8" },
  badge: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.1em",
    background: "rgba(99,102,241,0.18)",
    color: "#818cf8",
    border: "1px solid rgba(99,102,241,0.35)",
    borderRadius: 6,
    padding: "3px 8px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "14px 18px",
    marginBottom: 18,
  },
  formGroup: { display: "flex", flexDirection: "column", gap: 5 },
  label: { fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" },
  input: {
    background: "rgba(30,41,59,0.8)",
    border: "1px solid rgba(99,102,241,0.25)",
    borderRadius: 8,
    padding: "9px 12px",
    color: "#e2e8f0",
    fontSize: 13,
    outline: "none",
    fontFamily: "inherit",
    transition: "border 0.2s",
  },
  select: {
    background: "rgba(30,41,59,0.9)",
    border: "1px solid rgba(99,102,241,0.25)",
    borderRadius: 8,
    padding: "9px 12px",
    color: "#e2e8f0",
    fontSize: 13,
    outline: "none",
    cursor: "pointer",
  },
  checkLabel: { display: "flex", alignItems: "center", fontSize: 13, color: "#cbd5e1", cursor: "pointer" },
  btn: {
    width: "100%",
    padding: "12px 0",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: "0.03em",
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  spinner: { display: "inline-block", animation: "spin 1s linear infinite" },
  errorBox: {
    marginTop: 14,
    padding: "12px 16px",
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: 10,
    color: "#fca5a5",
    fontSize: 13,
  },
  emptyBox: {
    marginTop: 14,
    padding: "16px",
    background: "rgba(148,163,184,0.07)",
    border: "1px solid rgba(148,163,184,0.2)",
    borderRadius: 10,
    color: "#94a3b8",
    fontSize: 13,
    textAlign: "center",
  },
  resultsSection: { marginTop: 22 },
  resultsTitle: { margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#f1f5f9" },
  resultsNote: { margin: "0 0 14px", fontSize: 12, color: "#64748b" },
  cards: { display: "flex", flexDirection: "column", gap: 12 },
  card: {
    background: "rgba(30,41,59,0.5)",
    borderRadius: 12,
    padding: "14px 16px",
    cursor: "pointer",
    transition: "box-shadow 0.2s",
  },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  cardLeft: { display: "flex", alignItems: "center", gap: 10 },
  caseNum: {
    background: "rgba(99,102,241,0.15)",
    color: "#818cf8",
    borderRadius: 6,
    padding: "2px 8px",
    fontSize: 12,
    fontWeight: 700,
  },
  issueType: { fontSize: 13, fontWeight: 600, color: "#e2e8f0" },
  dept: { fontSize: 11, color: "#64748b", marginTop: 2 },
  simBadge: {
    borderRadius: 8,
    padding: "4px 10px",
    fontSize: 12,
    fontWeight: 700,
  },
  barTrack: { height: 4, background: "rgba(148,163,184,0.15)", borderRadius: 4, marginBottom: 10 },
  barFill: { height: 4, borderRadius: 4, transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)" },
  causeText: { fontSize: 12, color: "#94a3b8", marginBottom: 6 },
  causeLbl: { fontWeight: 600, color: "#64748b" },
  expanded: { borderTop: "1px solid rgba(99,102,241,0.15)", marginTop: 10, paddingTop: 12 },
  resolutionBox: {
    background: "rgba(34,197,94,0.07)",
    border: "1px solid rgba(34,197,94,0.2)",
    borderRadius: 8,
    padding: "10px 14px",
    marginBottom: 10,
  },
  resLbl: { fontSize: 11, fontWeight: 700, color: "#22c55e", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" },
  resText: { fontSize: 13, color: "#d1fae5", lineHeight: 1.6 },
  metaRow: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  tag: { fontSize: 11, padding: "3px 8px", borderRadius: 6 },
  caseId: { fontSize: 10, color: "#475569" },
  expandHint: { fontSize: 11, color: "#4f46e5", marginTop: 8, textAlign: "right" },
};
