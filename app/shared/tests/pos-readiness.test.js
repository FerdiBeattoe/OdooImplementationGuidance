import test from "node:test";
import assert from "node:assert/strict";

import { addPosConfigurationRecord, updatePosConfigurationRecord } from "../pos-configuration.js";
import { updatePosEvidenceRecord } from "../pos-evidence.js";
import { getPosReadinessSummary } from "../pos-readiness.js";
import { createInitialProjectState, normalizeProjectState } from "../project-state.js";

test("blocked required or go-live POS checkpoints prevent ready", () => {
  const state = createInitialProjectState();
  const summary = getPosReadinessSummary(state);

  assert.equal(summary.readinessState, "not_ready");
  assert.ok(summary.blockers.length > 0);
});

test("design capture without stronger evidence does not produce false ready", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(addPosConfigurationRecord(state, "sessionPolicyCapture"));
  const recordKey = state.posConfiguration.sessionPolicyCapture[0].key;
  state = normalizeProjectState(
    updatePosConfigurationRecord(state, "sessionPolicyCapture", recordKey, {
      sessionOpeningPolicyLabel: "Controlled open",
      cashierRoleNotes: "Planning only",
      offlinePolicyNotes: "Context only",
      inScope: true
    })
  );
  state = clearRequiredPosBlockers(state);

  const summary = getPosReadinessSummary(state);

  assert.equal(summary.readinessState, "not_ready");
  assert.ok(summary.captureOnly.length > 0);
});

test("user-asserted POS evidence remains weaker than hard readiness", () => {
  let state = clearRequiredPosBlockers(createInitialProjectState());
  state = assertRequiredPosEvidence(state);

  const summary = getPosReadinessSummary(state);

  assert.equal(summary.readinessState, "not_ready");
  assert.notEqual(summary.readinessState, "ready");
});

test("malformed or missing POS inputs fail safe", () => {
  const summary = getPosReadinessSummary({ checkpoints: null });

  assert.equal(summary.readinessState, "not_ready");
  assert.match(summary.explanation, /unavailable/i);
});

test("POS readiness remains domain-bounded", () => {
  let state = clearRequiredPosBlockers(createInitialProjectState());
  state = assertRequiredPosEvidence(state);
  const foreignCheckpoint = state.checkpoints.find((item) => item.id === "checkpoint-website-scope-baseline");
  foreignCheckpoint.status = "Fail";
  foreignCheckpoint.blockerFlag = true;
  foreignCheckpoint.blockedReason = "Foreign checkpoint should not leak into POS readiness.";

  const summary = getPosReadinessSummary(normalizeProjectState(state));

  assert.equal(summary.readinessState, "not_ready");
  assert.ok(summary.failedCheckpoints.every((item) => item.checkpointId.startsWith("checkpoint-pos-")));
  assert.ok(summary.blockers.every((item) => item.checkpointId.startsWith("checkpoint-pos-")));
});

function clearRequiredPosBlockers(state) {
  const nextState = structuredClone(state);
  const checkpointIds = [
    "checkpoint-pos-session-control",
    "checkpoint-pos-cashier-access",
    "checkpoint-pos-accounting-linkage"
  ];

  for (const checkpointId of checkpointIds) {
    const checkpoint = nextState.checkpoints.find((item) => item.id === checkpointId);
    checkpoint.status = "Pass";
    checkpoint.evidenceReference = `${checkpointId}-approved`;
    if (checkpoint.domainId === "pos") {
      checkpoint.checkpointOwner = "Retail operations owner";
      checkpoint.reviewer = "POS reviewer";
    }
    checkpoint.blockerFlag = false;
    checkpoint.blockedReason = "";
  }

  return normalizeProjectState(nextState);
}

function assertRequiredPosEvidence(state) {
  let nextState = normalizeProjectState(
    updatePosEvidenceRecord(state, "checkpoint-pos-session-control", {
      mode: "user_asserted",
      summary: "POS lead confirmed session-control support.",
      sourceLabel: "User assertion",
      recordedActor: "pos-ui-user"
    })
  );
  nextState = normalizeProjectState(
    updatePosEvidenceRecord(nextState, "checkpoint-pos-cashier-access", {
      mode: "user_asserted",
      summary: "POS lead confirmed cashier-access support.",
      sourceLabel: "User assertion",
      recordedActor: "pos-ui-user"
    })
  );
  nextState = normalizeProjectState(
    updatePosEvidenceRecord(nextState, "checkpoint-pos-accounting-linkage", {
      mode: "user_asserted",
      summary: "POS lead confirmed accounting-linkage support.",
      sourceLabel: "User assertion",
      recordedActor: "pos-ui-user"
    })
  );

  return nextState;
}
