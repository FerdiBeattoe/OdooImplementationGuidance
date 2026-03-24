import { createAuditEntry } from "./audit-log.js";

export function createInitialExecutionState() {
  return {
    executions: []
  };
}

export function normalizeExecutionState(state = {}) {
  return {
    executions: Array.isArray(state?.executions) ? state.executions.map((execution) => normalizeExecutionRecord(execution)) : []
  };
}

export function normalizeExecutionRecord(execution = {}) {
  return {
    id: execution.id || `execution-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    previewId: execution.previewId || "",
    domainId: execution.domainId || "",
    status: execution.status || "planned",
    resultSummary: execution.resultSummary || "",
    failureReason: execution.failureReason || "",
    actor: execution.actor || "ui-user",
    startedAt: execution.startedAt || "",
    completedAt: execution.completedAt || ""
  };
}

export function createExecutionOutcome(preview, patch = {}) {
  const execution = normalizeExecutionRecord({
    previewId: preview.id,
    domainId: preview.domainId,
    startedAt: new Date().toISOString(),
    ...patch
  });

  const auditEntry = createAuditEntry({
    kind: "execution",
    actor: execution.actor,
    domainId: execution.domainId,
    previewId: preview.id,
    executionId: execution.id,
    targetModel: preview.targetModel,
    targetIdentifier: preview.targetIdentifier,
    operation: preview.operation,
    safetyClass: preview.safetyClass,
    prerequisiteStatus: patch.prerequisiteStatus || (preview.prerequisites?.length ? "validated" : "not-required"),
    prerequisites: preview.prerequisites || [],
    deploymentTarget: preview.deploymentTarget || "",
    branchTarget: preview.branchTarget || "",
    status: execution.status,
    reason: execution.failureReason,
    summary: execution.resultSummary
  });

  return { execution, auditEntry };
}
