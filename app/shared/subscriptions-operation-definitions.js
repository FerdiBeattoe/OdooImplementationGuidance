// ---------------------------------------------------------------------------
// Subscriptions Operation Definitions — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Assembles caller-supplied operation definitions for Subscriptions domain
//   Executable checkpoints. Subscriptions currently has no governed-apply
//   operation definitions because the requested target models are outside the
//   allowed apply surface.
//
// Governing constraints:
//   - specs/runtime_state_contract.md §1 (operation_definition shape)
//   - governed-preview-engine.js R15 / Gate 6
//   - governed-odoo-apply-service.js S4 (sale.subscription.plan and
//     product.template are not in ALLOWED_APPLY_MODELS)
//   - checkpoint-engine.js generateSubscriptionsCheckpoints
//
// Hard rules:
//   R1  Only Subscriptions domain checkpoints are considered here. Never other domains.
//   R2  No Subscriptions operation definitions are emitted. sale.subscription.plan
//       and product.template are documented coverage gaps.
//   R3  The returned map is always a plain object (createOperationDefinitionsMap
//       shape). Never null, never an array.
//   R4  Non-Subscriptions checkpoint IDs are never added to the returned map.
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `subscriptions-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

import { createOperationDefinitionsMap } from "./runtime-state-contract.js";

// COVERAGE GAP: sale.subscription.plan not in ALLOWED_APPLY_MODELS
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
// COVERAGE GAP: product.template not in ALLOWED_APPLY_MODELS
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
export const SUBSCRIPTIONS_COVERAGE_GAP_MODELS = Object.freeze([
  "sale.subscription.plan",
  "product.template",
]);

export const SUBSCRIPTIONS_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([]);
export const SUBSCRIPTIONS_OP_DEFS_VERSION = "1.0.0";

export function assembleSubscriptionsOperationDefinitions(
  target_context = null,
  discovery_answers = null
) {
  return createOperationDefinitionsMap();
}
