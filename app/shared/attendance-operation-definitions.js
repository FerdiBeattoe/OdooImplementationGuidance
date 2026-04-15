import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`attendance-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const ATTENDANCE_OP_DEFS_VERSION = "1.2.0";
export const ATTENDANCE_TARGET_METHOD = "write";
// hr.attendance is in ALLOWED_APPLY_MODELS.
export const ATTENDANCE_COVERAGE_GAP_MODELS = Object.freeze([]);
export const ATTENDANCE_CHECKPOINT_METADATA = Object.freeze({
  ["checkpoint-attendance-mode-setup"]: Object.freeze({
    target_model: "res.company",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-attendance-overtime-policy"]: Object.freeze({
    target_model: "hr.attendance",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-attendance-reporting-baseline"]: Object.freeze({
    target_model: "hr.attendance",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Conditional",
  }),
});
export const ATTENDANCE_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(ATTENDANCE_CHECKPOINT_METADATA));
const VALID_TRACKING_MODES = new Set(["kiosk_badge", "mobile_app", "manual_entry"]);
function isPlainObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function addAttendanceDefinition(map, checkpoint_id, intended_changes) { const metadata = ATTENDANCE_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: ATTENDANCE_TARGET_METHOD, intended_changes, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleAttendanceOperationDefinitions(target_context = null, discovery_answers = null, wizard_captures = null) {
  const map = createOperationDefinitionsMap();
  // Wizard capture shape (attendance-wizard.js): {tracking_mode, kiosk_manager_pin_required,
  // overtime_threshold_hours, tolerance_minutes}.
  const capture = isPlainObject(wizard_captures?.attendance) ? wizard_captures.attendance : {};
  // checkpoint-attendance-mode-setup → res.company. Confirmed boolean field:
  // hr_presence_control_attendance ("Based on attendances"). Selecting any attendance-based
  // tracking_mode in the wizard confirms intent to make company presence control attendance-based.
  const trackingMode = typeof capture.tracking_mode === "string" && VALID_TRACKING_MODES.has(capture.tracking_mode) ? capture.tracking_mode : null;
  addAttendanceDefinition(map, "checkpoint-attendance-mode-setup", trackingMode ? { hr_presence_control_attendance: true } : null);
  // checkpoint-attendance-overtime-policy → hr.attendance.
  // honest-null: overtime_threshold_hours is company/employee schedule policy (resource.calendar
  // or hr.employee.overtime settings), not a per-record field on hr.attendance.
  addAttendanceDefinition(map, "checkpoint-attendance-overtime-policy", null);
  // checkpoint-attendance-reporting-baseline → hr.attendance. execution_relevance "None".
  addAttendanceDefinition(map, "checkpoint-attendance-reporting-baseline", null);
  return map;
}
