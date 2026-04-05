// ---------------------------------------------------------------------------
// Projects Operation Definitions — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Assembles caller-supplied operation definitions for Projects domain
//   Executable checkpoints. Projects currently has no governed-apply operation
//   definitions because every requested target model is outside the allowed
//   apply surface.
//
// Governing constraints:
//   - specs/runtime_state_contract.md §1 (operation_definition shape)
//   - governed-preview-engine.js R15 / Gate 6 (Executable checkpoints require
//     a matching operation_definition keyed by checkpoint_id)
//   - governed-odoo-apply-service.js S4 (project.project and project.task.type
//     are not in ALLOWED_APPLY_MODELS)
//   - checkpoint-engine.js generateProjectsCheckpoints
//   - domain-capabilities.js projects executeSupport=false
//
// Hard rules:
//   R1  Only Projects domain checkpoints are considered here. Never other domains.
//   R2  No Projects operation definitions are emitted. project.project and
//       project.task.type are documented coverage gaps.
//   R3  The returned map is always a plain object (createOperationDefinitionsMap
//       shape). Never null, never an array.
//   R4  Non-Projects checkpoint IDs are never added to the returned map.
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `projects-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

import { createOperationDefinitionsMap } from "./runtime-state-contract.js";

// COVERAGE GAP: project.project not in ALLOWED_APPLY_MODELS
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
// COVERAGE GAP: project.task.type not in ALLOWED_APPLY_MODELS
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
export const PROJECTS_COVERAGE_GAP_MODELS = Object.freeze([
  "project.project",
  "project.task.type",
]);

export const PROJECTS_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([]);
export const PROJECTS_OP_DEFS_VERSION = "1.0.0";

export function assembleProjectsOperationDefinitions(
  target_context = null,
  discovery_answers = null
) {
  return createOperationDefinitionsMap();
}
