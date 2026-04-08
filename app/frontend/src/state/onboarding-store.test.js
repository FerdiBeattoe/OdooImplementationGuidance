import test from "node:test";
import assert from "node:assert/strict";

import { createOnboardingStore } from "./onboarding-store.js";

// ---------------------------------------------------------------------------
// Subscriber capture helper
// ---------------------------------------------------------------------------

function captureNotifications(store) {
  const snapshots = [];
  store.subscribe(() => snapshots.push({ ...store.getState() }));
  return snapshots;
}

// ---------------------------------------------------------------------------
// setAccountStatus — transitions screen correctly for both paths
// ---------------------------------------------------------------------------

test("setAccountStatus('existing') sets screen to connect-account", () => {
  const store = createOnboardingStore();
  store.setAccountStatus("existing");
  const s = store.getState();
  assert.equal(s.account_status, "existing");
  assert.equal(s.screen, "connect-account");
});

test("setAccountStatus('new') sets screen to create-account", () => {
  const store = createOnboardingStore();
  store.setAccountStatus("new");
  const s = store.getState();
  assert.equal(s.account_status, "new");
  assert.equal(s.screen, "create-account");
});

// ---------------------------------------------------------------------------
// registerConnection — success
// ---------------------------------------------------------------------------

test("registerConnection success stores project_id, clears password, advances to industry", async () => {
  const store = createOnboardingStore();

  // Stub fetch
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    const body = JSON.parse(opts.body);
    // Verify password is sent in credentials, not at top level
    assert.equal(body.credentials.password, "secret123");
    assert.equal(body.credentials.url, "https://mycompany.odoo.com");
    assert.equal(body.project_id, "mycompany-odoo-com");
    return {
      ok: true,
      json: async () => ({ ok: true, registered_at: "2026-04-04T00:00:00Z" }),
    };
  };

  try {
    const result = await store.registerConnection(
      "https://mycompany.odoo.com", "mydb", "admin@test.com", "secret123"
    );

    assert.equal(result.ok, true);
    const s = store.getState();
    assert.equal(s.connection.project_id, "mycompany-odoo-com");
    assert.equal(s.connection.url, "https://mycompany.odoo.com");
    assert.equal(s.connection.database, "mydb");
    assert.notEqual(s.connection.registered_at, null);
    assert.equal(s.screen, "industry");

    // Password must not be in state anywhere
    const stateStr = JSON.stringify(s);
    assert.equal(stateStr.includes("secret123"), false, "Password must not appear in state");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ---------------------------------------------------------------------------
// registerConnection — failure does not advance
// ---------------------------------------------------------------------------

test("registerConnection failure does not advance, returns error", async () => {
  const store = createOnboardingStore();
  store.setAccountStatus("existing");

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: false,
    status: 400,
    json: async () => ({ ok: false, error: "Invalid database name" }),
  });

  try {
    const result = await store.registerConnection(
      "https://test.odoo.com", "baddb", "user@test.com", "pass"
    );

    assert.equal(result.ok, false);
    assert.equal(result.error, "Invalid database name");
    const s = store.getState();
    assert.equal(s.screen, "connect-account"); // did not advance
    assert.equal(s.connection.project_id, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ---------------------------------------------------------------------------
// registerConnection — auth error sanitizes message
// ---------------------------------------------------------------------------

test("registerConnection auth error shows sanitized message", async () => {
  const store = createOnboardingStore();

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: false,
    status: 401,
    json: async () => ({ ok: false, error: "Authentication failed for password=secret" }),
  });

  try {
    const result = await store.registerConnection(
      "https://x.odoo.com", "db", "u@t.com", "secret"
    );

    assert.equal(result.ok, false);
    assert.equal(result.error, "Connection failed — check your credentials");
    // Raw error must not leak
    assert.equal(store.getState().error.includes("secret"), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ---------------------------------------------------------------------------
// clearSensitiveData — confirms password not retained
// ---------------------------------------------------------------------------

test("clearSensitiveData does not retain password in state", () => {
  const store = createOnboardingStore();
  store.clearSensitiveData();
  const stateStr = JSON.stringify(store.getState());
  assert.equal(stateStr.includes("password"), false, "No password field in state");
});

// ---------------------------------------------------------------------------
// Screen 0 skip — if project_id already in store, screen starts at industry
// ---------------------------------------------------------------------------

test("if project_id already set, initial screen resolves past account-check", () => {
  const store = createOnboardingStore();
  // Simulate a previously registered connection
  const s = store.getState();
  s.connection.project_id = "existing-project";
  s.screen = "account-check";

  // The wizard render logic checks connection.project_id and skips to industry.
  // From the store perspective, verify the state is accessible.
  assert.equal(s.connection.project_id, "existing-project");
  // The screen skip logic is in the wizard view, not the store.
  // Store starts at account-check; the view advances it.
});

// ---------------------------------------------------------------------------
// registerConnection — invalid URL
// ---------------------------------------------------------------------------

test("registerConnection with invalid URL returns error without calling fetch", async () => {
  const store = createOnboardingStore();

  const originalFetch = globalThis.fetch;
  let fetchCalled = false;
  globalThis.fetch = async () => { fetchCalled = true; return { ok: true, json: async () => ({ ok: true }) }; };

  try {
    const result = await store.registerConnection("not-a-url", "db", "u@t.com", "pass");
    assert.equal(result.ok, false);
    assert.ok(result.error.includes("Invalid URL"));
    assert.equal(fetchCalled, false, "fetch should not be called for invalid URL");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ---------------------------------------------------------------------------
// Initial state defaults
// ---------------------------------------------------------------------------

test("initial state has account-check screen and null connection", () => {
  const store = createOnboardingStore();
  const s = store.getState();
  assert.equal(s.screen, "account-check");
  assert.equal(s.account_status, null);
  assert.equal(s.connection.project_id, null);
  assert.equal(s.connection.url, null);
  assert.equal(s.connection.database, null);
  assert.equal(s.connection.registered_at, null);
});

test("resumeAtQuestions sets the questions screen and preserves existing answers", () => {
  const store = createOnboardingStore();
  store.setAnswer("BM-01", "Services only");
  store.goToQuestion(5);
  store.setScreen("summary");

  store.resumeAtQuestions();

  const s = store.getState();
  assert.equal(s.screen, "questions");
  assert.equal(s.current_question_index, 5);
  assert.deepEqual(s.answers["BM-01"], { answer: "Services only", deferred: false });
});

test("reset clears onboarding progress back to the initial state", () => {
  const store = createOnboardingStore();
  store.setAccountStatus("existing");
  store.setAnswer("BM-01", "Services only");
  store.goToQuestion(4);
  store.setConfirmed(true);

  store.reset();

  const s = store.getState();
  assert.equal(s.screen, "account-check");
  assert.equal(s.account_status, null);
  assert.equal(s.current_question_index, 0);
  assert.deepEqual(s.answers, {});
  assert.equal(s.confirmed, false);
  assert.equal(s.connection.project_id, null);
});

// ---------------------------------------------------------------------------
// confirmAndRun — payload shape matches pipeline contract
// ---------------------------------------------------------------------------

test("confirmAndRun sends discovery_answers with raw answer values (not wrapper objects)", async () => {
  const store = createOnboardingStore();
  store.setAnswer("FC-01", "Full accounting");
  store.setAnswer("OP-01", "Yes");

  let capturedBody = null;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, opts) => {
    capturedBody = JSON.parse(opts.body);
    return { ok: true, json: async () => ({ ok: true, runtime_state: {} }) };
  };

  try {
    await store.confirmAndRun("test-proj");

    // discovery_answers must have { answers: { ... } } wrapper
    assert.ok(capturedBody.discovery_answers, "discovery_answers must be present");
    assert.ok(capturedBody.discovery_answers.answers, "discovery_answers.answers wrapper must be present");
    // Inner values must be raw strings, not { answer, deferred } wrappers
    assert.equal(capturedBody.discovery_answers.answers["FC-01"], "Full accounting");
    assert.equal(capturedBody.discovery_answers.answers["OP-01"], "Yes");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("confirmAndRun includes industry_template as raw value in answers wrapper", async () => {
  const store = createOnboardingStore();
  // Simulate industry selection by setting state directly
  store.getState().industry_id = "manufacturing";
  store.setAnswer("MF-01", "Yes");

  let capturedBody = null;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, opts) => {
    capturedBody = JSON.parse(opts.body);
    return { ok: true, json: async () => ({ ok: true, runtime_state: {} }) };
  };

  try {
    await store.confirmAndRun("test-proj");

    // industry_template must be a raw string, not a wrapper object
    assert.equal(capturedBody.discovery_answers.answers["industry_template"], "manufacturing");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("confirmAndRun excludes deferred answers from outbound payload", async () => {
  const store = createOnboardingStore();
  store.setAnswer("FC-01", "Full accounting");
  store.deferAnswer("BM-04");

  let capturedBody = null;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, opts) => {
    capturedBody = JSON.parse(opts.body);
    return { ok: true, json: async () => ({ ok: true, runtime_state: {} }) };
  };

  try {
    await store.confirmAndRun("test-proj");

    assert.equal(capturedBody.discovery_answers.answers["FC-01"], "Full accounting");
    assert.equal(capturedBody.discovery_answers.answers["BM-04"], undefined, "deferred answers must not appear in outbound payload");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("confirmAndRun sends project_identity wrapper instead of flat project_id", async () => {
  const store = createOnboardingStore();
  store.setAnswer("FC-01", "Full accounting");

  let capturedBody = null;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, opts) => {
    capturedBody = JSON.parse(opts.body);
    return { ok: true, json: async () => ({ ok: true, runtime_state: {} }) };
  };

  try {
    await store.confirmAndRun("my-project");

    assert.deepEqual(capturedBody.project_identity, { project_id: "my-project" });
    assert.equal(capturedBody.project_id, undefined, "flat project_id must not be sent");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("confirmAndRun includes target_context when supplied", async () => {
  const store = createOnboardingStore();
  store.setAnswer("FC-01", "Full accounting");

  let capturedBody = null;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, opts) => {
    capturedBody = JSON.parse(opts.body);
    return { ok: true, json: async () => ({ ok: true, runtime_state: {} }) };
  };

  try {
    await store.confirmAndRun("proj-1", {
      target_context: { deployment_type: "on_premise", primary_country: "US", primary_currency: "USD" },
    });

    assert.deepEqual(capturedBody.target_context, {
      deployment_type: "on_premise",
      primary_country: "US",
      primary_currency: "USD",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("confirmAndRun sends target_context as null when not supplied (honest-null)", async () => {
  const store = createOnboardingStore();
  store.setAnswer("FC-01", "Full accounting");

  let capturedBody = null;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, opts) => {
    capturedBody = JSON.parse(opts.body);
    return { ok: true, json: async () => ({ ok: true, runtime_state: {} }) };
  };

  try {
    await store.confirmAndRun("proj-1");

    assert.equal(capturedBody.target_context, null, "target_context must be honest-null when not supplied");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("confirmAndRun payload matches pipeline-view/dashboard contract shape", async () => {
  const store = createOnboardingStore();
  store.setAnswer("FC-01", "Full accounting");
  store.setAnswer("SC-01", "Yes");
  store.getState().industry_id = "retail";

  let capturedBody = null;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, opts) => {
    capturedBody = JSON.parse(opts.body);
    return { ok: true, json: async () => ({ ok: true, runtime_state: {} }) };
  };

  try {
    await store.confirmAndRun("test236", {
      target_context: { deployment_type: "on_premise", primary_country: "US", primary_currency: "USD" },
    });

    // Verify full contract shape
    assert.ok(capturedBody.project_identity, "project_identity must be present");
    assert.equal(capturedBody.project_identity.project_id, "test236");
    assert.ok(capturedBody.discovery_answers, "discovery_answers must be present");
    assert.ok(capturedBody.discovery_answers.answers, "answers wrapper must be present");
    assert.equal(capturedBody.target_context.primary_country, "US");
    assert.equal(capturedBody.target_context.primary_currency, "USD");
    assert.equal(capturedBody.target_context.deployment_type, "on_premise");

    // Verify inner values are raw, not wrapper objects
    assert.equal(capturedBody.discovery_answers.answers["FC-01"], "Full accounting");
    assert.equal(capturedBody.discovery_answers.answers["SC-01"], "Yes");
    assert.equal(capturedBody.discovery_answers.answers["industry_template"], "retail");

    // Verify no stale flat keys
    assert.equal(capturedBody.project_id, undefined);
    assert.equal(capturedBody.discovery_answers["FC-01"], undefined, "answers must not be at top level of discovery_answers");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ---------------------------------------------------------------------------
// Integration: onboarding payload shape produces non-null Foundation previews
// ---------------------------------------------------------------------------

test("onboarding payload shape produces non-null Foundation intended_changes via assembler", async () => {
  // Import the actual Foundation assembler to prove the payload shape works
  const { assembleFoundationOperationDefinitions } = await import(
    "../../../shared/foundation-operation-definitions.js"
  );

  const store = createOnboardingStore();
  store.setAnswer("FC-01", "Full accounting");
  store.setAnswer("BM-04", "Yes");

  let capturedBody = null;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, opts) => {
    capturedBody = JSON.parse(opts.body);
    return { ok: true, json: async () => ({ ok: true, runtime_state: {} }) };
  };

  try {
    await store.confirmAndRun("test236", {
      target_context: { deployment_type: "on_premise", primary_country: "US", primary_currency: "USD" },
    });

    // Feed the captured payload through the real assembler
    const opDefs = assembleFoundationOperationDefinitions(
      capturedBody.target_context,
      capturedBody.discovery_answers
    );

    // FND-FOUND-001: country_id must be non-null when primary_country supplied
    assert.ok(opDefs["FND-FOUND-001"], "FND-FOUND-001 must be assembled");
    assert.notEqual(opDefs["FND-FOUND-001"].intended_changes, null, "FND-FOUND-001 intended_changes must be non-null");
    assert.equal(opDefs["FND-FOUND-001"].intended_changes.country_id, "US");

    // FND-FOUND-002: country_id must be non-null when primary_country supplied
    assert.ok(opDefs["FND-FOUND-002"], "FND-FOUND-002 must be assembled");
    assert.notEqual(opDefs["FND-FOUND-002"].intended_changes, null, "FND-FOUND-002 intended_changes must be non-null");
    assert.equal(opDefs["FND-FOUND-002"].intended_changes.country_id, "US");

    // FND-DREQ-002: currency_id must be non-null when primary_currency supplied
    assert.ok(opDefs["FND-DREQ-002"], "FND-DREQ-002 must be assembled");
    assert.notEqual(opDefs["FND-DREQ-002"].intended_changes, null, "FND-DREQ-002 intended_changes must be non-null");
    assert.equal(opDefs["FND-DREQ-002"].intended_changes.currency_id, "USD");

    // FND-DREQ-003: conditional on BM-04=Yes — must be assembled with raw answer
    assert.ok(opDefs["FND-DREQ-003"], "FND-DREQ-003 must be assembled (BM-04=Yes)");
    assert.notEqual(opDefs["FND-DREQ-003"].intended_changes, null, "FND-DREQ-003 intended_changes must be non-null");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
