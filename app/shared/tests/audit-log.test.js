import test from "node:test";
import assert from "node:assert/strict";

import { createAuditEntry, normalizeAuditLog } from "../audit-log.js";

test("audit entry normalization preserves preview, prerequisite, and deployment context", () => {
  const entry = createAuditEntry({
    kind: "execution",
    previewId: "preview-7",
    executionId: "execution-7",
    targetModel: "crm.team",
    prerequisiteStatus: "validated",
    prerequisites: ["CRM sales-team ownership checkpoint remains in scope."],
    deploymentTarget: "On-Premise",
    branchTarget: "",
    status: "succeeded"
  });

  assert.equal(entry.previewId, "preview-7");
  assert.equal(entry.executionId, "execution-7");
  assert.equal(entry.prerequisiteStatus, "validated");
  assert.equal(entry.deploymentTarget, "On-Premise");
  assert.deepEqual(normalizeAuditLog([entry])[0].prerequisites, entry.prerequisites);
});
