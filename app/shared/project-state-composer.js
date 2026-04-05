// ---------------------------------------------------------------------------
// Project State Composer — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Deterministic composition of persisted governed project state from
//   explicit engine outputs. Does NOT validate, compute blockers, compute
//   readiness, generate previews, generate executions, or infer missing state.
//
// Governing constraints:
//   - specs/runtime_state_contract.md §4C (createPersistedProjectState shape)
//   - specs/runtime_state_contract.md §1.4 (activated_domains persisted keys)
//   - specs/runtime_state_contract.md §1.5 (checkpoints persisted keys)
//   - specs/runtime_state_contract.md §1.7 (stage_state persisted keys)
//
// Hard rules:
//   R1  Compose only from explicit governed inputs. No inference, no defaults
//       that imply readiness or completeness.
//   R2  Computed objects (blockers, stage_routing, validated_checkpoints,
//       readiness_state) are accepted as inputs but NEVER persisted directly.
//   R3  Checkpoints: only contract-defined persisted fields are written.
//       Computed fields (blocker_flag, blocked_reason, dependencies_met,
//       all_evidence_provided) are stripped from input records.
//   R4  activated_domains.domains: computed per-domain fields are stripped
//       (primary_stage, domain_status, domain_visibility, has_warnings,
//       has_deferrals, has_blocked_golive, has_review_pending).
//   R5  Secrets must not be stored. target_context violations throw
//       (assertNoSecretsInTargetContext). connection_state secrets are
//       stripped silently (stripSecretsDeep).
//   R6  Partial state must not imply readiness. readiness_summary is null
//       when readiness input is absent. go_live_readiness is never set
//       by inference.
//   R7  project_identity.last_modified_at is updated to composed_at.
//       project_id and created_at (immutable fields) are preserved unchanged.
//   R8  previews and executions are always empty arrays — this engine does
//       not compose preview or execution state.
//   R9  target_context takes precedence over environment_context. Both are
//       validated for secrets.
//   R10 Output is deterministic: same inputs always produce the same
//       logical output (composed_at and last_modified_at vary by call time).
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";
import {
  assertNoSecretsInTargetContext,
  persistedFieldKeys,
} from "./runtime-state-contract.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `project-state-composer: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

// ---------------------------------------------------------------------------
// Engine version — increment on any rule change
// ---------------------------------------------------------------------------

export const PROJECT_STATE_COMPOSER_VERSION = "1.0.0";

// ---------------------------------------------------------------------------
// Secret field names — forbidden in any persisted object
// ---------------------------------------------------------------------------

const SECRET_FIELD_NAMES = Object.freeze([
  "password",
  "token",
  "api_key",
  "secret",
  "credential",
]);

// ---------------------------------------------------------------------------
// Persisted field key sets (resolved once at module init — R3, R4)
// ---------------------------------------------------------------------------

const CHECKPOINT_PERSISTED_KEYS = persistedFieldKeys("checkpoints");
const STAGE_PERSISTED_KEYS = persistedFieldKeys("stage_state");

// Computed per-domain fields stripped from activated_domains.domains (R4)
const DOMAIN_COMPUTED_KEYS = Object.freeze(
  new Set([
    "primary_stage",
    "domain_status",
    "domain_visibility",
    "has_warnings",
    "has_deferrals",
    "has_blocked_golive",
    "has_review_pending",
  ])
);

// ---------------------------------------------------------------------------
// Internal: deep-strip secrets from an arbitrary object (R5)
// Returns a new object; input is never mutated.
// ---------------------------------------------------------------------------

function stripSecretsDeep(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) {
    return obj.map(stripSecretsDeep);
  }
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SECRET_FIELD_NAMES.includes(key.toLowerCase())) continue;
    result[key] = stripSecretsDeep(value);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Internal: sanitize connection_state — strip secrets, null if absent (R5)
// ---------------------------------------------------------------------------

function sanitizeConnectionState(connectionState) {
  if (
    connectionState === null ||
    connectionState === undefined ||
    typeof connectionState !== "object" ||
    Array.isArray(connectionState)
  ) {
    return null;
  }
  return stripSecretsDeep(connectionState);
}

// ---------------------------------------------------------------------------
// Internal: compose readiness_summary snapshot (R2, R6)
//
// Stores counts and status indicators only — not the full gap record arrays.
// These are computed fields and must not be re-persisted as computed objects.
// Returns null when readiness input is absent (R6).
// ---------------------------------------------------------------------------

function composeReadinessSummary(readiness) {
  if (
    readiness === null ||
    readiness === undefined ||
    typeof readiness !== "object" ||
    Array.isArray(readiness)
  ) {
    return null;
  }
  return {
    go_live_readiness:              readiness.go_live_readiness ?? null,
    readiness_reason:               readiness.readiness_reason ?? null,
    training_status:                readiness.training_status ?? null,
    incomplete_critical_count:      Array.isArray(readiness.incomplete_critical_checkpoints)
                                      ? readiness.incomplete_critical_checkpoints.length
                                      : 0,
    blocked_count:                  Array.isArray(readiness.blocked_checkpoints)
                                      ? readiness.blocked_checkpoints.length
                                      : 0,
    deferred_count:                 Array.isArray(readiness.deferred_checkpoints)
                                      ? readiness.deferred_checkpoints.length
                                      : 0,
    warning_count:                  Array.isArray(readiness.unresolved_warnings)
                                      ? readiness.unresolved_warnings.length
                                      : 0,
    recommendation_issued:          readiness.recommendation_issued ?? false,
    recommendation_issued_at:       readiness.recommendation_issued_at ?? null,
    recommendation_issued_by:       readiness.recommendation_issued_by ?? null,
    recommendation_withheld_reason: readiness.recommendation_withheld_reason ?? null,
  };
}

// ---------------------------------------------------------------------------
// Internal: pick only contract-defined persisted fields from a checkpoint (R3)
// ---------------------------------------------------------------------------

function pickPersistedCheckpointFields(checkpoint) {
  const result = {};
  for (const key of CHECKPOINT_PERSISTED_KEYS) {
    result[key] = checkpoint[key] !== undefined ? checkpoint[key] : null;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Internal: pick only contract-defined persisted fields from a stage record
// ---------------------------------------------------------------------------

function pickPersistedStageFields(record) {
  const result = {};
  for (const key of STAGE_PERSISTED_KEYS) {
    result[key] = record[key] !== undefined ? record[key] : null;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Internal: strip computed fields from an activated_domains domain record (R4)
// ---------------------------------------------------------------------------

function pickActivatedDomainRecord(domain) {
  const result = {};
  for (const [key, value] of Object.entries(domain)) {
    if (!DOMAIN_COMPUTED_KEYS.has(key)) {
      result[key] = value;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Internal: compose project_identity (R7)
// Preserves immutable fields (project_id, created_at).
// Updates last_modified_at to composedAt.
// ---------------------------------------------------------------------------

function composeProjectIdentity(input, composedAt) {
  if (input === null || input === undefined || typeof input !== "object") {
    return null;
  }
  return {
    ...input,
    last_modified_at: composedAt,
  };
}

// ---------------------------------------------------------------------------
// Internal: compose target_context (R5, R9)
// target_context takes precedence over environment_context.
// Throws via assertNoSecretsInTargetContext if secrets are present.
// ---------------------------------------------------------------------------

function composeTargetContext(targetContext, environmentContext) {
  const resolved = targetContext ?? environmentContext ?? null;
  if (resolved === null) return null;
  assertNoSecretsInTargetContext(resolved);
  return { ...resolved };
}

// ---------------------------------------------------------------------------
// Main export: composeProjectState
// ---------------------------------------------------------------------------

/**
 * Composes a deterministic persisted project state from governed engine inputs.
 *
 * Computed objects (blockers, stage_routing, validated_checkpoints) are
 * accepted per the governed API surface but are never persisted. They are
 * silently ignored — no computed state leaks into persisted output.
 *
 * @param {object}      [inputs]
 * @param {object|null} [inputs.project_identity]       - persisted identity record
 * @param {object|null} [inputs.environment_context]    - target context fallback
 * @param {object|null} [inputs.workflow_state]         - { stage_state, discovery_answers, deferments }
 * @param {object|null} [inputs.activated_domains]      - persisted activated_domains container
 * @param {Array|null}  [inputs.checkpoints]            - persisted checkpoint records
 * @param {object|null} [inputs.validated_checkpoints]  - NOT persisted (computed); accepted only
 * @param {object|null} [inputs.blockers]               - NOT persisted (computed); accepted only
 * @param {object|null} [inputs.stage_routing]          - NOT persisted (computed); accepted only
 * @param {object|null} [inputs.readiness]              - persisted as readiness_summary snapshot
 * @param {object|null} [inputs.connection_state]       - persisted after secret stripping
 * @param {object|null} [inputs.training_state]         - persisted where provided
 * @param {object|null} [inputs.target_context]         - persisted target context (takes precedence)
 * @param {Array|null}  [inputs.decision_links]         - persisted as decisions array
 * @returns {object} project_state — persisted shape with composer extensions
 */
export function composeProjectState({
  project_identity     = null,
  environment_context  = null,
  workflow_state       = null,
  activated_domains    = null,
  checkpoints          = null,
  validated_checkpoints = null,  // NOT persisted — R2
  blockers             = null,   // NOT persisted — R2
  stage_routing        = null,   // NOT persisted — R2
  readiness            = null,
  connection_state     = null,
  training_state       = null,
  target_context       = null,
  decision_links       = null,
} = {}) {
  // R2: computed inputs are explicitly accepted but never written to output.
  // The void expressions below document intentional non-use.
  void validated_checkpoints;
  void blockers;
  void stage_routing;

  const composedAt = new Date().toISOString();

  // --- project_identity (R7) ---
  const composedIdentity = composeProjectIdentity(project_identity, composedAt);

  // --- target_context / environment_context (R5, R9) ---
  const composedTargetContext = composeTargetContext(target_context, environment_context);

  // --- discovery_answers from workflow_state ---
  const composedDiscoveryAnswers = workflow_state?.discovery_answers ?? null;

  // --- activated_domains — strip computed per-domain fields (R4) ---
  let composedActivatedDomains = null;
  if (activated_domains !== null && activated_domains !== undefined) {
    composedActivatedDomains = {
      domains: Array.isArray(activated_domains.domains)
        ? activated_domains.domains.map(pickActivatedDomainRecord)
        : [],
      activation_engine_version: activated_domains.activation_engine_version ?? null,
      activated_at:              activated_domains.activated_at ?? null,
    };
  }

  // --- checkpoints — persisted fields only (R3) ---
  const composedCheckpoints = Array.isArray(checkpoints)
    ? checkpoints.map(pickPersistedCheckpointFields)
    : [];

  // --- decisions from decision_links ---
  const composedDecisions = Array.isArray(decision_links)
    ? decision_links.map((d) => ({ ...d }))
    : [];

  // --- stage_state from workflow_state — persisted fields only ---
  const rawStageState = workflow_state?.stage_state ?? [];
  const composedStageState = Array.isArray(rawStageState)
    ? rawStageState.map(pickPersistedStageFields)
    : [];

  // --- deferments from workflow_state ---
  const rawDeferments = workflow_state?.deferments ?? [];
  const composedDeferments = Array.isArray(rawDeferments)
    ? rawDeferments.map((d) => ({ ...d }))
    : [];

  // --- connection_state — secrets stripped (R5) ---
  const composedConnectionState = sanitizeConnectionState(connection_state);

  // --- training_state — passthrough where provided ---
  const composedTrainingState =
    training_state !== null && training_state !== undefined
      ? { ...training_state }
      : null;

  // --- readiness_summary — snapshot only, never recomputed here (R2, R6) ---
  const composedReadinessSummary = composeReadinessSummary(readiness);

  return {
    // Runtime contract persisted fields (§4C shape)
    project_identity:    composedIdentity,
    target_context:      composedTargetContext,
    discovery_answers:   composedDiscoveryAnswers,
    activated_domains:   composedActivatedDomains,
    checkpoints:         composedCheckpoints,
    decisions:           composedDecisions,
    stage_state:         composedStageState,
    deferments:          composedDeferments,
    previews:            [],   // R8: not composed by this engine
    executions:          [],   // R8: not composed by this engine

    // Composer-owned persisted extensions
    connection_state:    composedConnectionState,
    training_state:      composedTrainingState,
    readiness_summary:   composedReadinessSummary,

    // Composer metadata
    composer_version:    PROJECT_STATE_COMPOSER_VERSION,
    composed_at:         composedAt,
  };
}
