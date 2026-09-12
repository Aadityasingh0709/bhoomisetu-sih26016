import { useState } from "react";
import { getAISuggestions } from "../api/ai.js";
import toast from "react-hot-toast";
import {
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileText,
  Copy,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
} from "lucide-react";

/* ──────────────────────────────────────────────
   Colour helpers for similarity percentage
────────────────────────────────────────────── */
const simColor = (pct) => {
  if (pct >= 85) return "#059669"; // emerald
  if (pct >= 60) return "#d97706"; // amber
  return "#dc2626"; // rose
};

const simBg = (pct) => {
  if (pct >= 85) return "rgba(16, 185, 129, 0.1)";
  if (pct >= 60) return "rgba(245, 158, 11, 0.1)";
  return "rgba(239, 68, 68, 0.1)";
};

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
export default function AIRecommendationPanel({ prefill = {}, onApplySuggestion }) {
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
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSearch = async () => {
    if (!form.issue_description.trim()) {
      setError("Please enter an issue description to generate AI suggestions.");
      return;
    }
    setError(null);
    setLoading(true);
    setSearched(false);
    setSuggestions([]);
    setRecommendation(null);
    try {
      const data = await getAISuggestions(form);
      setSuggestions(data.suggestions || []);
      setRecommendation(data.recommendation || null);
      setSearched(true);
      if (data.recommendation) {
        toast.success("AI resolution strategy generated!");
      }
    } catch (err) {
      if (err.response?.status === 503) {
        setError("AI model is initializing. Please try again in a few seconds.");
      } else {
        setError("Could not connect to the AI service. Ensure the ML microservice (port 5001) is active.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTemplate = () => {
    if (!recommendation) return;
    const textToCopy = recommendation.resolution_template || 
      `AI Suggested Resolution:\nHeadline: ${recommendation.headline}\nAction Plan:\n${(recommendation.steps || []).map((s, i) => `${i + 1}. ${s}`).join('\n')}\nStatutory Reference: ${recommendation.statutory_precedent}`;
    
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success("Resolution plan copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);

    if (onApplySuggestion) {
      onApplySuggestion(textToCopy);
    }
  };

  return (
    <div className="rounded-2xl border border-ochre-200 bg-white/90 p-5 shadow-sm backdrop-blur-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ink-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-ochre-500 to-amber-600 text-white shadow-md">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-ink-900 flex items-center gap-2">
              <span>AI Bottleneck Resolution Advisor</span>
              <span className="rounded-full bg-ochre-100 text-ochre-800 text-[10px] font-bold px-2 py-0.5 border border-ochre-200">
                KNN Engine
              </span>
            </h3>
            <p className="text-xs text-ink-500 mt-0.5">
              Trained on 12,424 historical cases · Prescribes concrete mitigation steps, turnaround time &amp; statutory precedents
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
            ⚡ Self-Learning Active
          </span>
        </div>
      </div>

      {/* Input Form */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="block text-xs font-bold text-ink-700 mb-1">
            Department / Task Group
          </label>
          <select
            name="department"
            value={form.department}
            onChange={handleChange}
            className="w-full rounded-xl border border-ink-200 bg-ink-50/50 px-3 py-2 text-xs font-semibold text-ink-900 outline-none focus:border-ochre-500 focus:bg-white"
          >
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-ink-700 mb-1">
            Issue Category / Headline
          </label>
          <input
            name="issue_type"
            value={form.issue_type}
            onChange={handleChange}
            placeholder="e.g. Boundary Overlap, Title Dispute, PPE Gap"
            className="w-full rounded-xl border border-ink-200 bg-ink-50/50 px-3 py-2 text-xs font-semibold text-ink-900 outline-none focus:border-ochre-500 focus:bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-ink-700 mb-1">
            Severity Classification
          </label>
          <select
            name="severity"
            value={form.severity}
            onChange={handleChange}
            className="w-full rounded-xl border border-ink-200 bg-ink-50/50 px-3 py-2 text-xs font-semibold text-ink-900 outline-none focus:border-ochre-500 focus:bg-white"
          >
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-ink-700 mb-1">
            Urgency / Priority
          </label>
          <select
            name="urgency"
            value={form.urgency}
            onChange={handleChange}
            className="w-full rounded-xl border border-ink-200 bg-ink-50/50 px-3 py-2 text-xs font-semibold text-ink-900 outline-none focus:border-ochre-500 focus:bg-white"
          >
            <option value="Not Specified">Standard Priority</option>
            <option value="High">High Urgency</option>
            <option value="Critical">Critical Path Delay</option>
          </select>
        </div>

        <div className="sm:col-span-2 lg:col-span-4">
          <label className="block text-xs font-bold text-ink-700 mb-1">
            Bottleneck Narrative / Description *
          </label>
          <textarea
            name="issue_description"
            value={form.issue_description}
            onChange={handleChange}
            placeholder="Describe the bottleneck or deadlock in detail (e.g. 'Survey boundary dispute in Gat 104 with neighbouring landowners claiming encroachment over 150 meters of alignment corridor')..."
            rows={3}
            className="w-full rounded-xl border border-ink-200 bg-ink-50/50 p-3 text-xs font-medium text-ink-900 outline-none focus:border-ochre-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-4 text-xs font-semibold text-ink-600">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="is_overdue"
              checked={form.is_overdue}
              onChange={handleChange}
              className="rounded border-ink-300 text-ochre-600 focus:ring-ochre-500"
            />
            <span>SLA Overdue / Critical Flag</span>
          </label>
          <div className="flex items-center gap-1.5">
            <span>Precedents:</span>
            <select
              name="k"
              value={form.k}
              onChange={handleChange}
              className="rounded-lg border border-ink-200 bg-white px-2 py-0.5 text-xs font-bold text-ink-800"
            >
              {[3, 5, 7, 10].map((n) => (
                <option key={n} value={n}>
                  Top {n} Matches
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-ochre-600 to-amber-700 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:from-ochre-700 hover:to-amber-800 transition-all disabled:opacity-60 cursor-pointer"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Analyzing 12,424 Cases…</span>
            </>
          ) : (
            <>
              <Sparkles size={15} />
              <span>Generate AI Suggestion &amp; Action Plan</span>
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. SYNTHESIZED AI RECOMMENDATION & ACTION PLAN (TOP BOX)
      ───────────────────────────────────────────────────────────── */}
      {recommendation && (
        <div className="rounded-2xl border-2 border-emerald-400 bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                <Lightbulb size={18} />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded">
                  AI Prescribed Strategic Solution
                </span>
                <h4 className="text-sm sm:text-base font-black text-ink-900 mt-0.5">
                  {recommendation.headline}
                </h4>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-emerald-100 border border-emerald-300 px-2.5 py-1 text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                <ShieldCheck size={13} />
                <span>{recommendation.confidence_score}% Confidence</span>
              </span>
              <span className="rounded-lg bg-blue-100 border border-blue-300 px-2.5 py-1 text-[11px] font-bold text-blue-900 flex items-center gap-1">
                <Clock size={13} />
                <span>ETA: {recommendation.estimated_turnaround_days}</span>
              </span>
            </div>
          </div>

          <p className="text-xs font-semibold text-ink-700 leading-relaxed">
            {recommendation.summary}
          </p>

          {/* Actionable Step-by-Step Checklist */}
          <div className="rounded-xl border border-emerald-200/80 bg-white p-4 space-y-2.5">
            <h5 className="text-xs font-black uppercase tracking-wider text-ink-800 flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span>Prescribed Step-by-Step Action Plan:</span>
            </h5>
            <ol className="space-y-2 text-xs text-ink-800">
              {(recommendation.steps || []).map((step, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-black text-emerald-800">
                    {idx + 1}
                  </span>
                  <span className="leading-snug pt-0.5 font-medium">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Meta Footer & Statutory Grounding */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="rounded-xl bg-ink-50/70 border border-ink-100 p-3 text-xs">
              <span className="font-bold text-ink-700 block mb-0.5">Statutory Precedent / Grounding:</span>
              <span className="text-ink-600 text-[11px] font-medium">{recommendation.statutory_precedent}</span>
            </div>
            <div className="rounded-xl bg-ink-50/70 border border-ink-100 p-3 text-xs">
              <span className="font-bold text-ink-700 block mb-0.5">Preventive Recommendation:</span>
              <span className="text-ink-600 text-[11px] font-medium">
                {(recommendation.preventive_measures || [])[0] || "Institute standardized joint measurement protocols."}
              </span>
            </div>
          </div>

          {/* Action Button: Copy / Apply Plan */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-emerald-200/80">
            <div className="text-[11px] text-ink-500 font-medium">
              💡 Click below to copy this structured plan directly into the resolution order or grievance response.
            </div>
            <button
              type="button"
              onClick={handleCopyTemplate}
              className="inline-flex items-center gap-2 rounded-xl bg-ink-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  <span>Resolution Plan Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy Suggested Resolution Plan</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. SUPPORTING HISTORICAL PRECEDENT CASES (KNN MATCHES)
      ───────────────────────────────────────────────────────────── */}
      {suggestions.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-ink-800 flex items-center gap-1.5">
              <FileText size={14} className="text-ochre-600" />
              <span>Matched Historical Cases ({suggestions.length} precedents found)</span>
            </h4>
            <span className="text-[11px] text-ink-400">
              Source: BhoomiSetu National Casebase (12,424 Records)
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {suggestions.map((s, idx) => (
              <div
                key={s.case_id || idx}
                className="rounded-xl border border-ink-100 bg-white p-4 shadow-sm hover:border-ochre-300 transition-all space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-ink-100 px-2 py-0.5 font-mono text-[10px] font-bold text-ink-700">
                      #{idx + 1} Precedent
                    </span>
                    <span className="font-bold text-xs text-ink-900">{s.issue_type}</span>
                    <span className="text-[11px] text-ink-400 font-medium">· {s.department}</span>
                  </div>

                  <div
                    className="self-start rounded-full px-2.5 py-0.5 text-[11px] font-extrabold"
                    style={{
                      backgroundColor: simBg(s.similarity),
                      color: simColor(s.similarity),
                      border: `1px solid ${simColor(s.similarity)}40`,
                    }}
                  >
                    {s.similarity}% Precedent Match
                  </div>
                </div>

                {/* Historical Action Taken (Always Visible) */}
                <div className="rounded-lg bg-emerald-50/60 border border-emerald-200/60 p-2.5 text-xs text-ink-800 flex items-start gap-2">
                  <CheckCircle2 size={14} className="shrink-0 text-emerald-600 mt-0.5" />
                  <div>
                    <span className="font-bold text-emerald-950">Action Taken: </span>
                    <span className="text-ink-700">{s.resolution_action}</span>
                  </div>
                </div>

                {/* Sub-details */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-500 border-t border-ink-100/60 pt-2">
                  <span>
                    <strong className="text-ink-700">Cause:</strong> {s.cause || "Standard operational delay"}
                  </span>
                  <div className="flex items-center gap-2">
                    {s.classification && (
                      <span className="rounded bg-ink-100/70 px-1.5 py-0.2 text-[10px] text-ink-600">
                        {s.classification}
                      </span>
                    )}
                    <span className="font-mono text-[10px] text-ink-400">ID: {s.case_id}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {searched && suggestions.length === 0 && !error && (
        <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50/50 p-6 text-center text-xs text-ink-500">
          No direct historical matches found for this query. Try adjusting the description or select "General" department.
        </div>
      )}
    </div>
  );
}
