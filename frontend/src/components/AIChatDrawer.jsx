import { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  WifiOff,
  AlertTriangle,
  Clock,
  FileText,
  Copy,
  Lightbulb,
  CornerDownRight,
  Shield,
} from "lucide-react";
import { getAISuggestions, chatWithAI } from "../api/ai.js";
import toast from "react-hot-toast";

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-3.5 py-2.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-violet-400 animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}

function BotResponseBubble({ rec, suggestions, onApply, onClose }) {
  const isLow = rec.is_low_confidence || rec.no_match_found;

  const handleApply = () => {
    const text =
      rec.resolution_template ||
      `DIRECTIVE: ${rec.headline}\n\nSummary:\n${rec.summary}\n\nAction Plan:\n${(rec.steps || [])
        .map((s, i) => `${i + 1}. ${s}`)
        .join("\n")}\n\nCompliance Deadline: ${
        rec.estimated_turnaround_days || "5-7 Days"
      }\nStatutory Reference: ${rec.statutory_precedent}`;
    if (onApply) {
      onApply(text);
      toast.success("Applied to resolution note!");
    }
    if (onClose) onClose();
  };

  const copyToClipboard = () => {
    const text =
      rec.resolution_template ||
      `DIRECTIVE: ${rec.headline}\n\n${(rec.steps || []).map((s, i) => `${i + 1}. ${s}`).join("\n")}`;
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="max-w-[95%] space-y-2.5 text-xs text-ink-800 animate-fadeIn">
      {/* Status card */}
      <div
        className={`rounded-2xl rounded-tl-none border p-3.5 shadow-sm space-y-2 ${
          isLow
            ? "bg-gradient-to-br from-amber-50/90 to-orange-50/60 border-amber-300"
            : "bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white border-emerald-300"
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b pb-2 border-inherit">
          <div className="flex items-center gap-1.5">
            {isLow ? (
              <AlertTriangle size={14} className="text-amber-600 shrink-0" />
            ) : (
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
            )}
            <span
              className={`font-black text-[11px] ${
                isLow ? "text-amber-950" : "text-emerald-950"
              }`}
            >
              {isLow ? "Standard SOP Prescribed" : "Historical Precedent Matched"}
            </span>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              isLow
                ? "bg-amber-200 text-amber-900"
                : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {isLow ? "Fallback SOP" : `${rec.confidence_score}% Match`}
          </span>
        </div>

        <p className="font-bold text-ink-900 text-xs">{rec.headline}</p>
        <p className="text-[11px] text-ink-600 leading-relaxed">{rec.summary}</p>
      </div>

      {/* Actionable Steps */}
      {(rec.steps || []).length > 0 && (
        <div className="rounded-2xl rounded-tl-none bg-white border border-ink-100 p-3.5 shadow-sm space-y-2">
          <div className="flex items-center gap-1.5 text-ink-500 font-black text-[10px] uppercase tracking-wider">
            <FileText size={11} className="text-violet-600" />
            <span>Resolution Directives</span>
          </div>
          <div className="space-y-2">
            {(rec.steps || []).map((step, idx) => (
              <div key={idx} className="flex items-start gap-2 text-[11px] text-ink-700 leading-snug">
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-black mt-0.5 ${
                    isLow
                      ? "bg-amber-100 text-amber-900"
                      : "bg-emerald-100 text-emerald-900"
                  }`}
                >
                  {idx + 1}
                </span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata strip */}
      <div className="rounded-xl bg-white border border-ink-100 px-3 py-2 text-[10px] text-ink-500 space-y-1">
        {rec.statutory_precedent && (
          <div className="flex items-start gap-1">
            <span className="font-bold text-ink-700 shrink-0">Statutory:</span>
            <span className="line-clamp-2">{rec.statutory_precedent}</span>
          </div>
        )}
        {rec.estimated_turnaround_days && (
          <div className="flex items-center gap-1">
            <Clock size={11} className="text-ink-400 shrink-0" />
            <span className="font-bold text-ink-700">Turnaround:</span>
            <span>{rec.estimated_turnaround_days}</span>
          </div>
        )}
      </div>

      {/* Top Precedent Cases */}
      {!isLow && suggestions && suggestions.length > 0 && (
        <div className="rounded-xl bg-white border border-ink-100 p-2.5 text-[10px] space-y-1.5">
          <span className="font-black uppercase tracking-wider text-ink-400 block">
            Top Matched Precedents ({suggestions.length})
          </span>
          {suggestions.slice(0, 3).map((s, i) => (
            <div key={i} className="flex items-center justify-between gap-2 border-b border-ink-50 last:border-none pb-1">
              <span className="truncate text-ink-700 font-medium">#{s.case_id} · {s.issue_type}</span>
              <span className="font-bold text-emerald-600 shrink-0">{s.similarity}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1">
        {onApply && (
          <button
            type="button"
            onClick={handleApply}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-white font-bold text-[11px] shadow-sm transition-all cursor-pointer ${
              isLow
                ? "bg-amber-700 hover:bg-amber-800"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            <CheckCircle2 size={13} />
            <span>Apply to Resolution</span>
          </button>
        )}
        <button
          type="button"
          onClick={copyToClipboard}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-ink-200 bg-white hover:bg-ink-50 text-ink-700 font-bold text-[11px] transition-all cursor-pointer"
        >
          <Copy size={12} />
          <span>Copy</span>
        </button>
      </div>
    </div>
  );
}

export default function AIChatDrawer({ isOpen, onClose, target, onApply }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [latestRec, setLatestRec] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize query when drawer opens with a target
  useEffect(() => {
    if (isOpen && target) {
      const initialPrompt = target.message || target.issueDescription || "Bottleneck resolution";
      setMessages([]);
      setLatestRec(null);
      handleInitialAnalysis(initialPrompt);
    }
  }, [isOpen, target]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!loading && isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [loading, isOpen]);

  // Initial case analysis against 100 cases
  const handleInitialAnalysis = async (problemText) => {
    if (!problemText?.trim()) return;

    const deptName =
      target?.department?.displayName ||
      target?.department?.name ||
      target?.department ||
      "Survey & Land Records";

    setMessages([
      {
        role: "user",
        content: `Analyze bottleneck for ${deptName}: "${problemText}"`,
      },
    ]);
    setLoading(true);

    try {
      const data = await getAISuggestions({
        department: deptName,
        issue_type: target?.type || "Bottleneck",
        issue_description: problemText,
        severity: target?.severity === "High" ? "System Failure" : "Behavioural Failure",
        urgency: target?.severity === "High" ? "Critical" : "High",
        k: 5,
      });

      const rec = data.recommendation;
      if (!rec) {
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            type: "offline",
            content:
              "The Python ML service on port 5001 is offline. Start it by running `python app.py` in the `bhoomisetu-ml-service` folder.",
          },
        ]);
        return;
      }

      setLatestRec(rec);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          type: rec.is_low_confidence ? "fallback" : "match",
          recommendation: rec,
          suggestions: data.suggestions || [],
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          type: "error",
          content: "Unable to reach the AI engine. Please ensure the ML service is running on port 5001.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Conversational follow-up question / instruction handler
  const handleSendMessage = async (userQuery) => {
    if (!userQuery?.trim() || loading) return;

    const deptName =
      target?.department?.displayName ||
      target?.department?.name ||
      target?.department ||
      "Survey & Land Records";

    const baseDescription = target?.message || target?.issueDescription || "";

    // Show user question bubble
    setMessages((prev) => [...prev, { role: "user", content: userQuery }]);
    setInputValue("");
    setLoading(true);

    try {
      const data = await chatWithAI({
        message: userQuery,
        department: deptName,
        issue_type: target?.type || "Bottleneck",
        issue_description: baseDescription,
        current_recommendation: latestRec,
      });

      if (data.recommendation) {
        setLatestRec(data.recommendation);
      }

      if (data.is_conversational) {
        // Direct answer to user's question (e.g. "what should be our next step")
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            type: "chat_reply",
            content: data.reply,
          },
        ]);
      } else {
        // Ground context refinement that yielded updated precedent
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            type: "chat_reply",
            content: data.reply,
            recommendation: data.recommendation,
            suggestions: data.suggestions || [],
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          type: "error",
          content: "Encountered an issue communicating with the AI service. Please verify port 5001.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFollowUp = (question) => {
    if (loading) return;
    handleSendMessage(question);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Semi-transparent backdrop */}
      <div
        className="absolute inset-0 bg-ink-950/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-in Chatbot Panel from Right */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out border-l border-ink-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-700 via-indigo-700 to-blue-700 px-5 py-4 text-white flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 shadow-inner">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-black text-sm flex items-center gap-1.5">
                  <span>BhoomiSetu AI Copilot</span>
                  <span className="text-[10px] bg-emerald-400/30 text-emerald-200 border border-emerald-300/40 px-1.5 py-0.2 rounded-full font-bold">
                    KNN Conversational
                  </span>
                </h3>
                <p className="text-[10px] text-violet-200">
                  Interactive Land Acquisition Resolution Chatbot
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-violet-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Active Context Banner */}
          {target && (
            <div className="bg-ink-900 text-white px-4 py-2 text-[11px] flex items-center gap-2 shrink-0 border-b border-ink-800">
              <span className="text-violet-300 font-bold uppercase tracking-wider text-[9px] shrink-0">
                Context:
              </span>
              <span className="truncate text-ink-300 font-medium">
                {target.message || target.issueDescription || "Bottleneck Alert"}
              </span>
            </div>
          )}

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                  <Sparkles size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-sm text-ink-800">BhoomiSetu Chatbot Assistant</h4>
                  <p className="text-xs text-ink-500 max-w-xs">
                    Analyzing bottleneck against statutory frameworks &amp; 100 historical precedents.
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black shadow-xs mt-1 ${
                    msg.role === "user"
                      ? "bg-ink-800 text-white"
                      : "bg-gradient-to-br from-violet-600 to-indigo-600 text-white"
                  }`}
                >
                  {msg.role === "user" ? <User size={13} /> : <Bot size={13} />}
                </div>

                {/* User Bubble */}
                {msg.role === "user" ? (
                  <div className="max-w-[80%] rounded-2xl rounded-tr-none bg-ink-800 text-white px-3.5 py-2.5 text-xs shadow-sm font-medium leading-relaxed">
                    {msg.content}
                  </div>
                ) : msg.type === "offline" || msg.type === "error" ? (
                  <div className="max-w-[88%] rounded-2xl rounded-tl-none bg-rose-50 border border-rose-200 p-3.5 space-y-1.5 shadow-xs">
                    <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs">
                      <WifiOff size={14} />
                      <span>ML Microservice Offline</span>
                    </div>
                    <p className="text-xs text-rose-900 leading-snug">{msg.content}</p>
                    <div className="pt-1">
                      <code className="text-[10px] bg-rose-100 text-rose-900 px-2 py-1 rounded font-mono block">
                        python bhoomisetu-ml-service/app.py
                      </code>
                    </div>
                  </div>
                ) : msg.type === "chat_reply" ? (
                  /* Conversational Assistant Answer */
                  <div className="max-w-[90%] space-y-2 animate-fadeIn">
                    <div className="rounded-2xl rounded-tl-none bg-white border border-violet-200 p-3.5 shadow-sm text-xs text-ink-800 space-y-2 leading-relaxed">
                      <div className="flex items-center gap-1.5 text-violet-700 font-bold text-[11px] border-b border-violet-100 pb-1.5 mb-1.5">
                        <Sparkles size={12} />
                        <span>Resolution Copilot Response</span>
                      </div>
                      <div className="whitespace-pre-line text-ink-800 text-[11.5px] leading-relaxed">
                        {msg.content}
                      </div>
                    </div>

                    {/* If refined recommendation was returned with the reply */}
                    {msg.recommendation && (
                      <BotResponseBubble
                        rec={msg.recommendation}
                        suggestions={msg.suggestions}
                        onApply={onApply}
                        onClose={onClose}
                      />
                    )}
                  </div>
                ) : msg.recommendation ? (
                  /* Initial Precedent Directive Card */
                  <BotResponseBubble
                    rec={msg.recommendation}
                    suggestions={msg.suggestions}
                    onApply={onApply}
                    onClose={onClose}
                  />
                ) : null}
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-xs">
                  <Bot size={13} />
                </div>
                <div className="rounded-2xl rounded-tl-none bg-white border border-ink-200 shadow-xs">
                  <TypingDots />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Quick Follow-Up Chips */}
          <div className="bg-white border-t border-ink-100 px-3.5 py-2 shrink-0">
            <div className="flex items-center gap-1 text-[10px] font-bold text-ink-400 mb-1.5">
              <Lightbulb size={11} className="text-amber-500" />
              <span>Suggested Follow-Ups:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickFollowUp("what should be our next step")}
                className="px-2.5 py-1 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 text-[10.5px] font-medium transition-colors cursor-pointer flex items-center gap-1"
              >
                <CornerDownRight size={10} />
                <span>Next step?</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFollowUp("who is responsible for this?")}
                className="px-2.5 py-1 rounded-lg bg-ink-50 hover:bg-ink-100 text-ink-700 border border-ink-100 text-[10.5px] font-medium transition-colors cursor-pointer flex items-center gap-1"
              >
                <User size={10} />
                <span>Who is responsible?</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFollowUp("how many days will it take?")}
                className="px-2.5 py-1 rounded-lg bg-ink-50 hover:bg-ink-100 text-ink-700 border border-ink-100 text-[10.5px] font-medium transition-colors cursor-pointer flex items-center gap-1"
              >
                <Clock size={10} />
                <span>Timeframe / SLA?</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFollowUp("what documents are required?")}
                className="px-2.5 py-1 rounded-lg bg-ink-50 hover:bg-ink-100 text-ink-700 border border-ink-100 text-[10.5px] font-medium transition-colors cursor-pointer flex items-center gap-1"
              >
                <FileText size={10} />
                <span>Required documents?</span>
              </button>
            </div>
          </div>

          {/* Chat Input Bar */}
          <div className="border-t border-ink-200 bg-white p-3 shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputValue)}
                placeholder="Ask next steps, responsible officer, or describe updates…"
                disabled={loading}
                className="flex-1 rounded-xl border border-ink-200 bg-ink-50 px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => handleSendMessage(inputValue)}
                disabled={!inputValue.trim() || loading}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm hover:from-violet-700 hover:to-indigo-700 disabled:opacity-40 transition-all cursor-pointer"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
