// ---------------------------------------------------------------------------
// Governed Odoo Apply Service — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Application-layer boundary for governed Odoo writes in the pipeline path.
//   Takes a governed approval from the pipeline runtime state and performs a
//   bounded, auditable Odoo write through the OdooClient application-layer
//   boundary. Returns a truthful result_status for pipeline record ingestion.
//
//   THIS IS THE ONLY SERVICE THAT PERFORMS REAL ODOO WRITES IN THE GOVERNED
//   PIPELINE. It does NOT write directly to the database.
//
// Governing constraints:
//   - governed-execution-approval-engine.js (approval shape, execution_occurred)
//   - governed-preview-engine.js (preview record, execution_approval_implied)
//   - governed-execution-eligibility-engine.js (candidate shape, safety_class)
//   - odoo-client.js (application-layer boundary: write, create — no raw SQL)
//   - engine.js (getClientForProject — connection registry lookup)
//
// Hard rules:
//   S1  No business logic. No inference. No field invention.
//   S2  Apply refuses (fail closed) when any governed input is missing or invalid.
//   S3  approval.execution_occurred must be explicitly false. Re-execution refused.
//   S4  operation.model must be in ALLOWED_APPLY_MODELS.
//       Bounded to safe config models verified in engine.js executePreview.
//   S5  operation.method must be in ALLOWED_APPLY_METHODS: ["write", "create"].
//       No raw DB access. All writes through OdooClient methods only.
//   S6  write requires non-empty ids array of positive integers.
//   S7  Connection obtained from engine registry by project_id. Fail closed if absent.
//   S8  Returns { ok, result_status, odoo_result, error, executed_at,
//       execution_source_inputs } truthfully. Never invents a result.
//   S9  Fail closed on any validation failure or Odoo error: result_status "failure".
//   S10 execution_source_inputs captures approval_id, candidate_id, preview_id,
//       checkpoint_id, safety_class, model, method, project_id for auditability.
//   S11 _getClient is accepted as an injectable dependency for testability.
//       In production the engine registry is used (S7).
//   S12 After preview resolution, before execution: caller-supplied operation.model
//       must equal preview.target_model (when non-null/non-undefined); caller-supplied
//       operation.method must equal preview.target_operation (when non-null/non-undefined).
//       Fail closed on mismatch. Skip cross-check when preview fields are null/undefined
//       (non-Executable checkpoints or previews without operation_definitions).
// ---------------------------------------------------------------------------

import { getClientForProject } from "./engine.js";
import { computeExecutionRecords } from "../shared/governed-execution-record-engine.js";
import { appendExecution } from "../shared/runtime-state-contract.js";

// ---------------------------------------------------------------------------
// Service version — increment on any rule change
// ---------------------------------------------------------------------------

export const GOVERNED_APPLY_SERVICE_VERSION = "2.1.0";

// ---------------------------------------------------------------------------
// Bounded target surface (S4 — safe config models only)
// ---------------------------------------------------------------------------

export const ALLOWED_APPLY_MODELS = Object.freeze([
  // Foundation
  "res.company",
  // Inventory
  "stock.warehouse",
  "stock.picking.type",
  "stock.location",            // inventory location structure, approved per controller judgment 2026-04-05
  // CRM
  "crm.stage",
  "crm.team",
  // Master data
  "res.partner.category",
  "product.category",
  "uom.category",
  // Sales
  "product.pricelist",
  // Manufacturing
  "mrp.workcenter",
  "mrp.routing",               // manufacturing routing configuration, approved per controller judgment 2026-04-05
  // Website / eCommerce
  "delivery.carrier",
  "website",                   // website singleton configuration, approved per controller judgment 2026-04-05
  "payment.provider",          // payment provider configuration, approved per controller judgment 2026-04-05
  // Point of Sale
  "pos.payment.method",
  "pos.config",                // pos configuration profile, approved per controller judgment 2026-04-05
  // Projects
  "project.project",           // project template/structure configuration, approved per controller judgment 2026-04-05
  "project.task.type",         // task stage configuration, approved per controller judgment 2026-04-05
  // Quality
  "quality.point",             // quality check point definitions (implementation config), approved per controller judgment 2026-04-05
  // PLM
  "mrp.eco.type",              // ECO workflow type definitions (implementation config), approved per controller judgment 2026-04-05
  // Documents
  "documents.folder",          // document folder structure (implementation config), approved per controller judgment 2026-04-05
  // Sign
  "sign.template",             // signature template definitions (implementation config), approved per controller judgment 2026-04-05
  // Approvals
  "approval.category",         // approval workflow category definitions, approved per controller judgment 2026-04-05
  // Subscriptions
  "sale.subscription.plan",    // subscription plan definitions (product config), approved per controller judgment 2026-04-05
  // HR (bounded implementation provisioning)
  "hr.department",
  "hr.job",
  "hr.employee",
  // Accounting (bounded implementation provisioning)
  "account.journal",
  "account.tax",
  "account.account",
  // Users / Security (bounded implementation provisioning)
  "res.users",
  "res.groups",
  // HR & People
  "hr.attendance",
  "hr.appraisal",
  "hr.appraisal.goal",
  "hr.applicant",
  "hr.expense",
  "hr.expense.sheet",
  // "hr.payslip" — see GOVERNANCE EXCLUSIONS below
  "hr.salary.rule",
  // Helpdesk
  "helpdesk.team",
  "helpdesk.ticket",
  // Planning
  "planning.role",
  "planning.slot",
  // Maintenance — see GOVERNANCE EXCLUSIONS below
  // Repairs — see GOVERNANCE EXCLUSIONS below
  // Loyalty & Lunch
  "loyalty.program",
  "loyalty.reward",
  "lunch.supplier",
  "lunch.product",
  // Marketing
  "mailing.list",
  "mailing.mailing",
  // Live Chat
  "im_livechat.channel",
  // Knowledge
  "knowledge.article",
  // Calendar
  "calendar.event",
  // Fleet
  "fleet.vehicle",
  "fleet.vehicle.model",
  // Mail servers
  "fetchmail.server",
  "ir.mail_server",
  // WhatsApp
  "whatsapp.account",
  "whatsapp.template",
  // VoIP
  "voip.provider",
]);

// GOVERNANCE EXCLUSIONS — deliberately outside the write gate
// These models require a separate controller approval before
// being added to ALLOWED_APPLY_MODELS.
//
// product.template — touches live product catalog, transactional risk
// sale.order       — transactional record, not implementation config
// ir.model         — schema modification, irreversible risk
// ir.ui.view       — UI structure changes, irreversible risk
// ir.config_parameter — system-wide settings, requires explicit sign-off
// ir.config_parameter — keep out until blast radius is scoped
// account.report   — reporting structure, needs accounting review
// account.financial.html.report — same as above
// spreadsheet.template — borderline, defer until use case is defined
// mrp.eco          — ECO workflow, defer until PLM proof is complete
// documents.share  — sharing permissions, security review needed
// documents.document — content layer, not implementation config
// consolidation.company — multi-company risk, needs review
// consolidation.period  — same as above
// project.task     — transactional, not config
// hr.referral      — low priority, defer
// hr.referral.stage — low priority, defer
// sms.sms          — provider-dependent, defer until SMS proof complete
// mail.alias       — alias routing, system-wide impact
// mail.channel     — messaging infrastructure, needs review
// iot.device       — hardware binding, needs IoT proof first
// maintenance.equipment — asset/resource master records (business data), not config
// maintenance.request  — maintenance work orders (transactional), not config
// repair.order         — repair business documents (transactional), not config
// hr.payslip           — payroll transactional record, existing test coverage asserts exclusion

// ---------------------------------------------------------------------------
// Allowed application-layer methods (S5 — no raw DB)
// ---------------------------------------------------------------------------

export const ALLOWED_APPLY_METHODS = Object.freeze(["write", "create"]);

// ---------------------------------------------------------------------------
// Main export: applyGoverned
// ---------------------------------------------------------------------------

/**
 * Perform a bounded, governed Odoo application-layer write.
 *
 * Resolution order:
 *   1. Validate all required inputs (S2).
 *   2. Resolve approval from runtime_state._engine_outputs.execution_approvals (S3).
 *   3. Assert approval.execution_occurred === false (S3).
 *   4. Resolve candidate and preview (preview must exist before apply).
 *   5. Cross-check operation.model / operation.method against preview-bound
 *      target_model / target_operation (S12). Skip when preview fields are null/undefined.
 *   6. Validate operation model and method against allowed sets (S4, S5).
 *   7. Validate write constraints: ids non-empty positive integers (S6).
 *   8. Obtain OdooClient from connection registry (S7).
 *   9. Call client.write or client.create (S5 — no raw DB).
 *  10. Return truthful result envelope (S8).
 *
 * @param {object}   params
 * @param {string}   params.approval_id          — required governed approval ID
 * @param {object}   params.runtime_state        — required pipeline runtime state
 * @param {object}   params.operation            — required { model, method, ids?, values }
 * @param {object}   params.connection_context   — required { project_id }
 * @param {Function} [params._getClient]         — injectable client factory (tests only)
 * @returns {Promise<{
 *   ok: boolean,
 *   result_status: "success"|"failure",
 *   odoo_result: *,
 *   error: string|null,
 *   executed_at: string,
 *   execution_source_inputs: object|null
 * }>}
 */
export async function applyGoverned({
  approval_id,
  runtime_state,
  operation,
  connection_context,
  _getClient = null,   // S11: injectable for tests
} = {}) {

  // ── S2: Validate all required inputs ──────────────────────────────────────

  if (typeof approval_id !== "string" || approval_id.trim() === "") {
    return failClosed("approval_id is required.");
  }

  if (
    !runtime_state ||
    typeof runtime_state !== "object" ||
    Array.isArray(runtime_state)
  ) {
    return failClosed("runtime_state is required.");
  }

  if (
    !operation ||
    typeof operation !== "object" ||
    Array.isArray(operation)
  ) {
    return failClosed("operation is required.");
  }

  if (
    !connection_context ||
    typeof connection_context !== "object" ||
    typeof connection_context.project_id !== "string" ||
    connection_context.project_id.trim() === ""
  ) {
    return failClosed("connection_context.project_id is required.");
  }

  // ── Resolve approval from _engine_outputs ─────────────────────────────────

  const approvalsArr =
    runtime_state?._engine_outputs?.execution_approvals?.execution_approvals;
  const approvals = Array.isArray(approvalsArr) ? approvalsArr : [];
  const approval = approvals.find(
    (a) => a && a.approval_id === approval_id
  );

  if (!approval) {
    return failClosed(`Approval not found: ${approval_id}.`);
  }

  // ── S3: execution_occurred must be false ───────────────────────────────────

  if (approval.execution_occurred !== false) {
    return failClosed(
      "Apply refused: approval.execution_occurred is not false."
    );
  }

  // ── Resolve candidate ─────────────────────────────────────────────────────

  const candidatesArr =
    runtime_state?._engine_outputs?.execution_eligibility?.execution_candidates;
  const candidates = Array.isArray(candidatesArr) ? candidatesArr : [];
  const candidate = candidates.find(
    (c) => c && c.candidate_id === approval.candidate_id
  );

  if (!candidate) {
    return failClosed(
      `Candidate not found: ${approval.candidate_id}.`
    );
  }

  // ── Preview must exist before apply ───────────────────────────────────────

  const previews = Array.isArray(runtime_state.previews)
    ? runtime_state.previews
    : [];
  const preview = previews.find(
    (p) => p && p.preview_id === approval.preview_id
  );

  if (!preview) {
    return failClosed(
      `Preview not found: ${approval.preview_id}. Preview must exist before apply.`
    );
  }

  // ── S12: Preview operation cross-check ────────────────────────────────────
  // When the preview carries target_model or target_operation (non-null and
  // non-undefined), the caller-supplied operation must match exactly.
  // Fail closed on mismatch. Skip when preview fields are null or undefined
  // (non-Executable checkpoints or previews without operation_definitions).

  if (preview.target_model != null && operation.model !== preview.target_model) {
    return failClosed(
      `Operation model '${operation.model}' does not match preview-bound model '${preview.target_model}'. Apply refused.`
    );
  }

  if (preview.target_operation != null && operation.method !== preview.target_operation) {
    return failClosed(
      `Operation method '${operation.method}' does not match preview-bound operation '${preview.target_operation}'. Apply refused.`
    );
  }

  // ── S4: Validate operation model ──────────────────────────────────────────

  if (
    typeof operation.model !== "string" ||
    !ALLOWED_APPLY_MODELS.includes(operation.model)
  ) {
    return failClosed(
      `Model '${operation.model}' is not in the allowed apply set: [${ALLOWED_APPLY_MODELS.join(", ")}].`
    );
  }

  // ── S5: Validate operation method ─────────────────────────────────────────

  if (
    typeof operation.method !== "string" ||
    !ALLOWED_APPLY_METHODS.includes(operation.method)
  ) {
    return failClosed(
      `Method '${operation.method}' is not in the allowed apply set: [${ALLOWED_APPLY_METHODS.join(", ")}].`
    );
  }

  // ── Validate values ───────────────────────────────────────────────────────

  if (
    !operation.values ||
    typeof operation.values !== "object" ||
    Array.isArray(operation.values)
  ) {
    return failClosed("operation.values must be a non-null plain object.");
  }

  // ── S6: write requires non-empty positive integer ids ────────────────────

  if (operation.method === "write") {
    if (!Array.isArray(operation.ids) || operation.ids.length === 0) {
      return failClosed(
        "operation.ids must be a non-empty array for write."
      );
    }
    if (!operation.ids.every((id) => Number.isInteger(id) && id > 0)) {
      return failClosed(
        "operation.ids must contain positive integers only."
      );
    }
  }

  // ── S7: Obtain OdooClient ─────────────────────────────────────────────────

  let client;
  try {
    client = _getClient
      ? _getClient(connection_context.project_id)
      : getClientForProject(connection_context.project_id);
  } catch (err) {
    return failClosed(
      `No live Odoo connection for project '${connection_context.project_id}': ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // ── S10: Build execution source inputs for auditability ──────────────────

  const executed_at = new Date().toISOString();
  const execution_source_inputs = {
    approval_id: approval.approval_id,
    candidate_id: candidate.candidate_id,
    preview_id: preview.preview_id,
    checkpoint_id: approval.checkpoint_id ?? null,
    safety_class: candidate.safety_class ?? null,
    model: operation.model,
    method: operation.method,
    project_id: connection_context.project_id,
  };

  // ── S5: Execute through application-layer boundary — no raw DB ───────────

  try {
    let odoo_result;

    if (operation.method === "write") {
      // OdooClient.write(model, ids, values) → calls execute_kw "write"
      odoo_result = await client.write(
        operation.model,
        operation.ids,
        operation.values
      );
    } else {
      // operation.method === "create"
      // OdooClient.create(model, values) → calls execute_kw "create"
      odoo_result = await client.create(
        operation.model,
        operation.values
      );
    }

    // ── Post-apply truth chain ─────────────────────────────────────────────
    // Produce execution record, flip execution_occurred on consumed approval,
    // and return updated_runtime_state so the caller holds the truth.

    const recordCandidates = Array.isArray(
      runtime_state?._engine_outputs?.execution_eligibility?.execution_candidates
    ) ? runtime_state._engine_outputs.execution_eligibility.execution_candidates : [];
    const recordCheckpoints = Array.isArray(runtime_state.checkpoints)
      ? runtime_state.checkpoints : [];

    const executionRecordOutput = computeExecutionRecords(
      [approval],
      recordCandidates,
      Array.isArray(runtime_state.previews) ? runtime_state.previews : [],
      recordCheckpoints,
      null,
      runtime_state.target_context ?? null,
      null,
      { result_status: "success" }
    );

    // Append execution record if record engine produced one (all 5 gates passed).
    const existingExecutions = Array.isArray(runtime_state.executions)
      ? runtime_state.executions : [];
    const updatedExecutions = executionRecordOutput.executions.length > 0
      ? appendExecution(existingExecutions, executionRecordOutput.executions[0])
      : existingExecutions;

    // Flip execution_occurred = true on the consumed approval in _engine_outputs.
    const existingApprovalsArr =
      runtime_state?._engine_outputs?.execution_approvals?.execution_approvals;
    const updatedApprovalsArr = Array.isArray(existingApprovalsArr)
      ? existingApprovalsArr.map((a) =>
          a && a.approval_id === approval_id ? { ...a, execution_occurred: true } : a
        )
      : existingApprovalsArr;

    // Build updated_runtime_state — new object, input runtime_state not mutated.
    const updated_runtime_state = {
      ...runtime_state,
      executions: updatedExecutions,
      _engine_outputs: runtime_state._engine_outputs
        ? {
            ...runtime_state._engine_outputs,
            execution_approvals: runtime_state._engine_outputs.execution_approvals
              ? {
                  ...runtime_state._engine_outputs.execution_approvals,
                  execution_approvals: updatedApprovalsArr,
                }
              : runtime_state._engine_outputs.execution_approvals,
          }
        : runtime_state._engine_outputs,
    };

    // Populate checkpoint_statuses on success only — preserves existing entries.
    // Uses approval.checkpoint_id exactly (S10). Only set when result_status === "success"
    // (this path). Failure path does not reach here (catch block below).
    if (approval.checkpoint_id != null) {
      const existingStatuses =
        updated_runtime_state.checkpoint_statuses != null &&
        typeof updated_runtime_state.checkpoint_statuses === "object" &&
        !Array.isArray(updated_runtime_state.checkpoint_statuses)
          ? updated_runtime_state.checkpoint_statuses
          : {};
      updated_runtime_state.checkpoint_statuses = {
        ...existingStatuses,
        [approval.checkpoint_id]: "Complete",
      };
    }

    // S8: Return truthful success result with post-apply runtime state.
    return {
      ok: true,
      result_status: "success",
      odoo_result,
      error: null,
      executed_at,
      execution_source_inputs,
      updated_runtime_state,
    };

  } catch (err) {
    // S9: Fail closed on any Odoo error
    return {
      ok: false,
      result_status: "failure",
      odoo_result: null,
      error: err instanceof Error ? err.message : "Odoo apply failed.",
      executed_at,
      execution_source_inputs,
    };
  }
}

// ---------------------------------------------------------------------------
// Internal: fail-closed envelope factory (S9)
// ---------------------------------------------------------------------------

function failClosed(reason) {
  return {
    ok: false,
    result_status: "failure",
    odoo_result: null,
    error: reason,
    executed_at: new Date().toISOString(),
    execution_source_inputs: null,
  };
}
