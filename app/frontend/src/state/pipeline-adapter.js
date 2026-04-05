// ---------------------------------------------------------------------------
// Pipeline API Adapter — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Frontend transport adapter for the three locked pipeline backend routes.
//   Owns HTTP transport normalization only — no business logic, no inference,
//   no derived state, no mutation of backend payloads.
//
// Hard rules:
//   A1  Transport normalization only. No business rules. No inference.
//   A2  Backend envelope semantics preserved exactly as received.
//   A3  runtime_state is never mutated or re-shaped.
//   A4  not_found is surfaced truthfully when the backend sends it.
//   A5  No silent fills for missing fields in runtime data.
//   A6  Network and parse failures return { ok: false, error } — never throw.
//   A7  Malformed backend envelopes return { ok: false, error } — never throw.
//   A8  Deterministic: identical inputs produce identical structural outputs.
//   A9  No caching. No derived frontend state. No side effects.
// ---------------------------------------------------------------------------

const PIPELINE_RUN_URL       = "/api/pipeline/run";
const PIPELINE_LOAD_URL      = "/api/pipeline/state/load";
const PIPELINE_RESUME_URL    = "/api/pipeline/state/resume";
const PIPELINE_APPLY_URL     = "/api/pipeline/apply";
const PIPELINE_STATE_SAVE_URL = "/api/pipeline/state/save";

// ---------------------------------------------------------------------------
// isPlainObject — boundary-safe check
// ---------------------------------------------------------------------------

function isPlainObject(v) {
  return v !== null && v !== undefined && typeof v === "object" && !Array.isArray(v);
}

// ---------------------------------------------------------------------------
// isValidEnvelope — backend envelope shape check (ok must be boolean)
// ---------------------------------------------------------------------------

function isValidEnvelope(v) {
  return isPlainObject(v) && typeof v.ok === "boolean";
}

// ---------------------------------------------------------------------------
// post — private transport primitive
//
// Sends a POST request with a JSON body and returns either:
//   { _ok: true, body: object }     — response parsed successfully
//   { _ok: false, _err: string }    — network or JSON-parse failure
//
// Never throws. Callers inspect _ok to branch.
// ---------------------------------------------------------------------------

async function post(url, body, _fetch) {
  let response;
  try {
    response = await _fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (networkError) {
    return {
      _ok: false,
      _err: networkError instanceof Error ? networkError.message : "Network request failed.",
    };
  }

  let parsed;
  try {
    parsed = await response.json();
  } catch {
    return { _ok: false, _err: "Malformed response from server." };
  }

  return { _ok: true, body: parsed };
}

// ---------------------------------------------------------------------------
// runPipeline
//
// Calls POST /api/pipeline/run.
//
// @param {object} payload           — { discovery_answers, ...optional fields }
// @param {object} [opts]
// @param {Function} [opts._fetch]   — injectable fetch for testing
//
// @returns {{ ok: true, runtime_state: object }
//          | { ok: false, error: string }}
// ---------------------------------------------------------------------------

export async function runPipeline(payload, { _fetch = globalThis.fetch } = {}) {
  const transport = await post(PIPELINE_RUN_URL, payload, _fetch);

  if (!transport._ok) {
    return { ok: false, error: transport._err };
  }

  const body = transport.body;

  if (!isValidEnvelope(body)) {
    return { ok: false, error: "Malformed response envelope from server." };
  }

  if (!body.ok) {
    return {
      ok: false,
      error: typeof body.error === "string" ? body.error : "Pipeline run failed.",
    };
  }

  return { ok: true, runtime_state: body.runtime_state };
}

// ---------------------------------------------------------------------------
// loadPipelineState
//
// Calls POST /api/pipeline/state/load.
//
// @param {string} projectId         — stable project identifier
// @param {object} [opts]
// @param {Function} [opts._fetch]   — injectable fetch for testing
//
// @returns {{ ok: true, runtime_state: object, saved_at: string }
//          | { ok: false, error: string, not_found?: true }}
// ---------------------------------------------------------------------------

export async function loadPipelineState(projectId, { _fetch = globalThis.fetch } = {}) {
  const transport = await post(PIPELINE_LOAD_URL, { project_id: projectId }, _fetch);

  if (!transport._ok) {
    return { ok: false, error: transport._err };
  }

  const body = transport.body;

  if (!isValidEnvelope(body)) {
    return { ok: false, error: "Malformed response envelope from server." };
  }

  if (!body.ok) {
    const result = {
      ok: false,
      error: typeof body.error === "string" ? body.error : "Failed to load pipeline state.",
    };
    if (body.not_found === true) {
      result.not_found = true;
    }
    return result;
  }

  return { ok: true, runtime_state: body.runtime_state, saved_at: body.saved_at };
}

// ---------------------------------------------------------------------------
// resumePipelineState
//
// Calls POST /api/pipeline/state/resume.
//
// @param {string} projectId         — stable project identifier
// @param {object} [opts]
// @param {Function} [opts._fetch]   — injectable fetch for testing
//
// @returns {{ ok: true, runtime_state: object, saved_at: string }
//          | { ok: false, error: string, not_found?: true }}
// ---------------------------------------------------------------------------

export async function resumePipelineState(projectId, { _fetch = globalThis.fetch } = {}) {
  const transport = await post(PIPELINE_RESUME_URL, { project_id: projectId }, _fetch);

  if (!transport._ok) {
    return { ok: false, error: transport._err };
  }

  const body = transport.body;

  if (!isValidEnvelope(body)) {
    return { ok: false, error: "Malformed response envelope from server." };
  }

  if (!body.ok) {
    const result = {
      ok: false,
      error: typeof body.error === "string" ? body.error : "Failed to resume pipeline state.",
    };
    if (body.not_found === true) {
      result.not_found = true;
    }
    return result;
  }

  return { ok: true, runtime_state: body.runtime_state, saved_at: body.saved_at };
}

// ---------------------------------------------------------------------------
// applyGoverned
//
// Calls POST /api/pipeline/apply.
//
// @param {object} payload           — { approval_id, runtime_state, operation, connection_context }
// @param {object} [opts]
// @param {Function} [opts._fetch]   — injectable fetch for testing
//
// @returns {{ ok: true, result_status: string, odoo_result: *, executed_at: string, updated_runtime_state: object|null }
//          | { ok: false, error: string }}
// ---------------------------------------------------------------------------

export async function applyGoverned(payload, { _fetch = globalThis.fetch } = {}) {
  const transport = await post(PIPELINE_APPLY_URL, payload, _fetch);

  if (!transport._ok) {
    return { ok: false, error: transport._err };
  }

  const body = transport.body;

  if (!isValidEnvelope(body)) {
    return { ok: false, error: 'Malformed response envelope from server.' };
  }

  if (!body.ok) {
    return {
      ok: false,
      error: typeof body.error === 'string' ? body.error : 'Apply failed.',
    };
  }

  return {
    ok: true,
    result_status: body.result_status,
    odoo_result: body.odoo_result ?? null,
    executed_at: body.executed_at ?? null,
    updated_runtime_state: body.updated_runtime_state ?? null,
  };
}

// ---------------------------------------------------------------------------
// savePipelineState
//
// Calls POST /api/pipeline/state/save.
//
// @param {object} runtimeState      — runtime_state to persist
// @param {object} [opts]
// @param {Function} [opts._fetch]   — injectable fetch for testing
//
// @returns {{ ok: true, project_id: string, saved_at: string }
//          | { ok: false, error: string }}
// ---------------------------------------------------------------------------

export async function savePipelineState(runtimeState, { _fetch = globalThis.fetch } = {}) {
  const transport = await post(PIPELINE_STATE_SAVE_URL, runtimeState, _fetch);

  if (!transport._ok) {
    return { ok: false, error: transport._err };
  }

  const body = transport.body;

  if (!isValidEnvelope(body)) {
    return { ok: false, error: 'Malformed response envelope from server.' };
  }

  if (!body.ok) {
    return {
      ok: false,
      error: typeof body.error === 'string' ? body.error : 'Save failed.',
    };
  }

  return {
    ok: true,
    project_id: body.project_id,
    saved_at: body.saved_at,
  };
}

// ---------------------------------------------------------------------------
// registerPipelineConnection
//
// Calls POST /api/pipeline/connection/register to register a live Odoo
// connection under the given pipeline project_id. This satisfies S7 for
// subsequent applyGoverned calls that look up the connection by project_id.
//
// @param {string} projectId         — pipeline project_id
// @param {object} credentials       — { url, database, username, password }
// @param {object} [opts]
// @param {Function} [opts._fetch]   — injectable fetch for testing
//
// @returns {{ ok: true, registered_at: string }
//          | { ok: false, error: string }}
// ---------------------------------------------------------------------------

const PIPELINE_CONNECTION_REGISTER_URL = "/api/pipeline/connection/register";

export async function registerPipelineConnection(projectId, credentials, { _fetch = globalThis.fetch } = {}) {
  const transport = await post(PIPELINE_CONNECTION_REGISTER_URL, { project_id: projectId, credentials }, _fetch);

  if (!transport._ok) {
    return { ok: false, error: transport._err };
  }

  const body = transport.body;

  if (!isValidEnvelope(body)) {
    return { ok: false, error: 'Malformed response envelope from server.' };
  }

  if (!body.ok) {
    return {
      ok: false,
      error: typeof body.error === 'string' ? body.error : 'Pipeline connection registration failed.',
    };
  }

  return { ok: true, registered_at: body.registered_at ?? null };
}
