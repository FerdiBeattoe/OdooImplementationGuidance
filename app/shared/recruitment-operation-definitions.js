import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`recruitment-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const RECRUITMENT_OP_DEFS_VERSION = "1.2.0";
export const RECRUITMENT_TARGET_METHOD = "write";
// hr.applicant and hr.job are in ALLOWED_APPLY_MODELS.
export const RECRUITMENT_COVERAGE_GAP_MODELS = Object.freeze([]);
export const RECRUITMENT_CHECKPOINT_METADATA = Object.freeze({
  ["checkpoint-recruitment-pipeline-stages"]: Object.freeze({
    target_model: "hr.applicant",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-recruitment-job-position"]: Object.freeze({
    target_model: "hr.job",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-recruitment-interview-process"]: Object.freeze({
    target_model: "hr.applicant",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Conditional",
  }),
  ["checkpoint-recruitment-offer-workflow"]: Object.freeze({
    target_model: "hr.applicant",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
});
export const RECRUITMENT_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(RECRUITMENT_CHECKPOINT_METADATA));
function isPlainObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function addRecruitmentDefinition(map, checkpoint_id, intended_changes) { const metadata = RECRUITMENT_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: RECRUITMENT_TARGET_METHOD, intended_changes, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
function extractJobPositionChanges(capture) {
  if (!isPlainObject(capture)) return null;
  // hr.job.name is the required char label for a job position.
  const name = typeof capture.first_role_title === "string" ? capture.first_role_title.trim() : "";
  if (!name) return null;
  return { name };
}
export function assembleRecruitmentOperationDefinitions(target_context = null, discovery_answers = null, wizard_captures = null) {
  const map = createOperationDefinitionsMap();
  // Wizard capture shape (recruitment-wizard.js): {pipeline_stages (repeater), first_role_title,
  // careers_page_published, jobs_alias_email, interview_template_name}.
  const capture = isPlainObject(wizard_captures?.recruitment) ? wizard_captures.recruitment : null;
  // checkpoint-recruitment-pipeline-stages → hr.applicant.
  // honest-null: pipeline stages are seeded on hr.recruitment.stage (separate model), not on
  // hr.applicant. Writing stage labels to hr.applicant would be a target-model mismatch.
  addRecruitmentDefinition(map, "checkpoint-recruitment-pipeline-stages", null);
  // checkpoint-recruitment-job-position → hr.job (name seed from first_role_title).
  addRecruitmentDefinition(map, "checkpoint-recruitment-job-position", extractJobPositionChanges(capture));
  // checkpoint-recruitment-interview-process → hr.applicant. execution_relevance "None".
  addRecruitmentDefinition(map, "checkpoint-recruitment-interview-process", null);
  // checkpoint-recruitment-offer-workflow → hr.applicant.
  // honest-null: offers are per-candidate records and hr.applicant requires {schedule_pay,
  // kanban_state, referral_state} plus partner_name/job context per record; the wizard does
  // not produce per-applicant rows.
  addRecruitmentDefinition(map, "checkpoint-recruitment-offer-workflow", null);
  return map;
}
