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

  return el("span", { className: `status-badge status-badge--${tone}`, text: label });
}
