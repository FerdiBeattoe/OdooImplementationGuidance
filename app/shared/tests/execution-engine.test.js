import test from "node:test";
import assert from "node:assert/strict";

import { createExecutionOutcome } from "../execution-engine.js";

test("execution outcome preserves preview linkage and audit context", () => {
  const preview = {
    id: "preview-1",
    domainId: "inventory",
    targetModel: "stock.warehouse",
    targetIdentifier: "MAIN",
    operation: "create",
    safetyClass: "safe"
  };

  const result = createExecutionOutcome(preview, {
    status: "succeeded",
    resultSummary: "Applied."
  });

  assert.equal(result.execution.previewId, "preview-1");
  assert.equal(result.auditEntry.previewId, "preview-1");
  assert.equal(result.auditEntry.targetModel, "stock.warehouse");
});

test("execution outcome carries prerequisite and deployment context into audit records", () => {
  const preview = {
    id: "preview-2",
    domainId: "crm",
    targetModel: "crm.team",
    targetIdentifier: "North Team",
    operation: "create",
    safetyClass: "safe",
    prerequisites: ["CRM sales-team ownership checkpoint remains in scope."],
    deploymentTarget: "On-Premise",
    branchTarget: ""
  };

  const result = createExecutionOutcome(preview, {
    status: "succeeded",
    prerequisiteStatus: "validated",
    resultSummary: "Applied."
  });

  assert.equal(result.auditEntry.prerequisiteStatus, "validated");
  assert.deepEqual(result.auditEntry.prerequisites, preview.prerequisites);
  assert.equal(result.auditEntry.deploymentTarget, "On-Premise");
});
