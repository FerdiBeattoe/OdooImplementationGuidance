import test from "node:test";
import assert from "node:assert/strict";

import {
  addWebsiteEcommerceConfigurationRecord,
  updateWebsiteEcommerceConfigurationRecord
} from "../website-ecommerce-configuration.js";
import { updateWebsiteEcommerceEvidenceRecord } from "../website-ecommerce-evidence.js";
import { getWebsiteEcommerceReadinessSummary } from "../website-ecommerce-readiness.js";
import { createInitialProjectState, normalizeProjectState } from "../project-state.js";

test("blocked required or go-live Website / eCommerce checkpoints prevent ready", () => {
  const state = createInitialProjectState();
  const summary = getWebsiteEcommerceReadinessSummary(state);

  assert.equal(summary.readinessState, "not_ready");
  assert.ok(summary.blockers.length > 0);
});

test("design capture without stronger evidence does not produce false ready", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(addWebsiteEcommerceConfigurationRecord(state, "checkoutCapture"));
  const recordKey = state.websiteEcommerceConfiguration.checkoutCapture[0].key;
  state = normalizeProjectState(
    updateWebsiteEcommerceConfigurationRecord(state, "checkoutCapture", recordKey, {
      checkoutFlowLabel: "Standard checkout",
      paymentProviderNotes: "Planning only",
      orderConfirmationNotes: "Context only",
      inScope: true
    })
  );
  state = clearRequiredWebsiteBlockers(state);

  const summary = getWebsiteEcommerceReadinessSummary(state);

  assert.equal(summary.readinessState, "not_ready");
  assert.ok(summary.captureOnly.length > 0);
});

test("user-asserted Website / eCommerce evidence remains weaker than hard readiness", () => {
  let state = clearRequiredWebsiteBlockers(createInitialProjectState());
  state = assertRequiredWebsiteEvidence(state);

  const summary = getWebsiteEcommerceReadinessSummary(state);

  assert.equal(summary.readinessState, "not_ready");
  assert.notEqual(summary.readinessState, "ready");
});

test("malformed or missing Website / eCommerce inputs fail safe", () => {
  const summary = getWebsiteEcommerceReadinessSummary({ checkpoints: null });

  assert.equal(summary.readinessState, "not_ready");
  assert.match(summary.explanation, /unavailable/i);
});

test("Website / eCommerce readiness remains domain-bounded", () => {
  let state = clearRequiredWebsiteBlockers(createInitialProjectState());
  state = assertRequiredWebsiteEvidence(state);
  const foreignCheckpoint = state.checkpoints.find((item) => item.id === "checkpoint-manufacturing-process-mode");
  foreignCheckpoint.status = "Fail";
  foreignCheckpoint.blockerFlag = true;
  foreignCheckpoint.blockedReason = "Foreign checkpoint should not leak into Website readiness.";

  const summary = getWebsiteEcommerceReadinessSummary(normalizeProjectState(state));

  assert.equal(summary.readinessState, "not_ready");
  assert.ok(summary.failedCheckpoints.every((item) => item.checkpointId.startsWith("checkpoint-website-")));
  assert.ok(summary.blockers.every((item) => item.checkpointId.startsWith("checkpoint-website-")));
});

function clearRequiredWebsiteBlockers(state) {
  const nextState = structuredClone(state);
  const checkpointIds = [
    "checkpoint-website-scope-baseline",
    "checkpoint-website-catalog-publication",
    "checkpoint-website-customer-access-model",
    "checkpoint-website-checkout-baseline"
  ];

  for (const checkpointId of checkpointIds) {
    const checkpoint = nextState.checkpoints.find((item) => item.id === checkpointId);
    checkpoint.status = "Pass";
    checkpoint.evidenceReference = `${checkpointId}-approved`;
    checkpoint.checkpointOwner = "Website lead";
    checkpoint.reviewer = "Website reviewer";
    checkpoint.blockerFlag = false;
    checkpoint.blockedReason = "";
  }

  return normalizeProjectState(nextState);
}

function assertRequiredWebsiteEvidence(state) {
  let nextState = normalizeProjectState(
    updateWebsiteEcommerceEvidenceRecord(state, "checkpoint-website-scope-baseline", {
      mode: "user_asserted",
      summary: "Website lead confirmed scope support.",
      sourceLabel: "User assertion",
      recordedActor: "website-ui-user"
    })
  );
  nextState = normalizeProjectState(
    updateWebsiteEcommerceEvidenceRecord(nextState, "checkpoint-website-catalog-publication", {
      mode: "user_asserted",
      summary: "Website lead confirmed catalog-publication support.",
      sourceLabel: "User assertion",
      recordedActor: "website-ui-user"
    })
  );
  nextState = normalizeProjectState(
    updateWebsiteEcommerceEvidenceRecord(nextState, "checkpoint-website-customer-access-model", {
      mode: "user_asserted",
      summary: "Website lead confirmed customer-access support.",
      sourceLabel: "User assertion",
      recordedActor: "website-ui-user"
    })
  );
  nextState = normalizeProjectState(
    updateWebsiteEcommerceEvidenceRecord(nextState, "checkpoint-website-checkout-baseline", {
      mode: "user_asserted",
      summary: "Website lead confirmed checkout support.",
      sourceLabel: "User assertion",
      recordedActor: "website-ui-user"
    })
  );

  return nextState;
}
