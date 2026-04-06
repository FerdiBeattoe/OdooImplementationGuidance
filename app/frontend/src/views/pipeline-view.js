// ---------------------------------------------------------------------------
// Pipeline View — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Renders the pipeline screen. Reads pipeline runtime state from the
//   pipeline store. Delegates all actions to the store via callbacks.
//   No business logic. No state invention. Renders truthfully only.
//
// Hard rules:
//   V1  Reads state from pipelineStore — never from adapter directly.
//   V2  Actions call the provided callbacks — not the adapter or store directly.
//   V3  Renders each lifecycle status truthfully: idle/running/loading/
//       resuming/success/failure.
//   V4  runtime_state rendered as received — never mutated.
//   V5  not_found rendered distinctly when isNotFound is true.
//   V6  No business inference in render logic.
// ---------------------------------------------------------------------------

import { el } from "../lib/dom.js";
import { pipelineStore } from "../state/pipeline-store.js";
import { getPipelineViewModel } from "./pipeline-view-model.js";

// ---------------------------------------------------------------------------
// renderPipelineView
//
// @param {object} props
// @param {Function} props.onRun    — called with payload to start a pipeline run
// @param {Function} props.onLoad   — called with projectId to load saved state
// @param {Function} props.onResume — called with projectId to resume saved state
// ---------------------------------------------------------------------------

export function renderPipelineView({ onRun, onLoad, onResume, onApply, onSave, onConnect }) {
  const model = getPipelineViewModel(pipelineStore.getState());
  const { connection_registered, connection_project_id, connection_error } = pipelineStore.getState();
  return renderPipelineContent(model, {
    onRun, onLoad, onResume, onApply, onSave, onConnect,
    connection_registered: connection_registered ?? false,
    connection_project_id: connection_project_id ?? null,
    connection_error:      connection_error      ?? null,
  });
}

// ---------------------------------------------------------------------------
// renderPipelineContent
//
// Separated from renderPipelineView so it is callable with an explicit model
// in tests (without requiring a DOM-bootstrapped store).
//
// @param {object} model   — getPipelineViewModel() output
// @param {object} actions — { onRun, onLoad, onResume, onApply, onSave }
// ---------------------------------------------------------------------------

export function renderPipelineContent(model, { onRun, onLoad, onResume, onApply, onSave, onConnect, connection_registered, connection_project_id, connection_error }) {
  return el("section", { className: "workspace max-w-4xl mx-auto" }, [
    el("div", { className: "mb-8" }, [
      el("h1", { className: "text-3xl font-extrabold font-headline tracking-tight text-on-surface mb-2", text: "Pipeline" }),
      el("p", { className: "text-on-surface-variant", text: "Run, load, or resume the governed implementation pipeline." })
    ]),

    // ── Status banner ─────────────────────────────────────────────────────
    renderStatusBanner(model),

    // ── Actions ───────────────────────────────────────────────────────────
    model.isIdle || model.isSuccess || model.isFailure
      ? renderActions({ onRun, onLoad, onResume, onApply, onSave, onConnect, model, disabled: false, connection_registered, connection_project_id, connection_error })
      : renderActions({ onRun, onLoad, onResume, onApply, onSave, onConnect, model, disabled: true, connection_registered, connection_project_id, connection_error }),

    // ── Result panel ──────────────────────────────────────────────────────
    model.isSuccess ? renderRuntimeStatePanel(model.runtime_state, model.saved_at, model.apply_result) : null,
  ]);
}

// ---------------------------------------------------------------------------
// renderStatusBanner — truthful per lifecycle status
// ---------------------------------------------------------------------------

function renderStatusBanner(model) {
  if (model.isIdle) {
    return el("div", { className: "mb-6 p-4 rounded-lg bg-surface-container-low border border-outline-variant text-on-surface-variant text-sm" }, [
      el("span", { text: "No pipeline run active. Use the actions below to run, load, or resume." })
    ]);
  }

  if (model.isInProgress) {
    return el("div", { className: "mb-6 p-4 rounded-lg bg-surface-container border border-outline-variant" }, [
      el("span", { className: "text-sm font-medium text-on-surface", text: statusLabel(model.status) })
    ]);
  }

  if (model.isSuccess) {
    return el("div", { className: "mb-6 p-4 rounded-lg bg-surface-container-low border border-outline-variant text-on-surface text-sm font-medium" }, [
      el("span", { text: "Pipeline completed successfully." }),
      model.saved_at
        ? el("span", { className: "ml-2 text-on-surface-variant", text: `Saved at: ${model.saved_at}` })
        : null
    ]);
  }

  if (model.isNotFound) {
    return el("div", { className: "mb-6 p-4 rounded-lg bg-error-container border border-error text-on-error-container text-sm", dataset: { testid: "not-found-banner" } }, [
      el("span", { text: "Not found: " }),
      el("span", { text: model.error ?? "No saved pipeline state for this project." })
    ]);
  }

  if (model.isFailure) {
    return el("div", { className: "mb-6 p-4 rounded-lg bg-error-container border border-error text-on-error-container text-sm", dataset: { testid: "error-banner" } }, [
      el("span", { text: "Error: " }),
      el("span", { text: model.error ?? "Pipeline request failed." })
    ]);
  }

  return null;
}

// ---------------------------------------------------------------------------
// renderActions — run / load / resume controls
// ---------------------------------------------------------------------------

function renderActions({ onRun, onLoad, onResume, onApply, onSave, onConnect, model, disabled, connection_registered, connection_project_id, connection_error }) {
  return el("div", { className: "mb-6 flex flex-wrap gap-3" }, [
    // ── Run inputs — operator confirmation and deployment context ──────────
    el("div", { className: "w-full flex flex-wrap gap-2", dataset: { testid: "run-inputs" } }, [
      el("input", {
        type: "text",
        id: "pipeline-confirmed-by-input",
        placeholder: "Confirming operator (e.g. john.smith)",
        className: "flex-1 min-w-40 px-3 py-1.5 rounded-lg bg-surface-container-highest text-on-surface text-sm border border-outline-variant",
        dataset: { testid: "confirmed-by-input" },
      }),
      el("input", {
        type: "text",
        id: "pipeline-deployment-type-input",
        placeholder: "Deployment type (e.g. online, odoosh)",
        className: "flex-1 min-w-40 px-3 py-1.5 rounded-lg bg-surface-container-highest text-on-surface text-sm border border-outline-variant",
        dataset: { testid: "deployment-type-input" },
      }),
      el("input", {
        type: "text",
        id: "pipeline-primary-country-input",
        placeholder: "Primary country (e.g. United States)",
        className: "flex-1 min-w-40 px-3 py-1.5 rounded-lg bg-surface-container-highest text-on-surface text-sm border border-outline-variant",
        dataset: { testid: "primary-country-input" },
      }),
      el("input", {
        type: "text",
        id: "pipeline-primary-currency-input",
        placeholder: "Primary currency (e.g. USD)",
        className: "flex-1 min-w-40 px-3 py-1.5 rounded-lg bg-surface-container-highest text-on-surface text-sm border border-outline-variant",
        dataset: { testid: "primary-currency-input" },
      }),
      el("input", {
        type: "text",
        id: "pipeline-project-id-input",
        placeholder: "Project ID (e.g. proj-001)",
        className: "flex-1 min-w-40 px-3 py-1.5 rounded-lg bg-surface-container-highest text-on-surface text-sm border border-outline-variant",
        dataset: { testid: "project-id-input" },
      }),
      renderDiscoveryAnswerControls(),
      el("input", {
        type: "text",
        id: "pipeline-approval-granted-by-input",
        placeholder: "Approval granted-by (e.g. jane.doe)",
        className: "flex-1 min-w-40 px-3 py-1.5 rounded-lg bg-surface-container-highest text-on-surface text-sm border border-outline-variant",
        dataset: { testid: "approval-granted-by-input" },
      }),
    ]),

    // ── Pipeline connection — credential inputs for registry registration ──
    el("div", { className: "w-full flex flex-wrap gap-2 mt-1", dataset: { testid: "connection-inputs" } }, [
      el("input", {
        type: "text",
        id: "pipeline-connection-url-input",
        placeholder: "Odoo URL (https://your-instance.odoo.com)",
        className: "flex-1 min-w-48 px-3 py-1.5 rounded-lg bg-surface-container-highest text-on-surface text-sm border border-outline-variant",
        dataset: { testid: "connection-url-input" },
      }),
      el("input", {
        type: "text",
        id: "pipeline-connection-db-input",
        placeholder: "Database",
        className: "flex-1 min-w-28 px-3 py-1.5 rounded-lg bg-surface-container-highest text-on-surface text-sm border border-outline-variant",
        dataset: { testid: "connection-db-input" },
      }),
      el("input", {
        type: "text",
        id: "pipeline-connection-user-input",
        placeholder: "Username",
        className: "flex-1 min-w-28 px-3 py-1.5 rounded-lg bg-surface-container-highest text-on-surface text-sm border border-outline-variant",
        dataset: { testid: "connection-user-input" },
      }),
      el("input", {
        type: "password",
        id: "pipeline-connection-pass-input",
        placeholder: "Password",
        className: "flex-1 min-w-28 px-3 py-1.5 rounded-lg bg-surface-container-highest text-on-surface text-sm border border-outline-variant",
        dataset: { testid: "connection-pass-input" },
      }),
    ]),
    el("div", { className: "w-full flex flex-wrap items-center gap-3 mt-1" }, [
      el("button", {
        className: "px-4 py-2 rounded-lg bg-surface-container-highest text-on-surface text-sm font-semibold",
        dataset: { testid: "connect-pipeline-button" },
        onClick: () => {
          const projectId = (typeof document !== "undefined" && document.getElementById("pipeline-project-id-input")?.value?.trim()) || "";
          const url       = (typeof document !== "undefined" && document.getElementById("pipeline-connection-url-input")?.value?.trim()) || "";
          const database  = (typeof document !== "undefined" && document.getElementById("pipeline-connection-db-input")?.value?.trim()) || "";
          const username  = (typeof document !== "undefined" && document.getElementById("pipeline-connection-user-input")?.value?.trim()) || "";
          const password  = (typeof document !== "undefined" && document.getElementById("pipeline-connection-pass-input")?.value) || "";
          if (onConnect) onConnect(projectId, { url, database, username, password });
        }
      }, [el("span", { text: "Connect Pipeline" })]),
      connection_registered
        ? el("span", { className: "text-xs text-on-surface-variant", dataset: { testid: "connection-status" }, text: `Connected: ${connection_project_id ?? ""}` })
        : connection_error
          ? el("span", { className: "text-xs text-error", dataset: { testid: "connection-error" }, text: connection_error })
          : null,
    ]),

    el("button", {
      className: "text-sm font-semibold disabled:opacity-50",
      style: "background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.3); color: #92400e; border-radius: 6px; font-weight: 600; padding: 8px 20px; cursor: pointer;",
      disabled,
      dataset: { testid: "run-button" },
      onClick: () => {
        const confirmedBy        = (typeof document !== "undefined" && document.getElementById("pipeline-confirmed-by-input")?.value?.trim())           || null;
        const deploymentType     = (typeof document !== "undefined" && document.getElementById("pipeline-deployment-type-input")?.value?.trim())         || null;
        const primaryCountry     = (typeof document !== "undefined" && document.getElementById("pipeline-primary-country-input")?.value?.trim())         || null;
        const primaryCurrency    = (typeof document !== "undefined" && document.getElementById("pipeline-primary-currency-input")?.value?.trim())        || null;
        const projectId          = (typeof document !== "undefined" && document.getElementById("pipeline-project-id-input")?.value?.trim())              || null;
        const approvalGrantedBy  = (typeof document !== "undefined" && document.getElementById("pipeline-approval-granted-by-input")?.value?.trim())     || null;

        const targetCtx = {};
        if (deploymentType  !== null) targetCtx.deployment_type  = deploymentType;
        if (primaryCountry  !== null) targetCtx.primary_country  = primaryCountry;
        if (primaryCurrency !== null) targetCtx.primary_currency = primaryCurrency;

        const parsedAnswers = collectDiscoveryAnswers();

        onRun({
          project_identity:  projectId ? { project_id: projectId } : null,
          discovery_answers: { confirmed_by: confirmedBy, answers: parsedAnswers },
          target_context:    Object.keys(targetCtx).length > 0 ? targetCtx : null,
          approval_context:  approvalGrantedBy ? { approval_granted_by: approvalGrantedBy } : null,
        });
      }
    }, [el("span", { text: "Run Pipeline" })]),

    el("button", {
      className: "text-sm font-semibold disabled:opacity-50",
      style: "background: rgba(12,26,48,0.06); border: 1px solid rgba(12,26,48,0.15); color: #0c1a30; border-radius: 6px; padding: 8px 20px; cursor: pointer;",
      disabled,
      dataset: { testid: "load-button" },
      onClick: () => {
        const projectId = (typeof document !== "undefined" && document.getElementById("pipeline-project-id-input")?.value) || "";
        onLoad(projectId);
      }
    }, [el("span", { text: "Load State" })]),

    el("button", {
      className: "text-sm font-semibold disabled:opacity-50",
      style: "background: rgba(12,26,48,0.06); border: 1px solid rgba(12,26,48,0.15); color: #0c1a30; border-radius: 6px; padding: 8px 20px; cursor: pointer;",
      disabled,
      dataset: { testid: "resume-button" },
      onClick: () => {
        const projectId = (typeof document !== "undefined" && document.getElementById("pipeline-project-id-input")?.value) || "";
        onResume(projectId);
      }
    }, [el("span", { text: "Resume State" })]),

    model?.canSave
      ? el("button", {
          className: "px-4 py-2 rounded-lg bg-secondary text-on-secondary text-sm font-semibold disabled:opacity-50",
          disabled,
          dataset: { testid: "save-button" },
          onClick: () => onSave(model.runtime_state)
        }, [el("span", { text: "Save State" })])
      : null,

    model?.canApply
      ? el("button", {
          className: "px-4 py-2 rounded-lg bg-tertiary text-on-tertiary text-sm font-semibold disabled:opacity-50",
          disabled,
          dataset: { testid: "apply-button" },
          onClick: () => {
            const approvalId = model.firstUnappliedApprovalId;
            const projectId = (model.runtime_state?.project_identity?.project_id ?? "").trim();
            const opModel  = model.previewTargetModel  ?? "";
            const opMethod = model.previewTargetOperation ?? "";
            const idsRaw    = (typeof document !== "undefined" && document.getElementById("pipeline-apply-ids-input")?.value)    || "";
            const valuesRaw = (typeof document !== "undefined" && document.getElementById("pipeline-apply-values-input")?.value) || "{}";

            let values;
            try {
              values = JSON.parse(valuesRaw || "{}");
            } catch {
              return; // refuse malformed JSON — do not dispatch
            }

            const operation = { model: opModel, method: opMethod, values };
            if (opMethod === "write" && idsRaw.trim()) {
              operation.ids = idsRaw.split(",")
                .map((s) => parseInt(s.trim(), 10))
                .filter((n) => Number.isInteger(n) && n > 0);
            }

            onApply({
              approval_id: approvalId,
              runtime_state: model.runtime_state,
              operation,
              connection_context: { project_id: projectId },
            });
          }
        }, [el("span", { text: "Apply" })])
      : null,

    // ── Operation inputs — rendered when Apply is available ───────────────
    model?.canApply
      ? el("div", { className: "w-full mt-2 flex flex-wrap gap-2", dataset: { testid: "apply-operation-inputs" } }, [
          // Preview-bound model: read-only display, not a free-text input
          el("div", {
            className: "flex-1 min-w-40 px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface text-sm border border-outline-variant",
            dataset: { testid: "apply-model-display" },
            text: model.previewTargetModel,
          }),
          // Preview-bound operation: read-only display, not a free-text input
          el("div", {
            className: "flex-1 min-w-32 px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface text-sm border border-outline-variant",
            dataset: { testid: "apply-operation-display" },
            text: model.previewTargetOperation,
          }),
          model.previewIntendedChanges != null
            ? el("div", {
                className: "w-full px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface-variant text-xs border border-outline-variant font-mono",
                dataset: { testid: "apply-intended-changes-display" },
                text: JSON.stringify(model.previewIntendedChanges),
              })
            : null,
          el("input", {
            type: "text",
            id: "pipeline-apply-ids-input",
            placeholder: "IDs (comma-separated, write only)",
            className: "flex-1 min-w-40 px-3 py-1.5 rounded-lg bg-surface-container-highest text-on-surface text-sm border border-outline-variant",
            dataset: { testid: "apply-ids-input" },
          }),
          el("input", {
            type: "text",
            id: "pipeline-apply-values-input",
            placeholder: '{"field": "value"}',
            className: "flex-1 min-w-48 px-3 py-1.5 rounded-lg bg-surface-container-highest text-on-surface text-sm border border-outline-variant",
            dataset: { testid: "apply-values-input" },
          }),
        ])
      : null,

    // ── Preview resolution error — shown when unapplied approval exists
    // but preview cannot be resolved or required fields are null ──────────
    model?.previewResolutionError
      ? el("div", { className: "w-full mt-2 p-3 rounded-lg bg-error-container border border-error text-on-error-container text-sm", dataset: { testid: "preview-resolution-error" } }, [
          el("span", { text: `Preview resolution error: ${model.previewResolutionError}` })
        ])
      : null,
  ]);
}

// ---------------------------------------------------------------------------
// renderRuntimeStatePanel — success display, runtime_state unmodified
// ---------------------------------------------------------------------------

function renderRuntimeStatePanel(runtime_state, saved_at, apply_result) {
  const projectId = runtime_state?.project_identity?.project_id ?? null;
  const stage = runtime_state?.stage_routing?.current_stage ?? null;
  const previews = runtime_state?.previews ?? [];
  const hasPreviews = previews.length > 0;

  return el("div", { className: "bg-surface-container-low rounded-xl p-6 border border-outline-variant", dataset: { testid: "runtime-state-panel" } }, [
    el("h2", { className: "text-lg font-bold font-headline mb-4 text-on-surface", text: "Pipeline Result" }),
    projectId
      ? el("p", { className: "text-sm text-on-surface-variant mb-2" }, [
          el("span", { className: "font-medium text-on-surface", text: "Project: " }),
          el("span", { text: projectId })
        ])
      : null,
    stage
      ? el("p", { className: "text-sm text-on-surface-variant mb-2" }, [
          el("span", { className: "font-medium text-on-surface", text: "Stage: " }),
          el("span", { text: stage })
        ])
      : null,
    saved_at
      ? el("p", { className: "text-xs text-on-surface-variant mt-4", text: `Persisted at: ${saved_at}` })
      : null,

    // ── Apply result ───────────────────────────────────────────────────────
    apply_result != null
      ? el("div", { className: "mt-4 p-4 border border-outline-variant rounded-lg bg-surface-container text-sm", dataset: { testid: "apply-result" } }, [
          el("p", { className: "font-semibold text-on-surface mb-2", text: "Apply Result" }),
          el("p", { className: "text-on-surface-variant mb-1" }, [
            el("span", { className: "font-medium text-on-surface", text: "Status: " }),
            el("span", { dataset: { testid: "apply-result-status" }, text: String(apply_result.result_status ?? "—") })
          ]),
          el("p", { className: "text-on-surface-variant mb-1" }, [
            el("span", { className: "font-medium text-on-surface", text: "Executed at: " }),
            el("span", { dataset: { testid: "apply-result-executed-at" }, text: String(apply_result.executed_at ?? "—") })
          ]),
          apply_result.odoo_result != null
            ? el("p", { className: "text-on-surface-variant mb-1" }, [
                el("span", { className: "font-medium text-on-surface", text: "Odoo result: " }),
                el("span", { dataset: { testid: "apply-result-odoo-result" }, text: JSON.stringify(apply_result.odoo_result) })
              ])
            : null,
        ])
      : null,

    // ── Preview records or empty-preview diagnostic ────────────────────────
    ...(!hasPreviews
      ? [el("div", { className: "mt-4 p-4 border border-outline-variant rounded-lg bg-surface-container text-sm text-on-surface-variant", dataset: { testid: "empty-preview-diagnostic" } }, [
          el("p", { className: "font-semibold text-on-surface mb-2", text: "No preview records" }),
          el("p", { className: "mb-1", text: "The pipeline completed without generating any governed operation previews." }),
          el("p", { className: "mb-1", text: "Verify that:" }),
          el("ul", { className: "list-disc pl-4 space-y-1" }, [
            el("li", { text: "Discovery answers include at least one domain-activating question answered affirmatively (e.g. FC-01 \u2192 \"Full accounting\", MF-01 \u2192 \"Yes\", OP-01 \u2192 \"Yes\")." }),
            el("li", { text: "The project ID matches a valid previously-run pipeline state." }),
            stage
              ? el("li", { text: `Current stage is "${stage}" \u2014 confirm this stage has governed operations defined.` })
              : el("li", { text: "Stage routing did not resolve \u2014 re-check project identity and run inputs." }),
          ]),
        ])]
      : previews.map(preview =>
          el("div", { className: "mt-4 p-4 border border-outline-variant rounded-lg bg-surface-container text-sm", dataset: { testid: "preview-record" } }, [
            el("p", { className: "text-on-surface-variant mb-1" }, [
              el("span", { className: "font-medium text-on-surface", text: "Checkpoint: " }),
              el("span", { dataset: { testid: "preview-checkpoint-id" }, text: String(preview.checkpoint_id ?? "—") })
            ]),
            el("p", { className: "text-on-surface-variant mb-1" }, [
              el("span", { className: "font-medium text-on-surface", text: "Model: " }),
              el("span", { text: String(preview.target_model ?? "—") })
            ]),
            el("p", { className: "text-on-surface-variant mb-1" }, [
              el("span", { className: "font-medium text-on-surface", text: "Operation: " }),
              el("span", { text: String(preview.target_operation ?? "—") })
            ]),
            el("p", { className: "text-on-surface-variant mb-1" }, [
              el("span", { className: "font-medium text-on-surface", text: "Safety Class: " }),
              el("span", { dataset: { testid: "preview-safety-class" }, text: String(preview.safety_class ?? "—") })
            ]),
            el("p", { className: "text-on-surface-variant mb-1" }, [
              el("span", { className: "font-medium text-on-surface", text: "Intended Changes: " }),
              el("span", { text: preview.intended_changes != null ? JSON.stringify(preview.intended_changes) : "—" })
            ]),
            el("p", { className: "text-on-surface-variant mb-1" }, [
              el("span", { className: "font-medium text-on-surface", text: "Execution Approval Implied: " }),
              el("span", { text: String(preview.execution_approval_implied ?? "—") })
            ]),
          ])
        )
    ),
  ]);
}

// ---------------------------------------------------------------------------
// statusLabel — human-readable label for in-progress statuses
// ---------------------------------------------------------------------------

function statusLabel(status) {
  if (status === "running")  return "Running pipeline\u2026";
  if (status === "loading")  return "Loading saved state\u2026";
  if (status === "resuming") return "Resuming saved state\u2026";
  return "Processing\u2026";
}

// ---------------------------------------------------------------------------
// renderDiscoveryAnswerControls
//
// Replaces the raw JSON discovery-answers input with structured labeled
// controls for every question ID referenced in checkpoint-engine.js.
// Only question IDs that appear in checkpoint guard conditions are included.
// ---------------------------------------------------------------------------

function renderDiscoveryAnswerControls() {
  const labelCls  = "block text-xs text-on-surface-variant mb-0.5";
  const selectCls = "w-full px-2 py-1 rounded bg-surface-container-highest text-on-surface text-xs border border-outline-variant";
  const inputCls  = "w-full px-2 py-1 rounded bg-surface-container-highest text-on-surface text-xs border border-outline-variant";
  const groupCls  = "flex flex-col";
  const hdrCls    = "col-span-2 text-xs font-semibold text-on-surface-variant pt-2 mt-1 border-t border-outline-variant";

  const boolQ = (key, label) =>
    el("div", { className: groupCls }, [
      el("label", { className: labelCls, text: label }),
      el("select", { className: selectCls, dataset: { discoveryKey: key } }, [
        el("option", { value: "", text: "\u2014" }),
        el("option", { value: "Yes", text: "Yes" }),
        el("option", { value: "No",  text: "No"  }),
      ]),
    ]);

  const enumQ = (key, label, opts) =>
    el("div", { className: groupCls }, [
      el("label", { className: labelCls, text: label }),
      el("select", { className: selectCls, dataset: { discoveryKey: key } }, [
        el("option", { value: "", text: "\u2014" }),
        ...opts.map(o => el("option", { value: o, text: o })),
      ]),
    ]);

  const numQ = (key, label) =>
    el("div", { className: groupCls }, [
      el("label", { className: labelCls, text: label }),
      el("input", { type: "number", className: inputCls, min: "0", dataset: { discoveryKey: key } }),
    ]);

  const textQ = (key, label, placeholder) =>
    el("div", { className: groupCls }, [
      el("label", { className: labelCls, text: label }),
      el("input", { type: "text", className: inputCls, placeholder, dataset: { discoveryKey: key } }),
    ]);

  const multiQ = (key, label, opts) =>
    el("div", { className: `${groupCls} col-span-2` }, [
      el("label", { className: labelCls, text: `${label} \u2014 hold Ctrl/Cmd to select multiple` }),
      el("select", { className: selectCls, multiple: "true", size: String(opts.length), dataset: { discoveryKey: key } }, [
        ...opts.map(o => el("option", { value: o, text: o })),
      ]),
    ]);

  const hdr = (text) => el("div", { className: hdrCls, text });

  return el("details", { className: "w-full mt-1", dataset: { testid: "discovery-answers-section" } }, [
    el("summary", { className: "text-sm font-medium text-on-surface-variant px-2 py-1 rounded select-none", text: "Discovery Answers" }),
    el("div", { className: "grid grid-cols-2 gap-x-3 gap-y-2 mt-2 p-3 rounded-lg bg-surface-container border border-outline-variant" }, [
      hdr("Business Model"),
      boolQ("BM-02", "Multi-company setup?"),
      boolQ("BM-04", "Multiple currencies?"),
      numQ("BM-05",  "Number of companies"),

      hdr("Financial / Accounting"),
      enumQ("FC-01", "Accounting scope",          ["Full accounting", "Cash basis"]),
      enumQ("FC-02", "Inventory costing method",  ["AVCO", "FIFO", "Standard Price"]),
      boolQ("FC-03", "Analytic accounting?"),
      boolQ("FC-04", "Lock posted entries?"),
      boolQ("FC-05", "Tax included in price?"),
      boolQ("FC-06", "Round globally?"),

      hdr("Manufacturing"),
      boolQ("MF-01", "Manufacturing enabled?"),
      enumQ("MF-02", "Bill of Materials type",    ["Multi-level", "Phantom"]),
      boolQ("MF-03", "By-products?"),
      boolQ("MF-04", "Subcontracting?"),
      boolQ("MF-05", "Work orders?"),
      multiQ("MF-06", "Tracked inventory types",  ["Receipt", "In-process", "Finished goods"]),

      hdr("Operations / Inventory"),
      boolQ("OP-01", "Lots / serial numbers?"),
      numQ("OP-02",  "Expiration date tracking (days)"),

      hdr("Procurement"),
      enumQ("PI-02", "Purchase order approval",   ["No approval", "Threshold", "All orders"]),
      enumQ("PI-03", "Inventory routes",          ["2 steps", "3 steps"]),
      textQ("PI-04", "Costing / valuation method","e.g. Standard Price"),
      boolQ("PI-05", "Dropshipping?"),

      hdr("Route Management"),
      boolQ("RM-02", "Resupply routes?"),
      boolQ("RM-04", "Multi-warehouse?"),

      hdr("Sales"),
      boolQ("SC-02", "Sales margins?"),
      boolQ("SC-03", "Sales warnings?"),
      enumQ("SC-04", "Expense approval",          ["Manager approval", "No approval"]),

      hdr("Timesheet / Approvals"),
      boolQ("TA-02", "Manager approval for time-off?"),
      multiQ("TA-03", "Multi-step approval groups", ["HR leave", "Inventory adjustments", "Expenses", "Manufacturing order", "Document signing"]),
    ]),
  ]);
}

// ---------------------------------------------------------------------------
// collectDiscoveryAnswers
//
// Reads all [data-discovery-key] elements in the document and builds the
// answers object. Multi-selects yield arrays; number inputs yield numbers;
// all others yield strings. Empty/unset fields are omitted.
// ---------------------------------------------------------------------------

function collectDiscoveryAnswers() {
  if (typeof document === "undefined") return {};
  const answers = {};
  document.querySelectorAll("[data-discovery-key]").forEach(node => {
    const key = node.dataset.discoveryKey;
    if (!key) return;
    if (node.tagName === "SELECT" && node.multiple) {
      const selected = Array.from(node.selectedOptions).map(o => o.value).filter(Boolean);
      if (selected.length > 0) answers[key] = selected;
    } else if (node.type === "number") {
      const v = node.value.trim();
      if (v !== "") answers[key] = Number(v);
    } else if (node.tagName === "SELECT" || node.tagName === "INPUT") {
      const v = (node.value ?? "").trim();
      if (v) answers[key] = v;
    }
  });
  return answers;
}
