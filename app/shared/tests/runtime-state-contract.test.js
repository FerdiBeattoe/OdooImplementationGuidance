// ES modules are strict by default — assignment to frozen object properties
// throws TypeError without requiring an explicit "use strict" directive.
// The directive below is redundant but serves as an explicit reader signal.
"use strict";

import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  deepFreeze,
  appendDecision,
  appendPreview,
  appendExecution,
  createPersistedProjectState,
  getComputedObjectNames,
  persistedFieldKeys,
  computedFieldKeys,
  createTargetContext,
  assertNoSecretsInTargetContext,
  PROJECT_IDENTITY_IMMUTABLE_FIELDS,
  createProjectIdentity,
} from "../runtime-state-contract.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDecisionRecord(overrides = {}) {
  return {
    decision_id: crypto.randomUUID(),
    decision_type: "business_policy",
    decided_by: "test-user",
    decided_at: new Date().toISOString(),
    ...overrides,
  };
}

function makePreviewRecord(overrides = {}) {
  return {
    preview_id: crypto.randomUUID(),
    linked_checkpoint_id: "CP-001",
    preview_actor: "test-user",
    preview_created_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeExecutionRecord(overrides = {}) {
  return {
    execution_id: crypto.randomUUID(),
    linked_preview_id: crypto.randomUUID(),
    execution_actor: "test-user",
    requested_at: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 1. deepFreeze
// ---------------------------------------------------------------------------

describe("deepFreeze", () => {
  test("freezes a plain object", () => {
    const obj = deepFreeze({ a: 1 });
    assert.ok(Object.isFrozen(obj));
  });

  test("freezes nested objects", () => {
    const obj = deepFreeze({ a: { b: { c: 1 } } });
    assert.ok(Object.isFrozen(obj.a));
    assert.ok(Object.isFrozen(obj.a.b));
  });

  test("freezes arrays", () => {
    const arr = deepFreeze([1, 2, 3]);
    assert.ok(Object.isFrozen(arr));
  });

  test("freezes nested arrays", () => {
    const obj = deepFreeze({ items: [{ id: 1 }, { id: 2 }] });
    assert.ok(Object.isFrozen(obj.items));
    assert.ok(Object.isFrozen(obj.items[0]));
    assert.ok(Object.isFrozen(obj.items[1]));
  });

  test("freezes array elements that are objects", () => {
    const arr = deepFreeze([{ x: 1 }, { x: 2 }]);
    assert.ok(Object.isFrozen(arr[0]));
    assert.ok(Object.isFrozen(arr[1]));
  });

  test("mutation of frozen nested object throws", () => {
    const obj = deepFreeze({ a: { b: 1 } });
    assert.throws(() => {
      obj.a.b = 99;
    }, TypeError);
  });

  test("mutation of frozen array element property throws", () => {
    const arr = deepFreeze([{ x: 1 }]);
    assert.throws(() => {
      arr[0].x = 99;
    }, TypeError);
  });

  test("push on frozen array throws", () => {
    const arr = deepFreeze([1, 2]);
    assert.throws(() => {
      arr.push(3);
    }, TypeError);
  });

  test("returns the same reference", () => {
    const obj = { a: 1 };
    const result = deepFreeze(obj);
    assert.strictEqual(result, obj);
  });

  test("handles null without throwing", () => {
    assert.strictEqual(deepFreeze(null), null);
  });

  test("handles primitives without throwing", () => {
    assert.strictEqual(deepFreeze(42), 42);
    assert.strictEqual(deepFreeze("str"), "str");
    assert.strictEqual(deepFreeze(true), true);
  });

  test("handles already-frozen objects without throwing", () => {
    const obj = Object.freeze({ a: 1 });
    assert.doesNotThrow(() => deepFreeze(obj));
  });
});

// ---------------------------------------------------------------------------
// 2. Append helpers
// ---------------------------------------------------------------------------

describe("appendDecision", () => {
  test("returns a new array", () => {
    const base = [];
    const result = appendDecision(base, makeDecisionRecord());
    assert.notStrictEqual(result, base);
  });

  test("does not mutate the original array", () => {
    const base = [];
    appendDecision(base, makeDecisionRecord());
    assert.strictEqual(base.length, 0);
  });

  test("injects created_at when not supplied", () => {
    const rec = makeDecisionRecord();
    delete rec.created_at;
    const result = appendDecision([], rec);
    assert.strictEqual(typeof result[0].created_at, "string");
    assert.ok(result[0].created_at.length > 0);
  });

  test("caller-supplied created_at wins over injected default", () => {
    const ts = "2020-01-01T00:00:00.000Z";
    const result = appendDecision([], makeDecisionRecord({ created_at: ts }));
    assert.strictEqual(result[0].created_at, ts);
  });

  test("appended record is frozen", () => {
    const result = appendDecision([], makeDecisionRecord());
    assert.ok(Object.isFrozen(result[0]));
  });

  test("throws when decision_id is absent", () => {
    const { decision_id: _omit, ...noId } = makeDecisionRecord();
    assert.throws(() => appendDecision([], noId), /decision_id/);
  });

  test("throws when decision_id is empty string", () => {
    assert.throws(
      () => appendDecision([], makeDecisionRecord({ decision_id: "" })),
      /decision_id/
    );
  });

  test("throws when decision_id is whitespace only", () => {
    assert.throws(
      () => appendDecision([], makeDecisionRecord({ decision_id: "   " })),
      /decision_id/
    );
  });

  test("throws when decision_id is not a string", () => {
    assert.throws(
      () => appendDecision([], makeDecisionRecord({ decision_id: 123 })),
      /decision_id/
    );
  });

  test("throws when decision_type is absent", () => {
    const { decision_type: _omit, ...noType } = makeDecisionRecord();
    assert.throws(() => appendDecision([], noType), /decision_type/);
  });

  test("throws when decision_type is empty string", () => {
    assert.throws(
      () => appendDecision([], makeDecisionRecord({ decision_type: "" })),
      /decision_type/
    );
  });

  test("throws when existing is not an array", () => {
    assert.throws(() => appendDecision(null, makeDecisionRecord()), Error);
  });
});

describe("appendPreview", () => {
  test("returns a new array", () => {
    const base = [];
    assert.notStrictEqual(appendPreview(base, makePreviewRecord()), base);
  });

  test("does not mutate the original array", () => {
    const base = [];
    appendPreview(base, makePreviewRecord());
    assert.strictEqual(base.length, 0);
  });

  test("injects stale=false when not supplied", () => {
    const rec = makePreviewRecord();
    delete rec.stale;
    const result = appendPreview([], rec);
    assert.strictEqual(result[0].stale, false);
  });

  test("injects linked_execution_id=null when not supplied", () => {
    const rec = makePreviewRecord();
    delete rec.linked_execution_id;
    const result = appendPreview([], rec);
    assert.strictEqual(result[0].linked_execution_id, null);
  });

  test("caller-supplied stale wins over injected default", () => {
    const result = appendPreview([], makePreviewRecord({ stale: true }));
    assert.strictEqual(result[0].stale, true);
  });

  test("appended record is frozen", () => {
    const result = appendPreview([], makePreviewRecord());
    assert.ok(Object.isFrozen(result[0]));
  });

  test("throws when preview_id is absent", () => {
    const { preview_id: _omit, ...noId } = makePreviewRecord();
    assert.throws(() => appendPreview([], noId), /preview_id/);
  });

  test("throws when preview_id is empty string", () => {
    assert.throws(
      () => appendPreview([], makePreviewRecord({ preview_id: "" })),
      /preview_id/
    );
  });

  test("throws when preview_id is whitespace only", () => {
    assert.throws(
      () => appendPreview([], makePreviewRecord({ preview_id: "   " })),
      /preview_id/
    );
  });

  test("throws when preview_id is not a string", () => {
    assert.throws(
      () => appendPreview([], makePreviewRecord({ preview_id: 0 })),
      /preview_id/
    );
  });

  test("throws when existing is not an array", () => {
    assert.throws(() => appendPreview({}, makePreviewRecord()), Error);
  });
});

describe("appendExecution", () => {
  test("returns a new array", () => {
    const base = [];
    assert.notStrictEqual(appendExecution(base, makeExecutionRecord()), base);
  });

  test("does not mutate the original array", () => {
    const base = [];
    appendExecution(base, makeExecutionRecord());
    assert.strictEqual(base.length, 0);
  });

  test("injects status='planned' when not supplied", () => {
    const rec = makeExecutionRecord();
    delete rec.status;
    const result = appendExecution([], rec);
    assert.strictEqual(result[0].status, "planned");
  });

  test("injects completed_at=null when not supplied", () => {
    const rec = makeExecutionRecord();
    delete rec.completed_at;
    const result = appendExecution([], rec);
    assert.strictEqual(result[0].completed_at, null);
  });

  test("caller-supplied status wins over injected default", () => {
    const result = appendExecution([], makeExecutionRecord({ status: "approved" }));
    assert.strictEqual(result[0].status, "approved");
  });

  test("appended record is frozen", () => {
    const result = appendExecution([], makeExecutionRecord());
    assert.ok(Object.isFrozen(result[0]));
  });

  test("throws when execution_id is absent", () => {
    const { execution_id: _omit, ...noId } = makeExecutionRecord();
    assert.throws(() => appendExecution([], noId), /execution_id/);
  });

  test("throws when execution_id is empty string", () => {
    assert.throws(
      () => appendExecution([], makeExecutionRecord({ execution_id: "" })),
      /execution_id/
    );
  });

  test("throws when execution_id is whitespace only", () => {
    assert.throws(
      () => appendExecution([], makeExecutionRecord({ execution_id: "  " })),
      /execution_id/
    );
  });

  test("throws when execution_id is not a string", () => {
    assert.throws(
      () => appendExecution([], makeExecutionRecord({ execution_id: false })),
      /execution_id/
    );
  });

  test("throws when existing is not an array", () => {
    assert.throws(() => appendExecution(undefined, makeExecutionRecord()), Error);
  });
});

// ---------------------------------------------------------------------------
// 3. createPersistedProjectState
// ---------------------------------------------------------------------------

describe("createPersistedProjectState", () => {
  const COMPUTED = getComputedObjectNames();

  test("includes deferments as empty array", () => {
    const state = createPersistedProjectState();
    assert.ok(Array.isArray(state.deferments));
    assert.strictEqual(state.deferments.length, 0);
  });

  test("excludes readiness_state", () => {
    assert.ok(!("readiness_state" in createPersistedProjectState()));
  });

  test("excludes blockers", () => {
    assert.ok(!("blockers" in createPersistedProjectState()));
  });

  test("excludes audit_refs", () => {
    assert.ok(!("audit_refs" in createPersistedProjectState()));
  });

  test("excludes resume_context", () => {
    assert.ok(!("resume_context" in createPersistedProjectState()));
  });

  test("no key from getComputedObjectNames() appears in state", () => {
    const state = createPersistedProjectState();
    for (const name of COMPUTED) {
      assert.ok(!(name in state), `computed key "${name}" must not appear in persisted state`);
    }
  });

  test("decisions initialises as []", () => {
    assert.deepStrictEqual(createPersistedProjectState().decisions, []);
  });

  test("previews initialises as []", () => {
    assert.deepStrictEqual(createPersistedProjectState().previews, []);
  });

  test("executions initialises as []", () => {
    assert.deepStrictEqual(createPersistedProjectState().executions, []);
  });

  test("checkpoints initialises as []", () => {
    assert.deepStrictEqual(createPersistedProjectState().checkpoints, []);
  });

  test("stage_state initialises as []", () => {
    assert.deepStrictEqual(createPersistedProjectState().stage_state, []);
  });

  test("project_identity is present", () => {
    assert.ok("project_identity" in createPersistedProjectState());
  });

  test("target_context is present with odoo_version '19'", () => {
    const state = createPersistedProjectState();
    assert.strictEqual(state.target_context.odoo_version, "19");
  });

  test("discovery_answers is present with empty answers map", () => {
    const state = createPersistedProjectState();
    assert.deepStrictEqual(state.discovery_answers.answers, {});
  });
});

// ---------------------------------------------------------------------------
// 4. Persisted vs computed separation — Both objects
// ---------------------------------------------------------------------------

describe("Both object field separation", () => {
  const BOTH_OBJECTS = ["activated_domains", "stage_state", "checkpoints"];

  for (const name of BOTH_OBJECTS) {
    test(`${name}: persisted and computed key sets do not overlap`, () => {
      const persisted = new Set(persistedFieldKeys(name));
      const overlap = computedFieldKeys(name).filter((k) => persisted.has(k));
      assert.deepStrictEqual(
        overlap,
        [],
        `Overlap in "${name}": ${overlap.join(", ")}`
      );
    });
  }

  test("activated_domains: primary_stage absent from persisted keys", () => {
    assert.ok(!persistedFieldKeys("activated_domains").includes("primary_stage"));
  });

  test("activated_domains: primary_stage present in computed keys", () => {
    assert.ok(computedFieldKeys("activated_domains").includes("primary_stage"));
  });

  test("checkpoints: status is in persisted keys", () => {
    assert.ok(persistedFieldKeys("checkpoints").includes("status"));
  });

  test("checkpoints: status is absent from computed keys", () => {
    assert.ok(!computedFieldKeys("checkpoints").includes("status"));
  });

  test("checkpoints: blocker_flag is in computed keys", () => {
    assert.ok(computedFieldKeys("checkpoints").includes("blocker_flag"));
  });

  test("checkpoints: dependencies_met is in computed keys", () => {
    assert.ok(computedFieldKeys("checkpoints").includes("dependencies_met"));
  });

  test("checkpoints: all_evidence_provided is in computed keys", () => {
    assert.ok(computedFieldKeys("checkpoints").includes("all_evidence_provided"));
  });

  test("persistedFieldKeys returns a frozen array", () => {
    assert.ok(Object.isFrozen(persistedFieldKeys("checkpoints")));
  });

  test("computedFieldKeys returns a frozen array", () => {
    assert.ok(Object.isFrozen(computedFieldKeys("checkpoints")));
  });

  test("persistedFieldKeys throws for unknown object name", () => {
    assert.throws(() => persistedFieldKeys("unknown_object"), /unknown/i);
  });

  test("computedFieldKeys throws for unknown object name", () => {
    assert.throws(() => computedFieldKeys("unknown_object"), /unknown/i);
  });
});

// ---------------------------------------------------------------------------
// 5. target_context
// ---------------------------------------------------------------------------

describe("target_context", () => {
  test("odoo_version is always '19'", () => {
    const ctx = createTargetContext({ edition: "enterprise", deployment_type: "online" });
    assert.strictEqual(ctx.odoo_version, "19");
  });

  test("assertNoSecretsInTargetContext throws for 'password' key", () => {
    assert.throws(
      () => assertNoSecretsInTargetContext({ password: "x" }),
      /password/i
    );
  });

  test("assertNoSecretsInTargetContext throws for 'token' key", () => {
    assert.throws(
      () => assertNoSecretsInTargetContext({ token: "x" }),
      /token/i
    );
  });

  test("assertNoSecretsInTargetContext throws for 'api_key' key", () => {
    assert.throws(
      () => assertNoSecretsInTargetContext({ api_key: "x" }),
      /api_key/i
    );
  });

  test("assertNoSecretsInTargetContext throws for 'secret' key", () => {
    assert.throws(
      () => assertNoSecretsInTargetContext({ secret: "x" }),
      /secret/i
    );
  });

  test("assertNoSecretsInTargetContext throws for 'credential' key", () => {
    assert.throws(
      () => assertNoSecretsInTargetContext({ credential: "x" }),
      /credential/i
    );
  });

  test("assertNoSecretsInTargetContext accepts clean object", () => {
    assert.doesNotThrow(() =>
      assertNoSecretsInTargetContext({ odoo_version: "19", edition: "enterprise" })
    );
  });

  test("createTargetContext result passes secrets check", () => {
    const ctx = createTargetContext({ edition: "community", deployment_type: "on_premise" });
    assert.doesNotThrow(() => assertNoSecretsInTargetContext(ctx));
  });

  test("assertNoSecretsInTargetContext throws for nested secret key", () => {
    // A secret smuggled under an intermediate key must still be caught.
    assert.throws(
      () => assertNoSecretsInTargetContext({ db: { password: "123" } }),
      /password/i
    );
  });

  test("assertNoSecretsInTargetContext is a no-op on null", () => {
    assert.doesNotThrow(() => assertNoSecretsInTargetContext(null));
  });
});

// ---------------------------------------------------------------------------
// 6. project_identity — immutable fields
// ---------------------------------------------------------------------------

describe("project_identity", () => {
  test("PROJECT_IDENTITY_IMMUTABLE_FIELDS is frozen", () => {
    assert.ok(Object.isFrozen(PROJECT_IDENTITY_IMMUTABLE_FIELDS));
  });

  test("PROJECT_IDENTITY_IMMUTABLE_FIELDS includes project_id", () => {
    assert.ok(PROJECT_IDENTITY_IMMUTABLE_FIELDS.includes("project_id"));
  });

  test("PROJECT_IDENTITY_IMMUTABLE_FIELDS includes created_at", () => {
    assert.ok(PROJECT_IDENTITY_IMMUTABLE_FIELDS.includes("created_at"));
  });

  test("project_id is a non-empty string", () => {
    const identity = createProjectIdentity({ project_name: "Test" });
    assert.strictEqual(typeof identity.project_id, "string");
    assert.ok(identity.project_id.trim().length > 0);
  });

  test("project_id cannot be reassigned after deepFreeze", () => {
    const identity = deepFreeze(createProjectIdentity({ project_name: "Test" }));
    const original = identity.project_id;
    assert.throws(() => {
      identity.project_id = "overwritten";
    }, TypeError);
    assert.strictEqual(identity.project_id, original);
  });

  test("created_at cannot be reassigned after deepFreeze", () => {
    const identity = deepFreeze(createProjectIdentity({ project_name: "Test" }));
    const original = identity.created_at;
    assert.throws(() => {
      identity.created_at = "1970-01-01T00:00:00.000Z";
    }, TypeError);
    assert.strictEqual(identity.created_at, original);
  });

  test("each call produces a distinct project_id", () => {
    const a = createProjectIdentity();
    const b = createProjectIdentity();
    assert.notStrictEqual(a.project_id, b.project_id);
  });

  test("created_at and last_modified_at are ISO 8601 strings", () => {
    const identity = createProjectIdentity();
    assert.ok(!Number.isNaN(Date.parse(identity.created_at)));
    assert.ok(!Number.isNaN(Date.parse(identity.last_modified_at)));
  });
});
