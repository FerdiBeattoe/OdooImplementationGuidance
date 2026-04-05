// ---------------------------------------------------------------------------
// Runtime State Persistence Service — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Backend persistence boundary for runtime_state produced by the pipeline
//   orchestrator. Owns save, load, and resume by stable identifier only.
//
// Hard rules:
//   P1  No business logic. No inference. No field recomputation.
//   P2  runtime_state payload structure is never mutated on save or load.
//   P3  Computed objects (getComputedObjectNames()) are stripped before save.
//       They are always recomputed from persisted state — never restored.
//   P4  Secrets are never persisted. target_context is checked before save.
//   P5  Save/load must round-trip the persisted payload without drift.
//   P6  Missing record on load/resume fails truthfully — no silent invention.
//   P7  Malformed save/load input is rejected at the boundary.
//   P8  Stable identifiers only: project_id from project_identity.
//   P9  _engine_outputs is never persisted (derived, not persisted state).
//   P10 No frontend logic. No UI behavior. No side effects beyond file I/O.
//   P11 Append-only records (executions, checkpoint_confirmations,
//       checkpoint_statuses) are merged from prior saved state on every save.
//       The pipeline orchestrator unconditionally overrides executions with
//       fresh engine output (pipeline-orchestrator.js Step 12, line 316).
//       Confirm-route fields (checkpoint_confirmations, checkpoint_statuses)
//       are not included in pipeline output at all. Without merge-on-save,
//       these records are lost whenever a pipeline re-run state is saved.
//       This rule ensures the persistence boundary protects append-only
//       history from being overwritten — a persistence integrity concern.
// ---------------------------------------------------------------------------

import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  assertNoSecretsInTargetContext,
  getComputedObjectNames,
} from "../shared/runtime-state-contract.js";

// ---------------------------------------------------------------------------
// Storage root
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const RUNTIME_STATE_STORE_DIR = path.resolve(
  __dirname,
  "data",
  "runtime-states"
);

// ---------------------------------------------------------------------------
// Service version — increment on any persistence boundary or envelope change
// ---------------------------------------------------------------------------

export const RUNTIME_STATE_PERSISTENCE_SERVICE_VERSION = "1.1.0";

// ---------------------------------------------------------------------------
// NEVER_PERSISTED_KEYS
//
// Top-level runtime_state keys that are computed on every pipeline run and
// must never be written to storage. Loaded from runtime-state-contract so the
// list is authoritative and cannot drift independently.
//
// _engine_outputs is added here: it is derived traceability data, not persisted
// state (pipeline-orchestrator rule R3 / P9).
// ---------------------------------------------------------------------------

const COMPUTED_OBJECT_NAMES = getComputedObjectNames();
const NEVER_PERSISTED_KEYS  = new Set([...COMPUTED_OBJECT_NAMES, "_engine_outputs"]);

// ---------------------------------------------------------------------------
// Orchestrator metadata keys that are runtime-only (recomputed each run).
// These are stripped before save and not restored on load — they carry no
// persisted semantics.
// ---------------------------------------------------------------------------

const ORCHESTRATOR_METADATA_KEYS = new Set([
  "orchestrator_version",
  "orchestrated_at",
  "composer_version",
  "composed_at",
]);

// ---------------------------------------------------------------------------
// mergeExecutionRecords (P11)
//
// Merges execution records from a prior saved state into the new state.
// Deduplicates by execution_id — new records take precedence over existing.
// Returns the merged array without mutating either input.
// ---------------------------------------------------------------------------

function mergeExecutionRecords(existingExecutions, newExecutions) {
  const existing = Array.isArray(existingExecutions) ? existingExecutions : [];
  const incoming = Array.isArray(newExecutions) ? newExecutions : [];

  if (existing.length === 0) return incoming;
  if (incoming.length === 0) return [...existing];

  const incomingIds = new Set(
    incoming
      .filter((e) => e && typeof e.execution_id === "string")
      .map((e) => e.execution_id)
  );

  const merged = [...incoming];
  for (const rec of existing) {
    if (rec && typeof rec.execution_id === "string" && !incomingIds.has(rec.execution_id)) {
      merged.push(rec);
    }
  }
  return merged;
}

// ---------------------------------------------------------------------------
// isPlainObject — boundary-safe check
// ---------------------------------------------------------------------------

function isPlainObject(v) {
  return v !== null && v !== undefined && typeof v === "object" && !Array.isArray(v);
}

// ---------------------------------------------------------------------------
// validateRuntimeStateForSave
//
// Returns first validation error string, or null if valid.
// Only rejects what is structurally wrong at the persistence boundary.
// Does not re-validate business logic — that is the pipeline's responsibility.
// ---------------------------------------------------------------------------

function validateRuntimeStateForSave(runtimeState) {
  if (!isPlainObject(runtimeState)) {
    return "runtime_state must be a non-null plain object.";
  }

  if (!isPlainObject(runtimeState.project_identity)) {
    return "runtime_state.project_identity must be a non-null plain object.";
  }

  if (
    typeof runtimeState.project_identity.project_id !== "string" ||
    runtimeState.project_identity.project_id.trim() === ""
  ) {
    return "runtime_state.project_identity.project_id must be a non-empty string.";
  }

  if (!isPlainObject(runtimeState.discovery_answers)) {
    return "runtime_state.discovery_answers must be a non-null plain object.";
  }

  return null;
}

// ---------------------------------------------------------------------------
// validateResumeKey
//
// Returns first validation error string, or null if valid.
// ---------------------------------------------------------------------------

function validateResumeKey(projectId) {
  if (typeof projectId !== "string" || projectId.trim() === "") {
    return "project_id must be a non-empty string.";
  }
  return null;
}

// ---------------------------------------------------------------------------
// buildStorePath — deterministic file path from stable project_id
// ---------------------------------------------------------------------------

function buildStorePath(projectId) {
  // Sanitise: only allow UUID-safe characters to prevent path traversal.
  const safe = projectId.replace(/[^a-zA-Z0-9\-_]/g, "_");
  return path.join(RUNTIME_STATE_STORE_DIR, `${safe}.json`);
}

// ---------------------------------------------------------------------------
// stripNeverPersistedKeys
//
// Returns a shallow copy of runtimeState with all never-persisted top-level
// keys removed. Does not mutate the input.
// ---------------------------------------------------------------------------

function stripNeverPersistedKeys(runtimeState) {
  const result = {};
  for (const [key, value] of Object.entries(runtimeState)) {
    if (!NEVER_PERSISTED_KEYS.has(key) && !ORCHESTRATOR_METADATA_KEYS.has(key)) {
      result[key] = value;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// ensureStoreDir — idempotent directory creation
// ---------------------------------------------------------------------------

async function ensureStoreDir() {
  await mkdir(RUNTIME_STATE_STORE_DIR, { recursive: true });
}

// ---------------------------------------------------------------------------
// saveRuntimeState
//
// Saves the persisted subset of runtime_state to stable file storage.
//
// @param {object} runtimeState — full runtime_state from pipeline orchestrator
// @returns {{ ok: true, project_id: string, saved_at: string }
//          | { ok: false, error: string }}
//
// Contract:
//   - Rejects malformed input at boundary (P7).
//   - Strips computed / never-persisted keys before write (P3, P9).
//   - Checks target_context for secrets before write (P4).
//   - Does not mutate runtimeState (P2).
//   - Returns ok: false on any error — never throws through the boundary.
// ---------------------------------------------------------------------------

export async function saveRuntimeState(runtimeState) {
  // ── Boundary validation ──────────────────────────────────────────────────
  const validationError = validateRuntimeStateForSave(runtimeState);
  if (validationError !== null) {
    return { ok: false, error: validationError };
  }

  // ── Secrets check (P4) ───────────────────────────────────────────────────
  if (runtimeState.target_context !== null && runtimeState.target_context !== undefined) {
    try {
      assertNoSecretsInTargetContext(runtimeState.target_context);
    } catch (secretsError) {
      return {
        ok: false,
        error: `Secrets detected in target_context — save refused: ${secretsError.message}`,
      };
    }
  }

  const projectId = runtimeState.project_identity.project_id;

  // ── Strip never-persisted keys (P3, P9) ──────────────────────────────────
  const persistedPayload = stripNeverPersistedKeys(runtimeState);

  // ── Merge append-only records from prior saved state (P11) ──────────────
  // The pipeline orchestrator overrides executions with fresh engine output
  // (always []) and does not include checkpoint_confirmations or
  // checkpoint_statuses in its output. Without this merge, those records are
  // lost when a pipeline re-run state is saved.
  const priorResult = await loadRuntimeState(projectId);
  if (priorResult.ok && isPlainObject(priorResult.runtime_state)) {
    const prior = priorResult.runtime_state;

    // Executions: deduplicate merge by execution_id
    persistedPayload.executions = mergeExecutionRecords(
      prior.executions,
      persistedPayload.executions
    );

    // Checkpoint confirmations: merge objects (new keys override existing)
    if (isPlainObject(prior.checkpoint_confirmations)) {
      persistedPayload.checkpoint_confirmations = {
        ...prior.checkpoint_confirmations,
        ...(isPlainObject(persistedPayload.checkpoint_confirmations)
          ? persistedPayload.checkpoint_confirmations
          : {}),
      };
    }

    // Checkpoint statuses: merge objects (new values override existing)
    if (isPlainObject(prior.checkpoint_statuses)) {
      persistedPayload.checkpoint_statuses = {
        ...prior.checkpoint_statuses,
        ...(isPlainObject(persistedPayload.checkpoint_statuses)
          ? persistedPayload.checkpoint_statuses
          : {}),
      };
    }
  }

  // ── Build envelope ───────────────────────────────────────────────────────
  const savedAt = new Date().toISOString();
  const envelope = {
    schema_version: RUNTIME_STATE_PERSISTENCE_SERVICE_VERSION,
    project_id:     projectId,
    saved_at:       savedAt,
    runtime_state:  persistedPayload,
  };

  // ── Write to storage ─────────────────────────────────────────────────────
  try {
    await ensureStoreDir();
    const storePath = buildStorePath(projectId);
    await writeFile(storePath, JSON.stringify(envelope, null, 2), "utf8");
    return { ok: true, project_id: projectId, saved_at: savedAt };
  } catch (ioError) {
    return {
      ok: false,
      error: `Storage write failed: ${ioError instanceof Error ? ioError.message : String(ioError)}`,
    };
  }
}

// ---------------------------------------------------------------------------
// loadRuntimeState
//
// Loads and returns the persisted runtime_state for the given project_id.
//
// @param {string} projectId — stable project identifier
// @returns {{ ok: true, runtime_state: object, saved_at: string }
//          | { ok: false, error: string, not_found?: true }}
//
// Contract:
//   - Rejects malformed projectId at boundary (P7).
//   - Returns ok: false, not_found: true if no record exists (P6).
//   - Returns the exact persisted payload — no recomputation (P1).
//   - The returned runtime_state contains only persisted fields (P3).
//     Callers must rerun the pipeline to obtain computed fields.
// ---------------------------------------------------------------------------

export async function loadRuntimeState(projectId) {
  // ── Boundary validation ──────────────────────────────────────────────────
  const keyError = validateResumeKey(projectId);
  if (keyError !== null) {
    return { ok: false, error: keyError };
  }

  const storePath = buildStorePath(projectId);

  // ── Check existence (P6) ─────────────────────────────────────────────────
  try {
    await stat(storePath);
  } catch {
    return {
      ok: false,
      error: `No persisted state found for project_id "${projectId}".`,
      not_found: true,
    };
  }

  // ── Read and parse ────────────────────────────────────────────────────────
  let envelope;
  try {
    const raw = await readFile(storePath, "utf8");
    envelope = JSON.parse(raw);
  } catch (parseError) {
    return {
      ok: false,
      error: `Storage read failed: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
    };
  }

  // ── Envelope integrity check ─────────────────────────────────────────────
  if (!isPlainObject(envelope) || !isPlainObject(envelope.runtime_state)) {
    return {
      ok: false,
      error: `Stored envelope for project_id "${projectId}" is malformed.`,
    };
  }

  return {
    ok:           true,
    runtime_state: envelope.runtime_state,
    saved_at:     envelope.saved_at ?? null,
  };
}

// ---------------------------------------------------------------------------
// resumeRuntimeState
//
// Alias for loadRuntimeState with resume-intent semantics.
// Returns the same shape as loadRuntimeState.
//
// @param {string} projectId — stable project identifier
// @returns {{ ok: true, runtime_state: object, saved_at: string }
//          | { ok: false, error: string, not_found?: true }}
//
// Contract:
//   - Truthfully refuses if no record exists (P6).
//   - Does not recompute pipeline outputs (P1).
//   - Callers must feed the loaded runtime_state back into runPipelineService
//     to produce a full computed runtime state for the current session.
// ---------------------------------------------------------------------------

export async function resumeRuntimeState(projectId) {
  return loadRuntimeState(projectId);
}
