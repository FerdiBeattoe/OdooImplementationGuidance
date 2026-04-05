// ---------------------------------------------------------------------------
// Pipeline Application Service — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Backend application-service boundary over runPipeline(...).
//   Validates the incoming request shape at the backend boundary,
//   delegates to the shared pipeline orchestrator exactly once,
//   and returns the runtime state in a backend-owned envelope.
//
// Hard rules:
//   S1  No business logic. No inference. No field recomputation.
//   S2  Call runPipeline exactly once per request.
//   S3  Return runtime state payload unchanged inside envelope.
//   S4  Reject malformed input at boundary — do not silently fill.
//   S5  Optional inputs passed through truthfully (null if absent).
//   S6  No secrets persisted or leaked. No UI logic. No side effects.
//   S7  Persistence hooks: null/stubbed (not yet implemented).
//   S8  Deterministic: identical input → identical structural output.
// ---------------------------------------------------------------------------

import { runPipeline } from "../shared/pipeline-orchestrator.js";

// ---------------------------------------------------------------------------
// Backend service version — increment on any boundary or envelope change
// ---------------------------------------------------------------------------

export const PIPELINE_SERVICE_VERSION = "1.0.0";

// ---------------------------------------------------------------------------
// Required field set at the backend boundary
// discovery_answers is the only required input — all others are optional.
// ---------------------------------------------------------------------------

const REQUIRED_FIELDS = ["discovery_answers"];

// ---------------------------------------------------------------------------
// Optional pipeline input keys — passed through truthfully when absent.
// ---------------------------------------------------------------------------

const OPTIONAL_PIPELINE_KEYS = [
  "project_identity",
  "environment_context",
  "target_context",
  "connection_state",
  "workflow_state",
  "training_state",
  "decision_links",
  "approval_context",
  "execution_result",
  "operation_definitions",
  "checkpoint_statuses",
];

// ---------------------------------------------------------------------------
// isPlainObject — boundary-safe check (not null, not array, typeof object)
// ---------------------------------------------------------------------------

function isPlainObject(v) {
  return v !== null && v !== undefined && typeof v === "object" && !Array.isArray(v);
}

// ---------------------------------------------------------------------------
// validatePayload — returns first validation error or null if valid.
// Only rejects what is structurally wrong at the backend boundary.
// Does not inspect or enforce the shape of optional engine inputs.
// ---------------------------------------------------------------------------

function validatePayload(payload) {
  if (!isPlainObject(payload)) {
    return "Payload must be a non-null plain object.";
  }

  for (const field of REQUIRED_FIELDS) {
    if (!(field in payload)) {
      return `Required field missing: ${field}.`;
    }
  }

  if (!isPlainObject(payload.discovery_answers)) {
    return "discovery_answers must be a non-null plain object.";
  }

  // operation_definitions is optional. When present and non-null, must be a plain object.
  if (
    Object.prototype.hasOwnProperty.call(payload, "operation_definitions") &&
    payload.operation_definitions !== null &&
    payload.operation_definitions !== undefined &&
    !isPlainObject(payload.operation_definitions)
  ) {
    return "operation_definitions must be a plain object if provided.";
  }

  return null;
}

// ---------------------------------------------------------------------------
// runPipelineService — backend application-service entry point
//
// @param {object} payload  — raw request payload from backend transport layer
// @returns {{ ok: true, runtime_state: object }
//         | { ok: false, error: string }}
//
// Contract:
//   - On valid payload: returns { ok: true, runtime_state } where
//     runtime_state is the unmodified return value of runPipeline.
//   - On invalid payload: returns { ok: false, error } — never throws.
//   - runPipeline is called exactly once per invocation.
//   - Envelope fields (ok, runtime_state) are the only backend-owned additions.
//     The runtime_state value is not mutated or re-shaped.
// ---------------------------------------------------------------------------

export function runPipelineService(payload) {
  // ── Boundary validation ───────────────────────────────────────────────────
  const validationError = validatePayload(payload);
  if (validationError !== null) {
    return { ok: false, error: validationError };
  }

  // ── Extract inputs truthfully (S4, S5) ────────────────────────────────────
  // Required
  const discovery_answers = payload.discovery_answers;

  // Optional — null if absent, preserving caller-supplied null explicitly.
  const project_identity    = Object.prototype.hasOwnProperty.call(payload, "project_identity")    ? payload.project_identity    : null;
  const environment_context = Object.prototype.hasOwnProperty.call(payload, "environment_context") ? payload.environment_context : null;
  const target_context      = Object.prototype.hasOwnProperty.call(payload, "target_context")      ? payload.target_context      : null;
  const connection_state    = Object.prototype.hasOwnProperty.call(payload, "connection_state")    ? payload.connection_state    : null;
  const workflow_state      = Object.prototype.hasOwnProperty.call(payload, "workflow_state")      ? payload.workflow_state      : null;
  const training_state      = Object.prototype.hasOwnProperty.call(payload, "training_state")      ? payload.training_state      : null;
  const decision_links      = Object.prototype.hasOwnProperty.call(payload, "decision_links")      ? payload.decision_links      : null;
  const approval_context    = Object.prototype.hasOwnProperty.call(payload, "approval_context")    ? payload.approval_context    : null;
  const execution_result      = Object.prototype.hasOwnProperty.call(payload, "execution_result")      ? payload.execution_result      : null;
  const operation_definitions = Object.prototype.hasOwnProperty.call(payload, "operation_definitions") ? payload.operation_definitions : null;
  const checkpoint_statuses   = Object.prototype.hasOwnProperty.call(payload, "checkpoint_statuses")   ? payload.checkpoint_statuses   : null;

  // ── Single pipeline call (S2) ─────────────────────────────────────────────
  const runtimeState = runPipeline({
    project_identity,
    discovery_answers,
    environment_context,
    target_context,
    connection_state,
    workflow_state,
    training_state,
    decision_links,
    approval_context,
    execution_result,
    operation_definitions,
    checkpoint_statuses,
  });

  // ── Return backend envelope (S3) ──────────────────────────────────────────
  // runtime_state is the unmodified runPipeline return value.
  return { ok: true, runtime_state: runtimeState };
}
