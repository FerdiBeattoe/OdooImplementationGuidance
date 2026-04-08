// ---------------------------------------------------------------------------
// Knowledge Operation Definitions — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Assembles caller-supplied operation definitions for Knowledge domain
//   Executable checkpoints. Knowledge currently has no governed-apply
//   operation definitions because the requested target model is outside the
//   allowed apply surface.
//
// Governing constraints:
//   - specs/runtime_state_contract.md §1 (operation_definition shape)
//   - governed-preview-engine.js R15 / Gate 6
//   - governed-odoo-apply-service.js S4 (knowledge.article is not
//     in ALLOWED_APPLY_MODELS)
//   - checkpoint-engine.js generateKnowledgeCheckpoints
//
// Hard rules:
//   R1  Only Knowledge domain checkpoints are considered here. Never other domains.
//   R2  No Knowledge operation definitions are emitted. knowledge.article
//       is a documented coverage gap.
//   R3  The returned map is always a plain object (createOperationDefinitionsMap
//       shape). Never null, never an array.
//   R4  Non-Knowledge checkpoint IDs are never added to the returned map.
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `knowledge-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

import { createOperationDefinitionsMap } from "./runtime-state-contract.js";

// COVERAGE GAP: knowledge.article not in ALLOWED_APPLY_MODELS
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
export const KNOWLEDGE_COVERAGE_GAP_MODELS = Object.freeze([
  "knowledge.article",
]);

export const KNOWLEDGE_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([]);
export const KNOWLEDGE_OP_DEFS_VERSION = "1.0.0";

export function assembleKnowledgeOperationDefinitions(
  target_context = null,
  discovery_answers = null
) {
  return createOperationDefinitionsMap();
}
