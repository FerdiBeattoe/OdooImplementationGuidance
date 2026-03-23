import test from "node:test";
import assert from "node:assert/strict";

import { addManufacturingConfigurationRecord, updateManufacturingConfigurationRecord } from "../manufacturing-configuration.js";
import { updateManufacturingEvidenceRecord } from "../manufacturing-evidence.js";
import { getManufacturingReadinessSummary } from "../manufacturing-readiness.js";
import { createInitialProjectState, normalizeProjectState } from "../project-state.js";

test("blocked required or go-live Manufacturing checkpoints prevent ready", () => {
  const state = createInitialProjectState();
  const summary = getManufacturingReadinessSummary(state);

  assert.equal(summary.readinessState, "not_ready");
  assert.ok(summary.blockers.length > 0);
});

test("design capture without stronger evidence does not produce false ready", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(addManufacturingConfigurationRecord(state, "productionModeCapture"));
  const recordKey = state.manufacturingConfiguration.productionModeCapture[0].key;
  state = normalizeProjectState(
    updateManufacturingConfigurationRecord(state, "productionModeCapture", recordKey, {
      productionModeLabel: "Make to Order",
      productionStrategyNotes: "Planning only",
      exceptionNotes: "Context only",
      inScope: true
    })
  );
  state = clearRequiredManufacturingBlockers(state);

  const summary = getManufacturingReadinessSummary(state);

  assert.equal(summary.readinessState, "not_ready");
  assert.ok(summary.captureOnly.length > 0);
});

test("user-asserted Manufacturing evidence remains weaker than hard readiness", () => {
  let state = clearRequiredManufacturingBlockers(createInitialProjectState());
  state = assertRequiredManufacturingEvidence(state);

  const summary = getManufacturingReadinessSummary(state);

  assert.equal(summary.readinessState, "not_ready");
  assert.notEqual(summary.readinessState, "ready");
});

test("malformed or missing Manufacturing inputs fail safe", () => {
  const summary = getManufacturingReadinessSummary({ checkpoints: null });

  assert.equal(summary.readinessState, "not_ready");
  assert.match(summary.explanation, /unavailable/i);
});

test("Manufacturing readiness remains domain-bounded", () => {
  let state = clearRequiredManufacturingBlockers(createInitialProjectState());
  state = assertRequiredManufacturingEvidence(state);
  const foreignCheckpoint = state.checkpoints.find((item) => item.id === "checkpoint-crm-lead-opportunity-model");
  foreignCheckpoint.status = "Fail";
  foreignCheckpoint.blockerFlag = true;
  foreignCheckpoint.blockedReason = "Foreign checkpoint should not leak into Manufacturing readiness.";

  const summary = getManufacturingReadinessSummary(normalizeProjectState(state));

  assert.equal(summary.readinessState, "not_ready");
  assert.ok(summary.failedCheckpoints.every((item) => item.checkpointId.startsWith("checkpoint-manufacturing-")));
  assert.ok(summary.blockers.every((item) => item.checkpointId.startsWith("checkpoint-manufacturing-")));
});

function clearRequiredManufacturingBlockers(state) {
  const nextState = structuredClone(state);
  const checkpointIds = [
    "checkpoint-project-mode",
    "checkpoint-manufacturing-process-mode",
    "checkpoint-manufacturing-bom-governance",
    "checkpoint-manufacturing-routing-control"
  ];

  for (const checkpointId of checkpointIds) {
    const checkpoint = nextState.checkpoints.find((item) => item.id === checkpointId);
    checkpoint.status = "Pass";
    checkpoint.evidenceReference = `${checkpointId}-approved`;
    if (checkpoint.id === "checkpoint-project-mode") {
      checkpoint.checkpointOwner = "Project owner";
      checkpoint.reviewer = "Implementation lead";
    }
    if (checkpoint.domainId === "manufacturing-mrp") {
      checkpoint.checkpointOwner = "Manufacturing lead";
      checkpoint.reviewer = "Manufacturing reviewer";
    }
    checkpoint.blockerFlag = false;
    checkpoint.blockedReason = "";
  }

  return normalizeProjectState(nextState);
}

function assertRequiredManufacturingEvidence(state) {
  let nextState = normalizeProjectState(
    updateManufacturingEvidenceRecord(state, "checkpoint-manufacturing-process-mode", {
      mode: "user_asserted",
      summary: "Manufacturing lead confirmed process-mode support.",
      sourceLabel: "User assertion",
      recordedActor: "manufacturing-ui-user"
    })
  );
  nextState = normalizeProjectState(
    updateManufacturingEvidenceRecord(nextState, "checkpoint-manufacturing-bom-governance", {
      mode: "user_asserted",
      summary: "Manufacturing lead confirmed BOM-governance support.",
      sourceLabel: "User assertion",
      recordedActor: "manufacturing-ui-user"
    })
  );
  nextState = normalizeProjectState(
    updateManufacturingEvidenceRecord(nextState, "checkpoint-manufacturing-routing-control", {
      mode: "user_asserted",
      summary: "Manufacturing lead confirmed routing-control support.",
      sourceLabel: "User assertion",
      recordedActor: "manufacturing-ui-user"
    })
  );

  return nextState;
}
