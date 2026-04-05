// ---------------------------------------------------------------------------
// Pipeline Store — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Frontend state owner for pipeline runtime state. Centralizes run/load/resume
//   lifecycle tracking and holds the truthful result of each pipeline adapter call.
//   UI components consume this store — they do not call the adapter directly.
//
// Hard rules:
//   W1  State transitions only. No business logic. No inference.
//   W2  runtime_state is never mutated or re-shaped after adapter return.
//   W3  not_found is preserved exactly as the adapter surfaces it.
//   W4  No silent fills for missing runtime fields.
//   W5  Adapter is injected — default uses pipeline-adapter. Testable.
//   W6  Status tracks lifecycle truthfully: idle | running | loading | resuming
//       | success | failure.
//   W7  Each action clears prior state before the request begins.
//   W8  Subscribers notified on every state transition (before and after request).
//   W9  Deterministic: identical adapter results produce identical state.
//   W10 No caching. No derived frontend state. No side effects beyond state updates.
// ---------------------------------------------------------------------------

import {
  runPipeline as adapterRunPipeline,
  loadPipelineState as adapterLoadPipelineState,
  resumePipelineState as adapterResumePipelineState,
  applyGoverned as adapterApplyGoverned,
  savePipelineState as adapterSavePipelineState,
  registerPipelineConnection as adapterRegisterPipelineConnection,
} from "./pipeline-adapter.js";

function createInitialState() {
  return {
    status: "idle",
    runtime_state: null,
    error: null,
    not_found: false,
    saved_at: null,
    apply_result: null,
    // Pipeline connection registration (Slice 2: satisfy S7 for pipeline apply path)
    connection_registered: false,
    connection_project_id: null,
    connection_error: null,
  };
}

// ---------------------------------------------------------------------------
// createPipelineStore
//
// Factory — creates an isolated pipeline store instance.
// Accepts optional adapter overrides for testing.
//
// @param {object} [adapter]
// @param {Function} [adapter.runPipeline]
// @param {Function} [adapter.loadPipelineState]
// @param {Function} [adapter.resumePipelineState]
//
// @returns {{ subscribe, getState, runPipeline, loadPipelineState, resumePipelineState }}
// ---------------------------------------------------------------------------

export function createPipelineStore(adapter = {}) {
  const _run                = adapter.runPipeline               ?? adapterRunPipeline;
  const _load               = adapter.loadPipelineState         ?? adapterLoadPipelineState;
  const _resume             = adapter.resumePipelineState       ?? adapterResumePipelineState;
  const _apply              = adapter.applyGoverned             ?? adapterApplyGoverned;
  const _save               = adapter.savePipelineState         ?? adapterSavePipelineState;
  const _registerConnection = adapter.registerPipelineConnection ?? adapterRegisterPipelineConnection;

  const listeners = new Set();

  // ── Initial state ─────────────────────────────────────────────────────────
  //
  // status:        lifecycle phase — idle | running | loading | resuming | success | failure
  // runtime_state: backend payload as returned by the adapter — never mutated
  // error:         error string from adapter on failure — null on success/idle
  // not_found:     true only when adapter explicitly surfaces not_found: true
  // saved_at:      ISO timestamp from load/resume — null on run or idle
  // ---------------------------------------------------------------------------

  const state = createInitialState();

  // ── Internal helpers ──────────────────────────────────────────────────────

  function notify() {
    listeners.forEach((listener) => listener());
  }

  function clearTransientState() {
    state.runtime_state = null;
    state.error = null;
    state.not_found = false;
    state.saved_at = null;
    state.apply_result = null;
  }

  function setSuccessfulRuntimeState(runtimeState, savedAt = null) {
    state.status = "success";
    state.runtime_state = runtimeState;
    state.error = null;
    state.not_found = false;
    state.saved_at = savedAt;
    state.apply_result = null;
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
    Object.assign(state, createInitialState());
    notify();
  }

  // ── runPipeline ───────────────────────────────────────────────────────────
  //
  // Transitions:
  //   idle → running (notify)
  //   running → success  { runtime_state } (notify)
  //   running → failure  { error }         (notify)
  //
  // @param {object} payload — { discovery_answers, ...optional fields }
  // ---------------------------------------------------------------------------

  async function runPipeline(payload) {
    clearTransientState();
    state.status = "running";
    notify();

    const result = await _run(payload);

    if (result.ok) {
      setSuccessfulRuntimeState(result.runtime_state);
    } else {
      state.status = "failure";
      state.error = result.error;
    }
    notify();
  }

  // ── loadPipelineState ─────────────────────────────────────────────────────
  //
  // Transitions:
  //   idle → loading (notify)
  //   loading → success  { runtime_state, saved_at }          (notify)
  //   loading → failure  { error, not_found? }                (notify)
  //
  // @param {string} projectId — stable project identifier
  // ---------------------------------------------------------------------------

  async function loadPipelineState(projectId) {
    clearTransientState();
    state.status = "loading";
    notify();

    const result = await _load(projectId);

    if (result.ok) {
      setSuccessfulRuntimeState(result.runtime_state, result.saved_at);
    } else {
      state.status = "failure";
      state.error = result.error;
      state.not_found = result.not_found === true;
    }
    notify();
  }

  // ── resumePipelineState ───────────────────────────────────────────────────
  //
  // Transitions:
  //   idle → resuming (notify)
  //   resuming → success  { runtime_state, saved_at }         (notify)
  //   resuming → failure  { error, not_found? }               (notify)
  //
  // @param {string} projectId — stable project identifier
  // ---------------------------------------------------------------------------

  async function resumePipelineState(projectId) {
    clearTransientState();
    state.status = "resuming";
    notify();

    const result = await _resume(projectId);

    if (result.ok) {
      setSuccessfulRuntimeState(result.runtime_state, result.saved_at);
    } else {
      state.status = "failure";
      state.error = result.error;
      state.not_found = result.not_found === true;
    }
    notify();
  }

  // ── setRuntimeState ───────────────────────────────────────────────────────
  //
  // Accepts a truthful runtime_state produced by another governed pipeline
  // entrypoint (for example onboarding completion) and exposes it through the
  // same store consumed by the dashboard. No reshaping or inference.
  //
  // @param {object} runtimeState — runtime_state to expose to subscribers
  // -------------------------------------------------------------------------

  function setRuntimeState(runtimeState) {
    setSuccessfulRuntimeState(runtimeState);
    notify();
  }

  // ── applyGoverned ──────────────────────────────────────────────────────────
  //
  // Transitions:
  //   * → applying (notify) — clears error; preserves runtime_state
  //   applying → success  { apply_result, runtime_state updated }  (notify)
  //   applying → failure  { error }                                (notify)
  //
  // @param {object} payload — { approval_id, runtime_state, operation, connection_context }
  // ---------------------------------------------------------------------------

  async function applyGoverned(payload) {
    state.status = "applying";
    state.error = null;
    state.apply_result = null;
    notify();

    const result = await _apply(payload);

    if (result.ok) {
      state.status = "success";
      state.apply_result = {
        result_status: result.result_status,
        odoo_result: result.odoo_result,
        executed_at: result.executed_at,
      };
      // Replace runtime_state with the post-apply truth returned by the server.
      // This ensures the consumed approval (execution_occurred = true) is visible
      // and the same approval cannot be re-applied from this store state.
      if (result.updated_runtime_state != null) {
        state.runtime_state = result.updated_runtime_state;
      }
    } else {
      state.status = "failure";
      state.error = result.error;
    }
    notify();
  }

  // ── savePipelineState ─────────────────────────────────────────────────────
  //
  // Transitions:
  //   * → saving (notify) — clears error; preserves runtime_state
  //   saving → success  { saved_at updated }  (notify)
  //   saving → failure  { error }             (notify)
  //
  // @param {object} runtimeState — runtime_state to persist
  // ---------------------------------------------------------------------------

  async function savePipelineState(runtimeState) {
    state.status = "saving";
    state.error = null;
    notify();

    const result = await _save(runtimeState);

    if (result.ok) {
      state.status = "success";
      state.saved_at = result.saved_at;
    } else {
      state.status = "failure";
      state.error = result.error;
    }
    notify();
  }

  // ── registerPipelineConnection ────────────────────────────────────────────
  //
  // Registers a live Odoo connection under the pipeline project_id so that
  // subsequent applyGoverned calls can satisfy S7 (connection registry lookup).
  // Tracks registration result in connection_registered / connection_error.
  // Does not mutate the pipeline lifecycle status.
  //
  // @param {string} projectId    — pipeline project_id
  // @param {object} credentials  — { url, database, username, password }
  // ---------------------------------------------------------------------------

  async function registerPipelineConnection(projectId, credentials) {
    state.connection_error = null;
    notify();

    const result = await _registerConnection(projectId, credentials);

    if (result.ok) {
      state.connection_registered = true;
      state.connection_project_id = typeof projectId === 'string' ? projectId.trim() : null;
    } else {
      state.connection_registered = false;
      state.connection_error = result.error;
    }
    notify();
  }

  return { subscribe, getState, reset, runPipeline, loadPipelineState, resumePipelineState, applyGoverned, savePipelineState, registerPipelineConnection, setRuntimeState };
}

// ---------------------------------------------------------------------------
// Default singleton — uses the real pipeline adapter.
// Import and use this in app-store or UI components.
// ---------------------------------------------------------------------------

export const pipelineStore = createPipelineStore();
