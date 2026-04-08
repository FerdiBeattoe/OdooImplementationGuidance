// ---------------------------------------------------------------------------
// IoT Operation Definitions — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Assembles caller-supplied operation definitions for IoT domain
//   Executable checkpoints. IoT currently has no governed-apply
//   operation definitions because the requested target models are outside the
//   allowed apply surface.
//
// Governing constraints:
//   - specs/runtime_state_contract.md §1 (operation_definition shape)
//   - governed-preview-engine.js R15 / Gate 6
//   - governed-odoo-apply-service.js S4 (iot.device and
//     pos.config are not in ALLOWED_APPLY_MODELS for IoT scope)
//   - checkpoint-engine.js generateIotCheckpoints
//
// Hard rules:
//   R1  Only IoT domain checkpoints are considered here. Never other domains.
//   R2  No IoT operation definitions are emitted. iot.device
//       and pos.config are documented coverage gaps.
//   R3  The returned map is always a plain object (createOperationDefinitionsMap
//       shape). Never null, never an array.
//   R4  Non-IoT checkpoint IDs are never added to the returned map.
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `iot-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

import { createOperationDefinitionsMap } from "./runtime-state-contract.js";

// COVERAGE GAP: iot.device not in ALLOWED_APPLY_MODELS
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
// COVERAGE GAP: pos.config not in ALLOWED_APPLY_MODELS for IoT scope
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
export const IOT_COVERAGE_GAP_MODELS = Object.freeze([
  "iot.device",
  "pos.config",
]);

export const IOT_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([]);
export const IOT_OP_DEFS_VERSION = "1.0.0";

export function assembleIotOperationDefinitions(
  target_context = null,
  discovery_answers = null
) {
  return createOperationDefinitionsMap();
}
