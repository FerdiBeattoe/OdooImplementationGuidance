// ---------------------------------------------------------------------------
// Quality Operation Definitions - Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `quality-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

import {
  createOperationDefinition,
  createOperationDefinitionsMap,
} from "./runtime-state-contract.js";

import { CHECKPOINT_IDS } from "./checkpoint-engine.js";

export const QUALITY_OP_DEFS_VERSION = "1.2.0";
export const QUALITY_POINT_MODEL = "quality.point";
export const QUALITY_TARGET_METHOD = "write";
export const QUALITY_COVERAGE_GAP_MODELS = Object.freeze(["quality.alert"]);
export const QUALITY_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([
  CHECKPOINT_IDS.QUA_FOUND_001,
]);
export const QUALITY_CHECKPOINT_METADATA = Object.freeze({
  [CHECKPOINT_IDS.QUA_FOUND_001]: Object.freeze({ target_model: QUALITY_POINT_MODEL, validation_source: "User_Confirmed", execution_relevance: "Informational", safety_class: "Not_Applicable" }),
  [CHECKPOINT_IDS.QUA_DREQ_001]: Object.freeze({ target_model: QUALITY_POINT_MODEL, validation_source: "User_Confirmed", execution_relevance: "Informational", safety_class: "Not_Applicable" }),
  [CHECKPOINT_IDS.QUA_DREQ_002]: Object.freeze({ target_model: QUALITY_POINT_MODEL, validation_source: "User_Confirmed", execution_relevance: "Informational", safety_class: "Not_Applicable" }),
  [CHECKPOINT_IDS.QUA_DREQ_003]: Object.freeze({ target_model: QUALITY_POINT_MODEL, validation_source: "User_Confirmed", execution_relevance: "Informational", safety_class: "Not_Applicable" }),
});
function isPlainObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function extractQualityCapture(wizard_captures) { if (!isPlainObject(wizard_captures)) return null; return isPlainObject(wizard_captures.quality) ? wizard_captures.quality : null; }
function buildQualityPointChanges(capture) {
  if (!isPlainObject(capture)) return null;
  const title = typeof capture.quality_check_title === "string" ? capture.quality_check_title.trim() : "";
  const checkType = typeof capture.check_type === "string" ? capture.check_type.trim() : "";
  if (!title && !checkType) return null;
  // honest-null: test_type_id is required by quality.point but must be resolved
  // at runtime. The assembler emits a lookup sentinel — the runtime resolver
  // (odoo-lookup-resolver.js) replaces it with a real ID before the write.
  return {
    title: title || null,
    test_type_id: {
      __lookup: "quality.test.type",
      domain: [],
      field: "id",
      limit: 1,
    },
    note: checkType || null,
  };
}
function addQualityDefinition(map, checkpoint_id, intended_changes) { const metadata = QUALITY_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: QUALITY_TARGET_METHOD, intended_changes, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleQualityOperationDefinitions(target_context = null, discovery_answers = null, wizard_captures = null) { const map = createOperationDefinitionsMap(); const answers = discovery_answers?.answers ?? {}; const mf06 = Array.isArray(answers["MF-06"]) ? answers["MF-06"] : []; const qualityChanges = buildQualityPointChanges(extractQualityCapture(wizard_captures));
  addQualityDefinition(map, CHECKPOINT_IDS.QUA_FOUND_001, qualityChanges);
  if (mf06.includes("Receipt")) {
    addQualityDefinition(map, CHECKPOINT_IDS.QUA_DREQ_001, qualityChanges);
  }
  if (mf06.includes("In-process")) {
    addQualityDefinition(map, CHECKPOINT_IDS.QUA_DREQ_002, qualityChanges);
  }
  if (mf06.includes("Finished goods")) {
    addQualityDefinition(map, CHECKPOINT_IDS.QUA_DREQ_003, qualityChanges);
  }
  return map;
}
