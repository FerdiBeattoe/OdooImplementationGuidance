// ---------------------------------------------------------------------------
// Blocker Engine — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   First-pass derivation of blocker records from checkpoint records and
//   validation results. Produces the blockers container (§1.9 of the
//   runtime state contract).
//
// Governing constraints:
//   - specs/runtime_state_contract.md §1.9 (blockers shape)
//   - specs/runtime_state_contract.md §5.1 (blocker_record shape)
//   - specs/checkpoint_engine.md §2 (status transition rules, severity)
//
// Hard rules:
//   R1  Operates only on existing checkpoint records and validation records.
//       No checkpoint generation, no status mutation.
//   R2  Adds only blocker-owned fields. No checkpoint or validation field writes.
//   R3  A checkpoint receives at most one blocker record. Priority order:
//       owner_confirmation_missing > cross_domain_dependency >
//       dependency_unmet > evidence_missing.
//   R4  Severity is determined solely by checkpoint_class:
//       critical = Foundational | Domain_Required
//       standard = Go_Live | Recommended | Optional
//   R5  Recommended and Optional checkpoints are never upgraded to critical.
//   R6  No silent downgrade from blocked to warning.
//   R7  Cross-domain dependency blockers are structure-driven only:
//       declared dependencies + pass/block state of those dependencies.
//   R8  No dependency chain evaluation beyond immediate pass/block state.
//   R9  No readiness, deferment, preview, or execution computation.
//   R10 source_stage_id is null for first pass — stage routing is not yet
//       available; this field will be populated by the Stage Routing Engine.
//   R11 Output is deterministic: same inputs always produce same outputs.
//       created_at is fixed per compute call (all blockers in one run share
//       the same timestamp).
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `blocker-engine: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

// ---------------------------------------------------------------------------
// Engine version — increment on any rule change
// ---------------------------------------------------------------------------

export const BLOCKER_ENGINE_VERSION = "1.0.1";

// ---------------------------------------------------------------------------
// Constant enumerations
// ---------------------------------------------------------------------------

export const BLOCKER_TYPE = Object.freeze({
  DEPENDENCY_UNMET:             "dependency_unmet",
  EVIDENCE_MISSING:             "evidence_missing",
  OWNER_CONFIRMATION_MISSING:   "owner_confirmation_missing",
  CONNECTION_UNAVAILABLE:       "connection_unavailable",
  BRANCH_TARGET_UNDEFINED:      "branch_target_undefined",
  CROSS_DOMAIN_DEPENDENCY:      "cross_domain_dependency",
  DEPLOYMENT_CONSTRAINT:        "deployment_constraint",
});

export const BLOCKER_SEVERITY = Object.freeze({
  CRITICAL: "critical",
  STANDARD: "standard",
});

// Statuses that indicate a checkpoint is actively being worked on and should
// have its evidence evaluated. Not_Started is excluded: no evidence is expected yet.
const ACTIVE_EVIDENCE_STATUSES = new Set(["In_Progress", "Ready_For_Review"]);

// Statuses that satisfy an upstream dependency requirement.
const DEPENDENCY_PASSING_STATUSES = new Set(["Complete", "Deferred"]);

// ---------------------------------------------------------------------------
// Internal: severity from checkpoint_class
// ---------------------------------------------------------------------------

function severityFor(checkpointClass) {
  if (checkpointClass === "Foundational" || checkpointClass === "Domain_Required") {
    return BLOCKER_SEVERITY.CRITICAL;
  }
  return BLOCKER_SEVERITY.STANDARD;
}

// ---------------------------------------------------------------------------
// Output factories
// ---------------------------------------------------------------------------

/**
 * Creates a single blocker_record conforming to §5.1 of the runtime contract.
 *
 * @param {object} params
 * @param {string}      params.checkpoint_id
 * @param {string}      params.domain
 * @param {string}      params.checkpoint_class
 * @param {string}      params.blocker_type          - BLOCKER_TYPE constant
 * @param {string}      params.blocked_reason        - human-readable explanation
 * @param {string|null} params.blocking_checkpoint_id
 * @param {string|null} params.blocking_domain_id
 * @param {string}      params.resolution_action
 * @param {string}      params.created_at            - ISO 8601 timestamp (from caller)
 * @returns {object}  blocker_record
 */
export function createBlockerRecord({
  checkpoint_id = null,
  domain = null,
  checkpoint_class = null,
  blocker_type = null,
  blocked_reason = null,
  blocking_checkpoint_id = null,
  blocking_domain_id = null,
  resolution_action = null,
  created_at = null,
} = {}) {
  return {
    blocker_id:             `${checkpoint_id}:blocker`,
    scope:                  "checkpoint",
    source_checkpoint_id:   checkpoint_id,
    source_domain_id:       domain,
    source_stage_id:        null,      // R10: populated by Stage Routing Engine
    blocker_type,
    blocked_reason,
    blocking_checkpoint_id,
    blocking_domain_id,
    severity:               severityFor(checkpoint_class),
    created_at,
    resolution_action,
  };
}

/**
 * Creates the blockers container returned by computeBlockers().
 * Shape matches §1.9 of the runtime contract exactly.
 *
 * @param {object} params
 * @param {Array}       params.active_blockers
 * @param {number}      params.total_count
 * @param {object|null} params.by_severity   - map<severity, count>
 * @param {object|null} params.by_stage      - map<stage_id, count> — null in first pass
 * @param {object|null} params.by_domain     - map<domain_id, count>
 * @param {object|null} params.highest_priority_blocker
 * @returns {{ active_blockers, total_count, by_severity, by_stage, by_domain,
 *             highest_priority_blocker }}
 */
export function createBlockers({
  active_blockers = [],
  total_count = 0,
  by_severity = null,
  by_stage = null,
  by_domain = null,
  highest_priority_blocker = null,
} = {}) {
  return {
    active_blockers:          Array.isArray(active_blockers) ? active_blockers : [],
    total_count:              total_count ?? 0,
    by_severity:              by_severity ?? null,
    by_stage:                 by_stage ?? null,
    by_domain:                by_domain ?? null,
    highest_priority_blocker: highest_priority_blocker ?? null,
  };
}

// ---------------------------------------------------------------------------
// Internal: per-checkpoint blocker derivation
//
// Priority order (first rule that fires wins, R3):
//   P1  owner_confirmation_missing — validation source requires user input
//       but required discovery answers are absent or unconfirmed.
//   P2  cross_domain_dependency — a declared dependency checkpoint_id is not
//       present in the checkpoints array (phantom/unresolved dependency).
//   P3  dependency_unmet — a declared dependency checkpoint exists but has not
//       reached Complete or Deferred status.
//   P4  evidence_missing — checkpoint is In_Progress or Ready_For_Review and
//       evidence_required items have not been provided.
//
// Returns a blocker_record or null.
// ---------------------------------------------------------------------------

function deriveBlocker(checkpoint, validationRecord, checkpointsById, createdAt) {
  const {
    checkpoint_id,
    domain,
    checkpoint_class,
    validation_source,
    dependencies = [],
    evidence_required = [],
    evidence_items = {},
    status,
  } = checkpoint;

  // Guard: Complete and Deferred checkpoints never generate blockers.
  const COMPLETION_STATUSES = new Set(["Complete", "Deferred"]);
  if (COMPLETION_STATUSES.has(status)) {
    return null;
  }

  // P1: owner_confirmation_missing
  // Fires when: checkpoint requires user-confirmed input AND validation reports
  // that the required discovery answer is absent or unconfirmed.
  //
  // Two distinguishable sub-cases share the same blocker_type:
  //   (a) Unconditional Both — no discovery-question mapping exists for this
  //       checkpoint (missing_answer_refs is empty). The prerequisite is
  //       evidence submission / operator confirmation, not discovery answers.
  //   (b) Conditional Both / User_Confirmed — real discovery answers are
  //       missing (missing_answer_refs is non-empty).
  if (
    (validation_source === "User_Confirmed" || validation_source === "Both") &&
    validationRecord !== null &&
    validationRecord !== undefined &&
    validationRecord.validation_status === "Pending_User_Input"
  ) {
    const missingRefs = validationRecord.missing_answer_refs ?? [];
    const missing = missingRefs.slice(0, 3).join(", ");

    const blocked_reason = missing.length > 0
      ? `Checkpoint ${checkpoint_id} requires user-confirmed input but mandatory discovery answers are missing or unconfirmed. Missing discovery answers: ${missing}.`
      : `Checkpoint ${checkpoint_id} requires evidence submission or operator confirmation before it can proceed. No discovery-question mapping exists for this checkpoint.`;

    const resolution_action = missing.length > 0
      ? `Provide all required discovery answers and confirm them before progressing checkpoint ${checkpoint_id}.`
      : `Submit the required evidence or obtain operator confirmation for checkpoint ${checkpoint_id} before progressing.`;

    return createBlockerRecord({
      checkpoint_id,
      domain,
      checkpoint_class,
      blocker_type:             BLOCKER_TYPE.OWNER_CONFIRMATION_MISSING,
      blocked_reason,
      blocking_checkpoint_id:   null,
      blocking_domain_id:       null,
      resolution_action,
      created_at:               createdAt,
    });
  }

  // P2: cross_domain_dependency
  // Fires when a declared dependency checkpoint_id is not present in the
  // checkpoints array. This indicates a conditional checkpoint that was not
  // generated (e.g., its trigger question was not answered), or a domain that
  // was not activated.
  for (const depId of dependencies) {
    if (!checkpointsById.has(depId)) {
      return createBlockerRecord({
        checkpoint_id,
        domain,
        checkpoint_class,
        blocker_type:             BLOCKER_TYPE.CROSS_DOMAIN_DEPENDENCY,
        blocked_reason:           `Checkpoint ${checkpoint_id} declares a dependency on ${depId} which is not present in the current checkpoint set. The dependency checkpoint may belong to an unactivated domain or an ungenerated conditional path.`,
        blocking_checkpoint_id:   depId,
        blocking_domain_id:       null,
        resolution_action:        `Verify that the domain containing checkpoint ${depId} is activated and that its conditional generation trigger is satisfied.`,
        created_at:               createdAt,
      });
    }
  }

  // P3: dependency_unmet
  // Fires when a declared dependency checkpoint is present but has not
  // reached Complete or Deferred status.
  for (const depId of dependencies) {
    const dep = checkpointsById.get(depId);
    if (dep !== undefined && !DEPENDENCY_PASSING_STATUSES.has(dep.status)) {
      return createBlockerRecord({
        checkpoint_id,
        domain,
        checkpoint_class,
        blocker_type:             BLOCKER_TYPE.DEPENDENCY_UNMET,
        blocked_reason:           `Checkpoint ${checkpoint_id} depends on ${depId} which has status "${dep.status ?? "Not_Started"}". Required status: Complete or Deferred.`,
        blocking_checkpoint_id:   depId,
        blocking_domain_id:       dep.domain ?? null,
        resolution_action:        `Complete or defer checkpoint ${depId} before progressing checkpoint ${checkpoint_id}.`,
        created_at:               createdAt,
      });
    }
  }

  // P4: evidence_missing
  // Fires when the checkpoint is actively being worked (In_Progress or
  // Ready_For_Review) and has evidence_required items that have not been
  // provided. Not fired for Not_Started checkpoints.
  if (
    ACTIVE_EVIDENCE_STATUSES.has(status) &&
    Array.isArray(evidence_required) &&
    evidence_required.length > 0
  ) {
    const items = evidence_items !== null && typeof evidence_items === "object"
      ? evidence_items
      : {};

    const missingEvidence = evidence_required.filter((key) => {
      const item = items[key];
      return item === undefined || item === null || item.provided !== true;
    });

    if (missingEvidence.length > 0) {
      const preview = missingEvidence.slice(0, 3).join(", ");
      const more = missingEvidence.length > 3 ? ` (+${missingEvidence.length - 3} more)` : "";
      return createBlockerRecord({
        checkpoint_id,
        domain,
        checkpoint_class,
        blocker_type:             BLOCKER_TYPE.EVIDENCE_MISSING,
        blocked_reason:           `Checkpoint ${checkpoint_id} has ${missingEvidence.length} unprovided evidence item(s): ${preview}${more}.`,
        blocking_checkpoint_id:   null,
        blocking_domain_id:       null,
        resolution_action:        `Provide all required evidence items for checkpoint ${checkpoint_id}: ${preview}${more}.`,
        created_at:               createdAt,
      });
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Internal: summary computation helpers
// ---------------------------------------------------------------------------

function buildBySeverity(blockers) {
  const counts = { [BLOCKER_SEVERITY.CRITICAL]: 0, [BLOCKER_SEVERITY.STANDARD]: 0 };
  for (const b of blockers) {
    if (counts[b.severity] !== undefined) {
      counts[b.severity]++;
    }
  }
  return counts;
}

function buildByDomain(blockers) {
  const counts = {};
  for (const b of blockers) {
    if (b.source_domain_id !== null && b.source_domain_id !== undefined) {
      counts[b.source_domain_id] = (counts[b.source_domain_id] ?? 0) + 1;
    }
  }
  return Object.keys(counts).length > 0 ? counts : null;
}

function pickHighestPriority(blockers) {
  if (blockers.length === 0) return null;
  const critical = blockers.find((b) => b.severity === BLOCKER_SEVERITY.CRITICAL);
  return critical ?? blockers[0];
}

// ---------------------------------------------------------------------------
// Main export: computeBlockers
// ---------------------------------------------------------------------------

/**
 * Derives the blockers container from checkpoint records and validation results.
 *
 * Does NOT compute readiness, deferments, previews, or execution candidates.
 * Does NOT mutate any input record.
 *
 * @param {Array}  checkpoints          - array of checkpoint records (persisted state)
 * @param {object} validatedCheckpoints - output of computeValidation()
 *                                        { records: [...], engine_version, validated_at }
 * @returns {{ active_blockers, total_count, by_severity, by_stage, by_domain,
 *             highest_priority_blocker }}
 */
export function computeBlockers(checkpoints, validatedCheckpoints) {
  if (!Array.isArray(checkpoints)) {
    throw new Error("computeBlockers: checkpoints must be an array.");
  }
  if (
    validatedCheckpoints === null ||
    typeof validatedCheckpoints !== "object" ||
    !Array.isArray(validatedCheckpoints.records)
  ) {
    throw new Error(
      "computeBlockers: validatedCheckpoints must be an object with a records array."
    );
  }

  // Build lookup maps for O(1) access during derivation.
  const checkpointsById = new Map(
    checkpoints.map((cp) => [cp.checkpoint_id, cp])
  );
  const validationById = new Map(
    validatedCheckpoints.records.map((r) => [r.checkpoint_id, r])
  );

  // All blockers in a single compute call share one timestamp (R11).
  const createdAt = new Date().toISOString();

  const active_blockers = [];
  for (const cp of checkpoints) {
    const validationRecord = validationById.get(cp.checkpoint_id) ?? null;
    const blocker = deriveBlocker(cp, validationRecord, checkpointsById, createdAt);
    if (blocker !== null) {
      active_blockers.push(blocker);
    }
  }

  const by_severity = buildBySeverity(active_blockers);
  const by_domain = buildByDomain(active_blockers);
  const highest_priority_blocker = pickHighestPriority(active_blockers);

  return createBlockers({
    active_blockers,
    total_count:              active_blockers.length,
    by_severity:              active_blockers.length > 0 ? by_severity : null,
    by_stage:                 null, // R10: requires Stage Routing Engine
    by_domain:                by_domain,
    highest_priority_blocker: highest_priority_blocker,
  });
}
