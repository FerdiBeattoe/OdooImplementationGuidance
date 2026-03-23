import test from "node:test";
import assert from "node:assert/strict";

import { getCompactDownstreamImpactSummary, SAMPLE_GUIDANCE_BLOCKS } from "../guidance.js";

test("compact downstream impact summary reuses existing inventory guidance content", () => {
  const summary = getCompactDownstreamImpactSummary(SAMPLE_GUIDANCE_BLOCKS.inventoryWarehouse);

  assert.match(summary, /Affects operation-type design and route viability\./);
  assert.match(summary, /Changes how users execute stock moves and how evidence is reviewed\./);
});

test("compact downstream impact summary remains empty when no guidance impact exists", () => {
  assert.equal(getCompactDownstreamImpactSummary(null), "");
});
