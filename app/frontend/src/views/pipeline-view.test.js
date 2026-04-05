// ---------------------------------------------------------------------------
// Pipeline View Tests — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Prove that pipeline-view.js Apply button constructs the correct governed
//   apply payload from real UI/runtime state and passes it to onApply.
//
// Uses jsdom to provide a real DOM environment.
// ---------------------------------------------------------------------------

import { JSDOM } from "jsdom";

// Set up global DOM environment before importing the view module.
// el() reads `document` at call time, not at import time, so this works
// as long as globalThis.document is set before any el() calls.
const jsdom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
globalThis.document = jsdom.window.document;

import test from "node:test";
import assert from "node:assert/strict";

import { renderPipelineContent } from "./pipeline-view.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Makes a view model where canApply is true, with preview-bound fields populated.
 * Simulates the output of getPipelineViewModel() for a fully-resolved apply state.
 */
function makeApplyableModel({
  approvalId      = "ap-test",
  projectId       = "proj-test",
  targetModel     = "res.company",
  targetOperation = "write",
  intendedChanges = null,
  extra           = {},
} = {}) {
  return {
    status: "success",
    isIdle: false, isRunning: false, isLoading: false, isResuming: false,
    isApplying: false, isSaving: false, isInProgress: false,
    isSuccess: true, isFailure: false, isNotFound: false,
    canApply: true,
    canSave: true,
    firstUnappliedApprovalId: approvalId,
    previewTargetModel: targetModel,
    previewTargetOperation: targetOperation,
    previewIntendedChanges: intendedChanges,
    previewResolutionError: null,
    runtime_state: {
      project_identity: { project_id: projectId },
      _engine_outputs: {
        execution_approvals: {
          execution_approvals: [{ approval_id: approvalId, execution_occurred: false, preview_id: "pv-test" }]
        }
      },
      previews: [{ preview_id: "pv-test", target_model: targetModel, target_operation: targetOperation, intended_changes: intendedChanges }],
    },
    error: null,
    saved_at: null,
    apply_result: null,
    ...extra,
  };
}

/**
 * Sets the value of a DOM input by ID.
 */
function setInputValue(id, value) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Input not found: ${id}`);
  el.value = value;
}

/**
 * Renders the pipeline content into a fresh DOM container and returns it.
 */
function renderIntoBody(model, actions = {}) {
  // Clear body before each render
  document.body.innerHTML = "";
  const noop = () => {};
  const container = renderPipelineContent(model, {
    onRun:    actions.onRun    ?? noop,
    onLoad:   actions.onLoad   ?? noop,
    onResume: actions.onResume ?? noop,
    onApply:  actions.onApply  ?? noop,
    onSave:   actions.onSave   ?? noop,
  });
  document.body.appendChild(container);
  return container;
}

// ---------------------------------------------------------------------------
// Run button — payload construction
// ---------------------------------------------------------------------------

function makeIdleModel(extra = {}) {
  return {
    status: "idle",
    isIdle: true, isRunning: false, isLoading: false, isResuming: false,
    isApplying: false, isSaving: false, isInProgress: false,
    isSuccess: false, isFailure: false, isNotFound: false,
    canApply: false, canSave: false,
    firstUnappliedApprovalId: null,
    previewTargetModel: null, previewTargetOperation: null,
    previewIntendedChanges: null, previewResolutionError: null,
    runtime_state: null, error: null, saved_at: null, apply_result: null,
    ...extra,
  };
}

test("Run button calls onRun with confirmed_by from input when provided", () => {
  const model = makeIdleModel();
  let capturedPayload = null;

  renderIntoBody(model, { onRun: (payload) => { capturedPayload = payload; } });

  setInputValue("pipeline-confirmed-by-input", "john.smith");
  document.querySelector("[data-testid='run-button']").click();

  assert.ok(capturedPayload !== null, "onRun must be called");
  assert.equal(capturedPayload.discovery_answers.confirmed_by, "john.smith");
});

test("Run button sets confirmed_by to null when input is empty", () => {
  const model = makeIdleModel();
  let capturedPayload = null;

  renderIntoBody(model, { onRun: (payload) => { capturedPayload = payload; } });

  setInputValue("pipeline-confirmed-by-input", "");
  document.querySelector("[data-testid='run-button']").click();

  assert.ok(capturedPayload !== null);
  assert.equal(capturedPayload.discovery_answers.confirmed_by, null,
    "confirmed_by must be null when input is empty — not silently filled");
});

test("Run button includes target_context.deployment_type when deployment-type input is provided", () => {
  const model = makeIdleModel();
  let capturedPayload = null;

  renderIntoBody(model, { onRun: (payload) => { capturedPayload = payload; } });

  setInputValue("pipeline-deployment-type-input", "online");
  document.querySelector("[data-testid='run-button']").click();

  assert.ok(capturedPayload !== null);
  assert.ok(capturedPayload.target_context !== null, "target_context must be present when deployment type is provided");
  assert.equal(capturedPayload.target_context.deployment_type, "online");
});

test("Run button sets target_context to null when all three context inputs are empty", () => {
  const model = makeIdleModel();
  let capturedPayload = null;

  renderIntoBody(model, { onRun: (payload) => { capturedPayload = payload; } });

  setInputValue("pipeline-deployment-type-input",  "");
  setInputValue("pipeline-primary-country-input",  "");
  setInputValue("pipeline-primary-currency-input", "");
  document.querySelector("[data-testid='run-button']").click();

  assert.ok(capturedPayload !== null);
  assert.equal(capturedPayload.target_context, null,
    "target_context must be null when all three context inputs are empty");
});

test("Run button payload includes both confirmed_by and deployment_type when both inputs are set", () => {
  const model = makeIdleModel();
  let capturedPayload = null;

  renderIntoBody(model, { onRun: (payload) => { capturedPayload = payload; } });

  setInputValue("pipeline-confirmed-by-input",    "jane.doe");
  setInputValue("pipeline-deployment-type-input", "odoosh");
  document.querySelector("[data-testid='run-button']").click();

  assert.ok(capturedPayload !== null);
  assert.equal(capturedPayload.discovery_answers.confirmed_by, "jane.doe");
  assert.equal(capturedPayload.target_context.deployment_type, "odoosh");
});

test("Run inputs are rendered: confirmed-by, deployment-type, primary-country, and primary-currency inputs are present", () => {
  const model = makeIdleModel();
  renderIntoBody(model);

  assert.ok(document.getElementById("pipeline-confirmed-by-input"),     "confirmed-by input must be present");
  assert.ok(document.getElementById("pipeline-deployment-type-input"),  "deployment-type input must be present");
  assert.ok(document.getElementById("pipeline-primary-country-input"),  "primary-country input must be present");
  assert.ok(document.getElementById("pipeline-primary-currency-input"), "primary-currency input must be present");
});

test("Run button includes target_context.primary_country when primary-country input is provided", () => {
  const model = makeIdleModel();
  let capturedPayload = null;

  renderIntoBody(model, { onRun: (payload) => { capturedPayload = payload; } });

  setInputValue("pipeline-primary-country-input", "United States");
  document.querySelector("[data-testid='run-button']").click();

  assert.ok(capturedPayload !== null);
  assert.ok(capturedPayload.target_context !== null, "target_context must be present when primary_country is provided");
  assert.equal(capturedPayload.target_context.primary_country, "United States");
});

test("Run button includes target_context.primary_currency when primary-currency input is provided", () => {
  const model = makeIdleModel();
  let capturedPayload = null;

  renderIntoBody(model, { onRun: (payload) => { capturedPayload = payload; } });

  setInputValue("pipeline-primary-currency-input", "USD");
  document.querySelector("[data-testid='run-button']").click();

  assert.ok(capturedPayload !== null);
  assert.ok(capturedPayload.target_context !== null, "target_context must be present when primary_currency is provided");
  assert.equal(capturedPayload.target_context.primary_currency, "USD");
});

test("Run button does not fabricate primary_country or primary_currency when inputs are blank", () => {
  const model = makeIdleModel();
  let capturedPayload = null;

  renderIntoBody(model, { onRun: (payload) => { capturedPayload = payload; } });

  setInputValue("pipeline-deployment-type-input",  "online");
  setInputValue("pipeline-primary-country-input",  "");
  setInputValue("pipeline-primary-currency-input", "");
  document.querySelector("[data-testid='run-button']").click();

  assert.ok(capturedPayload !== null);
  assert.ok(capturedPayload.target_context !== null, "target_context present because deployment_type was provided");
  assert.equal(capturedPayload.target_context.deployment_type, "online");
  assert.equal(capturedPayload.target_context.primary_country,  undefined, "primary_country must be absent when input is blank — not fabricated");
  assert.equal(capturedPayload.target_context.primary_currency, undefined, "primary_currency must be absent when input is blank — not fabricated");
});

test("Run button sets target_context when only primary_country is provided, without deployment_type or primary_currency", () => {
  const model = makeIdleModel();
  let capturedPayload = null;

  renderIntoBody(model, { onRun: (payload) => { capturedPayload = payload; } });

  setInputValue("pipeline-deployment-type-input",  "");
  setInputValue("pipeline-primary-country-input",  "Belgium");
  setInputValue("pipeline-primary-currency-input", "");
  document.querySelector("[data-testid='run-button']").click();

  assert.ok(capturedPayload !== null);
  assert.ok(capturedPayload.target_context !== null, "target_context must be non-null when primary_country is set");
  assert.equal(capturedPayload.target_context.primary_country, "Belgium");
  assert.equal(capturedPayload.target_context.deployment_type,  undefined);
  assert.equal(capturedPayload.target_context.primary_currency, undefined);
});

// ---------------------------------------------------------------------------
// Apply button visibility
// ---------------------------------------------------------------------------

test("Apply button is rendered when canApply is true", () => {
  const model = makeApplyableModel();
  renderIntoBody(model);

  const btn = document.querySelector("[data-testid='apply-button']");
  assert.ok(btn !== null, "Apply button must be present when canApply is true");
});

test("Apply button is NOT rendered when canApply is false", () => {
  const model = makeApplyableModel({ extra: { canApply: false } });
  renderIntoBody(model);

  const btn = document.querySelector("[data-testid='apply-button']");
  assert.equal(btn, null, "Apply button must not be present when canApply is false");
});

// ---------------------------------------------------------------------------
// Operation inputs visibility
// ---------------------------------------------------------------------------

test("Operation inputs are rendered when canApply is true: read-only model and operation displays", () => {
  const model = makeApplyableModel({ targetModel: "res.partner", targetOperation: "write" });
  renderIntoBody(model);

  const modelDisplay = document.querySelector("[data-testid='apply-model-display']");
  const opDisplay    = document.querySelector("[data-testid='apply-operation-display']");
  assert.ok(modelDisplay !== null, "model read-only display must be present");
  assert.ok(opDisplay !== null, "operation read-only display must be present");
  assert.equal(modelDisplay.textContent, "res.partner");
  assert.equal(opDisplay.textContent, "write");
  assert.ok(document.getElementById("pipeline-apply-ids-input"), "ids input must be present");
  assert.ok(document.getElementById("pipeline-apply-values-input"), "values input must be present");
});

test("Free-text model and method inputs are NOT rendered (replaced by read-only displays)", () => {
  const model = makeApplyableModel();
  renderIntoBody(model);

  assert.equal(document.getElementById("pipeline-apply-model-input"), null, "free-text model input must not exist");
  assert.equal(document.getElementById("pipeline-apply-method-input"), null, "free-text method input must not exist");
});

test("Operation inputs are NOT rendered when canApply is false", () => {
  const model = makeApplyableModel({ extra: { canApply: false } });
  renderIntoBody(model);

  assert.equal(document.querySelector("[data-testid='apply-model-display']"), null);
  assert.equal(document.querySelector("[data-testid='apply-operation-display']"), null);
  assert.equal(document.getElementById("pipeline-apply-ids-input"), null);
  assert.equal(document.getElementById("pipeline-apply-values-input"), null);
});

// ---------------------------------------------------------------------------
// Apply button — full payload construction (create path)
// ---------------------------------------------------------------------------

test("Apply button calls onApply with correct full payload (create method)", () => {
  // targetOperation drives the method; model sourced from previewTargetModel
  const model = makeApplyableModel({ approvalId: "ap-create", projectId: "proj-create", targetModel: "res.company", targetOperation: "create" });
  let capturedPayload = null;

  renderIntoBody(model, {
    onApply: (payload) => { capturedPayload = payload; },
  });

  // Only user-supplied inputs remain: ids (empty for create) and values
  setInputValue("pipeline-apply-ids-input",    "");
  setInputValue("pipeline-apply-values-input", '{"name":"Test Co"}');

  document.querySelector("[data-testid='apply-button']").click();

  assert.ok(capturedPayload !== null, "onApply must be called");
  assert.equal(capturedPayload.approval_id, "ap-create");
  assert.equal(capturedPayload.runtime_state, model.runtime_state);
  assert.equal(capturedPayload.operation.model, "res.company");
  assert.equal(capturedPayload.operation.method, "create");
  assert.deepEqual(capturedPayload.operation.values, { name: "Test Co" });
  assert.equal(capturedPayload.operation.ids, undefined, "ids must be absent for create");
  assert.deepEqual(capturedPayload.connection_context, { project_id: "proj-create" });
});

// ---------------------------------------------------------------------------
// Apply button — full payload construction (write path)
// ---------------------------------------------------------------------------

test("Apply button calls onApply with correct full payload (write method)", () => {
  // targetOperation "write" (default) drives ids inclusion; targetModel from preview
  const model = makeApplyableModel({ approvalId: "ap-write", projectId: "proj-write", targetModel: "res.company", targetOperation: "write" });
  let capturedPayload = null;

  renderIntoBody(model, {
    onApply: (payload) => { capturedPayload = payload; },
  });

  setInputValue("pipeline-apply-ids-input",    "1, 2, 3");
  setInputValue("pipeline-apply-values-input", '{"name":"Updated"}');

  document.querySelector("[data-testid='apply-button']").click();

  assert.ok(capturedPayload !== null, "onApply must be called");
  assert.equal(capturedPayload.approval_id, "ap-write");
  assert.equal(capturedPayload.operation.model, "res.company");
  assert.equal(capturedPayload.operation.method, "write");
  assert.deepEqual(capturedPayload.operation.ids, [1, 2, 3]);
  assert.deepEqual(capturedPayload.operation.values, { name: "Updated" });
  assert.deepEqual(capturedPayload.connection_context, { project_id: "proj-write" });
});

// ---------------------------------------------------------------------------
// Apply button — malformed JSON values silently refuses dispatch
// ---------------------------------------------------------------------------

test("Apply button does NOT call onApply when values JSON is malformed", () => {
  const model = makeApplyableModel({ targetOperation: "write" });
  let called = false;

  renderIntoBody(model, {
    onApply: () => { called = true; },
  });

  setInputValue("pipeline-apply-ids-input",    "1");
  setInputValue("pipeline-apply-values-input", "not-valid-json{");

  document.querySelector("[data-testid='apply-button']").click();

  assert.equal(called, false, "onApply must not be called with malformed JSON");
});

// ---------------------------------------------------------------------------
// Apply button — approval_id sourced from firstUnappliedApprovalId
// ---------------------------------------------------------------------------

test("Apply button uses firstUnappliedApprovalId from model, not a hardcoded value", () => {
  const model = makeApplyableModel({ approvalId: "ap-dynamic-id" });
  let capturedApprovalId = null;

  renderIntoBody(model, {
    onApply: (payload) => { capturedApprovalId = payload.approval_id; },
  });

  setInputValue("pipeline-apply-ids-input",    "");
  setInputValue("pipeline-apply-values-input", "{}");

  document.querySelector("[data-testid='apply-button']").click();

  assert.equal(capturedApprovalId, "ap-dynamic-id");
});

// ---------------------------------------------------------------------------
// Apply button — connection_context.project_id sourced from runtime_state
// ---------------------------------------------------------------------------

test("Apply button sources connection_context.project_id from runtime_state", () => {
  const model = makeApplyableModel({ projectId: "proj-from-runtime" });
  let capturedConnectionContext = null;

  renderIntoBody(model, {
    onApply: (payload) => { capturedConnectionContext = payload.connection_context; },
  });

  setInputValue("pipeline-apply-ids-input",    "");
  setInputValue("pipeline-apply-values-input", "{}");

  document.querySelector("[data-testid='apply-button']").click();

  assert.deepEqual(capturedConnectionContext, { project_id: "proj-from-runtime" });
});

// ---------------------------------------------------------------------------
// Apply button — runtime_state passed through unchanged
// ---------------------------------------------------------------------------

test("Apply button passes runtime_state as exact reference from model", () => {
  const model = makeApplyableModel();
  let capturedRuntimeState = null;

  renderIntoBody(model, {
    onApply: (payload) => { capturedRuntimeState = payload.runtime_state; },
  });

  setInputValue("pipeline-apply-ids-input",    "");
  setInputValue("pipeline-apply-values-input", "{}");

  document.querySelector("[data-testid='apply-button']").click();

  assert.equal(capturedRuntimeState, model.runtime_state, "runtime_state must be the exact same reference");
});

// ---------------------------------------------------------------------------
// Apply button — preview-bound model/method in payload
// ---------------------------------------------------------------------------

test("Apply uses preview-bound model from previewTargetModel, not user-authored input", () => {
  const model = makeApplyableModel({ targetModel: "account.move", targetOperation: "write" });
  let capturedOp = null;

  renderIntoBody(model, {
    onApply: (payload) => { capturedOp = payload.operation; },
  });

  setInputValue("pipeline-apply-ids-input",    "5");
  setInputValue("pipeline-apply-values-input", '{"state":"posted"}');

  document.querySelector("[data-testid='apply-button']").click();

  assert.ok(capturedOp !== null);
  assert.equal(capturedOp.model, "account.move", "model must come from previewTargetModel");
  assert.equal(capturedOp.method, "write", "method must come from previewTargetOperation");
});

// ---------------------------------------------------------------------------
// Preview resolution error display
// ---------------------------------------------------------------------------

test("Preview resolution error is displayed when previewResolutionError is non-null", () => {
  const model = makeApplyableModel({
    extra: {
      canApply: false,
      previewResolutionError: "Approval has no preview_id.",
    },
  });
  renderIntoBody(model);

  const errorEl = document.querySelector("[data-testid='preview-resolution-error']");
  assert.ok(errorEl !== null, "preview-resolution-error element must be present");
  assert.ok(errorEl.textContent.includes("Approval has no preview_id."));
});

test("Preview resolution error is NOT displayed when previewResolutionError is null", () => {
  const model = makeApplyableModel();
  renderIntoBody(model);

  const errorEl = document.querySelector("[data-testid='preview-resolution-error']");
  assert.equal(errorEl, null, "preview-resolution-error must not render when error is null");
});

// ---------------------------------------------------------------------------
// Intended changes display
// ---------------------------------------------------------------------------

test("Intended changes display is rendered when previewIntendedChanges is non-null", () => {
  const model = makeApplyableModel({ intendedChanges: { active: false } });
  renderIntoBody(model);

  const changesEl = document.querySelector("[data-testid='apply-intended-changes-display']");
  assert.ok(changesEl !== null, "intended changes display must be present");
  assert.ok(changesEl.textContent.includes("active"));
});

test("Intended changes display is NOT rendered when previewIntendedChanges is null", () => {
  const model = makeApplyableModel({ intendedChanges: null });
  renderIntoBody(model);

  const changesEl = document.querySelector("[data-testid='apply-intended-changes-display']");
  assert.equal(changesEl, null, "intended changes display must not render when null");
});

// ---------------------------------------------------------------------------
// Runtime state panel — preview records display
// ---------------------------------------------------------------------------

test("renderRuntimeStatePanel renders preview records with checkpoint_id and safety_class", () => {
  const model = makeApplyableModel({
    extra: {
      runtime_state: {
        project_identity: { project_id: "proj-test" },
        _engine_outputs: {
          execution_approvals: {
            execution_approvals: [{ approval_id: "ap-test", execution_occurred: false, preview_id: "pv-test" }]
          }
        },
        previews: [
          {
            preview_id: "pv-test",
            checkpoint_id: "chk-001",
            target_model: "res.company",
            target_operation: "write",
            safety_class: "W2",
            intended_changes: { name: "Test" },
            execution_approval_implied: true,
          }
        ],
      },
    }
  });

  renderIntoBody(model);

  const panel = document.querySelector("[data-testid='runtime-state-panel']");
  assert.ok(panel !== null, "runtime-state-panel must be present");

  const checkpointEl = document.querySelector("[data-testid='preview-checkpoint-id']");
  assert.ok(checkpointEl !== null, "preview-checkpoint-id must be rendered");
  assert.ok(checkpointEl.textContent.includes("chk-001"), "checkpoint_id value must be rendered");

  const safetyClassEl = document.querySelector("[data-testid='preview-safety-class']");
  assert.ok(safetyClassEl !== null, "preview-safety-class must be rendered");
  assert.ok(safetyClassEl.textContent.includes("W2"), "safety_class value must be rendered");
});

test("renderRuntimeStatePanel renders no preview records when previews array is empty", () => {
  const model = makeApplyableModel({
    extra: {
      runtime_state: {
        project_identity: { project_id: "proj-test" },
        previews: [],
      },
    }
  });

  renderIntoBody(model);

  const records = document.querySelectorAll("[data-testid='preview-record']");
  assert.equal(records.length, 0, "no preview-record elements must render when previews is empty");
});
