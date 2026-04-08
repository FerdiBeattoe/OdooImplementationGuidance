// ---------------------------------------------------------------------------
// Pipeline Dashboard Tests — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Unit tests for the pipeline dashboard view and its pure helper functions.
//   Uses jsdom for DOM rendering tests. All API calls are mocked via injected
//   fetch or by testing the pure functions directly.
//
// Coverage:
//   1. Completion percentage calculation — 0%, partial, 100%
//   2. Domain status derivation — Not Started, In Progress, Complete, Blocked
//   3. Next action label for each checkpoint state combination
//   4. Priority ordering for "next highest priority checkpoint"
//   5. Deferred questions banner shows/hides correctly
//   6. Execute button calls correct API endpoint (via onApply callback)
//   7. Confirm panel opens and submits correctly
//   8. Refresh reloads runtime state and rerenders
// ---------------------------------------------------------------------------

import { JSDOM } from "jsdom";

// Set up global DOM before importing view (el() reads document at call time)
const jsdom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
globalThis.document  = jsdom.window.document;
globalThis.fetch     = async () => ({ ok: true, json: async () => ({ ok: true }) });

import test from "node:test";
import assert from "node:assert/strict";

import {
  ONBOARDING_RESUME_ROUTE,
  humanizeDomainId,
  buildCarryOverBlock,
  getCheckpointRecords,
  getActivatedDomainIds,
  deriveCompletionPercentage,
  deriveDomainStatus,
  deriveNextAction,
  derivePriorityScore,
  findHighestPriorityCheckpoint,
  getDeferredCount,
  buildDiscoveryAnswers,
  renderDashboardContent,
  triggerRefresh,
} from "./pipeline-dashboard.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCheckpoint(overrides = {}) {
  return {
    checkpoint_id:    "TST-001",
    domain:           "foundation",
    checkpoint_class: "Foundational",
    validation_source:"User_Confirmed",
    status:           "Not_Started",
    execution_relevance: "Informational",
    safety_class:     "Not_Applicable",
    dependencies:     [],
    preview_required: false,
    ...overrides,
  };
}

function makeRuntimeState(overrides = {}) {
  return {
    project_identity:  { project_id: "test-project" },
    target_context:    { deployment_type: "on_premise", primary_country: "US", primary_currency: "USD" },
    discovery_answers: { answers: {} },
    checkpoints:       { records: [], engine_version: "1.0.0", generated_at: "2026-01-01T00:00:00Z" },
    activated_domains: { domains: [], activated_at: null, activation_engine_version: null },
    blockers:          { active_blockers: [], total_count: 0 },
    previews:          [],
    _engine_outputs:   { execution_approvals: { execution_approvals: [] } },
    checkpoint_statuses: null,
    ...overrides,
  };
}

function makePsState(overrides = {}) {
  return {
    status:        "success",
    runtime_state: makeRuntimeState(),
    error:         null,
    not_found:     false,
    saved_at:      null,
    apply_result:  null,
    connection_registered: false,
    connection_project_id: null,
    connection_error:      null,
    ...overrides,
  };
}

function makeObState(overrides = {}) {
  return {
    screen:            "summary",
    industry_id:       "retail",
    industry_name:     "Retail",
    connection:        { project_id: "test-project", url: "https://test.odoo.com", database: null, registered_at: null },
    answers:           {},
    status:            "success",
    error:             null,
    confirmed:         true,
    ...overrides,
  };
}

function renderAndAppend(psState, obState, callbacks = {}) {
  document.body.innerHTML = "";
  const noop = () => {};
  const node = renderDashboardContent({
    psState,
    obState,
    onNavigate: callbacks.onNavigate ?? noop,
    onRun:      callbacks.onRun      ?? noop,
    onLoad:     callbacks.onLoad     ?? noop,
    onApply:    callbacks.onApply    ?? noop,
    onSave:     callbacks.onSave     ?? noop,
  });
  document.body.appendChild(node);
  return node;
}

// ---------------------------------------------------------------------------
// 1. Completion percentage calculation
// ---------------------------------------------------------------------------

test("deriveCompletionPercentage returns 0 when no checkpoints", () => {
  assert.equal(deriveCompletionPercentage([]), 0);
});

test("deriveCompletionPercentage returns 0 when no checkpoints are Complete", () => {
  const cps = [
    makeCheckpoint({ status: "Not_Started" }),
    makeCheckpoint({ checkpoint_id: "TST-002", status: "Not_Started" }),
  ];
  assert.equal(deriveCompletionPercentage(cps), 0);
});

test("deriveCompletionPercentage returns 50 for half complete", () => {
  const cps = [
    makeCheckpoint({ status: "Complete" }),
    makeCheckpoint({ checkpoint_id: "TST-002", status: "Not_Started" }),
  ];
  assert.equal(deriveCompletionPercentage(cps), 50);
});

test("deriveCompletionPercentage returns 100 when all Complete", () => {
  const cps = [
    makeCheckpoint({ status: "Complete" }),
    makeCheckpoint({ checkpoint_id: "TST-002", status: "Complete" }),
  ];
  assert.equal(deriveCompletionPercentage(cps), 100);
});

test("deriveCompletionPercentage rounds to nearest whole number", () => {
  const cps = [
    makeCheckpoint({ status: "Complete" }),
    makeCheckpoint({ checkpoint_id: "TST-002", status: "Not_Started" }),
    makeCheckpoint({ checkpoint_id: "TST-003", status: "Not_Started" }),
  ];
  // 1/3 = 33.33... → 33
  assert.equal(deriveCompletionPercentage(cps), 33);
});

test("deriveCompletionPercentage handles null entries gracefully", () => {
  const cps = [
    null,
    makeCheckpoint({ status: "Complete" }),
    undefined,
  ];
  // 1 complete out of 3 total (nulls count as non-complete)
  assert.equal(deriveCompletionPercentage(cps), 33);
});

// ---------------------------------------------------------------------------
// 2. Domain status derivation
// ---------------------------------------------------------------------------

test("deriveDomainStatus returns Not Started when no checkpoints are Complete", () => {
  const cps = [makeCheckpoint({ status: "Not_Started" })];
  assert.equal(deriveDomainStatus(cps, []), "Not Started");
});

test("deriveDomainStatus returns In Progress when some checkpoints are Complete", () => {
  const cps = [
    makeCheckpoint({ status: "Complete" }),
    makeCheckpoint({ checkpoint_id: "TST-002", status: "Not_Started" }),
  ];
  assert.equal(deriveDomainStatus(cps, []), "In Progress");
});

test("deriveDomainStatus returns Complete when all checkpoints are Complete", () => {
  const cps = [
    makeCheckpoint({ status: "Complete" }),
    makeCheckpoint({ checkpoint_id: "TST-002", status: "Complete" }),
  ];
  assert.equal(deriveDomainStatus(cps, []), "Complete");
});

test("deriveDomainStatus returns Blocked when active blocker references domain checkpoint", () => {
  const cps = [makeCheckpoint({ checkpoint_id: "FND-001", status: "Not_Started" })];
  const blockers = [{ source_checkpoint_id: "FND-001", blocker_type: "dependency_unmet", blocking_checkpoint_id: "USR-001" }];
  assert.equal(deriveDomainStatus(cps, blockers), "Blocked");
});

test("deriveDomainStatus returns Not Started for empty checkpoint list", () => {
  assert.equal(deriveDomainStatus([], []), "Not Started");
});

test("deriveDomainStatus returns Not Started when domainCps is not an array", () => {
  assert.equal(deriveDomainStatus(null, []), "Not Started");
});

test("deriveDomainStatus is Not Blocked when blocker references different domain", () => {
  const cps = [makeCheckpoint({ checkpoint_id: "FND-001", status: "Not_Started" })];
  const blockers = [{ source_checkpoint_id: "ACC-999", blocker_type: "dependency_unmet" }];
  assert.equal(deriveDomainStatus(cps, blockers), "Not Started");
});

// ---------------------------------------------------------------------------
// 3. Next action label
// ---------------------------------------------------------------------------

test("deriveNextAction returns Done when domain is Complete", () => {
  assert.equal(deriveNextAction([], [], "Complete"), "Done");
});

test("deriveNextAction returns Confirmation required for User_Confirmed next checkpoint", () => {
  const cps = [makeCheckpoint({ status: "Not_Started", validation_source: "User_Confirmed", execution_relevance: "Informational" })];
  assert.equal(deriveNextAction(cps, [], "Not Started"), "Confirmation required");
});

test("deriveNextAction returns Ready to execute for Executable next checkpoint", () => {
  const cps = [makeCheckpoint({ status: "Not_Started", execution_relevance: "Executable" })];
  assert.equal(deriveNextAction(cps, [], "In Progress"), "Ready to execute");
});

test("deriveNextAction returns Confirmation required for Informational next checkpoint", () => {
  const cps = [makeCheckpoint({ status: "Not_Started", validation_source: "Both", execution_relevance: "Informational" })];
  // With validation_source !== User_Confirmed and rel=Informational
  const result = deriveNextAction(cps, [], "Not Started");
  assert.equal(result, "Confirmation required");
});

test("deriveNextAction returns Blocked message when domain is Blocked and blocker has blocking_checkpoint_id", () => {
  const cps = [makeCheckpoint({ checkpoint_id: "FND-001", status: "Not_Started" })];
  const blockers = [{ source_checkpoint_id: "FND-001", blocker_type: "dependency_unmet", blocking_checkpoint_id: "USR-FOUND-001" }];
  const result = deriveNextAction(cps, blockers, "Blocked");
  assert.ok(result.includes("Blocked"), "result must include Blocked");
  assert.ok(result.includes("USR-FOUND-001"), "result must include the blocking checkpoint ID");
});

test("deriveNextAction returns Blocked when domain is Blocked with no specific dependency info", () => {
  const cps = [makeCheckpoint({ checkpoint_id: "FND-001", status: "Not_Started" })];
  assert.equal(deriveNextAction(cps, [], "Blocked"), "Blocked");
});

test("deriveNextAction skips Complete checkpoints to find next incomplete", () => {
  const cps = [
    makeCheckpoint({ checkpoint_id: "TST-001", status: "Complete" }),
    makeCheckpoint({ checkpoint_id: "TST-002", status: "Not_Started", execution_relevance: "Executable" }),
  ];
  assert.equal(deriveNextAction(cps, [], "In Progress"), "Ready to execute");
});

// ---------------------------------------------------------------------------
// 4. Priority ordering
// ---------------------------------------------------------------------------

test("derivePriorityScore: Executable Safe = 0", () => {
  const cp = makeCheckpoint({ execution_relevance: "Executable", safety_class: "Safe", status: "Not_Started" });
  assert.equal(derivePriorityScore(cp), 0);
});

test("derivePriorityScore: Executable Conditional = 1", () => {
  const cp = makeCheckpoint({ execution_relevance: "Executable", safety_class: "Conditional", status: "Not_Started" });
  assert.equal(derivePriorityScore(cp), 1);
});

test("derivePriorityScore: User_Confirmed = 2", () => {
  const cp = makeCheckpoint({ validation_source: "User_Confirmed", execution_relevance: "Informational", status: "Not_Started" });
  assert.equal(derivePriorityScore(cp), 2);
});

test("derivePriorityScore: Informational (non-User_Confirmed) = 3", () => {
  const cp = makeCheckpoint({ validation_source: "Both", execution_relevance: "Informational", status: "Not_Started" });
  assert.equal(derivePriorityScore(cp), 3);
});

test("derivePriorityScore: Complete = Infinity", () => {
  const cp = makeCheckpoint({ status: "Complete" });
  assert.equal(derivePriorityScore(cp), Infinity);
});

test("derivePriorityScore: null cp = Infinity", () => {
  assert.equal(derivePriorityScore(null), Infinity);
});

test("findHighestPriorityCheckpoint returns Executable Safe before Executable Conditional", () => {
  const cps = [
    makeCheckpoint({ checkpoint_id: "A", execution_relevance: "Executable", safety_class: "Conditional", status: "Not_Started" }),
    makeCheckpoint({ checkpoint_id: "B", execution_relevance: "Executable", safety_class: "Safe", status: "Not_Started" }),
  ];
  const result = findHighestPriorityCheckpoint(cps, []);
  assert.equal(result?.checkpoint_id, "B", "Safe must be returned before Conditional");
});

test("findHighestPriorityCheckpoint returns Executable Conditional before User_Confirmed", () => {
  const cps = [
    makeCheckpoint({ checkpoint_id: "A", validation_source: "User_Confirmed", execution_relevance: "Informational", status: "Not_Started" }),
    makeCheckpoint({ checkpoint_id: "B", execution_relevance: "Executable", safety_class: "Conditional", status: "Not_Started" }),
  ];
  const result = findHighestPriorityCheckpoint(cps, []);
  assert.equal(result?.checkpoint_id, "B");
});

test("findHighestPriorityCheckpoint skips Complete checkpoints", () => {
  const cps = [
    makeCheckpoint({ checkpoint_id: "A", execution_relevance: "Executable", safety_class: "Safe", status: "Complete" }),
    makeCheckpoint({ checkpoint_id: "B", validation_source: "User_Confirmed", execution_relevance: "Informational", status: "Not_Started" }),
  ];
  const result = findHighestPriorityCheckpoint(cps, []);
  assert.equal(result?.checkpoint_id, "B");
});

test("findHighestPriorityCheckpoint skips blocked checkpoints", () => {
  const cps = [
    makeCheckpoint({ checkpoint_id: "A", execution_relevance: "Executable", safety_class: "Safe", status: "Not_Started" }),
    makeCheckpoint({ checkpoint_id: "B", validation_source: "User_Confirmed", execution_relevance: "Informational", status: "Not_Started" }),
  ];
  const blockers = [{ source_checkpoint_id: "A", blocker_type: "dependency_unmet" }];
  const result = findHighestPriorityCheckpoint(cps, blockers);
  assert.equal(result?.checkpoint_id, "B", "Blocked checkpoint A must be skipped");
});

test("findHighestPriorityCheckpoint returns null when all checkpoints are Complete", () => {
  const cps = [
    makeCheckpoint({ status: "Complete" }),
    makeCheckpoint({ checkpoint_id: "TST-002", status: "Complete" }),
  ];
  assert.equal(findHighestPriorityCheckpoint(cps, []), null);
});

test("findHighestPriorityCheckpoint returns null for empty array", () => {
  assert.equal(findHighestPriorityCheckpoint([], []), null);
});

// ---------------------------------------------------------------------------
// 5. Deferred questions banner shows/hides correctly
// ---------------------------------------------------------------------------

test("getDeferredCount returns 0 when no answers are deferred", () => {
  const ob = makeObState({ answers: { "Q1": { answer: "Yes", deferred: false } } });
  assert.equal(getDeferredCount(ob), 0);
});

test("getDeferredCount counts deferred answers", () => {
  const ob = makeObState({
    answers: {
      "Q1": { answer: null, deferred: true },
      "Q2": { answer: "Yes", deferred: false },
      "Q3": { answer: null, deferred: true },
    },
  });
  assert.equal(getDeferredCount(ob), 2);
});

test("getDeferredCount returns 0 for empty answers", () => {
  const ob = makeObState({ answers: {} });
  assert.equal(getDeferredCount(ob), 0);
});

test("getDeferredCount returns 0 when obState has no answers field", () => {
  assert.equal(getDeferredCount({}), 0);
});

test("Deferred banner renders when deferred count > 0", () => {
  const ob = makeObState({ answers: { "Q1": { answer: null, deferred: true } } });
  const ps = makePsState();
  renderAndAppend(ps, ob);
  const banner = document.querySelector("[data-testid='deferred-banner']");
  assert.ok(banner !== null, "deferred-banner must be present when count > 0");
  assert.ok(banner.textContent.includes("1 unanswered question"), "banner text must include count");
});

test("Deferred banner does NOT render when no deferred questions", () => {
  const ob = makeObState({ answers: { "Q1": { answer: "Yes", deferred: false } } });
  const ps = makePsState();
  renderAndAppend(ps, ob);
  const banner = document.querySelector("[data-testid='deferred-banner']");
  assert.equal(banner, null, "deferred-banner must not render when count is 0");
});

test("Deferred banner link navigates to onboarding questions route", () => {
  const ob = makeObState({ answers: { "Q1": { answer: null, deferred: true } } });
  const ps = makePsState();
  let navigatedTo = null;
  renderAndAppend(ps, ob, { onNavigate: (view) => { navigatedTo = view; } });
  const link = document.querySelector("[data-testid='deferred-banner-link']");
  assert.ok(link !== null, "deferred-banner-link must be present");
  link.click();
  assert.equal(navigatedTo, ONBOARDING_RESUME_ROUTE, "banner link must navigate to the onboarding questions route");
});

test("Header review link navigates to onboarding questions route", () => {
  const ps = makePsState();
  const ob = makeObState();
  let navigatedTo = null;

  renderAndAppend(ps, ob, {
    onNavigate: (view) => { navigatedTo = view; },
  });

  const link = document.querySelector("[data-testid='header-review-answers-link']");
  assert.ok(link !== null, "header review link must be present");
  link.click();
  assert.equal(navigatedTo, ONBOARDING_RESUME_ROUTE, "header review link must navigate to the onboarding questions route");
});

test("Deferred banner shows plural 'questions' for count > 1", () => {
  const ob = makeObState({
    answers: {
      "Q1": { answer: null, deferred: true },
      "Q2": { answer: null, deferred: true },
    },
  });
  const ps = makePsState();
  renderAndAppend(ps, ob);
  const banner = document.querySelector("[data-testid='deferred-banner']");
  assert.ok(banner.textContent.includes("2 unanswered questions"), "should say 'questions' (plural)");
});

// ---------------------------------------------------------------------------
// 6. Execute button calls correct API endpoint
// ---------------------------------------------------------------------------

test("Execute button calls onApply with correct payload when approval exists", async () => {
  const approvalId = "ap-exec-test";
  const previewId  = "pv-exec-test";

  const rt = makeRuntimeState({
    checkpoints: {
      records: [
        makeCheckpoint({
          checkpoint_id:       "FND-DREQ-001",
          domain:              "foundation",
          status:              "Not_Started",
          execution_relevance: "Executable",
          safety_class:        "Safe",
          validation_source:   "Both",
        }),
      ],
    },
    activated_domains: { domains: ["foundation"], activated_at: null, activation_engine_version: null },
    previews: [
      {
        preview_id:        previewId,
        checkpoint_id:     "FND-DREQ-001",
        target_model:      "res.company",
        target_operation:  "write",
        intended_changes:  { name: "Test" },
        safety_class:      "Safe",
      },
    ],
    _engine_outputs: {
      execution_approvals: {
        execution_approvals: [
          { approval_id: approvalId, checkpoint_id: "FND-DREQ-001", execution_occurred: false, preview_id: previewId },
        ],
      },
    },
  });

  const ps = makePsState({ runtime_state: rt });
  const ob = makeObState();

  let capturedPayload = null;
  renderAndAppend(ps, ob, {
    onApply: (payload) => { capturedPayload = payload; },
  });

  // Expand the foundation domain card
  const card = document.querySelector("[data-testid='domain-card-foundation']");
  assert.ok(card !== null, "foundation domain card must be present");
  card.click();

  // Click Execute button
  const execBtn = document.querySelector("[data-testid='checkpoint-execute-btn-FND-DREQ-001']");
  assert.ok(execBtn !== null, "Execute button must be present for Executable checkpoint");

  execBtn.click();

  // Allow microtasks to flush
  await Promise.resolve();

  assert.ok(capturedPayload !== null, "onApply must be called");
  assert.equal(capturedPayload.approval_id, approvalId, "approval_id must match");
  assert.equal(capturedPayload.operation.model, "res.company");
  assert.equal(capturedPayload.operation.method, "write");
  assert.deepEqual(capturedPayload.connection_context, { project_id: "test-project" });
});

test("Execute button shows inline error when no approval exists for checkpoint", async () => {
  const rt = makeRuntimeState({
    checkpoints: {
      records: [
        makeCheckpoint({
          checkpoint_id:       "FND-DREQ-001",
          domain:              "foundation",
          status:              "Not_Started",
          execution_relevance: "Executable",
          safety_class:        "Safe",
        }),
      ],
    },
    activated_domains: { domains: ["foundation"], activated_at: null, activation_engine_version: null },
    _engine_outputs: { execution_approvals: { execution_approvals: [] } },
  });

  const ps = makePsState({ runtime_state: rt });
  const ob = makeObState();

  let applyCalled = false;
  renderAndAppend(ps, ob, { onApply: () => { applyCalled = true; } });

  const card = document.querySelector("[data-testid='domain-card-foundation']");
  card.click();

  const execBtn = document.querySelector("[data-testid='checkpoint-execute-btn-FND-DREQ-001']");
  assert.ok(execBtn !== null);
  execBtn.click();
  await Promise.resolve();

  assert.equal(applyCalled, false, "onApply must NOT be called when no approval exists");
  const errEl = document.querySelector("[data-testid='checkpoint-inline-error-FND-DREQ-001']");
  assert.ok(errEl !== null);
  assert.ok(errEl.textContent.length > 0, "inline error must be shown");
});

// ---------------------------------------------------------------------------
// 7. Confirm panel opens and submits correctly
// ---------------------------------------------------------------------------

test("Confirm button is rendered for User_Confirmed checkpoint", () => {
  const rt = makeRuntimeState({
    checkpoints: {
      records: [
        makeCheckpoint({
          checkpoint_id:       "FND-FOUND-005",
          domain:              "foundation",
          status:              "Not_Started",
          validation_source:   "User_Confirmed",
          execution_relevance: "Informational",
        }),
      ],
    },
    activated_domains: { domains: ["foundation"], activated_at: null, activation_engine_version: null },
  });

  const ps = makePsState({ runtime_state: rt });
  const ob = makeObState();
  renderAndAppend(ps, ob);

  const card = document.querySelector("[data-testid='domain-card-foundation']");
  card.click();

  const btn = document.querySelector("[data-testid='checkpoint-confirm-btn-FND-FOUND-005']");
  assert.ok(btn !== null, "Confirm button must be present for User_Confirmed checkpoint");
});

test("Confirm panel is hidden by default and shown after clicking Confirm", () => {
  const rt = makeRuntimeState({
    checkpoints: {
      records: [
        makeCheckpoint({
          checkpoint_id:       "FND-FOUND-005",
          domain:              "foundation",
          status:              "Not_Started",
          validation_source:   "User_Confirmed",
          execution_relevance: "Informational",
        }),
      ],
    },
    activated_domains: { domains: ["foundation"], activated_at: null, activation_engine_version: null },
  });

  const ps = makePsState({ runtime_state: rt });
  const ob = makeObState();
  renderAndAppend(ps, ob);

  const card = document.querySelector("[data-testid='domain-card-foundation']");
  card.click();

  const panel = document.querySelector("[data-testid='confirm-panel-FND-FOUND-005']");
  assert.ok(panel !== null, "confirm panel must exist in DOM");
  assert.equal(panel.style.display, "none", "confirm panel must be hidden initially");

  const btn = document.querySelector("[data-testid='checkpoint-confirm-btn-FND-FOUND-005']");
  btn.click();
  assert.notEqual(panel.style.display, "none", "confirm panel must be visible after clicking Confirm");
});

test("Confirm panel has evidence textarea, actor input, and submit button", () => {
  const rt = makeRuntimeState({
    checkpoints: {
      records: [
        makeCheckpoint({
          checkpoint_id:       "FND-FOUND-005",
          domain:              "foundation",
          status:              "Not_Started",
          validation_source:   "User_Confirmed",
        }),
      ],
    },
    activated_domains: { domains: ["foundation"], activated_at: null, activation_engine_version: null },
  });

  const ps = makePsState({ runtime_state: rt });
  const ob = makeObState();
  renderAndAppend(ps, ob);

  const card = document.querySelector("[data-testid='domain-card-foundation']");
  card.click();

  const evidence = document.querySelector("[data-testid='confirm-evidence-FND-FOUND-005']");
  const actor    = document.querySelector("[data-testid='confirm-actor-FND-FOUND-005']");
  const submit   = document.querySelector("[data-testid='confirm-submit-FND-FOUND-005']");

  assert.ok(evidence !== null, "evidence textarea must exist");
  assert.ok(actor    !== null, "actor input must exist");
  assert.ok(submit   !== null, "submit button must exist");
});

test("Confirm submit calls POST /api/pipeline/checkpoint/confirm with correct payload", async () => {
  const rt = makeRuntimeState({
    checkpoints: {
      records: [
        makeCheckpoint({
          checkpoint_id:     "FND-FOUND-005",
          domain:            "foundation",
          status:            "Not_Started",
          validation_source: "User_Confirmed",
        }),
      ],
    },
    activated_domains: { domains: ["foundation"], activated_at: null, activation_engine_version: null },
  });

  const ps = makePsState({ runtime_state: rt });
  const ob = makeObState();

  let capturedFetchUrl    = null;
  let capturedFetchBody   = null;
  let fetchCalled         = false;

  globalThis.fetch = async (url, opts) => {
    capturedFetchUrl  = url;
    capturedFetchBody = JSON.parse(opts.body);
    fetchCalled       = true;
    return { ok: true, json: async () => ({ ok: true }) };
  };

  renderAndAppend(ps, ob);

  const card = document.querySelector("[data-testid='domain-card-foundation']");
  card.click();

  const confirmBtn = document.querySelector("[data-testid='checkpoint-confirm-btn-FND-FOUND-005']");
  confirmBtn.click();

  const evidence = document.querySelector("[data-testid='confirm-evidence-FND-FOUND-005']");
  const actor    = document.querySelector("[data-testid='confirm-actor-FND-FOUND-005']");
  evidence.value = "Company currency verified as USD";
  actor.value    = "jane.smith@example.com";

  const submit = document.querySelector("[data-testid='confirm-submit-FND-FOUND-005']");
  submit.click();
  await Promise.resolve();
  await Promise.resolve(); // allow async handlers to settle

  assert.equal(fetchCalled, true, "fetch must be called");
  assert.equal(capturedFetchUrl, "/api/pipeline/checkpoint/confirm");
  assert.equal(capturedFetchBody.checkpoint_id, "FND-FOUND-005");
  assert.equal(capturedFetchBody.status, "Complete");
  assert.equal(capturedFetchBody.evidence, "Company currency verified as USD");
  assert.equal(capturedFetchBody.actor, "jane.smith@example.com");

  // Restore
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ ok: true }) });
});

test("Confirm submit shows inline error when evidence is empty", async () => {
  const rt = makeRuntimeState({
    checkpoints: {
      records: [
        makeCheckpoint({
          checkpoint_id:     "FND-FOUND-005",
          domain:            "foundation",
          status:            "Not_Started",
          validation_source: "User_Confirmed",
        }),
      ],
    },
    activated_domains: { domains: ["foundation"], activated_at: null, activation_engine_version: null },
  });

  const ps = makePsState({ runtime_state: rt });
  const ob = makeObState();

  let fetchCalled = false;
  globalThis.fetch = async () => { fetchCalled = true; return { ok: true, json: async () => ({ ok: true }) }; };

  renderAndAppend(ps, ob);
  const card = document.querySelector("[data-testid='domain-card-foundation']");
  card.click();

  const confirmBtn = document.querySelector("[data-testid='checkpoint-confirm-btn-FND-FOUND-005']");
  confirmBtn.click();

  // Leave evidence empty
  const evidence = document.querySelector("[data-testid='confirm-evidence-FND-FOUND-005']");
  evidence.value = "";

  const submit = document.querySelector("[data-testid='confirm-submit-FND-FOUND-005']");
  submit.click();
  await Promise.resolve();

  assert.equal(fetchCalled, false, "fetch must NOT be called when evidence is empty");
  const errEl = document.querySelector("[data-testid='checkpoint-inline-error-FND-FOUND-005']");
  assert.ok(errEl !== null);
  assert.ok(errEl.textContent.includes("Evidence"), "inline error must mention evidence");

  globalThis.fetch = async () => ({ ok: true, json: async () => ({ ok: true }) });
});

test("Confirm submit shows inline error when server returns ok: false", async () => {
  const rt = makeRuntimeState({
    checkpoints: {
      records: [
        makeCheckpoint({
          checkpoint_id:     "FND-FOUND-005",
          domain:            "foundation",
          status:            "Not_Started",
          validation_source: "User_Confirmed",
        }),
      ],
    },
    activated_domains: { domains: ["foundation"], activated_at: null, activation_engine_version: null },
  });

  const ps = makePsState({ runtime_state: rt });
  const ob = makeObState();

  globalThis.fetch = async () => ({
    ok: false,
    status: 400,
    json: async () => ({ ok: false, error: "Checkpoint not found" }),
  });

  renderAndAppend(ps, ob);
  const card = document.querySelector("[data-testid='domain-card-foundation']");
  card.click();

  const confirmBtn = document.querySelector("[data-testid='checkpoint-confirm-btn-FND-FOUND-005']");
  confirmBtn.click();

  const evidence = document.querySelector("[data-testid='confirm-evidence-FND-FOUND-005']");
  evidence.value = "Some evidence";

  const submit = document.querySelector("[data-testid='confirm-submit-FND-FOUND-005']");
  submit.click();
  await Promise.resolve();
  await Promise.resolve();

  const errEl = document.querySelector("[data-testid='checkpoint-inline-error-FND-FOUND-005']");
  assert.ok(errEl !== null);
  assert.ok(errEl.textContent.includes("Checkpoint not found"), "inline error must show server error message");

  globalThis.fetch = async () => ({ ok: true, json: async () => ({ ok: true }) });
});

// ---------------------------------------------------------------------------
// 8. Refresh reloads runtime state and rerenders
// ---------------------------------------------------------------------------

test("Refresh button is present in the dashboard", () => {
  const ps = makePsState();
  const ob = makeObState();
  renderAndAppend(ps, ob);
  const btn = document.querySelector("[data-testid='dashboard-refresh-btn']");
  assert.ok(btn !== null, "Refresh button must be present");
  assert.equal(btn.textContent.trim(), "Refresh");
});

test("Refresh button calls onLoad then onRun", async () => {
  const ps = makePsState();
  const ob = makeObState();

  const callOrder = [];
  renderAndAppend(ps, ob, {
    onLoad: async () => { callOrder.push("load"); },
    onRun:  async () => { callOrder.push("run"); },
  });

  const btn = document.querySelector("[data-testid='dashboard-refresh-btn']");
  btn.click();
  await Promise.resolve();
  await Promise.resolve();

  assert.ok(callOrder.includes("load"), "onLoad must be called on refresh");
  assert.ok(callOrder.includes("run"),  "onRun must be called on refresh");
  assert.equal(callOrder[0], "load", "load must come before run");
});

test("Refresh button is disabled when status is loading", () => {
  const ps = makePsState({ status: "loading" });
  const ob = makeObState();
  renderAndAppend(ps, ob);
  const btn = document.querySelector("[data-testid='dashboard-refresh-btn']");
  assert.ok(btn !== null);
  assert.equal(btn.disabled, true, "Refresh button must be disabled when loading");
  assert.equal(btn.textContent.trim(), "Refreshing...");
});

test("Dashboard renders loading state when status is running", () => {
  const ps = makePsState({ status: "running", runtime_state: null });
  const ob = makeObState();
  renderAndAppend(ps, ob);
  const loading = document.querySelector("[data-testid='dashboard-loading']");
  assert.ok(loading !== null, "loading state must be rendered");
});

test("Dashboard renders error banner when status is failure", () => {
  const ps = makePsState({ status: "failure", runtime_state: null, error: "Network error" });
  const ob = makeObState();
  renderAndAppend(ps, ob);
  const errBanner = document.querySelector("[data-testid='dashboard-error']");
  assert.ok(errBanner !== null, "error banner must be present on failure");
  assert.ok(errBanner.textContent.includes("Network error"));
});

// ---------------------------------------------------------------------------
// Additional rendering tests
// ---------------------------------------------------------------------------

test("Dashboard renders header with project ID", () => {
  const ps = makePsState();
  const ob = makeObState();
  renderAndAppend(ps, ob);
  const header = document.querySelector("[data-testid='dashboard-header']");
  assert.ok(header !== null, "dashboard header must be present");
  assert.ok(header.textContent.includes("test-project"), "header must show project ID");
});

test("Header shows correct completion percentage", () => {
  const rt = makeRuntimeState({
    checkpoints: {
      records: [
        makeCheckpoint({ checkpoint_id: "A", status: "Complete" }),
        makeCheckpoint({ checkpoint_id: "B", status: "Not_Started" }),
      ],
    },
  });
  const ps = makePsState({ runtime_state: rt });
  const ob = makeObState();
  renderAndAppend(ps, ob);

  const pct = document.querySelector("[data-testid='header-progress-pct']");
  assert.ok(pct !== null);
  assert.equal(pct.textContent, "50%", "Header must show 50% for 1 of 2 complete");
});

test("Header shows industry name from onboarding store", () => {
  const ps = makePsState();
  const ob = makeObState({ industry_name: "Manufacturing" });
  renderAndAppend(ps, ob);
  const header = document.querySelector("[data-testid='dashboard-header']");
  assert.ok(header.textContent.includes("Manufacturing"), "header must include industry name");
});

test("Domain card is rendered for each activated domain", () => {
  const rt = makeRuntimeState({
    checkpoints: {
      records: [
        makeCheckpoint({ checkpoint_id: "A", domain: "foundation", status: "Not_Started" }),
        makeCheckpoint({ checkpoint_id: "B", domain: "users_roles", status: "Complete" }),
      ],
    },
    activated_domains: { domains: ["foundation", "users_roles"], activated_at: null, activation_engine_version: null },
  });
  const ps = makePsState({ runtime_state: rt });
  const ob = makeObState();
  renderAndAppend(ps, ob);

  const foundCard = document.querySelector("[data-testid='domain-card-foundation']");
  const usrCard   = document.querySelector("[data-testid='domain-card-users_roles']");
  assert.ok(foundCard !== null, "foundation card must be present");
  assert.ok(usrCard   !== null, "users_roles card must be present");
});

test("Domain status badge shows correct text", () => {
  const rt = makeRuntimeState({
    checkpoints: {
      records: [
        makeCheckpoint({ checkpoint_id: "A", domain: "foundation", status: "Complete" }),
      ],
    },
    activated_domains: { domains: ["foundation"], activated_at: null, activation_engine_version: null },
  });
  const ps = makePsState({ runtime_state: rt });
  const ob = makeObState();
  renderAndAppend(ps, ob);

  const badge = document.querySelector("[data-testid='domain-status-foundation']");
  assert.ok(badge !== null);
  assert.equal(badge.textContent.trim(), "Complete");
});

test("Summary section shows correct remaining count", () => {
  const rt = makeRuntimeState({
    checkpoints: {
      records: [
        makeCheckpoint({ checkpoint_id: "A", domain: "foundation", status: "Complete" }),
        makeCheckpoint({ checkpoint_id: "B", domain: "foundation", status: "Not_Started" }),
        makeCheckpoint({ checkpoint_id: "C", domain: "foundation", status: "Not_Started" }),
      ],
    },
    activated_domains: { domains: ["foundation"], activated_at: null, activation_engine_version: null },
  });
  const ps = makePsState({ runtime_state: rt });
  const ob = makeObState();
  renderAndAppend(ps, ob);

  const remaining = document.querySelector("[data-testid='summary-remaining-count']");
  assert.ok(remaining !== null);
  assert.equal(remaining.textContent, "2", "remaining count must be 2");
});

test("Summary section shows next highest priority checkpoint", () => {
  const rt = makeRuntimeState({
    checkpoints: {
      records: [
        makeCheckpoint({
          checkpoint_id:       "EXEC-001",
          domain:              "foundation",
          status:              "Not_Started",
          execution_relevance: "Executable",
          safety_class:        "Safe",
        }),
      ],
    },
    activated_domains: { domains: ["foundation"], activated_at: null, activation_engine_version: null },
  });
  const ps = makePsState({ runtime_state: rt });
  const ob = makeObState();
  renderAndAppend(ps, ob);

  const nextAction = document.querySelector("[data-testid='summary-next-action-text']");
  assert.ok(nextAction !== null, "summary next action text must be present");
  assert.ok(nextAction.textContent.includes("EXEC-001"), "must show the checkpoint ID");
});

test("humanizeDomainId converts underscore to title case", () => {
  assert.equal(humanizeDomainId("master_data"),        "Master Data");
  assert.equal(humanizeDomainId("users_roles"),        "Users Roles");
  assert.equal(humanizeDomainId("foundation"),         "Foundation");
  assert.equal(humanizeDomainId("website_ecommerce"),  "Website Ecommerce");
});

test("humanizeDomainId handles empty string and null", () => {
  assert.equal(humanizeDomainId(""),   "");
  assert.equal(humanizeDomainId(null), "");
});

test("buildCarryOverBlock builds from checkpoint_statuses when present", () => {
  const rt = makeRuntimeState({
    checkpoint_statuses: { "FND-001": "Complete", "USR-001": "Not_Started" },
  });
  const result = buildCarryOverBlock(rt);
  assert.deepEqual(result, { "FND-001": "Complete" }, "only Complete statuses should be in carry-over");
});

test("buildCarryOverBlock falls back to checkpoint records", () => {
  const rt = makeRuntimeState({
    checkpoint_statuses: null,
    checkpoints: {
      records: [
        makeCheckpoint({ checkpoint_id: "FND-001", status: "Complete" }),
        makeCheckpoint({ checkpoint_id: "FND-002", status: "Not_Started" }),
      ],
    },
  });
  const result = buildCarryOverBlock(rt);
  assert.deepEqual(result, { "FND-001": "Complete" });
});

test("buildCarryOverBlock returns empty object for null runtime_state", () => {
  assert.deepEqual(buildCarryOverBlock(null), {});
});

test("getCheckpointRecords handles container shape", () => {
  const rt = makeRuntimeState({
    checkpoints: { records: [makeCheckpoint()], engine_version: "1.0.0", generated_at: "2026-01-01" },
  });
  const result = getCheckpointRecords(rt);
  assert.equal(result.length, 1);
});

test("getCheckpointRecords handles direct array shape", () => {
  const rt = { checkpoints: [makeCheckpoint()] };
  const result = getCheckpointRecords(rt);
  assert.equal(result.length, 1);
});

test("getCheckpointRecords returns empty array for null runtime_state", () => {
  assert.deepEqual(getCheckpointRecords(null), []);
});

test("getActivatedDomainIds returns string domains", () => {
  const rt = makeRuntimeState({
    activated_domains: { domains: ["foundation", "users_roles"], activated_at: null, activation_engine_version: null },
  });
  const result = getActivatedDomainIds(rt);
  assert.deepEqual(result, ["foundation", "users_roles"]);
});

test("getActivatedDomainIds handles object domain entries with domain_id", () => {
  const rt = makeRuntimeState({
    activated_domains: {
      domains: [{ domain_id: "foundation" }, { domain_id: "accounting" }],
      activated_at: null,
      activation_engine_version: null,
    },
  });
  const result = getActivatedDomainIds(rt);
  assert.deepEqual(result, ["foundation", "accounting"]);
});

test("No domains activated message is shown when domain list is empty", () => {
  const rt = makeRuntimeState({
    checkpoints: { records: [], engine_version: "1.0.0", generated_at: "2026-01-01" },
    activated_domains: { domains: [], activated_at: null, activation_engine_version: null },
  });
  const ps = makePsState({ runtime_state: rt });
  const ob = makeObState();
  renderAndAppend(ps, ob);
  const msg = document.querySelector("[data-testid='no-domains-message']");
  assert.ok(msg !== null, "no-domains-message must be shown when domain list is empty");
});

test("Complete checkpoint row shows checkmark, no action button", () => {
  const rt = makeRuntimeState({
    checkpoints: {
      records: [
        makeCheckpoint({ checkpoint_id: "FND-001", domain: "foundation", status: "Complete" }),
      ],
    },
    activated_domains: { domains: ["foundation"], activated_at: null, activation_engine_version: null },
  });
  const ps = makePsState({ runtime_state: rt });
  const ob = makeObState();
  renderAndAppend(ps, ob);

  const card = document.querySelector("[data-testid='domain-card-foundation']");
  card.click();

  const execBtn    = document.querySelector("[data-testid='checkpoint-execute-btn-FND-001']");
  const confirmBtn = document.querySelector("[data-testid='checkpoint-confirm-btn-FND-001']");
  const row        = document.querySelector("[data-testid='checkpoint-row-FND-001']");

  assert.equal(execBtn,    null, "Execute button must not be present for Complete checkpoint");
  assert.equal(confirmBtn, null, "Confirm button must not be present for Complete checkpoint");
  assert.ok(row !== null, "checkpoint row must exist");
});

test("Blocked checkpoint row shows disabled Blocked button", () => {
  const rt = makeRuntimeState({
    checkpoints: {
      records: [
        makeCheckpoint({
          checkpoint_id:       "FND-DREQ-001",
          domain:              "foundation",
          status:              "Not_Started",
          execution_relevance: "Executable",
        }),
      ],
    },
    activated_domains: { domains: ["foundation"], activated_at: null, activation_engine_version: null },
    blockers: {
      active_blockers: [
        { source_checkpoint_id: "FND-DREQ-001", blocker_type: "dependency_unmet", blocking_checkpoint_id: "FND-FOUND-001" },
      ],
    },
  });

  const ps = makePsState({ runtime_state: rt });
  const ob = makeObState();
  renderAndAppend(ps, ob);

  const card = document.querySelector("[data-testid='domain-card-foundation']");
  card.click();

  const blockedBtn = document.querySelector("[data-testid='checkpoint-blocked-btn-FND-DREQ-001']");
  assert.ok(blockedBtn !== null, "Blocked button must be present");
  assert.equal(blockedBtn.disabled, true, "Blocked button must be disabled");
});

test("Checkpoint row shows blocker text with blocking checkpoint ID", () => {
  const rt = makeRuntimeState({
    checkpoints: {
      records: [
        makeCheckpoint({
          checkpoint_id:       "FND-DREQ-001",
          domain:              "foundation",
          status:              "Not_Started",
          execution_relevance: "Executable",
        }),
      ],
    },
    activated_domains: { domains: ["foundation"], activated_at: null, activation_engine_version: null },
    blockers: {
      active_blockers: [
        { source_checkpoint_id: "FND-DREQ-001", blocker_type: "dependency_unmet", blocking_checkpoint_id: "FND-FOUND-001" },
      ],
    },
  });

  const ps = makePsState({ runtime_state: rt });
  const ob = makeObState();
  renderAndAppend(ps, ob);

  const card = document.querySelector("[data-testid='domain-card-foundation']");
  card.click();

  const blockerText = document.querySelector("[data-testid='checkpoint-blocker-text-FND-DREQ-001']");
  assert.ok(blockerText !== null, "blocker text must be present");
  assert.ok(blockerText.textContent.includes("FND-FOUND-001"), "blocker text must show blocking checkpoint ID");
});

test("Domain progress count shows correct fraction", () => {
  const rt = makeRuntimeState({
    checkpoints: {
      records: [
        makeCheckpoint({ checkpoint_id: "A", domain: "foundation", status: "Complete" }),
        makeCheckpoint({ checkpoint_id: "B", domain: "foundation", status: "Not_Started" }),
        makeCheckpoint({ checkpoint_id: "C", domain: "foundation", status: "Not_Started" }),
      ],
    },
    activated_domains: { domains: ["foundation"], activated_at: null, activation_engine_version: null },
  });

  const ps = makePsState({ runtime_state: rt });
  const ob = makeObState();
  renderAndAppend(ps, ob);

  const count = document.querySelector("[data-testid='domain-progress-count-foundation']");
  assert.ok(count !== null);
  assert.equal(count.textContent, "1 of 3 complete");
});

// ---------------------------------------------------------------------------
// buildDiscoveryAnswers — unwraps store wrappers to raw values
// ---------------------------------------------------------------------------

test("buildDiscoveryAnswers outputs raw answer values, not wrapper objects", () => {
  const obState = {
    answers: {
      "FC-01": { answer: "Full accounting", deferred: false },
      "BM-04": { answer: "Yes", deferred: false },
      "OP-01": { answer: "Yes", deferred: false },
    },
  };
  const result = buildDiscoveryAnswers(obState);

  assert.equal(result.answers["FC-01"], "Full accounting");
  assert.equal(result.answers["BM-04"], "Yes");
  assert.equal(result.answers["OP-01"], "Yes");
});

test("buildDiscoveryAnswers excludes deferred answers from outbound payload", () => {
  const obState = {
    answers: {
      "FC-01": { answer: "Full accounting", deferred: false },
      "BM-04": { answer: null, deferred: true },
      "SC-02": { answer: null, deferred: true },
    },
  };
  const result = buildDiscoveryAnswers(obState);

  assert.equal(result.answers["FC-01"], "Full accounting");
  assert.equal(result.answers["BM-04"], undefined, "deferred answer must not appear");
  assert.equal(result.answers["SC-02"], undefined, "deferred answer must not appear");
});

test("buildDiscoveryAnswers includes industry_template as raw string", () => {
  const obState = {
    answers: { "MF-01": { answer: "Yes", deferred: false } },
    industry_id: "manufacturing",
  };
  const result = buildDiscoveryAnswers(obState);

  assert.equal(result.answers["industry_template"], "manufacturing");
  assert.equal(result.answers["MF-01"], "Yes");
});

test("buildDiscoveryAnswers returns { answers: {} } for empty/null obState", () => {
  assert.deepEqual(buildDiscoveryAnswers(null), { answers: {} });
  assert.deepEqual(buildDiscoveryAnswers({}), { answers: {} });
  assert.deepEqual(buildDiscoveryAnswers({ answers: null }), { answers: {} });
});

test("buildDiscoveryAnswers preserves numeric and array raw values", () => {
  const obState = {
    answers: {
      "BM-05": { answer: 15, deferred: false },
      "MF-06": { answer: ["Receipt", "In-process"], deferred: false },
    },
  };
  const result = buildDiscoveryAnswers(obState);

  assert.equal(result.answers["BM-05"], 15);
  assert.deepEqual(result.answers["MF-06"], ["Receipt", "In-process"]);
});

test("buildDiscoveryAnswers conditional answer BM-04=Yes survives as raw string for engine comparison", () => {
  const obState = {
    answers: {
      "BM-04": { answer: "Yes", deferred: false },
      "SC-01": { answer: "Yes", deferred: false },
      "TA-02": { answer: "Yes", deferred: false },
    },
  };
  const result = buildDiscoveryAnswers(obState);

  // These must be raw strings for engine gates like:
  //   bm04 === "Yes"  (foundation-operation-definitions.js:169)
  //   sc01 === "Yes"  (domain-activation-engine.js:244)
  assert.equal(result.answers["BM-04"], "Yes");
  assert.equal(typeof result.answers["BM-04"], "string");
  assert.equal(result.answers["SC-01"], "Yes");
  assert.equal(result.answers["TA-02"], "Yes");
});
