// ---------------------------------------------------------------------------
// Validation Engine — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   First-pass validation of checkpoint records against discovery_answers.
//   Produces validated_checkpoints: one validation result per input checkpoint.
//
// Governing constraints:
//   - specs/checkpoint_engine.md §1 (checkpoint schema, validation_source enum)
//   - specs/runtime_state_contract.md §1.5 (checkpoints persisted fields)
//   - specs/discovery_question_framework.md (question-answer definitions)
//
// Hard rules:
//   R1  Operates only on existing checkpoint records. No checkpoint generation.
//   R2  Adds only validation-owned fields. No checkpoint-owned field mutations.
//   R3  System_Detectable checkpoints pass first-pass (no user input required).
//   R4  User_Confirmed checkpoints: if any required discovery answer is missing,
//       or no required answers are defined for this checkpoint,
//       produce Pending_User_Input (never mark Pass).
//   R5  Both checkpoints: if required user answers are present, Pending_System_Check.
//       If required answers are defined and any are missing, Pending_User_Input.
//       If no required answers are defined (unconditional) and confirmed_by is a
//       non-empty string, Pending_System_Check. If confirmed_by is absent, Pending_User_Input.
//       Both never reaches Pass on first pass (system check not possible).
//   R6  No cross-domain dependency evaluation.
//   R7  No blocker, readiness, or deferment computation.
//   R8  No preview or execution candidate generation.
//   R9  Output is deterministic: same inputs always produce same outputs.
//   R10 VALIDATION_REQUIRED_ANSWERS maps conditional checkpoints to their
//       required discovery question_id(s). Unconditional User_Confirmed and
//       Both checkpoints have no entry; they default to Pending_User_Input.
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `validation-engine: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

// ---------------------------------------------------------------------------
// Engine version — increment on any rule change
// ---------------------------------------------------------------------------

export const VALIDATION_ENGINE_VERSION = "1.2.0";

// ---------------------------------------------------------------------------
// Validation status constants
// ---------------------------------------------------------------------------

export const VALIDATION_STATUS = Object.freeze({
  PASS: "Pass",
  PENDING_SYSTEM_CHECK: "Pending_System_Check",
  PENDING_USER_INPUT: "Pending_User_Input",
});

// ---------------------------------------------------------------------------
// Static lookup: checkpoint_id → required discovery question_ids
//
// Populated only for conditional checkpoints whose validation depends on a
// specific discovery answer. An entry here means: all listed question_ids
// must be present in discoveryAnswers.answers for the checkpoint to pass
// first-pass user-input validation.
//
// Unconditional User_Confirmed and Both checkpoints are NOT listed here.
// Absence from this table means no discovery answer is available to confirm
// the checkpoint → these default to Pending_User_Input on first pass.
// ---------------------------------------------------------------------------

export const VALIDATION_REQUIRED_ANSWERS = Object.freeze({
  // Foundation
  "FND-FOUND-002": Object.freeze(["BM-03"]),
  "FND-FOUND-006": Object.freeze(["BM-02"]),
  "FND-DREQ-003":  Object.freeze(["BM-04"]),
  "FND-DREQ-004":  Object.freeze(["FC-04"]),

  // Users / Roles
  "USR-DREQ-004":  Object.freeze(["TA-02"]),
  "USR-DREQ-005":  Object.freeze(["BM-02"]),
  "USR-DREQ-006":  Object.freeze(["BM-05"]),
  "USR-DREQ-007":  Object.freeze(["SC-02"]),
  "USR-DREQ-008":  Object.freeze(["PI-02"]),
  "USR-DREQ-009":  Object.freeze(["SC-04"]),
  "USR-DREQ-010":  Object.freeze(["MF-05"]),
  "USR-DREQ-011":  Object.freeze(["FC-03"]),

  // Master Data
  "MAS-DREQ-005":  Object.freeze(["OP-01"]),
  "MAS-DREQ-006":  Object.freeze(["MF-01"]),
  // MAS-DREQ-007 (traceability categories) no longer maps to a discovery
  // question. PI-04 was removed from discovery; the gate now comes from
  // wizard_captures.inventory at checkpoint generation time. Absence from
  // this table is intentional — first-pass validation defaults to
  // Pending_User_Input / Pending_System_Check per R5.

  // CRM
  "CRM-DREQ-004":  Object.freeze(["TA-02"]),

  // Sales
  "SAL-DREQ-003":  Object.freeze(["SC-02"]),
  "SAL-DREQ-004":  Object.freeze(["SC-03"]),
  "SAL-DREQ-005":  Object.freeze(["SC-04"]),
  "SAL-DREQ-006":  Object.freeze(["FC-06"]),
  "SAL-DREQ-007":  Object.freeze(["PI-05"]),

  // Purchase
  "PUR-DREQ-003":  Object.freeze(["PI-02"]),
  "PUR-DREQ-004":  Object.freeze(["PI-02"]),
  "PUR-DREQ-005":  Object.freeze(["FC-03"]),
  "PUR-DREQ-006":  Object.freeze(["MF-04"]),
  "PUR-DREQ-007":  Object.freeze(["PI-05"]),

  // Inventory
  "INV-DREQ-003":  Object.freeze(["OP-02"]),
  "INV-DREQ-004":  Object.freeze(["PI-03"]),
  "INV-DREQ-005":  Object.freeze(["PI-03"]),
  "INV-DREQ-006":  Object.freeze(["PI-05"]),
  "INV-DREQ-007":  Object.freeze(["FC-02"]),
  "INV-DREQ-008":  Object.freeze(["MF-01"]),
  // INV-DREQ-009 (rental availability) gates on RM-01 array after RM-04 removal.
  // Generation checks RM-01 includes "Rental of assets or equipment"; here we
  // only require RM-01 to be answered at all — presence is sufficient because
  // the checkpoint is only generated when the array contains the rental value.
  "INV-DREQ-009":  Object.freeze(["RM-01"]),

  // Manufacturing
  "MRP-DREQ-003":  Object.freeze(["MF-02"]),
  "MRP-DREQ-004":  Object.freeze(["MF-02"]),
  "MRP-DREQ-005":  Object.freeze(["MF-03"]),
  "MRP-DREQ-006":  Object.freeze(["MF-03"]),
  "MRP-DREQ-007":  Object.freeze(["MF-04"]),
  "MRP-DREQ-008":  Object.freeze(["FC-01", "MF-02"]),

  // Accounting
  "ACCT-DREQ-005": Object.freeze(["BM-04"]),
  "ACCT-DREQ-006": Object.freeze(["FC-02"]),
  "ACCT-DREQ-007": Object.freeze(["FC-02"]),
  "ACCT-REC-001":  Object.freeze(["FC-05"]),
  "ACCT-REC-002":  Object.freeze(["FC-01"]),

  // POS
  "POS-DREQ-004":  Object.freeze(["FC-01"]),
  "POS-DREQ-005":  Object.freeze(["OP-01"]),

  // Website / eCommerce
  "WEB-DREQ-004":  Object.freeze(["OP-01"]),
  "WEB-DREQ-005":  Object.freeze(["SC-03"]),

  // Projects
  "PRJ-DREQ-003":  Object.freeze(["RM-02"]),
  "PRJ-DREQ-004":  Object.freeze(["FC-05"]),

  // HR
  "HR-DREQ-003":   Object.freeze(["TA-03"]),
  "HR-DREQ-004":   Object.freeze(["RM-02"]),

  // Quality
  "QUA-DREQ-001":  Object.freeze(["MF-06"]),
  "QUA-DREQ-002":  Object.freeze(["MF-06"]),
  "QUA-DREQ-003":  Object.freeze(["MF-06"]),

  // Approvals
  "APR-DREQ-003":  Object.freeze(["TA-03"]),
  "APR-DREQ-004":  Object.freeze(["TA-03"]),
  "APR-DREQ-005":  Object.freeze(["TA-03"]),
  "APR-DREQ-006":  Object.freeze(["TA-03"]),
  "APR-DREQ-007":  Object.freeze(["TA-03"]),

  // Subscriptions
  "SUB-DREQ-003":  Object.freeze(["FC-01"]),
});

// ---------------------------------------------------------------------------
// Output factories
// ---------------------------------------------------------------------------

/**
 * Creates a single validation result record.
 *
 * @param {object} params
 * @param {string}   params.checkpoint_id
 * @param {string}   params.validation_source  - from checkpoint metadata
 * @param {boolean}  params.validation_pass    - true only for Pass status
 * @param {string}   params.validation_status  - VALIDATION_STATUS constant
 * @param {string[]} params.answer_refs        - question_ids found in discovery_answers
 * @param {string[]} params.missing_answer_refs - question_ids required but absent
 * @returns {{ checkpoint_id, validation_source, validation_pass,
 *             validation_status, answer_refs, missing_answer_refs }}
 */
export function createValidationRecord({
  checkpoint_id = null,
  validation_source = null,
  validation_pass = false,
  validation_status = null,
  answer_refs = [],
  missing_answer_refs = [],
} = {}) {
  return {
    checkpoint_id,
    validation_source,
    validation_pass,
    validation_status,
    answer_refs: Array.isArray(answer_refs) ? [...answer_refs] : [],
    missing_answer_refs: Array.isArray(missing_answer_refs) ? [...missing_answer_refs] : [],
  };
}

/**
 * Creates the validated_checkpoints container returned by computeValidation().
 *
 * @param {object} params
 * @param {Array}  params.records
 * @param {string} params.engine_version
 * @param {string} params.validated_at - ISO 8601 timestamp
 * @returns {{ records, engine_version, validated_at }}
 */
export function createValidationResult({
  records = [],
  engine_version = null,
  validated_at = null,
} = {}) {
  return {
    records: Array.isArray(records) ? records : [],
    engine_version: engine_version ?? null,
    validated_at: validated_at ?? null,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if the given question_id has a non-null value in answers.
 */
function hasAnswer(discoveryAnswers, questionId) {
  return (
    discoveryAnswers !== null &&
    discoveryAnswers !== undefined &&
    discoveryAnswers.answers !== null &&
    discoveryAnswers.answers !== undefined &&
    Object.prototype.hasOwnProperty.call(discoveryAnswers.answers, questionId) &&
    discoveryAnswers.answers[questionId] !== null &&
    discoveryAnswers.answers[questionId] !== undefined
  );
}

/**
 * Evaluates the user-input portion of validation for a checkpoint.
 *
 * Returns an object with:
 *   { userAnswersOk, answer_refs, missing_answer_refs }
 *
 * userAnswersOk is true only when at least one required question_id is defined
 * AND all required question_ids are present in discoveryAnswers.
 */
function evaluateUserAnswers(checkpointId, discoveryAnswers) {
  const requiredIds = VALIDATION_REQUIRED_ANSWERS[checkpointId] ?? [];

  // No required answers defined: no discovery answer confirms this checkpoint.
  if (requiredIds.length === 0) {
    return { userAnswersOk: false, answer_refs: [], missing_answer_refs: [] };
  }

  const answer_refs = [];
  const missing_answer_refs = [];

  for (const qId of requiredIds) {
    if (hasAnswer(discoveryAnswers, qId)) {
      answer_refs.push(qId);
    } else {
      missing_answer_refs.push(qId);
    }
  }

  return {
    userAnswersOk: missing_answer_refs.length === 0,
    answer_refs,
    missing_answer_refs,
  };
}

// ---------------------------------------------------------------------------
// Per-checkpoint first-pass validation
// ---------------------------------------------------------------------------

function validateOneCheckpoint(checkpoint, discoveryAnswers) {
  const { checkpoint_id, validation_source } = checkpoint;

  // R3: System_Detectable passes first-pass unconditionally.
  if (validation_source === "System_Detectable") {
    return createValidationRecord({
      checkpoint_id,
      validation_source,
      validation_pass: true,
      validation_status: VALIDATION_STATUS.PASS,
      answer_refs: [],
      missing_answer_refs: [],
    });
  }

  // R4: User_Confirmed — must have all required discovery answers.
  if (validation_source === "User_Confirmed") {
    const { userAnswersOk, answer_refs, missing_answer_refs } =
      evaluateUserAnswers(checkpoint_id, discoveryAnswers);

    if (userAnswersOk) {
      return createValidationRecord({
        checkpoint_id,
        validation_source,
        validation_pass: true,
        validation_status: VALIDATION_STATUS.PASS,
        answer_refs,
        missing_answer_refs: [],
      });
    }

    return createValidationRecord({
      checkpoint_id,
      validation_source,
      validation_pass: false,
      validation_status: VALIDATION_STATUS.PENDING_USER_INPUT,
      answer_refs,
      missing_answer_refs,
    });
  }

  // R5: Both — user answers checked first; system check always pending on first pass.
  if (validation_source === "Both") {
    const { userAnswersOk, answer_refs, missing_answer_refs } =
      evaluateUserAnswers(checkpoint_id, discoveryAnswers);

    if (!userAnswersOk) {
      // For unconditional Both checkpoints (no mapped discovery questions),
      // confirmed_by satisfies the user-input requirement when present.
      const requiredIds = VALIDATION_REQUIRED_ANSWERS[checkpoint_id] ?? [];
      if (requiredIds.length === 0) {
        const confirmedBy = discoveryAnswers.confirmed_by;
        const isConfirmed = typeof confirmedBy === "string" && confirmedBy.trim() !== "";
        if (isConfirmed) {
          return createValidationRecord({
            checkpoint_id,
            validation_source,
            validation_pass: false,
            validation_status: VALIDATION_STATUS.PENDING_SYSTEM_CHECK,
            answer_refs: [],
            missing_answer_refs: [],
          });
        }
      }
      return createValidationRecord({
        checkpoint_id,
        validation_source,
        validation_pass: false,
        validation_status: VALIDATION_STATUS.PENDING_USER_INPUT,
        answer_refs,
        missing_answer_refs,
      });
    }

    // User answers present; system check is still required on first pass.
    return createValidationRecord({
      checkpoint_id,
      validation_source,
      validation_pass: false,
      validation_status: VALIDATION_STATUS.PENDING_SYSTEM_CHECK,
      answer_refs,
      missing_answer_refs: [],
    });
  }

  // Unknown validation_source: conservative non-passing.
  return createValidationRecord({
    checkpoint_id,
    validation_source,
    validation_pass: false,
    validation_status: VALIDATION_STATUS.PENDING_USER_INPUT,
    answer_refs: [],
    missing_answer_refs: [],
  });
}

// ---------------------------------------------------------------------------
// Main export: computeValidation
// ---------------------------------------------------------------------------

/**
 * Runs first-pass validation over an array of checkpoint records.
 *
 * Does NOT evaluate dependencies, blockers, readiness, deferments,
 * previews, or execution candidates.
 *
 * @param {Array}  checkpoints      - array of checkpoint records from CheckpointEngine
 * @param {object} discoveryAnswers - discovery_answers object from persisted state
 * @returns {{ records: Array, engine_version: string, validated_at: string }}
 */
export function computeValidation(checkpoints, discoveryAnswers) {
  if (!Array.isArray(checkpoints)) {
    throw new Error("computeValidation: checkpoints must be an array.");
  }
  if (discoveryAnswers === null || typeof discoveryAnswers !== "object") {
    throw new Error("computeValidation: discoveryAnswers must be an object.");
  }

  const records = checkpoints.map((cp) =>
    validateOneCheckpoint(cp, discoveryAnswers)
  );

  return createValidationResult({
    records,
    engine_version: VALIDATION_ENGINE_VERSION,
    validated_at: new Date().toISOString(),
  });
}
