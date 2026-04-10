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
//   S13 Each key in operation.values must be a confirmed Odoo 19 field name for the
//       target model, as recorded in scripts/odoo-confirmed-fields.json (generated
//       from live fields_get() on test236). Fail closed on any unknown field name.
//       Skip validation for models not present in the confirmed-fields JSON —
//       no false refusals for unverified models.
// ---------------------------------------------------------------------------

import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { getClientForProject } from "./engine.js";
import { computeExecutionRecords } from "../shared/governed-execution-record-engine.js";
import { appendExecution } from "../shared/runtime-state-contract.js";

// ---------------------------------------------------------------------------
// Confirmed Odoo 19 fields — loaded once at module init (S13)
// Source: scripts/odoo-confirmed-fields.json (generated from live Odoo 19 fields_get())
// Used to validate operation.values keys against known Odoo 19 field names.
// Models absent from this JSON are skipped (no false refusals for unverified models).
// ---------------------------------------------------------------------------

const _require = createRequire(import.meta.url);
const _confirmedFieldsPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../scripts/odoo-confirmed-fields.json"
);

let _confirmedFieldsData;
try {
  _confirmedFieldsData = _require(_confirmedFieldsPath);
} catch {
  _confirmedFieldsData = null;
}

/**
 * Map from model name → Set of confirmed Odoo 19 field names.
 * Only populated for models present in odoo-confirmed-fields.json.
 * Models absent from the JSON are not in this map — field validation is skipped for them.
 */
export const CONFIRMED_FIELDS_BY_MODEL = Object.freeze(
  _confirmedFieldsData?.models
    ? Object.fromEntries(
        Object.entries(_confirmedFieldsData.models).map(([model, data]) => [
          model,
          Object.freeze(new Set(Object.keys(data.fields ?? {}))),
        ])
      )
    : {}
);

// ---------------------------------------------------------------------------
// Service version — increment on any rule change
// ---------------------------------------------------------------------------

export const GOVERNED_APPLY_SERVICE_VERSION = "2.2.0";

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
]);

// ---------------------------------------------------------------------------
// Excluded models — business data or transactional records, not implementation
// configuration. These models were evaluated and explicitly rejected.
// ---------------------------------------------------------------------------
//
// quality.alert        — operational incident records (business data), not config
// maintenance.equipment — asset/resource master records (business data), not config
// maintenance.request  — maintenance work orders (transactional), not config
// repair.order         — repair business documents (transactional), not config
// project.task         — operational task records (transactional), not config
// mrp.eco              — engineering change order documents (transactional), not config
// documents.share      — runtime sharing links (operational), not implementation config
// sale.order           — sales transaction documents (transactional), not config
//
// Deferred models (need more scoping before approval):
// mrp.bom              — DEFERRED: write classified conditional (affects open MOs);
//                        no operation definition emitted yet; needs bounded scope
// product.template     — DEFERRED: too broad (all products); no bounded checkpoint
//                        scoping the specific write intent; global impact risk

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

  // ── S13: Validate field names against confirmed Odoo 19 fields ───────────
  // Only applied when the model is present in CONFIRMED_FIELDS_BY_MODEL.
  // Unknown field names on a verified model → fail closed (prevents silent
  // Odoo failures from typos or invented fields).
  {
    const confirmedFields = CONFIRMED_FIELDS_BY_MODEL[operation.model];
    if (confirmedFields) {
      for (const fieldName of Object.keys(operation.values)) {
        if (!confirmedFields.has(fieldName)) {
          return failClosed(
            `Field '${fieldName}' is not a confirmed Odoo 19 field on model '${operation.model}'. Apply refused (S13).`
          );
        }
      }
    }
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
