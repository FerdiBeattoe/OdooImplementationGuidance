export function createAuditEntry(patch = {}) {
  return {
    id: patch.id || `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind: patch.kind || "info",
    actor: patch.actor || "system",
    domainId: patch.domainId || "",
    previewId: patch.previewId || "",
    executionId: patch.executionId || "",
    targetModel: patch.targetModel || "",
    targetIdentifier: patch.targetIdentifier || "",
    operation: patch.operation || "",
    safetyClass: patch.safetyClass || "blocked",
    prerequisiteStatus: patch.prerequisiteStatus || "",
    prerequisites: Array.isArray(patch.prerequisites) ? patch.prerequisites : [],
    deploymentTarget: patch.deploymentTarget || "",
    branchTarget: patch.branchTarget || "",
    status: patch.status || "recorded",
    reason: patch.reason || "",
    summary: patch.summary || "",
    createdAt: patch.createdAt || new Date().toISOString()
  };
}

export function normalizeAuditLog(entries = []) {
  return Array.isArray(entries) ? entries.map((entry) => createAuditEntry(entry)) : [];
}
