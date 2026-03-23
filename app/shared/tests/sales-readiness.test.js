import test from "node:test";
import assert from "node:assert/strict";

import { addSalesConfigurationRecord, updateSalesConfigurationRecord } from "../sales-configuration.js";
import { updateSalesEvidenceRecord } from "../sales-evidence.js";
import { getSalesReadinessSummary } from "../sales-readiness.js";
import { createInitialProjectState, normalizeProjectState } from "../project-state.js";

test("blocked required or go-live Sales checkpoints prevent ready", () => {
  const state = createInitialProjectState();
  const summary = getSalesReadinessSummary(state);

  assert.equal(summary.readinessState, "not_ready");
  assert.ok(summary.blockers.length > 0);
});

test("design capture without stronger evidence does not produce false ready", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(addSalesConfigurationRecord(state, "processCapture"));
  const recordKey = state.salesConfiguration.processCapture[0].key;
  state = normalizeProjectState(
    updateSalesConfigurationRecord(state, "processCapture", recordKey, {
      quoteFlowMode: "Quotation then confirmation",
      orderConfirmationAssumptions: "Confirmation path is explicit",
      exceptionNotes: "Planning only",
      inScope: true
    })
  );
  state = clearRequiredSalesBlockers(state);

  const summary = getSalesReadinessSummary(state);

  assert.equal(summary.readinessState, "not_ready");
  assert.ok(summary.captureOnly.length > 0);
});

test("user-asserted evidence remains weaker than hard readiness", () => {
  let state = clearRequiredSalesBlockers(createInitialProjectState());
  state = assertRequiredSalesEvidence(state);

  const summary = getSalesReadinessSummary(state);

  assert.equal(summary.readinessState, "conditionally_ready");
  assert.notEqual(summary.readinessState, "ready");
});

test("next actions prioritize blockers over softer evidence gaps", () => {
  const state = createInitialProjectState();
  const summary = getSalesReadinessSummary(state);

  assert.equal(summary.nextActions[0].priority, "blocker");
});

test("summary remains consistent after resume or load", () => {
  let state = clearRequiredSalesBlockers(createInitialProjectState());
  state = assertRequiredSalesEvidence(state);

  const initial = getSalesReadinessSummary(state);
  const resumed = getSalesReadinessSummary(normalizeProjectState(structuredClone(state)));

  assert.deepEqual(resumed, initial);
});

test("malformed or missing inputs fail safe and do not overstate readiness", () => {
  const summary = getSalesReadinessSummary({ checkpoints: null });

  assert.equal(summary.readinessState, "not_ready");
  assert.match(summary.explanation, /unavailable/i);
});

function clearRequiredSalesBlockers(state) {
  const nextState = structuredClone(state);
  const checkpointIds = [
    "checkpoint-project-mode",
    "checkpoint-sales-process-mode",
    "checkpoint-sales-pricing-policy",
    "checkpoint-sales-quotation-control"
  ];

  for (const checkpointId of checkpointIds) {
    const checkpoint = nextState.checkpoints.find((item) => item.id === checkpointId);
    checkpoint.status = "Pass";
    checkpoint.evidenceReference = `${checkpointId}-approved`;
    if (checkpoint.id === "checkpoint-project-mode") {
      checkpoint.checkpointOwner = "Project owner";
      checkpoint.reviewer = "Implementation lead";
    }
    if (checkpoint.domainId === "sales") {
      checkpoint.checkpointOwner = "Sales lead";
      checkpoint.reviewer = "Sales reviewer";
    }
    checkpoint.blockerFlag = false;
    checkpoint.blockedReason = "";
  }

  return normalizeProjectState(nextState);
}

function assertRequiredSalesEvidence(state) {
  let nextState = normalizeProjectState(
    updateSalesEvidenceRecord(state, "checkpoint-sales-process-mode", {
      mode: "user_asserted",
      summary: "Sales lead confirmed process baseline support.",
      sourceLabel: "User assertion",
      recordedActor: "sales-ui-user"
    })
  );
  nextState = normalizeProjectState(
    updateSalesEvidenceRecord(nextState, "checkpoint-sales-pricing-policy", {
      mode: "user_asserted",
      summary: "Sales lead confirmed pricing support.",
      sourceLabel: "User assertion",
      recordedActor: "sales-ui-user"
    })
  );
  nextState = normalizeProjectState(
    updateSalesEvidenceRecord(nextState, "checkpoint-sales-quotation-control", {
      mode: "user_asserted",
      summary: "Sales lead confirmed quotation-control support.",
      sourceLabel: "User assertion",
      recordedActor: "sales-ui-user"
    })
  );

  return nextState;
}
