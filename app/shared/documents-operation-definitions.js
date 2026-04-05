// ---------------------------------------------------------------------------
// Documents Operation Definitions — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Assembles caller-supplied operation definitions for Documents domain
//   Executable checkpoints. Documents currently has no governed-apply operation
//   definitions because the requested target models are outside the allowed
//   apply surface.
//
// Governing constraints:
//   - specs/runtime_state_contract.md §1 (operation_definition shape)
//   - governed-preview-engine.js R15 / Gate 6
//   - governed-odoo-apply-service.js S4 (documents.folder and documents.share
//     are not in ALLOWED_APPLY_MODELS)
//   - checkpoint-engine.js generateDocumentsCheckpoints
//
// Hard rules:
//   R1  Only Documents domain checkpoints are considered here. Never other domains.
//   R2  No Documents operation definitions are emitted. documents.folder and
//       documents.share are documented coverage gaps.
//   R3  The returned map is always a plain object (createOperationDefinitionsMap
//       shape). Never null, never an array.
//   R4  Non-Documents checkpoint IDs are never added to the returned map.
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `documents-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

import { createOperationDefinitionsMap } from "./runtime-state-contract.js";

// COVERAGE GAP: documents.folder not in ALLOWED_APPLY_MODELS
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
// COVERAGE GAP: documents.share not in ALLOWED_APPLY_MODELS
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
export const DOCUMENTS_COVERAGE_GAP_MODELS = Object.freeze([
  "documents.folder",
  "documents.share",
]);

export const DOCUMENTS_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([]);
export const DOCUMENTS_OP_DEFS_VERSION = "1.0.0";

export function assembleDocumentsOperationDefinitions(
  target_context = null,
  discovery_answers = null
) {
  return createOperationDefinitionsMap();
}
