// ---------------------------------------------------------------------------
// Checkpoint Engine — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Converts activated_domains + discovery_answers into the persisted portion
//   of the checkpoints array. Each generated record is the minimum governed
//   set — identity, classification, validation source, initial status,
//   execution relevance, safety class, and cross-domain dependency wiring.
//
// Governing constraints:
//   - specs/checkpoint_engine.md (primary authority)
//   - specs/runtime_state_contract.md §1.5 (checkpoints persisted fields)
//   - specs/discovery_question_framework.md (question-answer definitions)
//   - docs/03_Authority_Order.md
//
// Hard rules (mirrors domain-activation-engine.js pattern):
//   R1  Every checkpoint traces to a domain_id. No orphan checkpoints.
//   R2  Every conditional checkpoint traces to a specific question_id.
//       Missing answer → checkpoint NOT generated.
//   R3  No computed fields emitted (blocker_flag, blocked_reason,
//       dependencies_met, all_evidence_provided).
//   R4  No status assignment beyond the initial "Not_Started".
//   R5  Foundation, users_roles, master_data are unconditionally activated;
//       their checkpoints are always generated.
//   R6  Dependencies are stored as arrays of checkpoint_id strings only.
//       They are NOT evaluated at generation time.
//   R7  Phantom dependency removal: if a conditional checkpoint referenced in
//       a dependencies array was not generated, remove it from that array
//       (Part 5, Rule 2 of checkpoint_engine.md).
//   R8  Output shape matches createCheckpoints() / createCheckpointRecord()
//       defined in this file — persisted fields only per §3.2.
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `checkpoint-engine: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

// ---------------------------------------------------------------------------
// Engine version — increment on any rule change
// ---------------------------------------------------------------------------

export const CHECKPOINT_ENGINE_VERSION = "1.0.0";

// ---------------------------------------------------------------------------
// Output contract factories
// These define the exact shape emitted by this engine.
// createCheckpointRecord() — one checkpoint record (persisted fields only,
//   matching the 10 governed fields set at generation time per task spec).
// createCheckpoints() — the container returned by computeCheckpoints().
// ---------------------------------------------------------------------------

/**
 * Creates a single checkpoint record with exactly the 10 persisted fields
 * set at generation time by this engine.
 *
 * Field names match runtime-state-contract.js createCheckpoint() persisted
 * key registry exactly. "domain" (not "domain_id") per §1.5 of the contract.
 *
 * preview_required is derived deterministically from execution_relevance per
 * checkpoint_engine.md §3.2: true when Executable, false otherwise.
 *
 * @param {object} params
 * @param {string} params.checkpoint_id
 * @param {string} params.domain           - domain_id value (field named "domain" per contract)
 * @param {string} params.checkpoint_class
 * @param {string} params.validation_source
 * @param {string} params.execution_relevance
 * @param {string} params.safety_class
 * @param {string[]} params.dependencies   - array of checkpoint_id strings, not evaluated
 * @param {string|null} params.downstream_impact_summary - optional summary string, null if not provided
 * @returns {{ checkpoint_id: string, domain: string, checkpoint_class: string,
 *             validation_source: string, status: string, execution_relevance: string,
 *             safety_class: string, dependencies: string[],
 *             preview_required: boolean, downstream_impact_summary: string|null }}
 */
export function createCheckpointRecord({
  checkpoint_id,
  domain,
  checkpoint_class,
  validation_source,
  execution_relevance,
  safety_class,
  dependencies = [],
  downstream_impact_summary = null,
} = {}) {
  return {
    checkpoint_id: checkpoint_id ?? null,
    domain: domain ?? null,
    checkpoint_class: checkpoint_class ?? null,
    validation_source: validation_source ?? null,
    status: "Not_Started",
    execution_relevance: execution_relevance ?? null,
    safety_class: safety_class ?? null,
    dependencies: Array.isArray(dependencies) ? [...dependencies] : [],
    preview_required: execution_relevance === "Executable",
    downstream_impact_summary: downstream_impact_summary ?? null,
  };
}

/**
 * Creates the container returned by computeCheckpoints().
 *
 * @param {object} params
 * @param {Array}  params.records
 * @param {string} params.engine_version
 * @param {string} params.generated_at   - ISO 8601 timestamp
 * @returns {{ records: Array, engine_version: string, generated_at: string }}
 */
export function createCheckpoints({ records = [], engine_version = null, generated_at = null } = {}) {
  return {
    records: Array.isArray(records) ? records : [],
    engine_version: engine_version ?? null,
    generated_at: generated_at ?? null,
  };
}

// ---------------------------------------------------------------------------
// Checkpoint ID constants — canonical set, stable for the life of a project
// ---------------------------------------------------------------------------

export const CHECKPOINT_IDS = Object.freeze({
  // Foundation
  FND_FOUND_001: "FND-FOUND-001",
  FND_FOUND_002: "FND-FOUND-002",
  FND_FOUND_003: "FND-FOUND-003",
  FND_FOUND_004: "FND-FOUND-004",
  FND_FOUND_005: "FND-FOUND-005",
  FND_FOUND_006: "FND-FOUND-006", // conditional: BM-02 = Yes
  FND_DREQ_001: "FND-DREQ-001",
  FND_DREQ_002: "FND-DREQ-002",
  FND_DREQ_003: "FND-DREQ-003", // conditional: BM-04 = Yes
  FND_DREQ_004: "FND-DREQ-004", // conditional: FC-04 = Yes

  // Users / Roles / Security
  USR_FOUND_001: "USR-FOUND-001",
  USR_FOUND_002: "USR-FOUND-002",
  USR_DREQ_001: "USR-DREQ-001",
  USR_DREQ_002: "USR-DREQ-002",
  USR_DREQ_003: "USR-DREQ-003",
  USR_DREQ_004: "USR-DREQ-004", // conditional: TA-02 = Yes
  USR_DREQ_005: "USR-DREQ-005", // conditional: BM-02 = Yes
  USR_DREQ_006: "USR-DREQ-006", // conditional: BM-05 > 50
  USR_DREQ_007: "USR-DREQ-007", // conditional: SC-02 = Yes
  USR_DREQ_008: "USR-DREQ-008", // conditional: PI-02 != No approval
  USR_DREQ_009: "USR-DREQ-009", // conditional: SC-04 = Manager approval
  USR_DREQ_010: "USR-DREQ-010", // conditional: MF-05 = Yes
  USR_DREQ_011: "USR-DREQ-011", // conditional: FC-03 = Yes

  // Master Data
  MAS_FOUND_001: "MAS-FOUND-001",
  MAS_FOUND_002: "MAS-FOUND-002",
  MAS_DREQ_001: "MAS-DREQ-001",
  MAS_DREQ_002: "MAS-DREQ-002",
  MAS_DREQ_003: "MAS-DREQ-003",
  MAS_DREQ_004: "MAS-DREQ-004",
  MAS_DREQ_005: "MAS-DREQ-005", // conditional: OP-01 = Yes
  MAS_DREQ_006: "MAS-DREQ-006", // conditional: MF-01 = Yes
  MAS_DREQ_007: "MAS-DREQ-007", // conditional: PI-04 != None

  // CRM
  CRM_FOUND_001: "CRM-FOUND-001",
  CRM_FOUND_002: "CRM-FOUND-002",
  CRM_DREQ_001: "CRM-DREQ-001",
  CRM_DREQ_002: "CRM-DREQ-002",
  CRM_DREQ_003: "CRM-DREQ-003",
  CRM_DREQ_004: "CRM-DREQ-004", // conditional: TA-02 = Yes
  CRM_REC_001: "CRM-REC-001",

  // Sales
  SAL_FOUND_001: "SAL-FOUND-001",
  SAL_FOUND_002: "SAL-FOUND-002",
  SAL_DREQ_001: "SAL-DREQ-001",
  SAL_DREQ_002: "SAL-DREQ-002",
  SAL_DREQ_003: "SAL-DREQ-003", // conditional: SC-02 = Yes
  SAL_DREQ_004: "SAL-DREQ-004", // conditional: SC-03 = Yes
  SAL_DREQ_005: "SAL-DREQ-005", // conditional: SC-04 = Manager approval
  SAL_DREQ_006: "SAL-DREQ-006", // conditional: FC-06 = Yes
  SAL_DREQ_007: "SAL-DREQ-007", // conditional: PI-05 = Yes
  SAL_GL_001: "SAL-GL-001",

  // Purchase
  PUR_FOUND_001: "PUR-FOUND-001",
  PUR_DREQ_001: "PUR-DREQ-001",
  PUR_DREQ_002: "PUR-DREQ-002",
  PUR_DREQ_003: "PUR-DREQ-003", // conditional: PI-02 = Threshold
  PUR_DREQ_004: "PUR-DREQ-004", // conditional: PI-02 = All orders
  PUR_DREQ_005: "PUR-DREQ-005", // conditional: FC-03 = Yes
  PUR_DREQ_006: "PUR-DREQ-006", // conditional: MF-04 = Yes
  PUR_DREQ_007: "PUR-DREQ-007", // conditional: PI-05 = Yes
  PUR_GL_001: "PUR-GL-001",

  // Inventory
  INV_FOUND_001: "INV-FOUND-001",
  INV_FOUND_002: "INV-FOUND-002",
  INV_FOUND_003: "INV-FOUND-003",
  INV_DREQ_001: "INV-DREQ-001",
  INV_DREQ_002: "INV-DREQ-002",
  INV_DREQ_003: "INV-DREQ-003", // conditional: OP-02 >= 2
  INV_DREQ_004: "INV-DREQ-004", // conditional: PI-03 = 2 steps
  INV_DREQ_005: "INV-DREQ-005", // conditional: PI-03 = 3 steps
  INV_DREQ_006: "INV-DREQ-006", // conditional: PI-05 = Yes
  INV_DREQ_007: "INV-DREQ-007", // conditional: FC-02 = AVCO or FIFO
  INV_DREQ_008: "INV-DREQ-008", // conditional: MF-01 = Yes
  INV_DREQ_009: "INV-DREQ-009", // conditional: RM-04 = Yes
  INV_GL_001: "INV-GL-001",
  INV_GL_002: "INV-GL-002",

  // Manufacturing
  MRP_FOUND_001: "MRP-FOUND-001",
  MRP_DREQ_001: "MRP-DREQ-001",
  MRP_DREQ_002: "MRP-DREQ-002",
  MRP_DREQ_003: "MRP-DREQ-003", // conditional: MF-02 = Multi-level
  MRP_DREQ_004: "MRP-DREQ-004", // conditional: MF-02 = Phantom
  MRP_DREQ_005: "MRP-DREQ-005", // conditional: MF-03 = Yes
  MRP_DREQ_006: "MRP-DREQ-006", // conditional: MF-03 = Yes
  MRP_DREQ_007: "MRP-DREQ-007", // conditional: MF-04 = Yes
  MRP_DREQ_008: "MRP-DREQ-008", // conditional: FC-01 = Full accounting AND MF-02 = Multi-level
  MRP_GL_001: "MRP-GL-001",
  MRP_GL_002: "MRP-GL-002",

  // PLM
  PLM_FOUND_001: "PLM-FOUND-001",
  PLM_DREQ_001: "PLM-DREQ-001",
  PLM_DREQ_002: "PLM-DREQ-002",
  PLM_REC_001: "PLM-REC-001",

  // Accounting
  ACCT_FOUND_001: "ACCT-FOUND-001",
  ACCT_FOUND_002: "ACCT-FOUND-002",
  ACCT_FOUND_003: "ACCT-FOUND-003",
  ACCT_DREQ_001: "ACCT-DREQ-001",
  ACCT_DREQ_002: "ACCT-DREQ-002",
  ACCT_DREQ_003: "ACCT-DREQ-003",
  ACCT_DREQ_004: "ACCT-DREQ-004",
  ACCT_DREQ_005: "ACCT-DREQ-005", // conditional: BM-04 = Yes
  ACCT_DREQ_006: "ACCT-DREQ-006", // conditional: FC-02 = AVCO or FIFO
  ACCT_DREQ_007: "ACCT-DREQ-007", // conditional: FC-02 = Standard Price
  ACCT_REC_001: "ACCT-REC-001",   // conditional: FC-05 = Yes
  ACCT_REC_002: "ACCT-REC-002",   // conditional: FC-01 = Full accounting
  ACCT_GL_001: "ACCT-GL-001",
  ACCT_GL_002: "ACCT-GL-002",
  ACCT_GL_003: "ACCT-GL-003",

  // POS
  POS_FOUND_001: "POS-FOUND-001",
  POS_DREQ_001: "POS-DREQ-001",
  POS_DREQ_002: "POS-DREQ-002",
  POS_DREQ_003: "POS-DREQ-003",
  POS_DREQ_004: "POS-DREQ-004", // conditional: FC-01 = Full accounting
  POS_DREQ_005: "POS-DREQ-005", // conditional: OP-01 = Yes
  POS_GL_001: "POS-GL-001",

  // Website / eCommerce
  WEB_FOUND_001: "WEB-FOUND-001",
  WEB_DREQ_001: "WEB-DREQ-001",
  WEB_DREQ_002: "WEB-DREQ-002",
  WEB_DREQ_003: "WEB-DREQ-003",
  WEB_DREQ_004: "WEB-DREQ-004", // conditional: OP-01 = Yes
  WEB_DREQ_005: "WEB-DREQ-005", // conditional: SC-03 = Yes
  WEB_GL_001: "WEB-GL-001",

  // Projects
  PRJ_FOUND_001: "PRJ-FOUND-001",
  PRJ_DREQ_001: "PRJ-DREQ-001",
  PRJ_DREQ_002: "PRJ-DREQ-002",
  PRJ_DREQ_003: "PRJ-DREQ-003", // conditional: RM-02 = Yes
  PRJ_DREQ_004: "PRJ-DREQ-004", // conditional: FC-05 = Yes
  PRJ_GL_001: "PRJ-GL-001",

  // HR
  HR_FOUND_001: "HR-FOUND-001",
  HR_DREQ_001: "HR-DREQ-001",
  HR_DREQ_002: "HR-DREQ-002",
  HR_DREQ_003: "HR-DREQ-003", // conditional: TA-03 includes HR leave
  HR_DREQ_004: "HR-DREQ-004", // conditional: RM-02 = Yes

  // Quality
  QUA_FOUND_001: "QUA-FOUND-001",
  QUA_DREQ_001: "QUA-DREQ-001", // conditional: MF-06 includes Receipt
  QUA_DREQ_002: "QUA-DREQ-002", // conditional: MF-06 includes In-process
  QUA_DREQ_003: "QUA-DREQ-003", // conditional: MF-06 includes Finished goods

  // Maintenance
  MNT_FOUND_001: "MNT-FOUND-001",
  MNT_DREQ_001: "MNT-DREQ-001",
  MNT_DREQ_002: "MNT-DREQ-002",
  MNT_REC_001: "MNT-REC-001",

  // Repairs
  REP_FOUND_001: "REP-FOUND-001",
  REP_DREQ_001: "REP-DREQ-001",
  REP_DREQ_002: "REP-DREQ-002",
  REP_REC_001: "REP-REC-001",

  // Documents
  DOC_FOUND_001: "DOC-FOUND-001",
  DOC_DREQ_001: "DOC-DREQ-001",
  DOC_REC_001: "DOC-REC-001",

  // Sign
  SGN_FOUND_001: "SGN-FOUND-001",
  SGN_DREQ_001: "SGN-DREQ-001",
  SGN_DREQ_002: "SGN-DREQ-002",

  // Approvals
  APR_FOUND_001: "APR-FOUND-001",
  APR_DREQ_001: "APR-DREQ-001",
  APR_DREQ_002: "APR-DREQ-002",
  APR_DREQ_003: "APR-DREQ-003", // conditional: TA-03 includes Inventory adjustments
  APR_DREQ_004: "APR-DREQ-004", // conditional: TA-03 includes Expenses
  APR_DREQ_005: "APR-DREQ-005", // conditional: TA-03 includes Manufacturing order
  APR_DREQ_006: "APR-DREQ-006", // conditional: TA-03 includes HR leave
  APR_DREQ_007: "APR-DREQ-007", // conditional: TA-03 includes Document signing

  // Subscriptions
  SUB_FOUND_001: "SUB-FOUND-001",
  SUB_DREQ_001: "SUB-DREQ-001",
  SUB_DREQ_002: "SUB-DREQ-002",
  SUB_DREQ_003: "SUB-DREQ-003", // conditional: FC-01 = Full accounting
  SUB_GL_001: "SUB-GL-001",

  // Rental
  RNT_FOUND_001: "RNT-FOUND-001",
  RNT_DREQ_001: "RNT-DREQ-001",
  RNT_DREQ_002: "RNT-DREQ-002",
  RNT_GL_001: "RNT-GL-001",

  // Field Service
  FSV_FOUND_001: "FSV-FOUND-001",
  FSV_DREQ_001: "FSV-DREQ-001",
  FSV_DREQ_002: "FSV-DREQ-002",
  FSV_DREQ_003: "FSV-DREQ-003", // conditional: OP-01 = Yes
  FSV_GL_001: "FSV-GL-001",
});

// ---------------------------------------------------------------------------
// Answer accessors — identical pattern to domain-activation-engine.js
// ---------------------------------------------------------------------------

function getAnswer(answers, questionId) {
  if (answers === null || typeof answers !== "object") return undefined;
  return answers[questionId];
}

function isAnswered(answers, questionId) {
  const answer = getAnswer(answers, questionId);
  return answer !== undefined && answer !== null;
}

function answerEquals(answers, questionId, value) {
  const answer = getAnswer(answers, questionId);
  return answer === value;
}

function multiSelectIncludes(answers, questionId, value) {
  const answer = getAnswer(answers, questionId);
  if (!Array.isArray(answer)) return false;
  return answer.includes(value);
}

function getNumericAnswer(answers, questionId) {
  const answer = getAnswer(answers, questionId);
  if (answer === undefined || answer === null) return NaN;
  return Number(answer);
}

// ---------------------------------------------------------------------------
// Phantom dependency pruning (Part 5, Rule 2)
// Removes any dependency reference that was not generated in this run.
// ---------------------------------------------------------------------------

function prunePhantomDependencies(dependencies, generatedIds) {
  if (!Array.isArray(dependencies)) return [];
  return dependencies.filter((id) => generatedIds.has(id));
}

// ---------------------------------------------------------------------------
// Per-domain checkpoint generator functions
// Each function receives (answers, generatedIds) and returns an array of
// createCheckpointRecord() objects. generatedIds is a Set that grows as
// records are accumulated; phantom pruning runs after all domains are
// generated (two-pass for cross-domain deps).
//
// Rule: only generate a checkpoint when its domain is activated === true.
// Rule: only generate a conditional checkpoint when its trigger answer is
//       present and matches the required value.
// ---------------------------------------------------------------------------

function generateFoundationCheckpoints(answers) {
  const D = "foundation";
  const C = CHECKPOINT_IDS;

  const records = [];

  // Unconditional checkpoints
  records.push(createCheckpointRecord({
    checkpoint_id: C.FND_FOUND_001,
    domain: D,
    checkpoint_class: "Foundational",
    validation_source: "Both",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.FND_FOUND_002,
    domain: D,
    checkpoint_class: "Foundational",
    validation_source: "Both",
    execution_relevance: "Executable",
    safety_class: "Conditional",
    dependencies: [C.FND_FOUND_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.FND_FOUND_003,
    domain: D,
    checkpoint_class: "Foundational",
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
    dependencies: [C.FND_FOUND_001],
  }));  // DL-016: reclassified from Both/Executable/Blocked — no truthful governed write; FND-DREQ-002 completed the actual currency write; confirm route only

  records.push(createCheckpointRecord({
    checkpoint_id: C.FND_FOUND_004,
    domain: D,
    checkpoint_class: "Foundational",
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
    dependencies: [C.FND_FOUND_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.FND_FOUND_005,
    domain: D,
    checkpoint_class: "Foundational",
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
    dependencies: [C.FND_FOUND_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.FND_DREQ_001,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "Both",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [C.FND_FOUND_002],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.FND_DREQ_002,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "Both",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [C.FND_FOUND_002, C.FND_FOUND_005],
  }));

  // Conditional: BM-02 = Yes
  if (isAnswered(answers, "BM-02") && (answerEquals(answers, "BM-02", true) || answerEquals(answers, "BM-02", "Yes"))) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.FND_FOUND_006,
      domain: D,
      checkpoint_class: "Foundational",
      validation_source: "User_Confirmed",
      execution_relevance: "Informational",
      safety_class: "Not_Applicable",
      dependencies: [C.FND_FOUND_005],
    }));
  }

  // Conditional: BM-04 = Yes
  if (isAnswered(answers, "BM-04") && (answerEquals(answers, "BM-04", true) || answerEquals(answers, "BM-04", "Yes"))) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.FND_DREQ_003,
      domain: D,
      checkpoint_class: "Domain_Required",
      validation_source: "Both",
      execution_relevance: "Executable",
      safety_class: "Conditional",
      dependencies: [C.FND_DREQ_002],
    }));
  }

  // Conditional: FC-04 = Yes
  if (isAnswered(answers, "FC-04") && (answerEquals(answers, "FC-04", true) || answerEquals(answers, "FC-04", "Yes"))) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.FND_DREQ_004,
      domain: D,
      checkpoint_class: "Domain_Required",
      validation_source: "User_Confirmed",
      execution_relevance: "Informational",
      safety_class: "Not_Applicable",
      dependencies: [C.FND_FOUND_004],
    }));
  }

  return records;
}

function generateUsersRolesCheckpoints(answers) {
  const D = "users_roles";
  const C = CHECKPOINT_IDS;

  const records = [];

  // Unconditional checkpoints
  records.push(createCheckpointRecord({
    checkpoint_id: C.USR_FOUND_001,
    domain: D,
    checkpoint_class: "Foundational",
    validation_source: "Both",
    execution_relevance: "Executable",
    safety_class: "Conditional",
    dependencies: [C.FND_DREQ_002],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.USR_FOUND_002,
    domain: D,
    checkpoint_class: "Foundational",
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
    dependencies: [C.FND_FOUND_005],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.USR_DREQ_001,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "Both",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [C.USR_FOUND_001, C.USR_FOUND_002],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.USR_DREQ_002,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "Both",
    execution_relevance: "Executable",
    safety_class: "Conditional",
    dependencies: [C.USR_DREQ_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.USR_DREQ_003,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
    dependencies: [C.USR_FOUND_002],
  }));

  // Conditional: TA-02 = Yes
  if (isAnswered(answers, "TA-02") && (answerEquals(answers, "TA-02", true) || answerEquals(answers, "TA-02", "Yes"))) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.USR_DREQ_004,
      domain: D,
      checkpoint_class: "Domain_Required",
      validation_source: "Both",
      execution_relevance: "Executable",
      safety_class: "Conditional",
      dependencies: [C.USR_DREQ_002],
    }));
  }

  // Conditional: BM-02 = Yes
  if (isAnswered(answers, "BM-02") && (answerEquals(answers, "BM-02", true) || answerEquals(answers, "BM-02", "Yes"))) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.USR_DREQ_005,
      domain: D,
      checkpoint_class: "Domain_Required",
      validation_source: "Both",
      execution_relevance: "Executable",
      safety_class: "Conditional",
      dependencies: [C.USR_FOUND_002],
    }));
  }

  // Conditional: BM-05 > 50
  const bm05 = getNumericAnswer(answers, "BM-05");
  if (!isNaN(bm05) && bm05 > 50) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.USR_DREQ_006,
      domain: D,
      checkpoint_class: "Domain_Required",
      validation_source: "User_Confirmed",
      execution_relevance: "Informational",
      safety_class: "Not_Applicable",
      dependencies: [C.USR_FOUND_002],
    }));
  }

  // Conditional: SC-02 = Yes
  if (isAnswered(answers, "SC-02") && (answerEquals(answers, "SC-02", true) || answerEquals(answers, "SC-02", "Yes"))) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.USR_DREQ_007,
      domain: D,
      checkpoint_class: "Domain_Required",
      validation_source: "User_Confirmed",
      execution_relevance: "Informational",
      safety_class: "Not_Applicable",
      dependencies: [C.USR_DREQ_003],
    }));
  }

  // Conditional: PI-02 != No approval
  if (isAnswered(answers, "PI-02") && !answerEquals(answers, "PI-02", "No approval")) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.USR_DREQ_008,
      domain: D,
      checkpoint_class: "Domain_Required",
      validation_source: "User_Confirmed",
      execution_relevance: "Informational",
      safety_class: "Not_Applicable",
      dependencies: [C.USR_DREQ_003],
    }));
  }

  // Conditional: SC-04 = Manager approval
  if (isAnswered(answers, "SC-04") && answerEquals(answers, "SC-04", "Manager approval")) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.USR_DREQ_009,
      domain: D,
      checkpoint_class: "Domain_Required",
      validation_source: "User_Confirmed",
      execution_relevance: "Informational",
      safety_class: "Not_Applicable",
      dependencies: [C.USR_DREQ_003],
    }));
  }

  // Conditional: MF-05 = Yes
  if (isAnswered(answers, "MF-05") && (answerEquals(answers, "MF-05", true) || answerEquals(answers, "MF-05", "Yes"))) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.USR_DREQ_010,
      domain: D,
      checkpoint_class: "Domain_Required",
      validation_source: "User_Confirmed",
      execution_relevance: "Informational",
      safety_class: "Not_Applicable",
      dependencies: [C.USR_DREQ_003],
    }));
  }

  // Conditional: FC-03 = Yes
  if (isAnswered(answers, "FC-03") && (answerEquals(answers, "FC-03", true) || answerEquals(answers, "FC-03", "Yes"))) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.USR_DREQ_011,
      domain: D,
      checkpoint_class: "Domain_Required",
      validation_source: "User_Confirmed",
      execution_relevance: "Informational",
      safety_class: "Not_Applicable",
      dependencies: [C.USR_DREQ_003],
    }));
  }

  return records;
}

function generateMasterDataCheckpoints(answers) {
  const D = "master_data";
  const C = CHECKPOINT_IDS;

  const records = [];

  // Unconditional checkpoints
  records.push(createCheckpointRecord({
    checkpoint_id: C.MAS_FOUND_001,
    domain: D,
    checkpoint_class: "Foundational",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [C.FND_DREQ_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.MAS_FOUND_002,
    domain: D,
    checkpoint_class: "Foundational",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [C.FND_FOUND_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.MAS_DREQ_001,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
    dependencies: [C.MAS_FOUND_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.MAS_DREQ_002,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
    dependencies: [C.MAS_FOUND_002],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.MAS_DREQ_003,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
    dependencies: [C.MAS_FOUND_002],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.MAS_DREQ_004,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
    dependencies: [C.USR_FOUND_002],
  }));

  // Conditional: OP-01 = Yes
  // Reclassified per DL-026: Both/Executable/Safe → User_Confirmed/Informational/Not_Applicable.
  // product.category has 300 records from localization on test236. Assembler intended_changes: null
  // (R4 honest-null). Same DL-013 pattern: Executable tag with null intended_changes and no
  // discoverable write target → reclassify to Informational.
  if (isAnswered(answers, "OP-01") && (answerEquals(answers, "OP-01", true) || answerEquals(answers, "OP-01", "Yes"))) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.MAS_DREQ_005,
      domain: D,
      checkpoint_class: "Domain_Required",
      validation_source: "User_Confirmed",
      execution_relevance: "Informational",
      safety_class: "Not_Applicable",
      dependencies: [C.MAS_FOUND_002],
    }));
  }

  // Conditional: MF-01 = Yes
  // Reclassified per DL-030: Both/Executable/Safe → User_Confirmed/Informational/Not_Applicable.
  // master-data assembler intended_changes: null (R4 honest-null). Same DL-013/026 pattern.
  if (isAnswered(answers, "MF-01") && (answerEquals(answers, "MF-01", true) || answerEquals(answers, "MF-01", "Yes"))) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.MAS_DREQ_006,
      domain: D,
      checkpoint_class: "Domain_Required",
      validation_source: "User_Confirmed",
      execution_relevance: "Informational",
      safety_class: "Not_Applicable",
      dependencies: [C.MAS_DREQ_001],
    }));
  }

  // Conditional: PI-04 != None
  if (isAnswered(answers, "PI-04") && !answerEquals(answers, "PI-04", "None")) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.MAS_DREQ_007,
      domain: D,
      checkpoint_class: "Domain_Required",
      validation_source: "Both",
      execution_relevance: "Executable",
      safety_class: "Conditional",
      dependencies: [C.MAS_DREQ_001],
    }));
  }

  return records;
}

function generateCRMCheckpoints(answers) {
  const D = "crm";
  const C = CHECKPOINT_IDS;

  const records = [];

  records.push(createCheckpointRecord({
    checkpoint_id: C.CRM_FOUND_001,
    domain: D,
    checkpoint_class: "Foundational",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [C.MAS_FOUND_002],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.CRM_FOUND_002,
    domain: D,
    checkpoint_class: "Foundational",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [C.USR_DREQ_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.CRM_DREQ_001,
    domain: D,
    checkpoint_class: "Domain_Required",
    // DL-031 batch: Both/Executable → User_Confirmed/Informational/Not_Applicable (R4 honest-null).
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
    dependencies: [C.CRM_FOUND_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.CRM_DREQ_002,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [C.CRM_FOUND_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.CRM_DREQ_003,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [C.CRM_FOUND_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.CRM_REC_001,
    domain: D,
    checkpoint_class: "Recommended",
    // DL-031 batch: Both/Executable → User_Confirmed/Informational/Not_Applicable (R4 honest-null).
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
    dependencies: [C.CRM_FOUND_002, C.CRM_DREQ_001],
  }));

  // Conditional: TA-02 = Yes
  if (isAnswered(answers, "TA-02") && (answerEquals(answers, "TA-02", true) || answerEquals(answers, "TA-02", "Yes"))) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.CRM_DREQ_004,
      domain: D,
      checkpoint_class: "Domain_Required",
      validation_source: "Both",
      execution_relevance: "Executable",
      safety_class: "Conditional",
      dependencies: [C.CRM_FOUND_002],
    }));
  }

  return records;
}

function generateSalesCheckpoints(answers) {
  const D = "sales";
  const C = CHECKPOINT_IDS;

  const records = [];

  records.push(createCheckpointRecord({
    checkpoint_id: C.SAL_FOUND_001,
    domain: D,
    checkpoint_class: "Foundational",
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
    dependencies: [C.MAS_DREQ_001, C.MAS_DREQ_003],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.SAL_FOUND_002,
    domain: D,
    checkpoint_class: "Foundational",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [C.USR_DREQ_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.SAL_DREQ_001,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
    dependencies: [C.SAL_FOUND_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.SAL_DREQ_002,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [C.SAL_FOUND_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.SAL_GL_001,
    domain: D,
    checkpoint_class: "Go_Live",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Not_Applicable",
    dependencies: [C.SAL_DREQ_001, C.SAL_DREQ_002],
  }));

  // Conditional: SC-02 = Yes
  if (isAnswered(answers, "SC-02") && (answerEquals(answers, "SC-02", true) || answerEquals(answers, "SC-02", "Yes"))) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.SAL_DREQ_003,
      domain: D,
      checkpoint_class: "Domain_Required",
      // DL-031 batch: Both/Executable → User_Confirmed/Informational/Not_Applicable (R4 honest-null).
      validation_source: "User_Confirmed",
      execution_relevance: "Informational",
      safety_class: "Not_Applicable",
      dependencies: [C.USR_DREQ_007],
    }));
  }

  // Conditional: SC-03 = Yes
  if (isAnswered(answers, "SC-03") && (answerEquals(answers, "SC-03", true) || answerEquals(answers, "SC-03", "Yes"))) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.SAL_DREQ_004,
      domain: D,
      checkpoint_class: "Domain_Required",
      validation_source: "User_Confirmed",
      execution_relevance: "Executable",
      safety_class: "Conditional",
      dependencies: [C.SAL_DREQ_001],
    }));
  }

  // Conditional: SC-04 = Manager approval
  if (isAnswered(answers, "SC-04") && answerEquals(answers, "SC-04", "Manager approval")) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.SAL_DREQ_005,
      domain: D,
      checkpoint_class: "Domain_Required",
      validation_source: "Both",
      execution_relevance: "Executable",
      safety_class: "Conditional",
      dependencies: [C.USR_DREQ_009],
    }));
  }

  // Conditional: FC-06 = Yes
  if (isAnswered(answers, "FC-06") && (answerEquals(answers, "FC-06", true) || answerEquals(answers, "FC-06", "Yes"))) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.SAL_DREQ_006,
      domain: D,
      checkpoint_class: "Domain_Required",
      validation_source: "User_Confirmed",
      execution_relevance: "Executable",
      safety_class: "Conditional",
      dependencies: [C.ACCT_DREQ_004],
    }));
  }

  // Conditional: PI-05 = Yes
  if (isAnswered(answers, "PI-05") && (answerEquals(answers, "PI-05", true) || answerEquals(answers, "PI-05", "Yes"))) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.SAL_DREQ_007,
      domain: D,
      checkpoint_class: "Domain_Required",
      validation_source: "User_Confirmed",
      execution_relevance: "Executable",
      safety_class: "Conditional",
      dependencies: [C.SAL_DREQ_001],
    }));
  }

  return records;
}

function generatePurchaseCheckpoints(answers) {
  const D = "purchase";
  const C = CHECKPOINT_IDS;

  const records = [];

  records.push(createCheckpointRecord({
    checkpoint_id: C.PUR_FOUND_001,
    domain: D,
    checkpoint_class: "Foundational",
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
    dependencies: [C.MAS_DREQ_002],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.PUR_DREQ_001,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
    dependencies: [C.PUR_FOUND_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.PUR_DREQ_002,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [C.MAS_DREQ_002],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.PUR_GL_001,
    domain: D,
    checkpoint_class: "Go_Live",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Not_Applicable",
    dependencies: [C.PUR_DREQ_001, C.PUR_DREQ_002],
  }));

  // Conditional: PI-02 = Threshold
  if (isAnswered(answers, "PI-02") && answerEquals(answers, "PI-02", "Threshold")) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.PUR_DREQ_003,
      domain: D,
      checkpoint_class: "Domain_Required",
      validation_source: "Both",
      execution_relevance: "Executable",
      safety_class: "Conditional",
      dependencies: [C.USR_DREQ_008],
    }));
  }

  // Conditional: PI-02 = All orders
  if (isAnswered(answers, "PI-02") && answerEquals(answers, "PI-02", "All orders")) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.PUR_DREQ_004,
      domain: D,
      checkpoint_class: "Domain_Required",
      validation_source: "Both",
      execution_relevance: "Executable",
      safety_class: "Conditional",
      dependencies: [C.USR_DREQ_008],
    }));
  }

  // Conditional: FC-03 = Yes
  if (isAnswered(answers, "FC-03") && (answerEquals(answers, "FC-03", true) || answerEquals(answers, "FC-03", "Yes"))) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.PUR_DREQ_005,
      domain: D,
      checkpoint_class: "Domain_Required",
      validation_source: "Both",
      execution_relevance: "Executable",
      safety_class: "Conditional",
      dependencies: [C.ACCT_DREQ_003],
    }));
  }

  // Conditional: MF-04 = Yes
  if (isAnswered(answers, "MF-04") && (answerEquals(answers, "MF-04", true) || answerEquals(answers, "MF-04", "Yes"))) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.PUR_DREQ_006,
      domain: D,
      checkpoint_class: "Domain_Required",
      // DL-031 batch: Both/Executable → User_Confirmed/Informational/Not_Applicable (R4 honest-null).
      validation_source: "User_Confirmed",
      execution_relevance: "Informational",
      safety_class: "Not_Applicable",
      dependencies: [C.MRP_DREQ_007],
    }));
  }

  // Conditional: PI-05 = Yes
  if (isAnswered(answers, "PI-05") && (answerEquals(answers, "PI-05", true) || answerEquals(answers, "PI-05", "Yes"))) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.PUR_DREQ_007,
      domain: D,
      checkpoint_class: "Domain_Required",
      // DL-031 batch: Both/Executable → User_Confirmed/Informational/Not_Applicable (R4 honest-null).
      validation_source: "User_Confirmed",
      execution_relevance: "Informational",
      safety_class: "Not_Applicable",
      dependencies: [C.PUR_DREQ_001],
    }));
  }

  return records;
}

function generateInventoryCheckpoints(answers) {
  const D = "inventory";
  const C = CHECKPOINT_IDS;

  const records = [];

  records.push(createCheckpointRecord({
    checkpoint_id: C.INV_FOUND_001,
    domain: D,
    checkpoint_class: "Foundational",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [C.MAS_DREQ_005],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.INV_FOUND_002,
    domain: D,
    checkpoint_class: "Foundational",
    // DL-031 batch: Both/Executable → User_Confirmed/Informational/Not_Applicable (R4 honest-null).
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
    dependencies: [C.INV_FOUND_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.INV_FOUND_003,
    domain: D,
    checkpoint_class: "Foundational",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [C.INV_FOUND_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.INV_DREQ_001,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
    dependencies: [C.MAS_DREQ_001],
  }));

  // INV-DREQ-002: depends on ACCT-DREQ-003 only when FC-01 = Full accounting
  const inv002Deps = [];
  if (isAnswered(answers, "FC-01") && answerEquals(answers, "FC-01", "Full accounting")) {
    inv002Deps.push(C.ACCT_DREQ_003);
  }
  records.push(createCheckpointRecord({
    checkpoint_id: C.INV_DREQ_002,
    domain: D,
    checkpoint_class: "Domain_Required",
    // DL-031 batch: Both/Executable → User_Confirmed/Informational/Not_Applicable (R4 honest-null).
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
    dependencies: inv002Deps,
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.INV_GL_001,
    domain: D,
    checkpoint_class: "Go_Live",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Not_Applicable",
    dependencies: [C.INV_FOUND_003, C.INV_DREQ_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.INV_GL_002,
    domain: D,
    checkpoint_class: "Go_Live",
    // DL-031 batch: Both → User_Confirmed (None/Not_Applicable unchanged).
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Not_Applicable",
    dependencies: [C.INV_FOUND_002],
  }));

  // Conditional: OP-02 >= 2
  const op02 = getNumericAnswer(answers, "OP-02");
  if (!isNaN(op02) && op02 >= 2) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.INV_DREQ_003,
      domain: D,
      checkpoint_class: "Domain_Required",
      validation_source: "Both",
      execution_relevance: "Executable",
      safety_class: "Conditional",
      dependencies: [C.INV_FOUND_001],
    }));
  }

  // Conditional: PI-03 = 2 steps
  if (isAnswered(answers, "PI-03") && answerEquals(answers, "PI-03", "2 steps")) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.INV_DREQ_004,
      domain: D,
      checkpoint_class: "Domain_Required",
      validation_source: "Both",
      execution_relevance: "Executable",
      safety_class: "Conditional",
      dependencies: [C.INV_FOUND_003],
    }));
  }

  // Conditional: PI-03 = 3 steps
  if (isAnswered(answers, "PI-03") && answerEquals(answers, "PI-03", "3 steps")) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.INV_DREQ_005,
      domain: D,
      checkpoint_class: "Domain_Required",
      validation_source: "Both",
      execution_relevance: "Executable",
      safety_class: "Conditional",
      dependencies: [C.INV_FOUND_003],
    }));
  }

  // Conditional: PI-05 = Yes
  if (isAnswered(answers, "PI-05") && (answerEquals(answers, "PI-05", true) || answerEquals(answers, "PI-05", "Yes"))) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.INV_DREQ_006,
      domain: D,
      checkpoint_class: "Domain_Required",
      // DL-031 batch: Both/Executable → User_Confirmed/Informational/Not_Applicable (R4 honest-null).
      validation_source: "User_Confirmed",
      execution_relevance: "Informational",
      safety_class: "Not_Applicable",
      dependencies: [C.INV_FOUND_003],
    }));
  }

  // Conditional: FC-02 = AVCO or FIFO
  if (isAnswered(answers, "FC-02") && (answerEquals(answers, "FC-02", "AVCO") || answerEquals(answers, "FC-02", "FIFO"))) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.INV_DREQ_007,
      domain: D,
      checkpoint_class: "Domain_Required",
      validation_source: "Both",
      execution_relevance: "Executable",
      safety_class: "Conditional",
      dependencies: [C.ACCT_FOUND_002, C.ACCT_DREQ_003],
    }));
  }

  // Conditional: MF-01 = Yes
  if (isAnswered(answers, "MF-01") && (answerEquals(answers, "MF-01", true) || answerEquals(answers, "MF-01", "Yes"))) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.INV_DREQ_008,
      domain: D,
      checkpoint_class: "Domain_Required",
      // DL-031 batch: Both/Executable → User_Confirmed/Informational/Not_Applicable (R4 honest-null).
      validation_source: "User_Confirmed",
      execution_relevance: "Informational",
      safety_class: "Not_Applicable",
      dependencies: [C.INV_FOUND_001],
    }));
  }

  // Conditional: RM-04 = Yes
  if (isAnswered(answers, "RM-04") && (answerEquals(answers, "RM-04", true) || answerEquals(answers, "RM-04", "Yes"))) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.INV_DREQ_009,
      domain: D,
      checkpoint_class: "Domain_Required",
      // DL-033: Both/Executable/Conditional → User_Confirmed/Informational/Not_Applicable (R4 honest-null, no op-def with non-null intended_changes).
      validation_source: "User_Confirmed",
      execution_relevance: "Informational",
      safety_class: "Not_Applicable",
      dependencies: [C.INV_FOUND_002],
    }));
  }

  return records;
}

function generateManufacturingCheckpoints(answers) {
  const D = "manufacturing";
  const C = CHECKPOINT_IDS;

  const records = [];

  records.push(createCheckpointRecord({
    checkpoint_id: C.MRP_FOUND_001,
    domain: D,
    checkpoint_class: "Foundational",
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
    dependencies: [C.INV_FOUND_003],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.MRP_DREQ_001,
    domain: D,
    checkpoint_class: "Domain_Required",
    // DL-031 batch: Both/Executable → User_Confirmed/Informational/Not_Applicable (R4 honest-null).
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
    dependencies: [C.MAS_DREQ_006],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.MRP_DREQ_002,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
    dependencies: [C.MRP_DREQ_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.MRP_GL_001,
    domain: D,
    checkpoint_class: "Go_Live",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Not_Applicable",
    dependencies: [C.MRP_DREQ_001, C.MRP_DREQ_002],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.MRP_GL_002,
    domain: D,
    checkpoint_class: "Go_Live",
    // DL-031 batch: Both → User_Confirmed (None/Not_Applicable unchanged).
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Not_Applicable",
    dependencies: [C.MRP_DREQ_001, C.INV_DREQ_002],
  }));

  // Conditional: MF-02 = Multi-level
  if (isAnswered(answers, "MF-02") && answerEquals(answers, "MF-02", "Multi-level")) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.MRP_DREQ_003,
      domain: D,
      checkpoint_class: "Domain_Required",
      validation_source: "Both",
      execution_relevance: "Executable",
      safety_class: "Conditional",
      dependencies: [C.MRP_DREQ_001],
    }));
  }

  // Conditional: MF-02 = Phantom
  if (isAnswered(answers, "MF-02") && answerEquals(answers, "MF-02", "Phantom")) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.MRP_DREQ_004,
      domain: D,
      checkpoint_class: "Domain_Required",
      validation_source: "Both",
      execution_relevance: "Executable",
      safety_class: "Conditional",
      dependencies: [C.MRP_DREQ_001],
    }));
  }

  // Conditional: MF-03 = Yes (work centers)
  if (isAnswered(answers, "MF-03") && (answerEquals(answers, "MF-03", true) || answerEquals(answers, "MF-03", "Yes"))) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.MRP_DREQ_005,
      domain: D,
      checkpoint_class: "Domain_Required",
      // DL-031 batch: Both/Executable → User_Confirmed/Informational/Not_Applicable (R4 honest-null).
      validation_source: "User_Confirmed",
      execution_relevance: "Informational",
      safety_class: "Not_Applicable",
      dependencies: [C.INV_FOUND_002],
    }));

    records.push(createCheckpointRecord({
      checkpoint_id: C.MRP_DREQ_006,
      domain: D,
      checkpoint_class: "Domain_Required",
      // DL-031 batch: Both/Executable → User_Confirmed/Informational/Not_Applicable (R4 honest-null).
      validation_source: "User_Confirmed",
      execution_relevance: "Informational",
      safety_class: "Not_Applicable",
      dependencies: [C.MRP_DREQ_005],
    }));
  }

  // Conditional: MF-04 = Yes (subcontracting)
  if (isAnswered(answers, "MF-04") && (answerEquals(answers, "MF-04", true) || answerEquals(answers, "MF-04", "Yes"))) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.MRP_DREQ_007,
      domain: D,
      checkpoint_class: "Domain_Required",
      // DL-031 batch: Both/Executable → User_Confirmed/Informational/Not_Applicable (R4 honest-null).
      validation_source: "User_Confirmed",
      execution_relevance: "Informational",
      safety_class: "Not_Applicable",
      dependencies: [C.INV_DREQ_008],
    }));
  }

  // Conditional: FC-01 = Full accounting AND MF-02 = Multi-level
  if (
    isAnswered(answers, "FC-01") && answerEquals(answers, "FC-01", "Full accounting") &&
    isAnswered(answers, "MF-02") && answerEquals(answers, "MF-02", "Multi-level")
  ) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.MRP_DREQ_008,
      domain: D,
      checkpoint_class: "Domain_Required",
      validation_source: "Both",
      execution_relevance: "Executable",
      safety_class: "Conditional",
      dependencies: [C.ACCT_FOUND_002, C.ACCT_DREQ_003],
    }));
  }

  return records;
}

function generatePLMCheckpoints(answers) {
  const D = "plm";
  const C = CHECKPOINT_IDS;

  const records = [];

  records.push(createCheckpointRecord({
    checkpoint_id: C.PLM_FOUND_001,
    domain: D,
    checkpoint_class: "Foundational",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [C.MRP_DREQ_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.PLM_DREQ_001,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
    dependencies: [C.USR_DREQ_010],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.PLM_DREQ_002,
    domain: D,
    checkpoint_class: "Domain_Required",
    // DL-033: Both/Executable/Conditional → User_Confirmed/Informational/Not_Applicable (coverage gap: mrp.eco.type, mrp.eco not in ALLOWED_APPLY_MODELS).
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
    dependencies: [C.PLM_FOUND_001, C.PLM_DREQ_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.PLM_REC_001,
    domain: D,
    checkpoint_class: "Recommended",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [C.PLM_FOUND_001],
  }));

  return records;
}

function generateAccountingCheckpoints(answers) {
  const D = "accounting";
  const C = CHECKPOINT_IDS;

  const records = [];

  // DL-018: Reclassified from Both/Executable/Safe to User_Confirmed/Informational/Not_Applicable.
  // Evidence: 8 account.journal records exist on test236 (localization-installed).
  // intended_changes is null in assembler — no truthful governed write target derivable.
  records.push(createCheckpointRecord({
    checkpoint_id: C.ACCT_FOUND_001,
    domain: D,
    checkpoint_class: "Foundational",
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
    dependencies: [C.FND_FOUND_004],
  }));

  // DL-019: Reclassified from System_Detectable/Executable/Conditional to User_Confirmed/Informational/Not_Applicable.
  // Evidence: 124 account.account records exist on test236 (chart of accounts installed).
  // intended_changes is null in assembler — no truthful governed write target derivable.
  records.push(createCheckpointRecord({
    checkpoint_id: C.ACCT_FOUND_002,
    domain: D,
    checkpoint_class: "Foundational",
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
    dependencies: [C.FND_FOUND_002],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.ACCT_FOUND_003,
    domain: D,
    checkpoint_class: "Foundational",
    // DL-031 batch: Both/Executable/Blocked → User_Confirmed/Informational/Not_Applicable.
    // FND-FOUND-003 now Complete (DL-016). Blocked status retired.
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
    dependencies: [C.FND_FOUND_003],
  }));

  // DL-020: Reclassified from Both/Executable/Conditional to User_Confirmed/Informational/Not_Applicable.
  // Evidence: 8 account.journal records configured on test236.
  // intended_changes is null in assembler — no journal-specific config in discovery_answers.
  records.push(createCheckpointRecord({
    checkpoint_id: C.ACCT_DREQ_001,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
    dependencies: [C.ACCT_FOUND_002],
  }));

  // DL-021: Reclassified from User_Confirmed/Executable/Safe to User_Confirmed/Informational/Not_Applicable.
  // Evidence: 16 account.tax records exist on test236 (localization-installed).
  // intended_changes is null in assembler — no tax-specific config in discovery_answers.
  records.push(createCheckpointRecord({
    checkpoint_id: C.ACCT_DREQ_002,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
    dependencies: [C.ACCT_FOUND_001],
  }));

  // DL-022: Reclassified from Both/Executable/Safe to User_Confirmed/Informational/Not_Applicable.
  // Evidence: 124 account.account records with code structure on test236.
  // intended_changes is null in assembler — no code structure in discovery_answers.
  records.push(createCheckpointRecord({
    checkpoint_id: C.ACCT_DREQ_003,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
    dependencies: [C.ACCT_FOUND_002],
  }));

  // DL-023: Reclassified from User_Confirmed/Executable/Safe to User_Confirmed/Informational/Not_Applicable.
  // Evidence: Fiscal period configuration exists on test236.
  // intended_changes is null in assembler — no fiscal period data in discovery_answers.
  records.push(createCheckpointRecord({
    checkpoint_id: C.ACCT_DREQ_004,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
    dependencies: [C.ACCT_FOUND_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.ACCT_GL_001,
    domain: D,
    checkpoint_class: "Go_Live",
    // DL-031 batch: Both/Executable → User_Confirmed/Informational/Not_Applicable (R4 honest-null).
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
    dependencies: [C.ACCT_DREQ_003],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.ACCT_GL_002,
    domain: D,
    checkpoint_class: "Go_Live",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Not_Applicable",
    dependencies: [C.ACCT_GL_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.ACCT_GL_003,
    domain: D,
    checkpoint_class: "Go_Live",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Not_Applicable",
    dependencies: [C.ACCT_GL_002],
  }));

  // Conditional: BM-04 = Yes
  if (isAnswered(answers, "BM-04") && (answerEquals(answers, "BM-04", true) || answerEquals(answers, "BM-04", "Yes"))) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.ACCT_DREQ_005,
      domain: D,
      checkpoint_class: "Domain_Required",
      validation_source: "Both",
      execution_relevance: "Executable",
      safety_class: "Conditional",
      dependencies: [C.ACCT_DREQ_003],
    }));
  }

  // Conditional: FC-02 = AVCO or FIFO
  if (isAnswered(answers, "FC-02") && (answerEquals(answers, "FC-02", "AVCO") || answerEquals(answers, "FC-02", "FIFO"))) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.ACCT_DREQ_006,
      domain: D,
      checkpoint_class: "Domain_Required",
      validation_source: "Both",
      execution_relevance: "Executable",
      safety_class: "Conditional",
      dependencies: [C.ACCT_FOUND_002],
    }));
  }

  // Conditional: FC-02 = Standard Price
  if (isAnswered(answers, "FC-02") && answerEquals(answers, "FC-02", "Standard Price")) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.ACCT_DREQ_007,
      domain: D,
      checkpoint_class: "Domain_Required",
      validation_source: "Both",
      execution_relevance: "Executable",
      safety_class: "Conditional",
      dependencies: [C.ACCT_DREQ_003],
    }));
  }

  // Conditional: FC-05 = Yes
  if (isAnswered(answers, "FC-05") && (answerEquals(answers, "FC-05", true) || answerEquals(answers, "FC-05", "Yes"))) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.ACCT_REC_001,
      domain: D,
      checkpoint_class: "Recommended",
      validation_source: "Both",
      execution_relevance: "Executable",
      safety_class: "Conditional",
      dependencies: [C.ACCT_DREQ_003],
    }));
  }

  // Conditional: FC-01 = Full accounting
  if (isAnswered(answers, "FC-01") && answerEquals(answers, "FC-01", "Full accounting")) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.ACCT_REC_002,
      domain: D,
      checkpoint_class: "Recommended",
      // DL-031 batch: Both/Executable → User_Confirmed/Informational/Not_Applicable (R4 honest-null).
      validation_source: "User_Confirmed",
      execution_relevance: "Informational",
      safety_class: "Not_Applicable",
      dependencies: [C.ACCT_DREQ_002],
    }));
  }

  return records;
}

function generatePOSCheckpoints(answers) {
  const D = "pos";
  const C = CHECKPOINT_IDS;

  const records = [];

  // Reclassified per DL-029: Both/Executable/Safe → User_Confirmed/Informational/Not_Applicable.
  // POS assembler produces intended_changes: null (R4 honest-null) for pos.payment.method.
  // Same DL-013 pattern: no truthful governed write target derivable.
  records.push(createCheckpointRecord({
    checkpoint_id: C.POS_FOUND_001,
    domain: D,
    checkpoint_class: "Foundational",
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
    dependencies: [C.FND_DREQ_002],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.POS_DREQ_001,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [C.POS_FOUND_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.POS_DREQ_002,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [C.POS_FOUND_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.POS_DREQ_003,
    domain: D,
    checkpoint_class: "Domain_Required",
    // DL-031 batch: Both/Executable → User_Confirmed/Informational/Not_Applicable (R4 honest-null).
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
    dependencies: [C.USR_DREQ_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.POS_GL_001,
    domain: D,
    checkpoint_class: "Go_Live",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Not_Applicable",
    dependencies: [C.POS_DREQ_001, C.POS_DREQ_002, C.POS_DREQ_003],
  }));

  // Conditional: FC-01 = Full accounting
  if (isAnswered(answers, "FC-01") && answerEquals(answers, "FC-01", "Full accounting")) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.POS_DREQ_004,
      domain: D,
      checkpoint_class: "Domain_Required",
      // DL-031 batch: Both/Executable → User_Confirmed/Informational/Not_Applicable (R4 honest-null).
      validation_source: "User_Confirmed",
      execution_relevance: "Informational",
      safety_class: "Not_Applicable",
      dependencies: [C.ACCT_DREQ_003],
    }));
  }

  // Conditional: OP-01 = Yes
  if (isAnswered(answers, "OP-01") && (answerEquals(answers, "OP-01", true) || answerEquals(answers, "OP-01", "Yes"))) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.POS_DREQ_005,
      domain: D,
      checkpoint_class: "Domain_Required",
      // DL-031 batch: Both/Executable → User_Confirmed/Informational/Not_Applicable (R4 honest-null).
      validation_source: "User_Confirmed",
      execution_relevance: "Informational",
      safety_class: "Not_Applicable",
      dependencies: [C.INV_FOUND_003],
    }));
  }

  return records;
}

function generateWebsiteEcommerceCheckpoints(answers) {
  const D = "website_ecommerce";
  const C = CHECKPOINT_IDS;

  const records = [];

  // Reclassified per DL-027: Both/Executable/Safe → User_Confirmed/Informational/Not_Applicable.
  // website-ecommerce-operation-definitions.js assembler returns empty map — no operation
  // definition exists for WEB-FOUND-001. No truthful governed write target derivable.
  records.push(createCheckpointRecord({
    checkpoint_id: C.WEB_FOUND_001,
    domain: D,
    checkpoint_class: "Foundational",
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
    dependencies: [C.FND_FOUND_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.WEB_DREQ_001,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [C.MAS_DREQ_001],
  }));

  // Reclassified per DL-028: Both/Executable/Conditional → User_Confirmed/Informational/Not_Applicable.
  // website-ecommerce-operation-definitions.js assembler returns empty map — no operation
  // definition exists for WEB-DREQ-002. No truthful governed write target derivable.
  records.push(createCheckpointRecord({
    checkpoint_id: C.WEB_DREQ_002,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
    dependencies: [C.WEB_FOUND_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.WEB_DREQ_003,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [C.WEB_DREQ_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.WEB_GL_001,
    domain: D,
    checkpoint_class: "Go_Live",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Not_Applicable",
    dependencies: [C.WEB_DREQ_002, C.WEB_DREQ_003],
  }));

  // Conditional: OP-01 = Yes
  if (isAnswered(answers, "OP-01") && (answerEquals(answers, "OP-01", true) || answerEquals(answers, "OP-01", "Yes"))) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.WEB_DREQ_004,
      domain: D,
      checkpoint_class: "Domain_Required",
      validation_source: "User_Confirmed",
      execution_relevance: "Executable",
      safety_class: "Conditional",
      dependencies: [C.INV_FOUND_001],
    }));
  }

  // Conditional: SC-03 = Yes
  if (isAnswered(answers, "SC-03") && (answerEquals(answers, "SC-03", true) || answerEquals(answers, "SC-03", "Yes"))) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.WEB_DREQ_005,
      domain: D,
      checkpoint_class: "Domain_Required",
      validation_source: "User_Confirmed",
      execution_relevance: "Executable",
      safety_class: "Conditional",
      dependencies: [C.SAL_DREQ_004],
    }));
  }

  return records;
}

function generateProjectsCheckpoints(answers) {
  const D = "projects";
  const C = CHECKPOINT_IDS;

  const records = [];

  records.push(createCheckpointRecord({
    checkpoint_id: C.PRJ_FOUND_001,
    domain: D,
    checkpoint_class: "Foundational",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [C.FND_DREQ_002],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.PRJ_DREQ_001,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [C.PRJ_FOUND_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.PRJ_DREQ_002,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
    dependencies: [C.PRJ_FOUND_001, C.SAL_DREQ_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.PRJ_GL_001,
    domain: D,
    checkpoint_class: "Go_Live",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Not_Applicable",
    dependencies: [C.PRJ_DREQ_002],
  }));

  // Conditional: RM-02 = Yes
  if (isAnswered(answers, "RM-02") && (answerEquals(answers, "RM-02", true) || answerEquals(answers, "RM-02", "Yes"))) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.PRJ_DREQ_003,
      domain: D,
      checkpoint_class: "Domain_Required",
      validation_source: "User_Confirmed",
      execution_relevance: "Executable",
      safety_class: "Conditional",
      dependencies: [C.SAL_DREQ_001],
    }));
  }

  // Conditional: FC-05 = Yes
  if (isAnswered(answers, "FC-05") && (answerEquals(answers, "FC-05", true) || answerEquals(answers, "FC-05", "Yes"))) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.PRJ_DREQ_004,
      domain: D,
      checkpoint_class: "Domain_Required",
      validation_source: "Both",
      execution_relevance: "Executable",
      safety_class: "Conditional",
      dependencies: [C.ACCT_REC_001],
    }));
  }

  return records;
}

function generateHRCheckpoints(answers) {
  const D = "hr";
  const C = CHECKPOINT_IDS;

  const records = [];

  records.push(createCheckpointRecord({
    checkpoint_id: C.HR_FOUND_001,
    domain: D,
    checkpoint_class: "Foundational",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [C.FND_FOUND_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.HR_DREQ_001,
    domain: D,
    checkpoint_class: "Domain_Required",
    // DL-031 batch: Both/Executable → User_Confirmed/Informational/Not_Applicable (R4 honest-null).
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
    dependencies: [C.HR_FOUND_001, C.USR_DREQ_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.HR_DREQ_002,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [C.HR_DREQ_001],
  }));

  // Conditional: TA-03 includes HR leave
  if (multiSelectIncludes(answers, "TA-03", "HR leave")) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.HR_DREQ_003,
      domain: D,
      checkpoint_class: "Domain_Required",
      validation_source: "Both",
      execution_relevance: "Executable",
      safety_class: "Conditional",
      dependencies: [C.HR_DREQ_001],
    }));
  }

  // Conditional: RM-02 = Yes
  if (isAnswered(answers, "RM-02") && (answerEquals(answers, "RM-02", true) || answerEquals(answers, "RM-02", "Yes"))) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.HR_DREQ_004,
      domain: D,
      checkpoint_class: "Domain_Required",
      // DL-031 batch: Both/Executable → User_Confirmed/Informational/Not_Applicable (R4 honest-null).
      validation_source: "User_Confirmed",
      execution_relevance: "Informational",
      safety_class: "Not_Applicable",
      dependencies: [C.HR_DREQ_001],
    }));
  }

  return records;
}

function generateQualityCheckpoints(answers) {
  const D = "quality";
  const C = CHECKPOINT_IDS;

  const records = [];

  records.push(createCheckpointRecord({
    checkpoint_id: C.QUA_FOUND_001,
    domain: D,
    checkpoint_class: "Foundational",
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
    dependencies: [C.INV_FOUND_003],
  }));

  // Conditional: MF-06 includes Receipt
  if (multiSelectIncludes(answers, "MF-06", "Receipt")) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.QUA_DREQ_001,
      domain: D,
      checkpoint_class: "Domain_Required",
      // DL-031 batch: Both/Executable → User_Confirmed/Informational/Not_Applicable (R4 honest-null).
      validation_source: "User_Confirmed",
      execution_relevance: "Informational",
      safety_class: "Not_Applicable",
      dependencies: [C.INV_FOUND_003],
    }));
  }

  // Conditional: MF-06 includes In-process
  if (multiSelectIncludes(answers, "MF-06", "In-process")) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.QUA_DREQ_002,
      domain: D,
      checkpoint_class: "Domain_Required",
      // DL-031 batch: Both/Executable → User_Confirmed/Informational/Not_Applicable (R4 honest-null).
      validation_source: "User_Confirmed",
      execution_relevance: "Informational",
      safety_class: "Not_Applicable",
      dependencies: [C.MRP_DREQ_005],
    }));
  }

  // Conditional: MF-06 includes Finished goods
  if (multiSelectIncludes(answers, "MF-06", "Finished goods")) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.QUA_DREQ_003,
      domain: D,
      checkpoint_class: "Domain_Required",
      // DL-031 batch: Both/Executable → User_Confirmed/Informational/Not_Applicable (R4 honest-null).
      validation_source: "User_Confirmed",
      execution_relevance: "Informational",
      safety_class: "Not_Applicable",
      dependencies: [C.INV_FOUND_003],
    }));
  }

  return records;
}

function generateMaintenanceCheckpoints(answers) {
  const D = "maintenance";
  const C = CHECKPOINT_IDS;

  const records = [];

  records.push(createCheckpointRecord({
    checkpoint_id: C.MNT_FOUND_001,
    domain: D,
    checkpoint_class: "Foundational",
    // DL-031 batch: Both/Executable → User_Confirmed/Informational/Not_Applicable (R4 honest-null).
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
    dependencies: [C.MRP_DREQ_005],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.MNT_DREQ_001,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [C.MNT_FOUND_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.MNT_DREQ_002,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [C.MNT_FOUND_001, C.USR_DREQ_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.MNT_REC_001,
    domain: D,
    checkpoint_class: "Recommended",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [C.MNT_FOUND_001],
  }));

  return records;
}

function generateRepairsCheckpoints(answers) {
  const D = "repairs";
  const C = CHECKPOINT_IDS;

  const records = [];

  records.push(createCheckpointRecord({
    checkpoint_id: C.REP_FOUND_001,
    domain: D,
    checkpoint_class: "Foundational",
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
    dependencies: [C.INV_FOUND_003],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.REP_DREQ_001,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
    dependencies: [C.REP_FOUND_001, C.MAS_DREQ_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.REP_DREQ_002,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
    dependencies: [C.SAL_DREQ_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.REP_REC_001,
    domain: D,
    checkpoint_class: "Recommended",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Not_Applicable",
    dependencies: [C.REP_DREQ_001, C.REP_DREQ_002],
  }));

  return records;
}

function generateDocumentsCheckpoints(answers) {
  const D = "documents";
  const C = CHECKPOINT_IDS;

  const records = [];

  records.push(createCheckpointRecord({
    checkpoint_id: C.DOC_FOUND_001,
    domain: D,
    checkpoint_class: "Foundational",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [C.FND_FOUND_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.DOC_DREQ_001,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [C.DOC_FOUND_001, C.USR_DREQ_002],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.DOC_REC_001,
    domain: D,
    checkpoint_class: "Recommended",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [C.DOC_FOUND_001],
  }));

  return records;
}

function generateSignCheckpoints(answers) {
  const D = "sign";
  const C = CHECKPOINT_IDS;

  const records = [];

  records.push(createCheckpointRecord({
    checkpoint_id: C.SGN_FOUND_001,
    domain: D,
    checkpoint_class: "Foundational",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [C.FND_FOUND_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.SGN_DREQ_001,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [C.SGN_FOUND_001, C.USR_DREQ_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.SGN_DREQ_002,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [C.SGN_FOUND_001],
  }));

  return records;
}

function generateApprovalsCheckpoints(answers) {
  const D = "approvals";
  const C = CHECKPOINT_IDS;

  const records = [];

  records.push(createCheckpointRecord({
    checkpoint_id: C.APR_FOUND_001,
    domain: D,
    checkpoint_class: "Foundational",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [C.USR_DREQ_003],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.APR_DREQ_001,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [C.APR_FOUND_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.APR_DREQ_002,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
    dependencies: [C.APR_FOUND_001],
  }));

  // Conditional: TA-03 includes Inventory adjustments
  if (multiSelectIncludes(answers, "TA-03", "Inventory adjustments")) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.APR_DREQ_003,
      domain: D,
      checkpoint_class: "Domain_Required",
      validation_source: "User_Confirmed",
      execution_relevance: "Executable",
      safety_class: "Conditional",
      dependencies: [C.APR_FOUND_001],
    }));
  }

  // Conditional: TA-03 includes Expenses
  if (multiSelectIncludes(answers, "TA-03", "Expenses")) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.APR_DREQ_004,
      domain: D,
      checkpoint_class: "Domain_Required",
      validation_source: "User_Confirmed",
      execution_relevance: "Executable",
      safety_class: "Conditional",
      dependencies: [C.APR_FOUND_001],
    }));
  }

  // Conditional: TA-03 includes Manufacturing order
  if (multiSelectIncludes(answers, "TA-03", "Manufacturing order")) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.APR_DREQ_005,
      domain: D,
      checkpoint_class: "Domain_Required",
      validation_source: "User_Confirmed",
      execution_relevance: "Executable",
      safety_class: "Conditional",
      dependencies: [C.APR_FOUND_001],
    }));
  }

  // Conditional: TA-03 includes HR leave
  if (multiSelectIncludes(answers, "TA-03", "HR leave")) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.APR_DREQ_006,
      domain: D,
      checkpoint_class: "Domain_Required",
      validation_source: "User_Confirmed",
      execution_relevance: "Executable",
      safety_class: "Conditional",
      dependencies: [C.APR_FOUND_001],
    }));
  }

  // Conditional: TA-03 includes Document signing
  if (multiSelectIncludes(answers, "TA-03", "Document signing")) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.APR_DREQ_007,
      domain: D,
      checkpoint_class: "Domain_Required",
      validation_source: "User_Confirmed",
      execution_relevance: "Executable",
      safety_class: "Conditional",
      dependencies: [C.APR_FOUND_001],
    }));
  }

  return records;
}

function generateSubscriptionsCheckpoints(answers) {
  const D = "subscriptions";
  const C = CHECKPOINT_IDS;

  const records = [];

  records.push(createCheckpointRecord({
    checkpoint_id: C.SUB_FOUND_001,
    domain: D,
    checkpoint_class: "Foundational",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [C.SAL_DREQ_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.SUB_DREQ_001,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
    dependencies: [C.SUB_FOUND_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.SUB_DREQ_002,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [C.SUB_FOUND_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.SUB_GL_001,
    domain: D,
    checkpoint_class: "Go_Live",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Not_Applicable",
    dependencies: [C.SUB_DREQ_001, C.SUB_DREQ_002],
  }));

  // Conditional: FC-01 = Full accounting
  if (isAnswered(answers, "FC-01") && answerEquals(answers, "FC-01", "Full accounting")) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.SUB_DREQ_003,
      domain: D,
      checkpoint_class: "Domain_Required",
      // DL-031 batch: Both/Executable → User_Confirmed/Informational/Not_Applicable (R4 honest-null).
      validation_source: "User_Confirmed",
      execution_relevance: "Informational",
      safety_class: "Not_Applicable",
      dependencies: [C.ACCT_DREQ_003],
    }));
  }

  return records;
}

function generateRentalCheckpoints(answers) {
  const D = "rental";
  const C = CHECKPOINT_IDS;

  const records = [];

  records.push(createCheckpointRecord({
    checkpoint_id: C.RNT_FOUND_001,
    domain: D,
    checkpoint_class: "Foundational",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [C.MAS_DREQ_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.RNT_DREQ_001,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [C.RNT_FOUND_001, C.SAL_DREQ_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.RNT_DREQ_002,
    domain: D,
    checkpoint_class: "Domain_Required",
    // DL-033: Both/Executable/Conditional → User_Confirmed/Informational/Not_Applicable (coverage gap: sale.order, product.template not in ALLOWED_APPLY_MODELS).
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
    dependencies: [C.INV_FOUND_003],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.RNT_GL_001,
    domain: D,
    checkpoint_class: "Go_Live",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Not_Applicable",
    dependencies: [C.RNT_DREQ_001, C.RNT_DREQ_002],
  }));

  return records;
}

function generateFieldServiceCheckpoints(answers) {
  const D = "field_service";
  const C = CHECKPOINT_IDS;

  const records = [];

  records.push(createCheckpointRecord({
    checkpoint_id: C.FSV_FOUND_001,
    domain: D,
    checkpoint_class: "Foundational",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [C.PRJ_DREQ_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.FSV_DREQ_001,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
    dependencies: [C.FSV_FOUND_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.FSV_DREQ_002,
    domain: D,
    checkpoint_class: "Domain_Required",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
    dependencies: [C.SAL_DREQ_001],
  }));

  records.push(createCheckpointRecord({
    checkpoint_id: C.FSV_GL_001,
    domain: D,
    checkpoint_class: "Go_Live",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Not_Applicable",
    dependencies: [C.FSV_DREQ_001, C.FSV_DREQ_002],
  }));

  // Conditional: OP-01 = Yes
  if (isAnswered(answers, "OP-01") && (answerEquals(answers, "OP-01", true) || answerEquals(answers, "OP-01", "Yes"))) {
    records.push(createCheckpointRecord({
      checkpoint_id: C.FSV_DREQ_003,
      domain: D,
      checkpoint_class: "Domain_Required",
      // DL-031 batch: Both/Executable → User_Confirmed/Informational/Not_Applicable (R4 honest-null).
      validation_source: "User_Confirmed",
      execution_relevance: "Informational",
      safety_class: "Not_Applicable",
      dependencies: [C.INV_FOUND_001, C.MAS_DREQ_001],
    }));
  }

  return records;
}

// ---------------------------------------------------------------------------
// Domain ID → generator function map
// ---------------------------------------------------------------------------

const DOMAIN_GENERATORS = Object.freeze({
  foundation: generateFoundationCheckpoints,
  users_roles: generateUsersRolesCheckpoints,
  master_data: generateMasterDataCheckpoints,
  crm: generateCRMCheckpoints,
  sales: generateSalesCheckpoints,
  purchase: generatePurchaseCheckpoints,
  inventory: generateInventoryCheckpoints,
  manufacturing: generateManufacturingCheckpoints,
  plm: generatePLMCheckpoints,
  accounting: generateAccountingCheckpoints,
  pos: generatePOSCheckpoints,
  website_ecommerce: generateWebsiteEcommerceCheckpoints,
  projects: generateProjectsCheckpoints,
  hr: generateHRCheckpoints,
  quality: generateQualityCheckpoints,
  maintenance: generateMaintenanceCheckpoints,
  repairs: generateRepairsCheckpoints,
  documents: generateDocumentsCheckpoints,
  sign: generateSignCheckpoints,
  approvals: generateApprovalsCheckpoints,
  subscriptions: generateSubscriptionsCheckpoints,
  rental: generateRentalCheckpoints,
  field_service: generateFieldServiceCheckpoints,
});

// ---------------------------------------------------------------------------
// Main export: computeCheckpoints
// ---------------------------------------------------------------------------

/**
 * Generates the persisted checkpoint set from activated domain records and
 * discovery answers.
 *
 * @param {object} activatedDomains - Output of computeActivatedDomains() from
 *   domain-activation-engine.js. Must have a `domains` array of domain records,
 *   each with { domain_id, activated } at minimum.
 * @param {object} discoveryAnswers - The discovery_answers persisted object from
 *   runtime state. Must have an `answers` map (question_id → answer_value).
 *   Pass {} or { answers: {} } if no answers are available yet.
 *
 * @returns {object} createCheckpoints() shape: { records, engine_version, generated_at }
 */
export function computeCheckpoints(activatedDomains, discoveryAnswers) {
  // --- Input normalization ---
  const domains = Array.isArray(activatedDomains?.domains)
    ? activatedDomains.domains
    : [];

  const answers =
    discoveryAnswers?.answers !== null &&
    typeof discoveryAnswers?.answers === "object"
      ? discoveryAnswers.answers
      : {};

  // --- Pass 1: Generate all records for activated domains ---
  const allRecords = [];

  for (const domainRecord of domains) {
    // R6: Only generate checkpoints for activated domains
    if (!domainRecord || domainRecord.activated !== true) continue;

    const domainId = domainRecord.domain_id;
    const generator = DOMAIN_GENERATORS[domainId];

    if (!generator) {
      // Unknown domain — no generator defined. Skip with no inference.
      continue;
    }

    const domainRecords = generator(answers);
    allRecords.push(...domainRecords);
  }

  // --- Pass 2: Build generated ID set for phantom pruning ---
  const generatedIds = new Set(allRecords.map((r) => r.checkpoint_id));

  // --- Pass 3: Prune phantom dependencies ---
  // Any checkpoint_id in a dependencies array that was not generated must be
  // removed (Part 5, Rule 2 of checkpoint_engine.md).
  const prunedRecords = allRecords.map((record) => {
    const prunedDeps = prunePhantomDependencies(record.dependencies, generatedIds);
    if (prunedDeps.length === record.dependencies.length) {
      return record; // no change
    }
    return { ...record, dependencies: prunedDeps };
  });

  return createCheckpoints({
    records: prunedRecords,
    engine_version: CHECKPOINT_ENGINE_VERSION,
    generated_at: new Date().toISOString(),
  });
}
