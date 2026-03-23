import test from "node:test";
import assert from "node:assert/strict";

import { addPurchaseConfigurationRecord, updatePurchaseConfigurationRecord } from "../purchase-configuration.js";
import { updatePurchaseEvidenceRecord } from "../purchase-evidence.js";
import { getPurchaseReadinessSummary } from "../purchase-readiness.js";
import { createInitialProjectState, normalizeProjectState } from "../project-state.js";

test("blocked required or go-live Purchase checkpoints prevent ready", () => {
  const state = createInitialProjectState();
  const summary = getPurchaseReadinessSummary(state);

  assert.equal(summary.readinessState, "not_ready");
  assert.ok(summary.blockers.length > 0);
});

test("design capture without stronger evidence does not produce false ready", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(addPurchaseConfigurationRecord(state, "processCapture"));
  const recordKey = state.purchaseConfiguration.processCapture[0].key;
  state = normalizeProjectState(
    updatePurchaseConfigurationRecord(state, "processCapture", recordKey, {
      rfqFlowMode: "RFQ then confirmation",
      poConfirmationAssumptions: "Confirmation path is explicit",
      exceptionNotes: "Planning only",
      inScope: true
    })
  );
  state = clearRequiredPurchaseBlockers(state);

  const summary = getPurchaseReadinessSummary(state);

  assert.equal(summary.readinessState, "not_ready");
  assert.ok(summary.captureOnly.length > 0);
});

test("user-asserted evidence remains weaker than hard readiness", () => {
  let state = clearRequiredPurchaseBlockers(createInitialProjectState());
  state = assertRequiredPurchaseEvidence(state);

  const summary = getPurchaseReadinessSummary(state);

  assert.equal(summary.readinessState, "conditionally_ready");
  assert.notEqual(summary.readinessState, "ready");
});

test("next actions prioritize blockers over softer evidence gaps", () => {
  const state = createInitialProjectState();
  const summary = getPurchaseReadinessSummary(state);

  assert.equal(summary.nextActions[0].priority, "blocker");
});

test("summary remains consistent after resume or load", () => {
  let state = clearRequiredPurchaseBlockers(createInitialProjectState());
  state = assertRequiredPurchaseEvidence(state);

  const initial = getPurchaseReadinessSummary(state);
  const resumed = getPurchaseReadinessSummary(normalizeProjectState(structuredClone(state)));

  assert.deepEqual(resumed, initial);
});

test("malformed or missing inputs fail safe and do not overstate readiness", () => {
  const summary = getPurchaseReadinessSummary({ checkpoints: null });

  assert.equal(summary.readinessState, "not_ready");
  assert.match(summary.explanation, /unavailable/i);
});

function clearRequiredPurchaseBlockers(state) {
  const nextState = structuredClone(state);
  const checkpointIds = [
    "checkpoint-project-mode",
    "checkpoint-purchase-process-mode",
    "checkpoint-purchase-vendor-pricing-policy",
    "checkpoint-purchase-approval-control"
  ];

  for (const checkpointId of checkpointIds) {
    const checkpoint = nextState.checkpoints.find((item) => item.id === checkpointId);
    checkpoint.status = "Pass";
    checkpoint.evidenceReference = `${checkpointId}-approved`;
    if (checkpoint.id === "checkpoint-project-mode") {
      checkpoint.checkpointOwner = "Project owner";
      checkpoint.reviewer = "Implementation lead";
    }
    if (checkpoint.domainId === "purchase") {
      checkpoint.checkpointOwner = "Procurement lead";
      checkpoint.reviewer = "Procurement reviewer";
    }
    checkpoint.blockerFlag = false;
    checkpoint.blockedReason = "";
  }

  return normalizeProjectState(nextState);
}

function assertRequiredPurchaseEvidence(state) {
  let nextState = normalizeProjectState(
    updatePurchaseEvidenceRecord(state, "checkpoint-purchase-process-mode", {
      mode: "user_asserted",
      summary: "Procurement lead confirmed process baseline support.",
      sourceLabel: "User assertion",
      recordedActor: "purchase-ui-user"
    })
  );
  nextState = normalizeProjectState(
    updatePurchaseEvidenceRecord(nextState, "checkpoint-purchase-vendor-pricing-policy", {
      mode: "user_asserted",
      summary: "Procurement lead confirmed vendor policy support.",
      sourceLabel: "User assertion",
      recordedActor: "purchase-ui-user"
    })
  );
  nextState = normalizeProjectState(
    updatePurchaseEvidenceRecord(nextState, "checkpoint-purchase-approval-control", {
      mode: "user_asserted",
      summary: "Procurement lead confirmed approval-control support.",
      sourceLabel: "User assertion",
      recordedActor: "purchase-ui-user"
    })
  );

  return nextState;
}
