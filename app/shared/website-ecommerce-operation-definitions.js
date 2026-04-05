// ---------------------------------------------------------------------------
// Website/eCommerce Operation Definitions — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Assembles caller-supplied operation definitions for Website/eCommerce
//   domain Executable checkpoints. Website/eCommerce currently has no governed
//   apply operation definitions because the requested target models are outside
//   the allowed apply surface.
//
// Governing constraints:
//   - specs/runtime_state_contract.md §1 (operation_definition shape)
//   - governed-preview-engine.js R15 / Gate 6 (Executable checkpoints require
//     a matching operation_definition keyed by checkpoint_id)
//   - governed-odoo-apply-service.js S4 (website and payment.provider are not
//     in ALLOWED_APPLY_MODELS)
//   - checkpoint-engine.js generateWebsiteEcommerceCheckpoints
//
// Hard rules:
//   R1  Only Website/eCommerce domain checkpoints are considered here. Never
//       other domains.
//   R2  No Website/eCommerce operation definitions are emitted. website and
//       payment.provider are documented coverage gaps.
//   R3  The returned map is always a plain object (createOperationDefinitionsMap
//       shape). Never null, never an array.
//   R4  Non-Website/eCommerce checkpoint IDs are never added to the returned map.
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `website-ecommerce-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

import { createOperationDefinitionsMap } from "./runtime-state-contract.js";

// COVERAGE GAP: website not in ALLOWED_APPLY_MODELS
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
// COVERAGE GAP: payment.provider not in ALLOWED_APPLY_MODELS
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
export const WEBSITE_ECOMMERCE_COVERAGE_GAP_MODELS = Object.freeze([
  "website",
  "payment.provider",
]);

export const WEBSITE_ECOMMERCE_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([]);
export const WEBSITE_ECOMMERCE_OP_DEFS_VERSION = "1.0.0";

export function assembleWebsiteEcommerceOperationDefinitions(
  target_context = null,
  discovery_answers = null
) {
  return createOperationDefinitionsMap();
}
