import test from "node:test";
import assert from "node:assert/strict";

import { addInventoryConfigurationRecord, updateInventoryConfigurationRecord } from "../inventory-configuration.js";
import { updateInventoryEvidenceRecord } from "../inventory-evidence.js";
import { getInventoryReadinessSummary } from "../inventory-readiness.js";
import { createInitialProjectState, normalizeProjectState, updateCheckpointRecord } from "../project-state.js";

test("blocked required or go-live inventory checkpoints prevent ready", () => {
  const state = createInitialProjectState();
  const summary = getInventoryReadinessSummary(state);

  assert.equal(summary.readinessState, "not_ready");
  assert.ok(summary.blockers.length > 0);
});

test("deferred recommended inventory item can still produce conditionally ready when blockers are clear", () => {
  let state = createInitialProjectState();
  state = clearCoreInventoryBlockers(state);
  state = assertCriticalInventoryEvidence(state);
  state = updateCheckpointRecord(state, "checkpoint-inventory-landed-costs", {
    status: "Warning",
    defermentFlag: true,
    defermentReason: "Phase 2 rollout.",
    reviewPoint: "Before readiness sign-off."
  });

  const summary = getInventoryReadinessSummary(state);

  assert.equal(summary.readinessState, "conditionally_ready");
  assert.equal(summary.deferredCheckpoints.length, 1);
});

test("design capture without sufficient evidence does not produce false ready", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(addInventoryConfigurationRecord(state, "warehouses"));
  const warehouseKey = state.inventoryConfiguration.warehouses[0].key;
  state = normalizeProjectState(
    updateInventoryConfigurationRecord(state, "warehouses", warehouseKey, {
      warehouseName: "Main warehouse",
      code: "WH1",
      companyScope: "Holding company",
      purposeNotes: "Primary stock storage",
      inScope: true
    })
  );
  state = clearCoreInventoryBlockers(state);

  const summary = getInventoryReadinessSummary(state);

  assert.equal(summary.readinessState, "not_ready");
  assert.ok(summary.captureOnly.length > 0);
});

test("next actions prioritize blockers over softer evidence gaps", () => {
  let state = createInitialProjectState();
  state = updateCheckpointRecord(state, "checkpoint-inventory-landed-costs", {
    status: "Warning"
  });

  const summary = getInventoryReadinessSummary(state);

  assert.equal(summary.nextActions[0].priority, "blocker");
});

test("summary remains consistent after resume or load", () => {
  let state = createInitialProjectState();
  state = clearCoreInventoryBlockers(state);
  const initial = getInventoryReadinessSummary(state);
  const resumed = getInventoryReadinessSummary(normalizeProjectState(structuredClone(state)));

  assert.deepEqual(resumed, initial);
});

test("malformed or missing summary inputs fail safe and do not overstate readiness", () => {
  const summary = getInventoryReadinessSummary({ checkpoints: null });

  assert.equal(summary.readinessState, "not_ready");
  assert.match(summary.explanation, /unavailable/i);
});

function clearCoreInventoryBlockers(state) {
  const nextState = structuredClone(state);
  const checkpointIds = [
    "checkpoint-project-mode",
    "checkpoint-finance-policy",
    "checkpoint-accounting-valuation-method-prerequisites",
    "checkpoint-accounting-stock-mapping-prerequisites",
    "checkpoint-accounting-landed-cost-prerequisites",
    "checkpoint-inventory-warehouse-setup",
    "checkpoint-inventory-operation-types",
    "checkpoint-inventory-routes",
    "checkpoint-inventory-valuation"
  ];

  for (const checkpointId of checkpointIds) {
    const checkpoint = nextState.checkpoints.find((item) => item.id === checkpointId);
    checkpoint.status = "Pass";
    checkpoint.evidenceReference = `${checkpointId}-approved`;
    if (checkpoint.id === "checkpoint-project-mode") {
      checkpoint.checkpointOwner = "Project owner";
      checkpoint.reviewer = "Implementation lead";
    }
    if (checkpoint.domainId === "accounting") {
      checkpoint.checkpointOwner = "Finance lead";
      checkpoint.reviewer = "Controller";
    }
    checkpoint.blockerFlag = false;
    checkpoint.blockedReason = "";
  }

  return normalizeProjectState(nextState);
}

function assertCriticalInventoryEvidence(state) {
  let nextState = normalizeProjectState(
    updateInventoryEvidenceRecord(state, "checkpoint-inventory-warehouse-setup", {
      mode: "user_asserted",
      summary: "Warehouse structure confirmed by operations.",
      sourceLabel: "User assertion",
      recordedActor: "inventory-ui-user"
    })
  );
  nextState = normalizeProjectState(
    updateInventoryEvidenceRecord(nextState, "checkpoint-inventory-operation-types", {
      mode: "user_asserted",
      summary: "Operation types confirmed by operations.",
      sourceLabel: "User assertion",
      recordedActor: "inventory-ui-user"
    })
  );
  nextState = normalizeProjectState(
    updateInventoryEvidenceRecord(nextState, "checkpoint-inventory-routes", {
      mode: "user_asserted",
      summary: "Routes confirmed by operations.",
      sourceLabel: "User assertion",
      recordedActor: "inventory-ui-user"
    })
  );
  nextState = normalizeProjectState(
    updateInventoryEvidenceRecord(nextState, "checkpoint-inventory-valuation", {
      mode: "user_asserted",
      summary: "Valuation policy confirmed by finance.",
      sourceLabel: "User assertion",
      recordedActor: "inventory-ui-user"
    })
  );

  return nextState;
}
