// ---------------------------------------------------------------------------
// Onboarding Store — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Frontend state owner for the onboarding wizard lifecycle. Manages industry
//   selection, question progression, deferred answers, and pipeline run trigger.
//
// Hard rules (mirrors platform governance):
//   W1  State transitions only. No business logic inference.
//   W2  Answers are stored exactly as entered — never re-shaped.
//   W3  deferred: true is preserved exactly as set.
//   W4  No silent fills for missing answers.
//   W5  Subscribers notified on every state transition.
//   W6  Status tracks lifecycle: idle | loading | success | failure
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// normaliseOdooUrl
//
// Pure function — no DOM dependency. Safe to import in Node test environments.
//
// Converts any user-typed URL variant to canonical https://hostname[:port]
// form.
//
// Rules:
//   - Always enforce https — never allow http in final URL
//   - Strip fragment, query string, and path segments
//   - Lowercase the hostname
//   - If input has no dots (bare word), append .odoo.com
//   - Preserve non-standard ports
//   - Reject if no valid hostname can be derived after normalisation
//
// @param {string} raw  — raw user input
// @returns {{ ok: boolean, url: string|null, error: string|null }}
// ---------------------------------------------------------------------------

export function normaliseOdooUrl(raw) {
  if (!raw || typeof raw !== "string") {
    return { ok: false, url: null, error: "We couldn't understand that URL — try mycompany.odoo.com" };
  }

  let input = raw.trim();
  if (!input) {
    return { ok: false, url: null, error: "We couldn't understand that URL — try mycompany.odoo.com" };
  }

  // Strip fragment (hash portion)
  const hashIdx = input.indexOf("#");
  if (hashIdx !== -1) {
    input = input.slice(0, hashIdx);
  }

  // Strip query string
  const queryIdx = input.indexOf("?");
  if (queryIdx !== -1) {
    input = input.slice(0, queryIdx);
  }

  // Downcase before protocol detection
  const inputLower = input.toLowerCase();

  // Strip http:// or https:// prefix to get the raw host+path part
  let hostPart;
  if (inputLower.startsWith("https://")) {
    hostPart = input.slice(8);
  } else if (inputLower.startsWith("http://")) {
    hostPart = input.slice(7);
  } else {
    hostPart = input;
  }

  // Strip everything after the first slash (path segments)
  const slashIdx = hostPart.indexOf("/");
  if (slashIdx !== -1) {
    hostPart = hostPart.slice(0, slashIdx);
  }

  // Lowercase the hostname (preserves port separator)
  hostPart = hostPart.toLowerCase();

  // Strip trailing dots or colons
  hostPart = hostPart.replace(/[.:]+$/, "");

  if (!hostPart) {
    return { ok: false, url: null, error: "We couldn't understand that URL — try mycompany.odoo.com" };
  }

  // Split hostname and port
  const colonIdx = hostPart.lastIndexOf(":");
  let hostname = hostPart;
  let port = "";
  if (colonIdx !== -1) {
    const potentialPort = hostPart.slice(colonIdx + 1);
    if (/^\d+$/.test(potentialPort)) {
      hostname = hostPart.slice(0, colonIdx);
      port = potentialPort;
    }
  }

  if (!hostname) {
    return { ok: false, url: null, error: "We couldn't understand that URL — try mycompany.odoo.com" };
  }

  // If no dot in hostname (bare word like "mycompany"), append .odoo.com
  if (!hostname.includes(".")) {
    hostname = hostname + ".odoo.com";
  }

  // Basic hostname validity: must have at least one dot and no illegal chars
  if (!/^[a-z0-9]([a-z0-9\-.]*[a-z0-9])?$/.test(hostname) || !hostname.includes(".")) {
    return { ok: false, url: null, error: "We couldn't understand that URL — try mycompany.odoo.com" };
  }

  const canonical = port
    ? `https://${hostname}:${port}`
    : `https://${hostname}`;

  return { ok: true, url: canonical, error: null };
}

// ---------------------------------------------------------------------------
// DEFERRED DEFAULTS TABLE
// When a question is deferred, the wizard assumes the maximum-scope default
// answer for domain activation purposes.
// ---------------------------------------------------------------------------

const DEFERRED_DEFAULTS = {
  "BM-01": { defaultAnswer: "Both physical products and services", domains: ["inventory", "sales", "purchase", "projects", "crm"] },
  "BM-02": { defaultAnswer: "Yes", domains: ["foundation"] },
  "BM-04": { defaultAnswer: "Yes", domains: ["accounting"] },
  "BM-05": { defaultAnswer: "> 50", domains: ["users_roles"] },
  "RM-01": { defaultAnswer: "All options", domains: ["sales", "subscriptions", "projects", "rental", "pos", "website_ecommerce"] },
  "RM-02": { defaultAnswer: "Yes", domains: ["projects", "hr"] },
  "RM-03": { defaultAnswer: "Yes", domains: ["subscriptions"] },
  "RM-04": { defaultAnswer: "Yes", domains: ["rental", "inventory"] },
  "OP-01": { defaultAnswer: "Yes", domains: ["inventory"] },
  "OP-02": { defaultAnswer: "> 5", domains: ["inventory"] },
  "OP-03": { defaultAnswer: "Yes", domains: ["pos"] },
  "OP-04": { defaultAnswer: "Yes", domains: ["website_ecommerce"] },
  "OP-05": { defaultAnswer: "Yes", domains: ["field_service", "projects"] },
  "SC-01": { defaultAnswer: "Yes", domains: ["crm"] },
  "SC-02": { defaultAnswer: "Yes", domains: ["sales"] },
  "SC-03": { defaultAnswer: "Yes", domains: ["sales"] },
  "SC-04": { defaultAnswer: "Discounts require manager approval above a threshold", domains: ["users_roles", "sales"] },
  "PI-01": { defaultAnswer: "Yes", domains: ["purchase"] },
  "PI-02": { defaultAnswer: "All purchase orders require manager approval", domains: ["users_roles"] },
  "PI-03": { defaultAnswer: "3 steps", domains: ["inventory", "quality"] },
  "PI-04": { defaultAnswer: "Both lot and serial number tracking", domains: ["inventory"] },
  "PI-05": { defaultAnswer: "Yes", domains: ["inventory", "purchase", "sales"] },
  "FC-01": { defaultAnswer: "Full accounting", domains: ["accounting"] },
  "FC-02": { defaultAnswer: "FIFO", domains: ["accounting", "inventory"] },
  "FC-03": { defaultAnswer: "Yes", domains: ["purchase", "accounting", "users_roles"] },
  "FC-04": { defaultAnswer: "Yes", domains: ["accounting"] },
  "FC-05": { defaultAnswer: "Yes", domains: ["accounting", "projects"] },
  "FC-06": { defaultAnswer: "Yes", domains: ["accounting", "sales"] },
  "TA-01": { defaultAnswer: "All role separations", domains: ["users_roles", "hr"] },
  "TA-02": { defaultAnswer: "Yes", domains: ["users_roles", "crm", "sales"] },
  "TA-03": { defaultAnswer: "All non-None options", domains: ["approvals", "sign"] },
  "TA-04": { defaultAnswer: null, domains: [] },
};

const ONBOARDING_STORAGE_KEY = "odoo_impl_onboarding_state";

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function createDefaultState() {
  return {
    screen: "account-check",     // "account-check" | "create-account" | "connect-account" | "industry" | "questions" | "irreversible-warning" | "summary"
    account_status: null,        // null | "existing" | "new"
    connection: {
      project_id: null,
      url: null,
      database: null,
      registered_at: null,
    },
    industry_id: null,
    industry_name: null,
    pre_populated_answers: {},
    deferred_questions: [],
    activated_domains_preview: [],
    answers: {},                 // { "BM-01": { answer: "...", deferred: false }, ... }
    current_question_index: 0,
    pending_irreversible: null,  // { questionId, selectedAnswer } when warning screen is active
    status: "idle",              // idle | loading | success | failure
    error: null,
    confirmed: false,
    deferred_acknowledged: false,
    sessionToken: null,
    user: null,
  };
}

function readPersistedState() {
  try {
    const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isPlainObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writePersistedState(state) {
  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify({
      screen: state.screen,
      account_status: state.account_status,
      connection: state.connection,
      industry_id: state.industry_id,
      industry_name: state.industry_name,
      pre_populated_answers: state.pre_populated_answers,
      deferred_questions: state.deferred_questions,
      activated_domains_preview: state.activated_domains_preview,
      answers: state.answers,
      current_question_index: state.current_question_index,
      pending_irreversible: state.pending_irreversible,
      confirmed: state.confirmed,
      deferred_acknowledged: state.deferred_acknowledged,
    }));
  } catch {
    // localStorage unavailable — non-fatal
  }
}

function clearPersistedState() {
  try {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  } catch {
    // localStorage unavailable — non-fatal
  }
}

function createInitialState(persist) {
  const initialState = createDefaultState();
  if (!persist) {
    return initialState;
  }

  const persisted = readPersistedState();
  if (!persisted) {
    return initialState;
  }

  if (typeof persisted.screen === "string") {
    initialState.screen = persisted.screen;
  }
  if (persisted.account_status === "existing" || persisted.account_status === "new") {
    initialState.account_status = persisted.account_status;
  }
  if (isPlainObject(persisted.connection)) {
    initialState.connection = {
      project_id: typeof persisted.connection.project_id === "string" ? persisted.connection.project_id : null,
      url: typeof persisted.connection.url === "string" ? persisted.connection.url : null,
      database: typeof persisted.connection.database === "string" ? persisted.connection.database : null,
      registered_at: typeof persisted.connection.registered_at === "string" ? persisted.connection.registered_at : null,
    };
  }
  if (typeof persisted.industry_id === "string") {
    initialState.industry_id = persisted.industry_id;
  }
  if (typeof persisted.industry_name === "string") {
    initialState.industry_name = persisted.industry_name;
  }
  if (isPlainObject(persisted.pre_populated_answers)) {
    initialState.pre_populated_answers = persisted.pre_populated_answers;
  }
  if (Array.isArray(persisted.deferred_questions)) {
    initialState.deferred_questions = persisted.deferred_questions;
  }
  if (Array.isArray(persisted.activated_domains_preview)) {
    initialState.activated_domains_preview = persisted.activated_domains_preview;
  }
  if (isPlainObject(persisted.answers)) {
    initialState.answers = persisted.answers;
  }
  if (Number.isInteger(persisted.current_question_index) && persisted.current_question_index >= 0) {
    initialState.current_question_index = persisted.current_question_index;
  }
  if (isPlainObject(persisted.pending_irreversible)) {
    initialState.pending_irreversible = persisted.pending_irreversible;
  }
  if (typeof persisted.confirmed === "boolean") {
    initialState.confirmed = persisted.confirmed;
  }
  if (typeof persisted.deferred_acknowledged === "boolean") {
    initialState.deferred_acknowledged = persisted.deferred_acknowledged;
  }

  return initialState;
}

// ---------------------------------------------------------------------------
// createOnboardingStore
//
// Factory — creates an isolated onboarding store instance.
// ---------------------------------------------------------------------------

export function createOnboardingStore({ persist = false } = {}) {
  const listeners = new Set();

  // ── Initial state ─────────────────────────────────────────────────────────
  const state = createInitialState(persist);

  // ── Internal helpers ──────────────────────────────────────────────────────

  function notify({ skipPersist = false } = {}) {
    if (persist && !skipPersist) {
      writePersistedState(state);
    }
    listeners.forEach((listener) => listener());
  }

  // ── Public API ────────────────────────────────────────────────────────────

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function getState() {
    return state;
  }

  function reset() {
    Object.assign(state, createDefaultState());
    if (persist) {
      clearPersistedState();
    }
    notify({ skipPersist: true });
  }

  // ── selectIndustry ────────────────────────────────────────────────────────
  //
  // POST /api/pipeline/industry/select
  // On success: stores industry data and advances to questions screen.
  //
  // @param {string} projectId
  // @param {string} industryId
  // ---------------------------------------------------------------------------

  async function selectIndustry(projectId, industryId) {
    state.status = "loading";
    state.error = null;
    notify();

    try {
      const res = await fetch("/api/pipeline/industry/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, industry_id: industryId }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        state.status = "failure";
        state.error = data.error || "Industry selection failed";
      } else {
        state.status = "success";
        state.industry_id = data.industry_id;
        state.industry_name = data.industry_name;
        state.pre_populated_answers = data.pre_populated_answers || {};
        state.deferred_questions = data.deferred_questions || [];
        state.activated_domains_preview = data.activated_domains_preview || [];
        state.screen = "questions";
        state.current_question_index = 0;
      }
    } catch (e) {
      state.status = "failure";
      state.error = e.message || "Network error";
    }

    notify();
  }

  // ── setAnswer ─────────────────────────────────────────────────────────────

  function setAnswer(questionId, answer) {
    state.answers[questionId] = { answer, deferred: false };
    notify();
  }

  // ── deferAnswer ───────────────────────────────────────────────────────────

  function deferAnswer(questionId) {
    state.answers[questionId] = { answer: null, deferred: true };
    notify();
  }

  // ── setConnection ──────────────────────────────────────────────────────────
  // Sets connection fields directly (used when external connection wizard succeeds).

  function setConnection({ url, database, project_id }) {
    if (project_id) state.connection.project_id = project_id;
    if (url) state.connection.url = url;
    if (database) state.connection.database = database;
    state.connection.registered_at = new Date().toISOString();
    state.status = "success";
    state.error = null;
    state.screen = "industry";
    notify();
  }

  // ── setScreen ─────────────────────────────────────────────────────────────

  function setScreen(screen) {
    state.screen = screen;
    notify();
  }

  // ── nextQuestion ──────────────────────────────────────────────────────────
  //
  // Advances current_question_index to the next visible (condition-met) question.
  // Visible question list is computed externally by the view and passed in as
  // visibleCount so the store stays logic-free about QUESTIONS array.
  // The view is responsible for calling this only when in range.

  function nextQuestion() {
    state.current_question_index += 1;
    notify();
  }

  // ── prevQuestion ──────────────────────────────────────────────────────────

  function prevQuestion() {
    if (state.current_question_index > 0) {
      state.current_question_index -= 1;
      notify();
    }
  }

  // ── goToQuestion ──────────────────────────────────────────────────────────

  function goToQuestion(index) {
    state.current_question_index = index;
    state.screen = "questions";
    notify();
  }

  function resumeAtQuestions() {
    state.screen = "questions";
    state.pending_irreversible = null;
    notify();
  }

  function setAuth(sessionToken, user, projectId) {
    state.sessionToken = sessionToken || null;
    state.user = user || null;
    if (projectId && !state.connection.project_id) {
      state.connection = { ...state.connection, project_id: projectId };
    }
    notify();
  }

  // ── setPendingIrreversible ────────────────────────────────────────────────

  function setPendingIrreversible(questionId, selectedAnswer) {
    state.pending_irreversible = { questionId, selectedAnswer };
    state.screen = "irreversible-warning";
    notify();
  }

  // ── clearPendingIrreversible ──────────────────────────────────────────────

  function clearPendingIrreversible() {
    state.pending_irreversible = null;
    state.screen = "questions";
    notify();
  }

  // ── setDeferredAcknowledged ───────────────────────────────────────────────

  function setDeferredAcknowledged(val) {
    state.deferred_acknowledged = val;
    notify();
  }

  // ── setConfirmed ──────────────────────────────────────────────────────────

  function setConfirmed(val) {
    state.confirmed = val;
    notify();
  }

  // ── confirmAndRun ─────────────────────────────────────────────────────────
  //
  // POST /api/pipeline/run with collected discovery answers.
  // On success: calls onSuccess callback (navigation is caller's responsibility).
  //
  // @param {string} projectId
  // @returns {{ ok: boolean, runtime_state?: object, error?: string }}

  async function confirmAndRun(projectId, { target_context = null } = {}) {
    state.status = "loading";
    state.error = null;
    notify();

    // Build discovery_answers payload from store answers — wrapped in
    // { answers: { ... } } to match the pipeline contract used by
    // pipeline-view and pipeline-dashboard.
    //
    // Store answers are { answer, deferred } wrappers. The engine expects
    // raw values (strings, numbers, arrays) inside discovery_answers.answers,
    // so we unwrap here at the caller boundary.
    const answers = {};
    for (const [qId, entry] of Object.entries(state.answers)) {
      if (entry.deferred) continue; // deferred questions have no truthful answer to send
      answers[qId] = entry.answer;
    }
    if (state.industry_id) {
      answers["industry_template"] = state.industry_id;
    }
    const discovery_answers = { answers };

    try {
      const token = state.sessionToken || "";

      const body = {
        project_identity:  projectId ? { project_id: projectId } : null,
        discovery_answers,
        target_context:    target_context ?? null,
      };

      const res = await fetch("/api/pipeline/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        state.status = "failure";
        state.error = data.error || "Pipeline run failed";
        notify();
        return { ok: false, error: state.error };
      } else {
        state.status = "success";
        notify();
        return { ok: true, runtime_state: data.runtime_state };
      }
    } catch (e) {
      state.status = "failure";
      state.error = e.message || "Network error";
      notify();
      return { ok: false, error: state.error };
    }
  }

  // ── setAccountStatus ──────────────────────────────────────────────────────
  //
  // Sets account_status and advances to the appropriate screen.
  // "existing" → connect-account, "new" → create-account

  function setAccountStatus(status) {
    state.account_status = status;
    if (status === "existing") {
      state.screen = "connect-account";
    } else if (status === "new") {
      state.screen = "create-account";
    }
    state.error = null;
    notify();
  }

  // ── registerConnection ───────────────────────────────────────────────────
  //
  // POST /api/pipeline/connection/register
  // On success: populates connection, clears password, advances to industry.
  // On failure: returns exact error, does not advance.
  //
  // @param {string} url
  // @param {string} database
  // @param {string} username
  // @param {string} password
  // @returns {{ ok: boolean, error?: string }}

  async function registerConnection(url, database, username, password) {
    state.status = "loading";
    state.error = null;
    notify();

    // Derive project_id from URL hostname
    let projectId;
    try {
      const parsed = new URL(url);
      projectId = parsed.hostname.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    } catch {
      state.status = "failure";
      state.error = "Invalid URL — please enter a valid instance URL (e.g. https://mycompany.odoo.com)";
      notify();
      return { ok: false, error: state.error };
    }

    if (!projectId) {
      state.status = "failure";
      state.error = "Could not derive a project ID from the URL.";
      notify();
      return { ok: false, error: state.error };
    }

    try {
      const res = await fetch("/api/pipeline/connection/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          credentials: { url, database, username, password },
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        state.status = "failure";
        // Do not echo raw error that may contain credentials
        const isAuthError = res.status === 401 || res.status === 403 ||
          (data.error && /auth|credential|password|login|access denied/i.test(data.error));
        state.error = isAuthError
          ? "Connection failed — check your credentials"
          : (data.error || "Connection registration failed");
        notify();
        return { ok: false, error: state.error };
      }

      // Success — store connection, clear password, advance
      state.connection.project_id = projectId;
      state.connection.url = url;
      state.connection.database = database;
      state.connection.registered_at = new Date().toISOString();
      state.status = "success";
      state.error = null;
      state.screen = "industry";
      notify();
      return { ok: true };
    } catch (e) {
      state.status = "failure";
      state.error = "Network error — could not reach the server";
      notify();
      return { ok: false, error: state.error };
    }
  }

  // ── clearSensitiveData ───────────────────────────────────────────────────
  //
  // Clears any transient sensitive data from the store. Password is never
  // stored in state — this is a safety-net method.

  function clearSensitiveData() {
    // Password is never persisted in state; this is a no-op safety net.
    // If any future field is sensitive, clear it here.
    notify();
  }

  function setConnectionError(message) {
    state.status = "failure";
    state.error = message || "An error occurred.";
    notify();
  }

  // ── getDeferredCount ──────────────────────────────────────────────────────

  function getDeferredCount() {
    return Object.values(state.answers).filter((a) => a.deferred === true).length;
  }

  // ── getDefaultedDomains ───────────────────────────────────────────────────
  //
  // Returns an array of { questionId, defaultAnswer, domains } for every
  // deferred answer that has a known deferred default.

  function getDefaultedDomains() {
    const result = [];
    for (const [qId, entry] of Object.entries(state.answers)) {
      if (entry.deferred && DEFERRED_DEFAULTS[qId]) {
        result.push({ questionId: qId, ...DEFERRED_DEFAULTS[qId] });
      }
    }
    return result;
  }

  return {
    subscribe,
    getState,
    reset,
    setAccountStatus,
    registerConnection,
    setConnection,
    clearSensitiveData,
    setConnectionError,
    selectIndustry,
    setAnswer,
    deferAnswer,
    setScreen,
    nextQuestion,
    prevQuestion,
    goToQuestion,
    resumeAtQuestions,
    setAuth,
    setPendingIrreversible,
    clearPendingIrreversible,
    setDeferredAcknowledged,
    setConfirmed,
    confirmAndRun,
    getDeferredCount,
    getDefaultedDomains,
  };
}

// ---------------------------------------------------------------------------
// Default singleton
// ---------------------------------------------------------------------------

export const onboardingStore = createOnboardingStore({ persist: true });
