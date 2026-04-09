import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `runtime-state-contract: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

// ---------------------------------------------------------------------------
// Immutable field declarations
// ---------------------------------------------------------------------------

export const PROJECT_IDENTITY_IMMUTABLE_FIELDS = Object.freeze([
  "project_id",
  "created_at",
]);

// ---------------------------------------------------------------------------
// Secrets guard
// ---------------------------------------------------------------------------

const FORBIDDEN_TARGET_CONTEXT_FIELDS = Object.freeze([
  "password",
  "token",
  "api_key",
  "secret",
  "credential",
]);

export function assertNoSecretsInTargetContext(obj) {
  if (obj === null || typeof obj !== "object") {
    return;
  }
  for (const key of Object.keys(obj)) {
    if (FORBIDDEN_TARGET_CONTEXT_FIELDS.includes(key.toLowerCase())) {
      throw new Error(
        `assertNoSecretsInTargetContext: forbidden field "${key}" must not be present in target_context.`
      );
    }
    // Recurse into nested objects so secrets cannot be smuggled under
    // intermediate keys (e.g. { db: { password: "..." } }).
    assertNoSecretsInTargetContext(obj[key]);
  }
}

// ---------------------------------------------------------------------------
// Factory: project_identity
// ---------------------------------------------------------------------------

export function createProjectIdentity({
  project_name,
  customer_entity,
  project_owner,
  implementation_lead,
  project_mode,
} = {}) {
  const now = new Date().toISOString();

  return {
    project_id: crypto.randomUUID(),
    project_name: project_name ?? null,
    customer_entity: customer_entity ?? null,
    project_owner: project_owner ?? null,
    implementation_lead: implementation_lead ?? null,
    project_mode: project_mode ?? null,
    created_at: now,
    last_modified_at: now,
  };
}

// ---------------------------------------------------------------------------
// Factory: target_context
// ---------------------------------------------------------------------------

export function createTargetContext({
  edition,
  deployment_type,
  primary_country = null,
  primary_currency = null,
  multi_company = false,
  multi_currency = false,
  odoosh_branch_target = null,
  odoosh_environment_type = null,
  connection_mode = null,
  connection_status = null,
  connection_target_id = null,
  connection_capability_note = null,
} = {}) {
  const obj = {
    odoo_version: ODOO_VERSION,
    edition: edition ?? null,
    deployment_type: deployment_type ?? null,
    primary_country,
    primary_currency,
    multi_company,
    multi_currency,
    odoosh_branch_target,
    odoosh_environment_type,
    connection_mode,
    connection_status,
    connection_target_id,
    connection_capability_note,
  };

  assertNoSecretsInTargetContext(obj);
  return obj;
}

// ---------------------------------------------------------------------------
// Factory: discovery_answers
// ---------------------------------------------------------------------------

export function createDiscoveryAnswers({ framework_version } = {}) {
  return {
    answers: {},
    answered_at: {},
    conditional_questions_skipped: [],
    framework_version: framework_version ?? null,
    confirmed_by: null,
    confirmed_at: null,
  };
}

// ---------------------------------------------------------------------------
// Factory: deferment_record
// ---------------------------------------------------------------------------

export function createDefermentRecord({
  source_checkpoint_id,
  source_domain_id,
  source_stage_id,
  deferred_by,
  reason,
  constraints = [],
  review_date = null,
  owner_signoff = false,
  owner_signoff_by = null,
  owner_signoff_at = null,
  linked_decision_id,
  phase2_eligible = false,
} = {}) {
  return {
    deferment_id: crypto.randomUUID(),
    source_checkpoint_id: source_checkpoint_id ?? null,
    source_domain_id: source_domain_id ?? null,
    source_stage_id: source_stage_id ?? null,
    deferred_by: deferred_by ?? null,
    deferred_at: new Date().toISOString(),
    reason: reason ?? null,
    constraints,
    review_date,
    owner_signoff,
    owner_signoff_by,
    owner_signoff_at,
    linked_decision_id: linked_decision_id ?? null,
    phase2_eligible,
    reactivated: false,
    reactivated_at: null,
  };
}

// ---------------------------------------------------------------------------
// Factories: empty array shapes
// ---------------------------------------------------------------------------

export function createDecisionsArray() {
  return [];
}

export function createPreviewsArray() {
  return [];
}

export function createExecutionsArray() {
  return [];
}

// ---------------------------------------------------------------------------
// Factory: operation_definition — caller-supplied explicit input
// NOT a checkpoint field. NOT persisted. NOT inferred.
// target_model, method/target_operation, intended_changes, safety_class,
// execution_relevance, and validation_source are always caller-supplied.
// The engine refuses to default, guess, or derive any of these fields.
// ---------------------------------------------------------------------------

export function createOperationDefinition({
  checkpoint_id = null,
  target_model = null,
  method = null,
  target_operation = null,
  intended_changes = null,
  safety_class = null,
  execution_relevance = null,
  validation_source = null,
} = {}) {
  const resolvedMethod = method ?? target_operation ?? null;
  return {
    checkpoint_id: checkpoint_id ?? null,
    target_model: target_model ?? null,
    method: resolvedMethod,
    target_operation: resolvedMethod,
    intended_changes: intended_changes ?? null,
    safety_class: safety_class ?? null,
    execution_relevance: execution_relevance ?? null,
    validation_source: validation_source ?? null,
  };
}

/**
 * Returns an empty operation_definitions map.
 * Callers populate this map by keying each createOperationDefinition()
 * record on its checkpoint_id before passing to runPipeline / computePreviews.
 *
 * @returns {{ [checkpoint_id: string]: object }}
 */
export function createOperationDefinitionsMap() {
  return {};
}

// ---------------------------------------------------------------------------
// Computed object stubs
// Step 2: stubs only — all fields null / false / [].
// No domain logic. No dependencies. No functions.
// Each object declares __owner to identify the engine responsible for populating it.
// These objects are NEVER persisted. They are always recomputed from persisted state.
// ---------------------------------------------------------------------------

// readiness_state (1.8)
// Owner: StageRoutingEngine — sole authority over go-live readiness computation (§2.4).
export const COMPUTED_READINESS_STATE_STUB = Object.freeze({
  __owner: "StageRoutingEngine",
  go_live_readiness: null,
  readiness_reason: null,
  incomplete_critical_checkpoints: [],
  blocked_checkpoints: [],
  deferred_checkpoints: [],
  unresolved_warnings: [],
  training_status: null,
  recommendation_issued: false,
  recommendation_issued_at: null,
  recommendation_issued_by: null,
  recommendation_withheld_reason: null,
});

// blockers (1.9)
// Owner: StageRoutingEngine — derives active blockers from checkpoint blocker_flag (§2.4).
export const COMPUTED_BLOCKERS_STUB = Object.freeze({
  __owner: "StageRoutingEngine",
  active_blockers: [],
  total_count: 0,
  by_severity: null,
  by_stage: null,
  by_domain: null,
  highest_priority_blocker: null,
});

// audit_refs (1.14)
// Owner: StageRoutingEngine — per §2.4, the Stage Routing and Readiness Engine
// computes audit_refs on every load (recompute Step 7, §3.1). It has read access
// to all linkage fields (linked_decision_ids, linked_preview_ids,
// linked_execution_ids on checkpoints, decisions, previews, executions) and is
// the single engine authorized to produce the cross-reference index.
export const COMPUTED_AUDIT_REFS_STUB = Object.freeze({
  __owner: "StageRoutingEngine",
  by_checkpoint: null,
  by_decision: null,
  by_preview: null,
  by_execution: null,
});

// resume_context (1.16)
// Owner: StageRoutingEngine — computes resume target, stale alerts, next action,
// and secondary action queue on every load/resume (§2.4, recompute Step 6).
export const COMPUTED_RESUME_CONTEXT_STUB = Object.freeze({
  __owner: "StageRoutingEngine",
  current_stages: [],
  resume_target_type: null,
  resume_target_checkpoint_id: null,
  resume_target_domain_id: null,
  resume_target_stage_id: null,
  resume_context_message: null,
  stale_state_alerts: [],
  highest_priority_blocker: null,
  next_required_action: null,
  secondary_action_queue: [],
});

// ---------------------------------------------------------------------------
// Both object factories
// Step 3: activated_domains, stage_state, checkpoints.
// Each Both object has a declared persisted key set and computed key set.
// The sets are non-overlapping by construction.
// No logic. No domain-specific defaults. No functions beyond key list accessors.
// ---------------------------------------------------------------------------

// ── Field key registries ────────────────────────────────────────────────────
//
// persistedFieldKeys(objectName) — fields saved to storage and restored on resume.
// computedFieldKeys(objectName) — fields populated by the owning engine on each
//   recompute; never persisted, never seeded with real values by factories.
//
// activated_domains: container-level persisted keys + per-domain computed keys.
//   primary_stage is ONLY in computed (per spec §1.4 and §3.5 assignment table).
// stage_state: per-record field separation (S01–S12 stage records).
// checkpoints: per-record field separation.
//   status → persisted (tracks real work done; §3.2).
//   blocker_flag, dependencies_met, all_evidence_provided → computed (CheckpointEngine).

const _PERSISTED_KEYS = Object.freeze({
  activated_domains: Object.freeze([
    "domains",
    "activation_engine_version",
    "activated_at",
  ]),
  stage_state: Object.freeze([
    "stage_id",
    "entry_confirmed_at",
    "entry_confirmed_by",
    "exit_confirmed_at",
    "exit_confirmed_by",
  ]),
  checkpoints: Object.freeze([
    "checkpoint_id",
    "domain",
    "checkpoint_name",
    "checkpoint_class",
    "validation_source",
    "evidence_required",
    "checkpoint_owner",
    "deferment_allowed",
    "deferment_constraints",
    "dependencies",
    "downstream_impact_summary",
    "guidance_required",
    "training_available",
    "execution_relevance",
    "preview_required",
    "safety_class",
    "linked_decision_types",
    "status",
    "evidence_items",
    "reviewer",
    "linked_preview_ids",
    "linked_execution_ids",
    "linked_decision_ids",
    "last_status_transition_actor",
    "last_status_transition_at",
    "last_reviewed_at",
  ]),
});

const _COMPUTED_KEYS = Object.freeze({
  activated_domains: Object.freeze([
    "primary_stage",
    "domain_status",
    "domain_visibility",
    "has_warnings",
    "has_deferrals",
    "has_blocked_golive",
    "has_review_pending",
  ]),
  stage_state: Object.freeze([
    "stage_status",
    "entry_conditions_met",
    "exit_conditions_met",
    "has_deferrals",
    "has_cross_stage_blockers",
    "parallel_active",
    "assigned_domains",
  ]),
  checkpoints: Object.freeze([
    "blocker_flag",
    "blocked_reason",
    "dependencies_met",
    "all_evidence_provided",
  ]),
});

export function persistedFieldKeys(objectName) {
  const keys = _PERSISTED_KEYS[objectName];
  if (!keys) {
    throw new Error(
      `persistedFieldKeys: unknown Both object "${objectName}". ` +
        `Known: ${Object.keys(_PERSISTED_KEYS).join(", ")}.`
    );
  }
  return Object.freeze(keys);
}

export function computedFieldKeys(objectName) {
  const keys = _COMPUTED_KEYS[objectName];
  if (!keys) {
    throw new Error(
      `computedFieldKeys: unknown Both object "${objectName}". ` +
        `Known: ${Object.keys(_COMPUTED_KEYS).join(", ")}.`
    );
  }
  return Object.freeze(keys);
}

// ── Factory: activated_domains (1.4) ───────────────────────────────────────
// Both. Container persisted at S02 exit. Per-domain computed fields are
// populated by StageRoutingEngine on every recompute — not present in factory output.

export function createActivatedDomains() {
  return {
    domains: [],
    activation_engine_version: null,
    activated_at: null,
  };
}

// Individual domain record — persisted fields only.
// Computed fields (primary_stage, domain_status, etc.) are not set here.
export function createActivatedDomainRecord({
  domain_id = null,
  activated = false,
  excluded_reason = null,
  priority = null,
  activation_question_refs = [],
  deferral_eligible = false,
} = {}) {
  return {
    domain_id,
    activated,
    excluded_reason,
    priority,
    activation_question_refs,
    deferral_eligible,
  };
}

// ── Factory: stage_state (1.7) ─────────────────────────────────────────────
// Both. One record per stage (S01–S12). Persisted fields are entry/exit events
// set once per stage transition. Computed fields are populated by StageRoutingEngine.
// stage_id is immutable once set (§3.5 pattern).

export function createStageRecord({ stage_id = null } = {}) {
  return {
    stage_id,
    entry_confirmed_at: null,
    entry_confirmed_by: null,
    exit_confirmed_at: null,
    exit_confirmed_by: null,
  };
}

export function createStageStateArray() {
  return [];
}

// ── Factory: checkpoint (1.5) ──────────────────────────────────────────────
// Both. Definition fields are immutable (set once at generation by CheckpointEngine).
// Mutable persisted fields track in-progress state.
// Computed fields (blocker_flag, blocked_reason, dependencies_met,
// all_evidence_provided) are populated by CheckpointEngine — not set here.

export function createCheckpoint({
  checkpoint_id = null,
  domain = null,
  checkpoint_name = null,
  checkpoint_class = null,
  validation_source = null,
  evidence_required = [],
  checkpoint_owner = null,
  deferment_allowed = false,
  deferment_constraints = null,
  dependencies = [],
  downstream_impact_summary = null,
  guidance_required = false,
  training_available = false,
  execution_relevance = null,
  preview_required = false,
  safety_class = null,
  linked_decision_types = [],
} = {}) {
  return {
    // Immutable definition fields — set at generation, never changed (§3.2, §3.5)
    checkpoint_id,
    domain,
    checkpoint_name,
    checkpoint_class,
    validation_source,
    evidence_required,
    checkpoint_owner,
    deferment_allowed,
    deferment_constraints,
    dependencies,
    downstream_impact_summary,
    guidance_required,
    training_available,
    execution_relevance,
    preview_required,
    safety_class,
    linked_decision_types,
    // Mutable persisted fields — updated during checkpoint work
    status: null,
    evidence_items: {},
    reviewer: null,
    linked_preview_ids: [],
    linked_execution_ids: [],
    linked_decision_ids: [],
    last_status_transition_actor: null,
    last_status_transition_at: null,
    last_reviewed_at: null,
  };
}

// ---------------------------------------------------------------------------
// Step 4A — deepFreeze helper
// Recursively freezes an object and all nested objects/arrays.
// No engine logic. No side effects beyond freezing.
// ---------------------------------------------------------------------------

export function deepFreeze(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  if (Object.isFrozen(obj)) return obj;

  if (Array.isArray(obj)) {
    obj.forEach(deepFreeze);
  } else {
    Object.getOwnPropertyNames(obj).forEach((key) => {
      deepFreeze(obj[key]);
    });
  }

  return Object.freeze(obj);
}

// ---------------------------------------------------------------------------
// Step 4B — Append-only helpers
// Each helper returns a NEW array. Input arrays are never mutated.
// Required fields are validated before the record is accepted.
// Records are frozen with deepFreeze before being placed in the returned array.
// ---------------------------------------------------------------------------

export function appendDecision(existing, record) {
  if (!Array.isArray(existing)) {
    throw new Error("appendDecision: existing must be an array.");
  }
  if (!record || typeof record !== "object") {
    throw new Error("appendDecision: record must be an object.");
  }
  if (typeof record.decision_id !== "string" || record.decision_id.trim() === "") {
    throw new Error("appendDecision: record.decision_id must be a non-empty string.");
  }
  if (typeof record.decision_type !== "string" || record.decision_type.trim() === "") {
    throw new Error("appendDecision: record.decision_type must be a non-empty string.");
  }
  const sealed = deepFreeze({
    created_at: new Date().toISOString(),
    ...record,
  });
  return [...existing, sealed];
}

export function appendPreview(existing, record) {
  if (!Array.isArray(existing)) {
    throw new Error("appendPreview: existing must be an array.");
  }
  if (!record || typeof record !== "object") {
    throw new Error("appendPreview: record must be an object.");
  }
  if (typeof record.preview_id !== "string" || record.preview_id.trim() === "") {
    throw new Error("appendPreview: record.preview_id must be a non-empty string.");
  }
  const sealed = deepFreeze({
    stale: false,
    linked_execution_id: null,
    ...record,
  });
  return [...existing, sealed];
}

export function appendExecution(existing, record) {
  if (!Array.isArray(existing)) {
    throw new Error("appendExecution: existing must be an array.");
  }
  if (!record || typeof record !== "object") {
    throw new Error("appendExecution: record must be an object.");
  }
  if (typeof record.execution_id !== "string" || record.execution_id.trim() === "") {
    throw new Error("appendExecution: record.execution_id must be a non-empty string.");
  }
  const sealed = deepFreeze({
    status: "planned",
    completed_at: null,
    ...record,
  });
  return [...existing, sealed];
}

// ---------------------------------------------------------------------------
// Step 4C — createPersistedProjectState()
// Returns only persisted objects. No computed objects included.
// Both objects contribute only their persisted container shapes.
// Arrays initialised as []. Computed object names are absent from this output.
// ---------------------------------------------------------------------------

export function createPersistedProjectState() {
  return {
    project_identity: createProjectIdentity(),
    target_context: createTargetContext(),
    discovery_answers: createDiscoveryAnswers(),
    wizard_captures: {},
    activated_domains: createActivatedDomains(),
    checkpoints: [],
    decisions: createDecisionsArray(),
    stage_state: createStageStateArray(),
    // deferments: flat append-only array of deferment_record objects.
    // Aligns with decisions/previews/executions pattern.
    deferments: [],
    previews: createPreviewsArray(),
    executions: createExecutionsArray(),
  };
}

// ---------------------------------------------------------------------------
// Step 4D — getComputedObjectNames()
// Returns a frozen array of the top-level keys that are NEVER persisted.
// Used by the serialization layer to strip computed fields before save.
// ---------------------------------------------------------------------------

export function getComputedObjectNames() {
  return Object.freeze([
    "readiness_state",
    "blockers",
    "audit_refs",
    "resume_context",
  ]);
}
