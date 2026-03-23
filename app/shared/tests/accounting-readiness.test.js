import test from "node:test";
import assert from "node:assert/strict";

import { updateAccountingEvidenceRecord } from "../accounting-evidence.js";
import { addAccountingConfigurationRecord, updateAccountingConfigurationRecord } from "../accounting-configuration.js";
import { getAccountingReadinessSummary } from "../accounting-readiness.js";
import { createInitialProjectState, normalizeProjectState } from "../project-state.js";

test("failed required Accounting checkpoint produces not_ready", () => {
  const state = createInitialProjectState();
  const summary = getAccountingReadinessSummary(state);

  assert.equal(summary.readinessState, "not_ready");
  assert.ok(summary.blockers.length > 0);
});

test("blocked dependency in the Accounting slice produces not_ready", () => {
  const state = createInitialProjectState();
  const checkpoint = state.checkpoints.find((item) => item.id === "checkpoint-accounting-stock-mapping-prerequisites");
  const summary = getAccountingReadinessSummary(state);

  assert.equal(checkpoint.status, "Fail");
  assert.match(checkpoint.blockedReason, /Inventory valuation method policy confirmed/i);
  assert.equal(summary.readinessState, "not_ready");
});

test("design-capture-only support does not produce ready", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(addAccountingConfigurationRecord(state, "policyCapture"));
  const recordKey = state.accountingConfiguration.policyCapture[0].key;
  state = normalizeProjectState(
    updateAccountingConfigurationRecord(state, "policyCapture", recordKey, {
      companyAccountingScope: "Holding company",
      policyTopic: "Inventory valuation",
      valuationMethodLabel: "AVCO",
      inventoryScopeNotes: "Planning only",
      decisionOwnerNotes: "Finance lead",
      downstreamConstraintNotes: "No checkpoint truth",
      inScope: true
    })
  );
  state = clearRequiredAccountingBlockers(state);

  const summary = getAccountingReadinessSummary(state);

  assert.equal(summary.readinessState, "not_ready");
  assert.ok(summary.captureOnly.length > 0);
});

test("user-asserted support without stronger proof does not produce ready", () => {
  let state = clearRequiredAccountingBlockers(createInitialProjectState());
  state = assertRequiredAccountingEvidence(state);

  const summary = getAccountingReadinessSummary(state);

  assert.equal(summary.readinessState, "conditionally_ready");
  assert.notEqual(summary.readinessState, "ready");
});

test("bounded recommended unresolved item can still produce conditionally_ready when required blockers are clear", () => {
  let state = clearRequiredAccountingBlockers(createInitialProjectState());
  state = assertRequiredAccountingEvidence(state);

  const summary = getAccountingReadinessSummary(state);

  assert.equal(summary.readinessState, "conditionally_ready");
  assert.equal(summary.deferredCheckpoints.length, 0);
});

test("next actions prioritize blockers over softer evidence gaps", () => {
  const state = createInitialProjectState();
  const summary = getAccountingReadinessSummary(state);

  assert.equal(summary.nextActions[0].priority, "blocker");
});

test("malformed or missing Accounting inputs fail safe to not_ready", () => {
  const summary = getAccountingReadinessSummary({ checkpoints: null });

  assert.equal(summary.readinessState, "not_ready");
  assert.match(summary.explanation, /unavailable/i);
});

test("summary remains consistent before and after normalizeProjectState", () => {
  let state = clearRequiredAccountingBlockers(createInitialProjectState());
  state = assertRequiredAccountingEvidence(state);

  const initial = getAccountingReadinessSummary(state);
  const resumed = getAccountingReadinessSummary(normalizeProjectState(structuredClone(state)));

  assert.deepEqual(resumed, initial);
});

function clearRequiredAccountingBlockers(state) {
  const nextState = structuredClone(state);
  const checkpointIds = [
    "checkpoint-project-mode",
    "checkpoint-finance-policy",
    "checkpoint-accounting-valuation-method-prerequisites",
    "checkpoint-accounting-stock-mapping-prerequisites"
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

function assertRequiredAccountingEvidence(state) {
  let nextState = normalizeProjectState(
    updateAccountingEvidenceRecord(state, "checkpoint-finance-policy", {
      mode: "user_asserted",
      summary: "Finance lead confirmed prerequisite policy support.",
      sourceLabel: "User assertion",
      recordedActor: "accounting-ui-user"
    })
  );
  nextState = normalizeProjectState(
    updateAccountingEvidenceRecord(nextState, "checkpoint-accounting-valuation-method-prerequisites", {
      mode: "user_asserted",
      summary: "Finance lead confirmed valuation-method support.",
      sourceLabel: "User assertion",
      recordedActor: "accounting-ui-user"
    })
  );
  nextState = normalizeProjectState(
    updateAccountingEvidenceRecord(nextState, "checkpoint-accounting-stock-mapping-prerequisites", {
      mode: "user_asserted",
      summary: "Finance lead confirmed stock-mapping support.",
      sourceLabel: "User assertion",
      recordedActor: "accounting-ui-user"
    })
  );

  return nextState;
}
