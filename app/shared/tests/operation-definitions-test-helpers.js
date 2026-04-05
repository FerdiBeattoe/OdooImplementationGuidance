import assert from "node:assert/strict";

export function makeTargetContext(overrides = {}) {
  return {
    odoo_version: "19",
    edition: "enterprise",
    deployment_type: "on_premise",
    primary_country: "US",
    primary_currency: "USD",
    multi_company: false,
    multi_currency: false,
    odoosh_branch_target: null,
    odoosh_environment_type: null,
    connection_mode: null,
    connection_status: null,
    connection_target_id: null,
    connection_capability_note: null,
    ...overrides,
  };
}

export function makeDiscoveryAnswers(overrides = {}) {
  return {
    answers: { ...overrides },
    answered_at: {},
    conditional_questions_skipped: [],
    framework_version: "1.0",
    confirmed_by: null,
    confirmed_at: null,
  };
}

export function assertPlainObject(value) {
  assert.ok(value !== null, "result must not be null");
  assert.ok(!Array.isArray(value), "result must not be an array");
  assert.equal(typeof value, "object", "result must be an object");
}

export function assertDefinitionsUseAllowedModels(defs, allowedModels) {
  const allowed = new Set(allowedModels);
  for (const key of Object.keys(defs)) {
    assert.ok(
      allowed.has(defs[key].target_model),
      `${key} target_model ${defs[key].target_model} must be in ALLOWED_APPLY_MODELS`
    );
  }
}

export function assertDefinitionMetadata(defs, metadata, targetMethod) {
  for (const [checkpointId, def] of Object.entries(defs)) {
    const expected = metadata[checkpointId];
    assert.ok(expected, `Missing expected metadata for ${checkpointId}`);
    assert.equal(def.checkpoint_id, checkpointId, `${checkpointId} checkpoint_id mismatch`);
    assert.equal(def.target_model, expected.target_model, `${checkpointId} target_model mismatch`);
    assert.equal(def.method, targetMethod, `${checkpointId} method mismatch`);
    assert.equal(def.target_operation, targetMethod, `${checkpointId} target_operation mismatch`);
    assert.equal(def.intended_changes, null, `${checkpointId} intended_changes must be null`);
    assert.equal(def.safety_class, expected.safety_class, `${checkpointId} safety_class mismatch`);
    assert.equal(
      def.execution_relevance,
      expected.execution_relevance,
      `${checkpointId} execution_relevance mismatch`
    );
    assert.equal(
      def.validation_source,
      expected.validation_source,
      `${checkpointId} validation_source mismatch`
    );
  }
}
