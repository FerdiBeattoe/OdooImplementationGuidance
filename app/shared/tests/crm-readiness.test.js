import test from "node:test";
import assert from "node:assert/strict";

import { addCrmConfigurationRecord, updateCrmConfigurationRecord } from "../crm-configuration.js";
import { updateCrmEvidenceRecord } from "../crm-evidence.js";
import { getCrmReadinessSummary } from "../crm-readiness.js";
import { createInitialProjectState, normalizeProjectState } from "../project-state.js";

test("blocked required or go-live CRM checkpoints prevent ready", () => {
  const state = createInitialProjectState();
  const summary = getCrmReadinessSummary(state);

  assert.equal(summary.readinessState, "not_ready");
  assert.ok(summary.blockers.length > 0);
});

test("design capture without stronger evidence does not produce false ready", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(addCrmConfigurationRecord(state, "pipelineCapture"));
  const recordKey = state.crmConfiguration.pipelineCapture[0].key;
  state = normalizeProjectState(
    updateCrmConfigurationRecord(state, "pipelineCapture", recordKey, {
      stageLabel: "Qualified",
      stageSequenceNotes: "Planning only",
      conversionPolicyNotes: "Context only",
      inScope: true
    })
  );
  state = clearRequiredCrmBlockers(state);

  const summary = getCrmReadinessSummary(state);

  assert.equal(summary.readinessState, "not_ready");
  assert.ok(summary.captureOnly.length > 0);
});

test("user-asserted CRM evidence remains weaker than hard readiness", () => {
  let state = clearRequiredCrmBlockers(createInitialProjectState());
  state = assertRequiredCrmEvidence(state);

  const summary = getCrmReadinessSummary(state);

  assert.equal(summary.readinessState, "not_ready");
  assert.notEqual(summary.readinessState, "ready");
});

test("malformed or missing CRM inputs fail safe", () => {
  const summary = getCrmReadinessSummary({ checkpoints: null });

  assert.equal(summary.readinessState, "not_ready");
  assert.match(summary.explanation, /unavailable/i);
});

test("CRM readiness remains domain-bounded", () => {
  let state = clearRequiredCrmBlockers(createInitialProjectState());
  state = assertRequiredCrmEvidence(state);
  const foreignCheckpoint = state.checkpoints.find((item) => item.id === "checkpoint-pos-session-control");
  foreignCheckpoint.status = "Fail";
  foreignCheckpoint.blockerFlag = true;
  foreignCheckpoint.blockedReason = "Foreign checkpoint should not leak into CRM readiness.";

  const summary = getCrmReadinessSummary(normalizeProjectState(state));

  assert.equal(summary.readinessState, "not_ready");
  assert.ok(summary.failedCheckpoints.every((item) => item.checkpointId.startsWith("checkpoint-crm-")));
  assert.ok(summary.blockers.every((item) => item.checkpointId.startsWith("checkpoint-crm-")));
});

function clearRequiredCrmBlockers(state) {
  const nextState = structuredClone(state);
  const checkpointIds = [
    "checkpoint-crm-lead-opportunity-model",
    "checkpoint-crm-pipeline-governance",
    "checkpoint-crm-sales-team-ownership"
  ];

  for (const checkpointId of checkpointIds) {
    const checkpoint = nextState.checkpoints.find((item) => item.id === checkpointId);
    checkpoint.status = "Pass";
    checkpoint.evidenceReference = `${checkpointId}-approved`;
    checkpoint.checkpointOwner = "Sales lead";
    checkpoint.reviewer = "CRM reviewer";
    checkpoint.blockerFlag = false;
    checkpoint.blockedReason = "";
  }

  return normalizeProjectState(nextState);
}

function assertRequiredCrmEvidence(state) {
  let nextState = normalizeProjectState(
    updateCrmEvidenceRecord(state, "checkpoint-crm-lead-opportunity-model", {
      mode: "user_asserted",
      summary: "CRM lead confirmed lead/opportunity baseline support.",
      sourceLabel: "User assertion",
      recordedActor: "crm-ui-user"
    })
  );
  nextState = normalizeProjectState(
    updateCrmEvidenceRecord(nextState, "checkpoint-crm-pipeline-governance", {
      mode: "user_asserted",
      summary: "CRM lead confirmed pipeline-governance support.",
      sourceLabel: "User assertion",
      recordedActor: "crm-ui-user"
    })
  );
  nextState = normalizeProjectState(
    updateCrmEvidenceRecord(nextState, "checkpoint-crm-sales-team-ownership", {
      mode: "user_asserted",
      summary: "CRM lead confirmed ownership support.",
      sourceLabel: "User assertion",
      recordedActor: "crm-ui-user"
    })
  );

  return nextState;
}
