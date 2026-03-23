import { el } from "../lib/dom.js";

export function renderStatusBadge(status) {
  const tone = status.toLowerCase().replace(/\s+/g, "-");
  return el("span", { className: `status-badge status-badge--${tone}`, text: status });
}
