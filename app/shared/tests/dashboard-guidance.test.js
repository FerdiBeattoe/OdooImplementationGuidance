import test from "node:test";
import assert from "node:assert/strict";

import { SAMPLE_GUIDANCE_BLOCKS, getGuidanceBlockForCheckpoint } from "../guidance.js";
import { createInitialProjectState } from "../project-state.js";

test("dashboard guidance can bind truthfully to the active primary checkpoint", () => {
  const state = createInitialProjectState();
  state.checkpoints.forEach((checkpoint) => {
    checkpoint.status = checkpoint.id === "checkpoint-crm-lead-opportunity-model" ? "Fail" : "Pass";
  });

  const primaryCheckpoint = state.checkpoints.find((checkpoint) => checkpoint.status !== "Pass");
  const guidanceBlock = getGuidanceBlockForCheckpoint(primaryCheckpoint);

  assert.equal(primaryCheckpoint?.guidanceKey, "crmLeadOpportunityModel");
  assert.equal(guidanceBlock, SAMPLE_GUIDANCE_BLOCKS.crmLeadOpportunityModel);
  assert.notEqual(guidanceBlock, SAMPLE_GUIDANCE_BLOCKS.inventory);
});

test("dashboard guidance returns no block when checkpoint guidance cannot be resolved safely", () => {
  assert.equal(getGuidanceBlockForCheckpoint({ guidanceKey: "missing-guidance" }), null);
  assert.equal(getGuidanceBlockForCheckpoint(null), null);
});
