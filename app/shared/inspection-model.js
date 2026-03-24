import { getDomainSupport } from "./domain-capabilities.js";

export function createInitialInspectionState() {
  return {
    domains: {}
  };
}

export function normalizeInspectionState(state = {}) {
  return {
    domains: typeof state?.domains === "object" && state.domains ? state.domains : {}
  };
}

export function createInspectionRecord(domainId, patch = {}) {
  return {
    domainId,
    status: "idle",
    inspectedAt: "",
    lastPreviewableAt: "",
    lastExecutableAt: "",
    summary: "",
    moduleStatus: [],
    recordCounts: {},
    modelStatus: {},
    blockedReasons: [],
    deploymentNotes: [],
    ...patch
  };
}

export function buildInspectionSummary(domainId, inspection) {
  const support = getDomainSupport(domainId);
  const moduleSummary = Array.isArray(inspection?.moduleStatus)
    ? inspection.moduleStatus.map((item) => `${item.module}: ${item.state}`).join(", ")
    : "";

  return {
    headline: support.summary,
    summary: inspection?.summary || "No inspection has been recorded for this domain yet.",
    moduleSummary,
    blockedReasons: inspection?.blockedReasons || [],
    recordCounts: inspection?.recordCounts || {}
  };
}

