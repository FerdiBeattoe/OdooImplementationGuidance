import test from "node:test";
import assert from "node:assert/strict";

import {
  getProjectStoreRecordId,
  getProjectStoreRecordLabel,
  normalizeProjectStorePayload
} from "../project-store.js";

test("normalizeProjectStorePayload preserves valid saved projects and drops malformed records", () => {
  const validProject = {
    projectIdentity: {
      projectId: "proj-valid",
      projectName: "Valid Project"
    }
  };

  const normalized = normalizeProjectStorePayload({
    projects: [
      {},
      { projectIdentity: null },
      { projectIdentity: { projectId: "" } },
      validProject
    ],
    savedAt: "2026-03-23T08:00:00Z"
  });

  assert.deepEqual(normalized.projects, [validProject]);
  assert.equal(normalized.savedAt, "2026-03-23T08:00:00Z");
});

test("project-store helpers fail safe for malformed saved-project records", () => {
  assert.equal(getProjectStoreRecordId({}), "");
  assert.equal(getProjectStoreRecordLabel({}), "");
  assert.equal(getProjectStoreRecordId({ projectIdentity: { projectId: "proj-1" } }), "proj-1");
  assert.equal(
    getProjectStoreRecordLabel({ projectIdentity: { projectId: "proj-1", projectName: "  " } }),
    "proj-1"
  );
});
