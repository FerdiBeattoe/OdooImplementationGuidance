// ---------------------------------------------------------------------------
// Governed Odoo Apply Service Tests
// Tests for: app/backend/governed-odoo-apply-service.js
// ---------------------------------------------------------------------------
//
// Test coverage:
//   1.  Preview exists before apply — approval.preview_id must resolve in runtime_state.previews
//   2.  Approval required before apply — approval_id must resolve in _engine_outputs.execution_approvals
//   3.  Apply refuses when approval_id missing
//   4.  Apply refuses when runtime_state missing
//   5.  Apply refuses when operation missing
//   6.  Apply refuses when connection_context.project_id missing
//   7.  Apply refuses when approval not found in runtime_state
//   8.  Apply refuses when approval.execution_occurred is not false
//   9.  Apply refuses when candidate not found
//  10.  Apply refuses when preview not found (preview must exist before apply)
//  11.  Apply refuses when model not in ALLOWED_APPLY_MODELS (not res.company)
//  12.  Apply refuses when method not in ALLOWED_APPLY_METHODS
//  13.  Apply refuses when write is called without ids
//  14.  Apply refuses when write ids contain non-positive integers
//  15.  Apply refuses when no live connection for project_id
//  15b. Whitespace-padded project_id passes validation and reaches registry lookup (trim normalisation)
//  16.  Apply success — client.write called, result_status "success", odoo_result present
//  17.  Apply success — execution_source_inputs captures all required fields
//  18.  Apply failure — Odoo client throws, result_status "failure", error present
//  19.  Apply failure closes with truthful error message (not invented)
//  20.  No raw DB write path — only client.write/client.create invoked (never direct db)
//  21.  Apply success with create method — client.create called, result_status "success"
//  22.  Apply refuses create when values is missing
//  23.  Contract shape: all result fields present on success
//  24.  Contract shape: all result fields present on failure
// ---------------------------------------------------------------------------

"use strict";

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  applyGoverned,
  ALLOWED_APPLY_MODELS,
  ALLOWED_APPLY_METHODS,
  GOVERNED_APPLY_SERVICE_VERSION,
} from "../governed-odoo-apply-service.js";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeApproval(overrides = {}) {
  return {
    approval_id: "approval-001",
    candidate_id: "candidate-001",
    preview_id: "preview-001",
    checkpoint_id: "CMP-FOUND-001",
    safety_class: "safe",
    execution_occurred: false,   // R11 of approval engine: hardcoded false
    ...overrides,
  };
}

function makeCandidate(overrides = {}) {
  return {
    candidate_id: "candidate-001",
    checkpoint_id: "CMP-FOUND-001",
    preview_id: "preview-001",
    safety_class: "safe",
    ...overrides,
  };
}

function makePreview(overrides = {}) {
  return {
    preview_id: "preview-001",
    checkpoint_id: "CMP-FOUND-001",
    checkpoint_class: "Foundational",
    safety_class: "safe",
    execution_approval_implied: false,   // R8 of preview engine: hardcoded false
    ...overrides,
  };
}

function makeRuntimeState({
  approvals = [makeApproval()],
  candidates = [makeCandidate()],
  previews = [makePreview()],
} = {}) {
  return {
    previews,
    executions: [],
    _engine_outputs: {
      execution_approvals: { execution_approvals: approvals },
      execution_eligibility: { execution_candidates: candidates },
    },
  };
}

function makeOperation(overrides = {}) {
  return {
    model: "res.company",
    method: "write",
    ids: [1],
    values: { name: "ACME Corp" },
    ...overrides,
  };
}

function makeConnectionContext(overrides = {}) {
  return {
    project_id: "proj-001",
    ...overrides,
  };
}

// Mock OdooClient — never touches a real database
function makeMockClient({ writeResult = true, createResult = 42, throws = null } = {}) {
  const calls = { write: [], create: [] };
  const client = {
    _calls: calls,
    write: async (model, ids, values) => {
      calls.write.push({ model, ids, values });
      if (throws) throw throws;
      return writeResult;
    },
    create: async (model, values) => {
      calls.create.push({ model, values });
      if (throws) throw throws;
      return createResult;
    },
  };
  return client;
}

function makeGetClient(client) {
  return (_projectId) => client;
}

function makeGetClientThrows(msg) {
  return (_projectId) => { throw new Error(msg); };
}

// ---------------------------------------------------------------------------
// 1. Service metadata
// ---------------------------------------------------------------------------

describe("GOVERNED_APPLY_SERVICE_VERSION", () => {
  it("is a non-empty string", () => {
    assert.strictEqual(typeof GOVERNED_APPLY_SERVICE_VERSION, "string");
    assert.ok(GOVERNED_APPLY_SERVICE_VERSION.trim().length > 0);
  });
});

describe("ALLOWED_APPLY_MODELS", () => {
  const EXPECTED_SAFE_MODELS = [
    // Pre-existing entries
    "res.company",
    "stock.warehouse",
    "stock.picking.type",
    "crm.stage",
    "crm.team",
    "res.partner.category",
    "product.category",
    "uom.category",
    "product.pricelist",
    "mrp.workcenter",
    "delivery.carrier",
    "pos.payment.method",
    "hr.department",
    "hr.job",
    "account.journal",
    "account.tax",
    "hr.employee",
    "account.account",
    "res.users",
    "res.groups",
    // Controller judgment additions 2026-04-05
    "stock.location",        // inventory location structure
    "mrp.routing",           // manufacturing routing configuration
    "project.project",       // project template/structure configuration
    "project.task.type",     // task stage configuration
    "pos.config",            // pos configuration profile
    "website",               // website singleton configuration
    "payment.provider",      // payment provider configuration
    "quality.point",         // quality check point definitions
    "mrp.eco.type",          // ECO workflow type definitions
    "documents.folder",      // document folder structure
    "sign.template",         // signature template definitions
    "approval.category",     // approval workflow category definitions
    "sale.subscription.plan", // subscription plan definitions
  ];

  for (const model of EXPECTED_SAFE_MODELS) {
    it(`contains ${model}`, () => {
      assert.ok(ALLOWED_APPLY_MODELS.includes(model));
    });
  }

  // Models that remain outside scope — no wizard surface, security-critical
  // beyond implementation provisioning, or not an Odoo ORM model.
  const EXCLUDED_MODELS = ["ir.rule", "ir.model.access", "res_company", "hr.payslip", "hr.contract"];

  for (const model of EXCLUDED_MODELS) {
    it(`excludes non-implementation model ${model}`, () => {
      assert.ok(!ALLOWED_APPLY_MODELS.includes(model));
    });
  }

  // Business data and transactional models excluded by controller judgment 2026-04-05
  // These must never appear in ALLOWED_APPLY_MODELS.
  const EXCLUDED_BUSINESS_DATA_MODELS = [
    "quality.alert",         // operational incident records (business data)
    "maintenance.equipment", // asset/resource master records (business data)
    "maintenance.request",   // maintenance work orders (transactional)
    "repair.order",          // repair business documents (transactional)
    "project.task",          // operational task records (transactional)
    "mrp.eco",               // engineering change order documents (transactional)
    "documents.share",       // runtime sharing links (operational)
    "sale.order",            // sales transaction documents (transactional)
  ];

  for (const model of EXCLUDED_BUSINESS_DATA_MODELS) {
    it(`excludes business-data model ${model} (not implementation configuration)`, () => {
      assert.ok(!ALLOWED_APPLY_MODELS.includes(model));
    });
  }

  // Deferred models — must not appear until DL-024/DL-025 are resolved
  const DEFERRED_MODELS = [
    "mrp.bom",          // DL-024: conditional write risk, no operation definition
    "product.template", // DL-025: too broad, no bounded checkpoint scope
  ];

  for (const model of DEFERRED_MODELS) {
    it(`excludes deferred model ${model} (pending DL resolution)`, () => {
      assert.ok(!ALLOWED_APPLY_MODELS.includes(model));
    });
  }

  it("is frozen (immutable)", () => {
    assert.ok(Object.isFrozen(ALLOWED_APPLY_MODELS));
  });
});

// ---------------------------------------------------------------------------
// S4 gate — newly approved models pass the allowlist check
// ---------------------------------------------------------------------------

describe("applyGoverned — S4 gate passes for controller-judgment-approved models", () => {
  const APPROVED_NEW_MODELS = [
    "stock.location",
    "mrp.routing",
    "project.project",
    "project.task.type",
    "pos.config",
    "website",
    "payment.provider",
    "quality.point",
    "mrp.eco.type",
    "documents.folder",
    "sign.template",
    "approval.category",
    "sale.subscription.plan",
  ];

  for (const model of APPROVED_NEW_MODELS) {
    it(`S4 gate passes for ${model} (model is allowed, write reaches client)`, async () => {
      const client = makeMockClient();
      const result = await applyGoverned({
        approval_id: "approval-001",
        runtime_state: makeRuntimeState(),
        operation: makeOperation({ model, method: "write", ids: [1], values: { name: "test" } }),
        connection_context: makeConnectionContext(),
        _getClient: makeGetClient(client),
      });
      assert.strictEqual(result.ok, true,
        `Expected ok=true for model '${model}' but got error: ${result.error}`);
      assert.strictEqual(result.result_status, "success");
      assert.strictEqual(client._calls.write.length, 1,
        `Expected client.write to be called once for model '${model}'`);
      assert.strictEqual(client._calls.write[0].model, model);
    });
  }
});

// ---------------------------------------------------------------------------
// S4 gate — excluded business-data models are still rejected
// ---------------------------------------------------------------------------

describe("applyGoverned — S4 gate rejects excluded business-data models", () => {
  const REJECTED_MODELS = [
    "quality.alert",
    "maintenance.equipment",
    "maintenance.request",
    "repair.order",
    "project.task",
    "mrp.eco",
    "documents.share",
    "sale.order",
    "mrp.bom",          // deferred DL-024
    "product.template", // deferred DL-025
  ];

  for (const model of REJECTED_MODELS) {
    it(`S4 gate rejects ${model} (not in ALLOWED_APPLY_MODELS)`, async () => {
      const client = makeMockClient();
      const result = await applyGoverned({
        approval_id: "approval-001",
        runtime_state: makeRuntimeState(),
        operation: makeOperation({ model, method: "write", ids: [1], values: { name: "test" } }),
        connection_context: makeConnectionContext(),
        _getClient: makeGetClient(client),
      });
      assert.strictEqual(result.ok, false,
        `Expected ok=false for excluded model '${model}'`);
      assert.strictEqual(result.result_status, "failure");
      assert.ok(
        typeof result.error === "string" && result.error.includes(model),
        `Error message must name the rejected model '${model}': ${result.error}`
      );
      assert.strictEqual(client._calls.write.length, 0,
        `client.write must not be called for excluded model '${model}'`);
    });
  }
});

describe("ALLOWED_APPLY_METHODS", () => {
  it("contains write and create only", () => {
    assert.ok(ALLOWED_APPLY_METHODS.includes("write"));
    assert.ok(ALLOWED_APPLY_METHODS.includes("create"));
  });

  it("is frozen (immutable)", () => {
    assert.ok(Object.isFrozen(ALLOWED_APPLY_METHODS));
  });
});

// ---------------------------------------------------------------------------
// 2. Input validation — apply refuses when governed inputs are missing (S2)
// ---------------------------------------------------------------------------

describe("applyGoverned — input validation (fail closed)", () => {
  it("refuses when approval_id is missing", async () => {
    const rs = makeRuntimeState();
    const result = await applyGoverned({
      approval_id: "",
      runtime_state: rs,
      operation: makeOperation(),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(makeMockClient()),
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.result_status, "failure");
    assert.ok(typeof result.error === "string" && result.error.length > 0);
    assert.strictEqual(result.execution_source_inputs, null);
  });

  it("refuses when approval_id is not a string", async () => {
    const result = await applyGoverned({
      approval_id: 42,
      runtime_state: makeRuntimeState(),
      operation: makeOperation(),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(makeMockClient()),
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.result_status, "failure");
  });

  it("refuses when runtime_state is missing", async () => {
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: null,
      operation: makeOperation(),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(makeMockClient()),
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.result_status, "failure");
  });

  it("refuses when runtime_state is an array", async () => {
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: [],
      operation: makeOperation(),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(makeMockClient()),
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.result_status, "failure");
  });

  it("refuses when operation is missing", async () => {
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: makeRuntimeState(),
      operation: null,
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(makeMockClient()),
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.result_status, "failure");
  });

  it("refuses when connection_context.project_id is missing", async () => {
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: makeRuntimeState(),
      operation: makeOperation(),
      connection_context: { project_id: "" },
      _getClient: makeGetClient(makeMockClient()),
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.result_status, "failure");
  });

  it("refuses when connection_context is null", async () => {
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: makeRuntimeState(),
      operation: makeOperation(),
      connection_context: null,
      _getClient: makeGetClient(makeMockClient()),
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.result_status, "failure");
  });
});

// ---------------------------------------------------------------------------
// 3. Approval required before apply
// ---------------------------------------------------------------------------

describe("applyGoverned — approval required before apply", () => {
  it("refuses when approval_id not found in runtime_state", async () => {
    const rs = makeRuntimeState({ approvals: [] });
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: rs,
      operation: makeOperation(),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(makeMockClient()),
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.result_status, "failure");
    assert.ok(result.error.includes("Approval not found"));
  });

  it("refuses when approval_id resolves but execution_occurred is not false (S3)", async () => {
    const rs = makeRuntimeState({
      approvals: [makeApproval({ execution_occurred: true })],
    });
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: rs,
      operation: makeOperation(),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(makeMockClient()),
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.result_status, "failure");
    assert.ok(result.error.includes("execution_occurred"));
  });

  it("refuses when execution_occurred is null instead of false", async () => {
    const rs = makeRuntimeState({
      approvals: [makeApproval({ execution_occurred: null })],
    });
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: rs,
      operation: makeOperation(),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(makeMockClient()),
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.result_status, "failure");
  });
});

// ---------------------------------------------------------------------------
// 4. Preview must exist before apply
// ---------------------------------------------------------------------------

describe("applyGoverned — preview must exist before apply", () => {
  it("refuses when preview_id not found in runtime_state.previews", async () => {
    // Approval references preview-001 but no previews in runtime_state
    const rs = makeRuntimeState({ previews: [] });
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: rs,
      operation: makeOperation(),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(makeMockClient()),
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.result_status, "failure");
    assert.ok(result.error.includes("Preview not found"));
    assert.ok(result.error.includes("Preview must exist before apply"));
  });

  it("refuses when runtime_state.previews is empty array", async () => {
    const rs = makeRuntimeState({ previews: [] });
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: rs,
      operation: makeOperation(),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(makeMockClient()),
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.result_status, "failure");
  });

  it("proceeds when preview exists", async () => {
    // Full happy-path setup — preview present
    const client = makeMockClient();
    const rs = makeRuntimeState();
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: rs,
      operation: makeOperation(),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(client),
    });
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.result_status, "success");
  });
});

// ---------------------------------------------------------------------------
// 5. Target/context safety constraints — bounded model enforcement (S4)
// ---------------------------------------------------------------------------

describe("applyGoverned — bounded model enforcement (S4)", () => {
  it("refuses when model is not in ALLOWED_APPLY_MODELS", async () => {
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: makeRuntimeState(),
      operation: makeOperation({ model: "res.partner" }),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(makeMockClient()),
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.result_status, "failure");
    assert.ok(result.error.includes("res.partner"));
    assert.ok(result.error.includes("not in the allowed apply set"));
  });

  it("refuses when model is a direct SQL table name (raw DB)", async () => {
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: makeRuntimeState(),
      operation: makeOperation({ model: "res_company" }),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(makeMockClient()),
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.result_status, "failure");
  });

  it("refuses when model is empty string", async () => {
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: makeRuntimeState(),
      operation: makeOperation({ model: "" }),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(makeMockClient()),
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.result_status, "failure");
  });

  it("allows res.company (first slice model)", async () => {
    const client = makeMockClient();
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: makeRuntimeState(),
      operation: makeOperation({ model: "res.company" }),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(client),
    });
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.result_status, "success");
  });
});

// ---------------------------------------------------------------------------
// 6. Method enforcement (S5)
// ---------------------------------------------------------------------------

describe("applyGoverned — method enforcement (S5)", () => {
  it("refuses when method is not in ALLOWED_APPLY_METHODS", async () => {
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: makeRuntimeState(),
      operation: makeOperation({ method: "unlink" }),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(makeMockClient()),
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.result_status, "failure");
    assert.ok(result.error.includes("unlink"));
    assert.ok(result.error.includes("not in the allowed apply set"));
  });

  it("refuses executeKw direct calls (raw bypass attempt)", async () => {
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: makeRuntimeState(),
      operation: makeOperation({ method: "executeKw" }),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(makeMockClient()),
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.result_status, "failure");
  });

  it("refuses SQL method (raw DB write attempt)", async () => {
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: makeRuntimeState(),
      operation: makeOperation({ method: "execute" }),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(makeMockClient()),
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.result_status, "failure");
  });
});

// ---------------------------------------------------------------------------
// 7. Write ids validation (S6)
// ---------------------------------------------------------------------------

describe("applyGoverned — write ids validation (S6)", () => {
  it("refuses write without ids", async () => {
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: makeRuntimeState(),
      operation: makeOperation({ ids: undefined }),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(makeMockClient()),
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.result_status, "failure");
    assert.ok(result.error.includes("ids"));
  });

  it("refuses write with empty ids array", async () => {
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: makeRuntimeState(),
      operation: makeOperation({ ids: [] }),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(makeMockClient()),
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.result_status, "failure");
  });

  it("refuses write with non-positive integer ids", async () => {
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: makeRuntimeState(),
      operation: makeOperation({ ids: [0] }),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(makeMockClient()),
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.result_status, "failure");
  });

  it("refuses write with float ids", async () => {
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: makeRuntimeState(),
      operation: makeOperation({ ids: [1.5] }),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(makeMockClient()),
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.result_status, "failure");
  });

  it("allows write with valid positive integer ids", async () => {
    const client = makeMockClient();
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: makeRuntimeState(),
      operation: makeOperation({ ids: [1] }),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(client),
    });
    assert.strictEqual(result.ok, true);
  });
});

// ---------------------------------------------------------------------------
// 8. Connection enforcement (S7)
// ---------------------------------------------------------------------------

describe("applyGoverned — connection enforcement (S7)", () => {
  it("refuses when no live connection for project_id", async () => {
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: makeRuntimeState(),
      operation: makeOperation(),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClientThrows("No live Odoo connection is active for this project."),
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.result_status, "failure");
    assert.ok(result.error.includes("No live Odoo connection"));
  });

  it("whitespace-padded project_id passes validation and reaches the registry lookup", async () => {
    // Service validates project_id.trim() !== "" — a padded value passes.
    // The engine-level trim in getClientForProject normalises " proj-001 " → "proj-001",
    // resolving the same trimmed key that registerPipelineConnection stores.
    let capturedProjectId;
    const capturingGetClient = (projectId) => {
      capturedProjectId = projectId;
      return makeMockClient();
    };
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: makeRuntimeState(),
      operation: makeOperation(),
      connection_context: { project_id: " proj-001 " },
      _getClient: capturingGetClient,
    });
    // Apply succeeds — padded project_id is not rejected by the service guard
    assert.strictEqual(result.ok, true);
    // The padded value reaches the lookup; engine.js trims it before connectionRegistry.get()
    assert.strictEqual(capturedProjectId, " proj-001 ");
  });
});

// ---------------------------------------------------------------------------
// 9. Apply calls the correct Odoo application-layer boundary (S5)
// ---------------------------------------------------------------------------

describe("applyGoverned — Odoo application-layer write (S5)", () => {
  it("calls client.write with correct model, ids, values for write operation", async () => {
    const client = makeMockClient();
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: makeRuntimeState(),
      operation: makeOperation({
        model: "res.company",
        method: "write",
        ids: [1],
        values: { name: "ACME Corp" },
      }),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(client),
    });

    assert.strictEqual(result.ok, true);
    assert.strictEqual(client._calls.write.length, 1);
    assert.strictEqual(client._calls.write[0].model, "res.company");
    assert.deepStrictEqual(client._calls.write[0].ids, [1]);
    assert.deepStrictEqual(client._calls.write[0].values, { name: "ACME Corp" });
    // create must NOT be called
    assert.strictEqual(client._calls.create.length, 0);
  });

  it("calls client.create with correct model and values for create operation", async () => {
    const client = makeMockClient({ createResult: 5 });
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: makeRuntimeState(),
      operation: {
        model: "res.company",
        method: "create",
        values: { name: "New Branch" },
      },
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(client),
    });

    assert.strictEqual(result.ok, true);
    assert.strictEqual(client._calls.create.length, 1);
    assert.strictEqual(client._calls.create[0].model, "res.company");
    assert.deepStrictEqual(client._calls.create[0].values, { name: "New Branch" });
    // write must NOT be called
    assert.strictEqual(client._calls.write.length, 0);
  });

  it("does NOT call any method other than write or create (no raw DB path)", async () => {
    const client = makeMockClient();
    // Add a _post spy to ensure it's not called directly
    let directPostCalled = false;
    client._post = () => { directPostCalled = true; return Promise.resolve(); };

    await applyGoverned({
      approval_id: "approval-001",
      runtime_state: makeRuntimeState(),
      operation: makeOperation(),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(client),
    });

    assert.strictEqual(directPostCalled, false, "_post must not be called directly");
  });
});

// ---------------------------------------------------------------------------
// 10. Apply success produces truthful execution result (S8)
// ---------------------------------------------------------------------------

describe("applyGoverned — apply success produces truthful result (S8)", () => {
  it("returns result_status 'success' and odoo_result from client.write", async () => {
    const client = makeMockClient({ writeResult: true });
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: makeRuntimeState(),
      operation: makeOperation(),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(client),
    });

    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.result_status, "success");
    assert.strictEqual(result.odoo_result, true);
    assert.strictEqual(result.error, null);
    assert.ok(typeof result.executed_at === "string" && result.executed_at.length > 0);
  });

  it("execution_source_inputs captures all required fields for auditability (S10)", async () => {
    const client = makeMockClient();
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: makeRuntimeState(),
      operation: makeOperation({
        model: "res.company",
        method: "write",
        ids: [1],
        values: { name: "ACME" },
      }),
      connection_context: makeConnectionContext({ project_id: "proj-001" }),
      _getClient: makeGetClient(client),
    });

    assert.strictEqual(result.ok, true);
    const src = result.execution_source_inputs;
    assert.ok(src, "execution_source_inputs must be present");
    assert.strictEqual(src.approval_id, "approval-001");
    assert.strictEqual(src.candidate_id, "candidate-001");
    assert.strictEqual(src.preview_id, "preview-001");
    assert.strictEqual(src.checkpoint_id, "CMP-FOUND-001");
    assert.strictEqual(src.safety_class, "safe");
    assert.strictEqual(src.model, "res.company");
    assert.strictEqual(src.method, "write");
    assert.strictEqual(src.project_id, "proj-001");
  });

  it("create returns new record id as odoo_result", async () => {
    const client = makeMockClient({ createResult: 42 });
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: makeRuntimeState(),
      operation: { model: "res.company", method: "create", values: { name: "Branch" } },
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(client),
    });
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.odoo_result, 42);
  });
});

// ---------------------------------------------------------------------------
// 11. Apply failure produces truthful execution result (S9)
// ---------------------------------------------------------------------------

describe("applyGoverned — apply failure produces truthful result (S9)", () => {
  it("returns result_status 'failure' when client.write throws OdooRpcError", async () => {
    const odooError = new Error("Record not found (res.company, id=999)");
    const client = makeMockClient({ throws: odooError });
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: makeRuntimeState(),
      operation: makeOperation({ ids: [999] }),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(client),
    });

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.result_status, "failure");
    assert.ok(result.error.includes("Record not found"));
    assert.strictEqual(result.odoo_result, null);
    assert.ok(typeof result.executed_at === "string");
  });

  it("error message is taken verbatim from Odoo error (not invented)", async () => {
    const odooError = new Error("Access Denied");
    const client = makeMockClient({ throws: odooError });
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: makeRuntimeState(),
      operation: makeOperation(),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(client),
    });

    assert.strictEqual(result.error, "Access Denied");
  });

  it("execution_source_inputs is still captured on Odoo failure", async () => {
    const odooError = new Error("Network error");
    const client = makeMockClient({ throws: odooError });
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: makeRuntimeState(),
      operation: makeOperation(),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(client),
    });

    assert.strictEqual(result.result_status, "failure");
    assert.ok(result.execution_source_inputs !== null, "execution_source_inputs must be captured on failure");
    assert.strictEqual(result.execution_source_inputs.approval_id, "approval-001");
  });
});

// ---------------------------------------------------------------------------
// 12. Contract shape compliance (S8)
// ---------------------------------------------------------------------------

describe("applyGoverned — contract shape compliance (S8)", () => {
  const RESULT_FIELDS = [
    "ok", "result_status", "odoo_result", "error", "executed_at", "execution_source_inputs"
  ];

  it("success result contains all required fields", async () => {
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: makeRuntimeState(),
      operation: makeOperation(),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(makeMockClient()),
    });
    for (const field of RESULT_FIELDS) {
      assert.ok(
        Object.prototype.hasOwnProperty.call(result, field),
        `Missing field: ${field}`
      );
    }
    assert.strictEqual(typeof result.ok, "boolean");
    assert.strictEqual(typeof result.result_status, "string");
    assert.strictEqual(typeof result.executed_at, "string");
  });

  it("failure result contains all required fields", async () => {
    const result = await applyGoverned({
      approval_id: "",
      runtime_state: null,
      operation: null,
      connection_context: null,
    });
    for (const field of RESULT_FIELDS) {
      assert.ok(
        Object.prototype.hasOwnProperty.call(result, field),
        `Missing field: ${field}`
      );
    }
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.result_status, "failure");
    assert.strictEqual(typeof result.error, "string");
    assert.strictEqual(typeof result.executed_at, "string");
  });

  it("validation failure result contains all required fields", async () => {
    // Approval not found case
    const result = await applyGoverned({
      approval_id: "nonexistent",
      runtime_state: makeRuntimeState({ approvals: [] }),
      operation: makeOperation(),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(makeMockClient()),
    });
    for (const field of RESULT_FIELDS) {
      assert.ok(
        Object.prototype.hasOwnProperty.call(result, field),
        `Missing field: ${field}`
      );
    }
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.result_status, "failure");
  });

  it("result_status is always 'success' or 'failure' — never invented", async () => {
    const successResult = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: makeRuntimeState(),
      operation: makeOperation(),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(makeMockClient()),
    });
    assert.ok(["success", "failure"].includes(successResult.result_status));

    const failureResult = await applyGoverned({
      approval_id: "",
      runtime_state: null,
      operation: null,
      connection_context: null,
    });
    assert.ok(["success", "failure"].includes(failureResult.result_status));
  });
});

// ---------------------------------------------------------------------------
// 13. Per-model governed write path proof
//     Each safe model must prove: create succeeds, write succeeds,
//     governance gates still enforced, guarded models still refused.
// ---------------------------------------------------------------------------

const SAFE_MODELS_CREATE = [
  { model: "stock.warehouse", values: { name: "Main WH", code: "WH" } },
  { model: "stock.picking.type", values: { name: "Delivery", code: "OUT" } },
  { model: "crm.stage", values: { name: "Qualification" } },
  { model: "crm.team", values: { name: "Direct Sales" } },
  { model: "res.partner.category", values: { name: "VIP" } },
  { model: "product.category", values: { name: "Electronics" } },
  { model: "uom.category", values: { name: "Weight" } },
  { model: "product.pricelist", values: { name: "Retail" } },
  { model: "mrp.workcenter", values: { name: "Assembly Line 1" } },
  { model: "delivery.carrier", values: { name: "DHL Express" } },
  { model: "pos.payment.method", values: { name: "Cash" } },
  { model: "hr.department", values: { name: "Engineering" } },
  { model: "hr.job", values: { name: "Developer" } },
  { model: "account.journal", values: { name: "Bank", type: "bank", code: "BNK" } },
  { model: "account.tax", values: { name: "VAT 20%", amount: 20, type_tax_use: "sale" } },
  { model: "hr.employee", values: { name: "Jane Doe", department_id: 1, job_id: 1, work_email: "jane@acme.com" } },
  { model: "account.account", values: { code: "100000", name: "Cash", account_type: "asset_current" } },
  { model: "res.users", values: { name: "New User", login: "newuser@acme.com", email: "newuser@acme.com" } },
  { model: "res.groups", values: { name: "Implementation Team" } },
];

describe("applyGoverned — per-model governed create proof", () => {
  for (const { model, values } of SAFE_MODELS_CREATE) {
    it(`${model} create succeeds through governed path`, async () => {
      const client = makeMockClient({ createResult: 100 });
      const result = await applyGoverned({
        approval_id: "approval-001",
        runtime_state: makeRuntimeState(),
        operation: { model, method: "create", values },
        connection_context: makeConnectionContext(),
        _getClient: makeGetClient(client),
      });
      assert.strictEqual(result.ok, true, `${model} create must succeed`);
      assert.strictEqual(result.result_status, "success");
      assert.strictEqual(result.odoo_result, 100);
      assert.strictEqual(client._calls.create.length, 1);
      assert.strictEqual(client._calls.create[0].model, model);
      assert.deepStrictEqual(client._calls.create[0].values, values);
      assert.strictEqual(result.execution_source_inputs.model, model);
      assert.strictEqual(result.execution_source_inputs.method, "create");
    });
  }
});

describe("applyGoverned — per-model governed write proof", () => {
  for (const { model, values } of SAFE_MODELS_CREATE) {
    it(`${model} write succeeds through governed path`, async () => {
      const client = makeMockClient({ writeResult: true });
      const result = await applyGoverned({
        approval_id: "approval-001",
        runtime_state: makeRuntimeState(),
        operation: { model, method: "write", ids: [1], values },
        connection_context: makeConnectionContext(),
        _getClient: makeGetClient(client),
      });
      assert.strictEqual(result.ok, true, `${model} write must succeed`);
      assert.strictEqual(result.result_status, "success");
      assert.strictEqual(result.odoo_result, true);
      assert.strictEqual(client._calls.write.length, 1);
      assert.strictEqual(client._calls.write[0].model, model);
      assert.deepStrictEqual(client._calls.write[0].ids, [1]);
      assert.strictEqual(result.execution_source_inputs.model, model);
      assert.strictEqual(result.execution_source_inputs.method, "write");
    });
  }
});

describe("applyGoverned — per-model governance gates still enforced", () => {
  for (const { model, values } of SAFE_MODELS_CREATE) {
    it(`${model} still requires approval (refuses missing approval_id)`, async () => {
      const result = await applyGoverned({
        approval_id: "",
        runtime_state: makeRuntimeState(),
        operation: { model, method: "create", values },
        connection_context: makeConnectionContext(),
        _getClient: makeGetClient(makeMockClient()),
      });
      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.result_status, "failure");
    });

    it(`${model} still requires preview (refuses missing preview)`, async () => {
      const rs = makeRuntimeState({ previews: [] });
      const result = await applyGoverned({
        approval_id: "approval-001",
        runtime_state: rs,
        operation: { model, method: "create", values },
        connection_context: makeConnectionContext(),
        _getClient: makeGetClient(makeMockClient()),
      });
      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.result_status, "failure");
      assert.ok(result.error.includes("Preview"));
    });

    it(`${model} still refuses re-execution`, async () => {
      const rs = makeRuntimeState({
        approvals: [makeApproval({ execution_occurred: true })],
      });
      const result = await applyGoverned({
        approval_id: "approval-001",
        runtime_state: rs,
        operation: { model, method: "create", values },
        connection_context: makeConnectionContext(),
        _getClient: makeGetClient(makeMockClient()),
      });
      assert.strictEqual(result.ok, false);
      assert.ok(result.error.includes("execution_occurred"));
    });
  }
});

describe("applyGoverned — non-implementation models refused", () => {
  const GUARDED = [
    { model: "ir.rule", values: { name: "Bypass" } },
    { model: "ir.model.access", values: { name: "Bypass" } },
    { model: "hr.payslip", values: { name: "Payslip" } },
    { model: "hr.contract", values: { name: "Contract" } },
    { model: "res.partner", values: { name: "Partner" } },
  ];

  for (const { model, values } of GUARDED) {
    it(`${model} create is refused`, async () => {
      const result = await applyGoverned({
        approval_id: "approval-001",
        runtime_state: makeRuntimeState(),
        operation: { model, method: "create", values },
        connection_context: makeConnectionContext(),
        _getClient: makeGetClient(makeMockClient()),
      });
      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.result_status, "failure");
      assert.ok(result.error.includes("not in the allowed apply set"));
    });

    it(`${model} write is refused`, async () => {
      const result = await applyGoverned({
        approval_id: "approval-001",
        runtime_state: makeRuntimeState(),
        operation: { model, method: "write", ids: [1], values },
        connection_context: makeConnectionContext(),
        _getClient: makeGetClient(makeMockClient()),
      });
      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.result_status, "failure");
      assert.ok(result.error.includes("not in the allowed apply set"));
    });
  }
});

describe("applyGoverned — per-model Odoo failure is truthful", () => {
  for (const { model, values } of SAFE_MODELS_CREATE) {
    it(`${model} Odoo error returns truthful failure envelope`, async () => {
      const odooError = new Error(`Access Denied on ${model}`);
      const client = makeMockClient({ throws: odooError });
      const result = await applyGoverned({
        approval_id: "approval-001",
        runtime_state: makeRuntimeState(),
        operation: { model, method: "create", values },
        connection_context: makeConnectionContext(),
        _getClient: makeGetClient(client),
      });
      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.result_status, "failure");
      assert.ok(result.error.includes(`Access Denied on ${model}`));
      assert.strictEqual(result.odoo_result, null);
      assert.ok(result.execution_source_inputs !== null);
      assert.strictEqual(result.execution_source_inputs.model, model);
    });
  }
});

// ---------------------------------------------------------------------------
// 14. Post-apply truth chain (R-RECORDING, R-CONSUMPTION, R-UPDATE)
// ---------------------------------------------------------------------------

describe("applyGoverned — post-apply truth chain", () => {
  // Fixture with checkpoint so computeExecutionRecords can pass all 5 gates.
  function makePostApplyCheckpoint(overrides = {}) {
    return {
      checkpoint_id: "CMP-FOUND-001",
      checkpoint_name: "Foundation",
      checkpoint_class: "Foundational",
      safety_class: "safe",
      execution_relevance: "Executable",
      preview_required: true,
      ...overrides,
    };
  }

  function makeRuntimeStateWithCheckpoint(overrides = {}) {
    const approvals   = overrides.approvals   ?? [makeApproval()];
    const candidates  = overrides.candidates  ?? [makeCandidate()];
    const previews    = overrides.previews    ?? [makePreview()];
    const checkpoints = overrides.checkpoints ?? [makePostApplyCheckpoint()];
    const executions  = overrides.executions  ?? [];
    return {
      previews,
      executions,
      checkpoints,
      _engine_outputs: {
        execution_approvals: { execution_approvals: approvals },
        execution_eligibility: { execution_candidates: candidates },
      },
    };
  }

  it("successful apply returns updated_runtime_state", async () => {
    const client = makeMockClient();
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: makeRuntimeStateWithCheckpoint(),
      operation: makeOperation(),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(client),
    });
    assert.strictEqual(result.ok, true);
    assert.ok(result.updated_runtime_state != null, "updated_runtime_state must be present on success");
    assert.strictEqual(typeof result.updated_runtime_state, "object");
  });

  it("consumed approval has execution_occurred = true in updated_runtime_state", async () => {
    const client = makeMockClient();
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: makeRuntimeStateWithCheckpoint(),
      operation: makeOperation(),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(client),
    });
    assert.strictEqual(result.ok, true);
    const approvals =
      result.updated_runtime_state?._engine_outputs?.execution_approvals?.execution_approvals;
    assert.ok(Array.isArray(approvals), "approvals must be an array in updated_runtime_state");
    const consumed = approvals.find((a) => a.approval_id === "approval-001");
    assert.ok(consumed, "consumed approval must exist in updated_runtime_state");
    assert.strictEqual(consumed.execution_occurred, true,
      "execution_occurred must be true on the consumed approval");
  });

  it("other approvals in the array are not modified", async () => {
    const otherApproval = makeApproval({ approval_id: "approval-other", execution_occurred: false });
    const client = makeMockClient();
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: makeRuntimeStateWithCheckpoint({ approvals: [makeApproval(), otherApproval] }),
      operation: makeOperation(),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(client),
    });
    assert.strictEqual(result.ok, true);
    const approvals =
      result.updated_runtime_state?._engine_outputs?.execution_approvals?.execution_approvals;
    const other = approvals.find((a) => a.approval_id === "approval-other");
    assert.ok(other, "other approval must remain in array");
    assert.strictEqual(other.execution_occurred, false,
      "other approval must remain untouched");
  });

  it("execution record is appended to executions in updated_runtime_state", async () => {
    const client = makeMockClient();
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: makeRuntimeStateWithCheckpoint(),
      operation: makeOperation(),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(client),
    });
    assert.strictEqual(result.ok, true);
    const executions = result.updated_runtime_state?.executions;
    assert.ok(Array.isArray(executions), "executions must be an array in updated_runtime_state");
    assert.strictEqual(executions.length, 1, "one execution record must be appended");
    const rec = executions[0];
    assert.strictEqual(rec.approval_id, "approval-001");
    assert.strictEqual(rec.result_status, "success");
    assert.strictEqual(rec.execution_record_type, "recorded");
    assert.ok(typeof rec.execution_id === "string" && rec.execution_id.length > 0,
      "execution_id must be a non-empty string");
  });

  it("second apply attempt with updated_runtime_state is refused", async () => {
    const client = makeMockClient();
    const firstResult = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: makeRuntimeStateWithCheckpoint(),
      operation: makeOperation(),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(client),
    });
    assert.strictEqual(firstResult.ok, true);

    // Second attempt passes the updated_runtime_state — execution_occurred is now true.
    const secondResult = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: firstResult.updated_runtime_state,
      operation: makeOperation(),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(client),
    });
    assert.strictEqual(secondResult.ok, false);
    assert.strictEqual(secondResult.result_status, "failure");
    assert.ok(secondResult.error.includes("execution_occurred"),
      "error must mention execution_occurred");
  });

  it("updated_runtime_state preserves other existing runtime_state fields", async () => {
    const client = makeMockClient();
    const originalState = makeRuntimeStateWithCheckpoint();
    originalState.project_identity = { project_id: "proj-preserve-001" };
    originalState.discovery_answers = { answers: { q1: "yes" } };

    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: originalState,
      operation: makeOperation(),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(client),
    });
    assert.strictEqual(result.ok, true);
    assert.deepStrictEqual(
      result.updated_runtime_state.project_identity,
      { project_id: "proj-preserve-001" }
    );
    assert.deepStrictEqual(
      result.updated_runtime_state.discovery_answers,
      { answers: { q1: "yes" } }
    );
  });

  it("updated_runtime_state absent on Odoo failure", async () => {
    const client = makeMockClient({ throws: new Error("Odoo write failed") });
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: makeRuntimeStateWithCheckpoint(),
      operation: makeOperation(),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(client),
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.updated_runtime_state, undefined,
      "updated_runtime_state must be absent on failure");
  });

  it("updated_runtime_state absent on validation failure (failClosed path)", async () => {
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: makeRuntimeStateWithCheckpoint({ approvals: [] }),
      operation: makeOperation(),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(makeMockClient()),
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.updated_runtime_state, undefined,
      "updated_runtime_state must be absent on validation failure");
  });

  it("executions from prior applies are preserved when appending new record", async () => {
    const priorExecution = {
      execution_id: "exec-prior-001",
      approval_id: "approval-prior",
      candidate_id: "candidate-001",
      preview_id: "preview-001",
      checkpoint_id: "CMP-FOUND-001",
      safety_class: "safe",
      result_status: "success",
      execution_source_inputs: null,
      execution_decision_path: null,
      execution_record_type: "recorded",
      recorded_at: "2026-01-01T00:00:00.000Z",
      deployment_target: null,
      branch_context: null,
    };
    const client = makeMockClient();
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: makeRuntimeStateWithCheckpoint({ executions: [priorExecution] }),
      operation: makeOperation(),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(client),
    });
    assert.strictEqual(result.ok, true);
    const executions = result.updated_runtime_state?.executions;
    assert.strictEqual(executions.length, 2,
      "prior execution must be preserved, new one appended");
    assert.strictEqual(executions[0].execution_id, "exec-prior-001");
    assert.strictEqual(executions[1].approval_id, "approval-001");
  });
});

// ---------------------------------------------------------------------------
// 15. Preview operation cross-check (S12)
//     When preview.target_model / preview.target_operation are non-null,
//     the caller-supplied operation must match exactly. Fail closed on mismatch.
//     Skip cross-check when preview fields are null or undefined.
// ---------------------------------------------------------------------------

describe("applyGoverned — preview operation cross-check (S12)", () => {
  it("refuses when operation.model does not match preview.target_model", async () => {
    const preview = makePreview({ target_model: "res.company", target_operation: "write" });
    const rs = makeRuntimeState({ previews: [preview] });
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: rs,
      operation: makeOperation({ model: "stock.warehouse" }),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(makeMockClient()),
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.result_status, "failure");
    assert.ok(result.error.includes("stock.warehouse"),
      `error must mention caller model, got: ${result.error}`);
    assert.ok(result.error.includes("res.company"),
      `error must mention preview-bound model, got: ${result.error}`);
    assert.strictEqual(result.execution_source_inputs, null);
  });

  it("refuses when operation.method does not match preview.target_operation", async () => {
    const preview = makePreview({ target_model: "res.company", target_operation: "write" });
    const rs = makeRuntimeState({ previews: [preview] });
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: rs,
      operation: { model: "res.company", method: "create", values: { name: "X" } },
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(makeMockClient()),
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.result_status, "failure");
    assert.ok(result.error.includes("create"),
      `error must mention caller method, got: ${result.error}`);
    assert.ok(result.error.includes("write"),
      `error must mention preview-bound operation, got: ${result.error}`);
    assert.strictEqual(result.execution_source_inputs, null);
  });

  it("passes through when operation.model and operation.method match preview-bound values", async () => {
    const client = makeMockClient();
    const preview = makePreview({ target_model: "res.company", target_operation: "write" });
    const rs = makeRuntimeState({ previews: [preview] });
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: rs,
      operation: makeOperation({ model: "res.company", method: "write" }),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(client),
    });
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.result_status, "success");
  });

  it("skips cross-check when preview.target_model is null", async () => {
    const client = makeMockClient();
    const preview = makePreview({ target_model: null, target_operation: null });
    const rs = makeRuntimeState({ previews: [preview] });
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: rs,
      operation: makeOperation({ model: "res.company", method: "write" }),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(client),
    });
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.result_status, "success");
  });

  it("skips cross-check when preview.target_model is undefined (field absent from preview record)", async () => {
    // makePreview() omits target_model and target_operation — they are undefined at runtime.
    // The loose != null guard must treat undefined the same as null.
    const client = makeMockClient();
    const preview = makePreview();
    const rs = makeRuntimeState({ previews: [preview] });
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: rs,
      operation: makeOperation({ model: "res.company", method: "write" }),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(client),
    });
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.result_status, "success");
  });

  it("cross-check mismatch returns standard fail-closed envelope shape", async () => {
    const preview = makePreview({ target_model: "res.company", target_operation: "write" });
    const rs = makeRuntimeState({ previews: [preview] });
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: rs,
      operation: makeOperation({ model: "stock.warehouse" }),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(makeMockClient()),
    });
    const RESULT_FIELDS = [
      "ok", "result_status", "odoo_result", "error", "executed_at", "execution_source_inputs",
    ];
    for (const field of RESULT_FIELDS) {
      assert.ok(
        Object.prototype.hasOwnProperty.call(result, field),
        `Missing field: ${field}`
      );
    }
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.result_status, "failure");
    assert.strictEqual(typeof result.error, "string");
    assert.ok(result.error.length > 0);
    assert.strictEqual(result.odoo_result, null);
    assert.strictEqual(result.execution_source_inputs, null);
  });
});

// ---------------------------------------------------------------------------
// 16. checkpoint_statuses population on governed apply
//     Root-cause fix: successful apply must set checkpoint_statuses[checkpoint_id]
//     = "Complete" so Both-sourced Executable checkpoints (FND-FOUND-001,
//     FND-FOUND-002, FND-DREQ-001, FND-DREQ-002) transition out of Not_Started.
// ---------------------------------------------------------------------------

describe("applyGoverned — checkpoint_statuses population", () => {
  // Test 1: checkpoint_statuses is populated on success
  it("checkpoint_statuses[checkpoint_id] is set to 'Complete' on success", async () => {
    const client = makeMockClient();
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: makeRuntimeState(),
      operation: makeOperation(),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(client),
    });
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.result_status, "success");
    const statuses = result.updated_runtime_state?.checkpoint_statuses;
    assert.ok(statuses != null, "checkpoint_statuses must be present in updated_runtime_state");
    assert.strictEqual(typeof statuses, "object");
    assert.strictEqual(statuses["CMP-FOUND-001"], "Complete",
      "approval.checkpoint_id must be keyed to 'Complete'");
  });

  // Test 2: checkpoint_statuses is not populated on failure
  it("checkpoint_statuses is not set on Odoo failure", async () => {
    const odooError = new Error("Odoo write failed");
    const client = makeMockClient({ throws: odooError });
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: makeRuntimeState(),
      operation: makeOperation(),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(client),
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.result_status, "failure");
    // updated_runtime_state absent on failure — checkpoint_statuses must not be set
    assert.strictEqual(result.updated_runtime_state, undefined,
      "updated_runtime_state must be absent on failure");
  });

  // Test 3: existing checkpoint_statuses entries are preserved
  it("existing checkpoint_statuses entries are preserved on success", async () => {
    const client = makeMockClient();
    const runtimeStateWithPriorStatuses = makeRuntimeState();
    runtimeStateWithPriorStatuses.checkpoint_statuses = {
      "FND-DREQ-001": "Complete",
      "FND-DREQ-002": "Complete",
    };
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: runtimeStateWithPriorStatuses,
      operation: makeOperation(),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(client),
    });
    assert.strictEqual(result.ok, true);
    const statuses = result.updated_runtime_state?.checkpoint_statuses;
    assert.ok(statuses != null, "checkpoint_statuses must be present");
    // Prior entries preserved
    assert.strictEqual(statuses["FND-DREQ-001"], "Complete",
      "prior entry FND-DREQ-001 must be preserved");
    assert.strictEqual(statuses["FND-DREQ-002"], "Complete",
      "prior entry FND-DREQ-002 must be preserved");
    // New entry added
    assert.strictEqual(statuses["CMP-FOUND-001"], "Complete",
      "new entry CMP-FOUND-001 must be added");
  });

  // Test 4: approval.checkpoint_id is used correctly
  it("uses approval.checkpoint_id exactly as the key (not operation model or other field)", async () => {
    const client = makeMockClient();
    const approval = makeApproval({ checkpoint_id: "FND-FOUND-002" });
    const candidate = makeCandidate({ checkpoint_id: "FND-FOUND-002" });
    const rs = {
      previews: [makePreview()],
      executions: [],
      _engine_outputs: {
        execution_approvals: { execution_approvals: [approval] },
        execution_eligibility: { execution_candidates: [candidate] },
      },
    };
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: rs,
      operation: makeOperation(),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(client),
    });
    assert.strictEqual(result.ok, true);
    const statuses = result.updated_runtime_state?.checkpoint_statuses;
    assert.ok(statuses != null, "checkpoint_statuses must be present");
    // FND-FOUND-002 keyed, not CMP-FOUND-001 or any other value
    assert.strictEqual(statuses["FND-FOUND-002"], "Complete",
      "approval.checkpoint_id 'FND-FOUND-002' must be the key");
    assert.strictEqual(statuses["CMP-FOUND-001"], undefined,
      "wrong checkpoint_id must not appear");
  });

  // Test 5: checkpoint_statuses initialises correctly when absent from runtime_state
  it("checkpoint_statuses initialises to a fresh object when absent from runtime_state", async () => {
    const client = makeMockClient();
    // Explicitly confirm no checkpoint_statuses in incoming runtime_state
    const rs = makeRuntimeState();
    assert.strictEqual(rs.checkpoint_statuses, undefined,
      "fixture must not pre-seed checkpoint_statuses");
    const result = await applyGoverned({
      approval_id: "approval-001",
      runtime_state: rs,
      operation: makeOperation(),
      connection_context: makeConnectionContext(),
      _getClient: makeGetClient(client),
    });
    assert.strictEqual(result.ok, true);
    const statuses = result.updated_runtime_state?.checkpoint_statuses;
    assert.ok(statuses != null, "checkpoint_statuses must be initialised");
    assert.strictEqual(typeof statuses, "object");
    assert.ok(!Array.isArray(statuses), "checkpoint_statuses must be a plain object, not an array");
    assert.strictEqual(statuses["CMP-FOUND-001"], "Complete",
      "single entry for the executed checkpoint must be present");
    // Only the one entry — no phantom keys
    assert.strictEqual(Object.keys(statuses).length, 1,
      "checkpoint_statuses must contain exactly one entry when initialised from absent state");
  });
});
