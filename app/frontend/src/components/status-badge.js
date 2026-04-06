import { el } from "../lib/dom.js";

export function renderStatusBadge(status) {
  const toneMap = {
    Blocked: "blocked",
    Warning: "warning",
    Deferred: "deferred",
    "In Progress": "in-progress",
    "Not Ready": "not-started",
    "Conditionally Ready": "warning",
    Ready: "success",
    Fail: "not-started",
    Pass: "success",
    "Not Started": "not-started"
  };

  const labelMap = {
    Blocked: "Needs attention",
    Warning: "Needs attention",
    Deferred: "Skipped for now",
    "In Progress": "In progress",
    "Not Ready": "Not ready",
    "Conditionally Ready": "Check required",
    Ready: "Ready to go live",
    Fail: "Not yet started",
    Pass: "Done",
    "Not Started": "Not started"
  };

  const tone = toneMap[status] || "not-started";
  const label = labelMap[status] || status;

  const toneStyles = {
    "success": "background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2); color: #065f46;",
    "not-started": "background: rgba(12,26,48,0.06); border: 1px solid rgba(12,26,48,0.12); color: #64748b;",
    "blocked": "background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); color: #dc2626;",
    "in-progress": "background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2); color: #92400e;",
    "warning": "background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2); color: #92400e;",
    "deferred": "background: rgba(12,26,48,0.06); border: 1px solid rgba(12,26,48,0.12); color: #64748b;",
  };

  const baseStyle = "display: inline-block; font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; padding: 3px 10px; border-radius: 6px;";
  const style = baseStyle + (toneStyles[tone] || toneStyles["not-started"]);

  return el("span", { className: `status-badge status-badge--${tone}`, style, text: label });
}
