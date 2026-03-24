import test from "node:test";
import assert from "node:assert/strict";

import { connectProject, disconnectProject, executePreview, inspectDomain, previewDomain } from "./engine.js";
import { createInitialProjectState } from "../shared/project-state.js";

function createFakeOdooFetch() {
  const state = {
    modules: [
      { id: 1, name: "base", state: "installed" },
      { id: 2, name: "crm", state: "installed" },
      { id: 3, name: "stock", state: "installed" },
      { id: 4, name: "product", state: "installed" },
      { id: 5, name: "contacts", state: "installed" },
      { id: 6, name: "uom", state: "installed" }
    ],
    companies: [{ id: 10, name: "Old Name" }],
    warehouses: [{ id: 20, name: "Main Warehouse", code: "MAIN" }],
    operationTypes: [],
    stages: [{ id: 30, name: "New" }],
    teams: [],
    partnerCategories: [{ id: 40, name: "VIP" }],
    productCategories: [{ id: 50, name: "All", parent_id: false, complete_name: "All" }],
    uomCategories: [{ id: 60, name: "Weight" }],
    partners: [{ id: 70, name: "Azure Interior" }],
    productTemplates: [{ id: 80, name: "Desk" }]
  };

  const fetchImpl = async (url, options = {}) => {
    if (String(url).includes("/web/session/authenticate")) {
      return new Response(
        JSON.stringify({ jsonrpc: "2.0", id: 1, result: { uid: 7 } }),
        { status: 200, headers: { "set-cookie": "session_id=session-xyz; Path=/" } }
      );
    }

    const body = JSON.parse(options.body || "{}");
    const params = body.params || {};

    if (String(url).includes("/web/webclient/version_info")) {
      return new Response(
        JSON.stringify({ jsonrpc: "2.0", id: 1, result: { server_version: "19.0", server_serie: "19.0" } }),
        { status: 200 }
      );
    }

    if (String(url).includes("/web/dataset/call_kw")) {
      const result = handleCall(state, params.model, params.method, params.args || [], params.kwargs || {});
      return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result }), { status: 200 });
    }

    return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, error: { message: "Unsupported request" } }), { status: 400 });
  };

  return { state, fetchImpl };
}

function handleCall(state, model, method, args, kwargs) {
  if (method === "search_read") {
    const rows = getRows(state, model);
    const fields = kwargs.fields || [];
    return rows.slice(0, kwargs.limit || rows.length).map((row) => selectFields(row, fields));
  }

  if (method === "search_count") {
    return getRows(state, model).length;
  }

  if (method === "create") {
    const values = args[0] || {};
    if (model === "crm.team") {
      const id = state.teams.length + 100;
      state.teams.push({ id, name: values.name });
      return id;
    }

    if (model === "crm.stage") {
      const id = state.stages.length + 100;
      state.stages.push({ id, name: values.name });
      return id;
    }

    if (model === "stock.warehouse") {
      const id = state.warehouses.length + 100;
      state.warehouses.push({ id, name: values.name, code: values.code });
      return id;
    }

    if (model === "stock.picking.type") {
      const id = state.operationTypes.length + 100;
      state.operationTypes.push({
        id,
        name: values.name,
        code: values.code,
        warehouse_id: [values.warehouse_id, "Main Warehouse"]
      });
      return id;
    }

    if (model === "res.partner.category") {
      const id = state.partnerCategories.length + 100;
      state.partnerCategories.push({ id, name: values.name });
      return id;
    }

    if (model === "product.category") {
      const id = state.productCategories.length + 100;
      const parentId = values.parent_id || false;
      const parent = parentId ? state.productCategories.find((item) => item.id === parentId) : null;
      state.productCategories.push({
        id,
        name: values.name,
        parent_id: parent ? [parent.id, parent.name] : false,
        complete_name: parent ? `${parent.complete_name}/${values.name}` : values.name
      });
      return id;
    }

    if (model === "uom.category") {
      const id = state.uomCategories.length + 100;
      state.uomCategories.push({ id, name: values.name });
      return id;
    }
  }

  if (method === "write") {
    const [ids, values] = args;
    if (model === "res.company") {
      for (const id of ids) {
        const row = state.companies.find((company) => company.id === id);
        if (row) {
          Object.assign(row, values);
        }
      }
      return true;
    }
  }

  throw new Error(`Unhandled fake Odoo call ${model}.${method}`);
}

function getRows(state, model) {
  switch (model) {
    case "ir.module.module":
      return state.modules;
    case "res.company":
      return state.companies;
    case "stock.warehouse":
      return state.warehouses;
    case "stock.picking.type":
      return state.operationTypes;
    case "crm.stage":
      return state.stages;
    case "crm.team":
      return state.teams;
    case "res.partner":
      return state.partners;
    case "product.template":
      return state.productTemplates;
    case "res.partner.category":
      return state.partnerCategories;
    case "product.category":
      return state.productCategories;
    case "uom.category":
      return state.uomCategories;
    default:
      return [];
  }
}

function selectFields(row, fields) {
  const result = {};
  for (const field of fields) {
    result[field] = row[field];
  }
  return result;
}

test("CRM inspection and preview include live team scaffolding support", async () => {
  const { fetchImpl } = createFakeOdooFetch();
  const project = createInitialProjectState();
  project.projectIdentity.organizationName = "Acme";
  project.crmConfiguration.activityDisciplineCapture = [
    {
      key: "team-1",
      salesTeamLabel: "North Team",
      ownerRoleNote: "Sales lead",
      activityTypeNotes: "",
      inScope: true
    }
  ];

  project.connectionState = await connectProject(project, {
    url: "https://example.odoo.test",
    database: "demo",
    username: "admin",
    password: "secret"
  }, fetchImpl);

  const inspection = await inspectDomain(project, "crm", fetchImpl);
  assert.equal(inspection.recordCounts.teams, 0);

  const result = await previewDomain(project, "crm", fetchImpl);
  assert.ok(result.previews.some((preview) => preview.targetModel === "crm.team" && preview.executable));
  disconnectProject(project);
});

test("executePreview refuses a stale CRM team preview after live inspection drift", async () => {
  const { state, fetchImpl } = createFakeOdooFetch();
  const project = createInitialProjectState();
  project.crmConfiguration.activityDisciplineCapture = [
    {
      key: "team-1",
      salesTeamLabel: "North Team",
      ownerRoleNote: "Sales lead",
      activityTypeNotes: "",
      inScope: true
    }
  ];

  project.connectionState = await connectProject(project, {
    url: "https://example.odoo.test",
    database: "demo",
    username: "admin",
    password: "secret"
  }, fetchImpl);

  const preview = (await previewDomain(project, "crm", fetchImpl)).previews.find((item) => item.targetModel === "crm.team");
  state.teams.push({ id: 200, name: "North Team" });

  const outcome = await executePreview(project, preview, { confirmed: true }, fetchImpl);
  assert.equal(outcome.execution.status, "failed");
  assert.match(outcome.execution.failureReason, /stale|no longer matches/i);
  disconnectProject(project);
});

test("inventory operation type preview stays conditional until linked warehouse exists live", async () => {
  const { fetchImpl } = createFakeOdooFetch();
  const project = createInitialProjectState();
  project.inventoryConfiguration.warehouses = [
    {
      key: "wh-2",
      warehouseName: "Overflow Warehouse",
      code: "OVR",
      companyScope: "",
      purposeNotes: "",
      inScope: true
    }
  ];
  project.inventoryConfiguration.operationTypes = [
    {
      key: "op-1",
      linkedWarehouseKey: "wh-2",
      operationTypeName: "Overflow Receipts",
      operationTypeKey: "IN",
      flowCategory: "Inbound",
      sequenceOrder: "",
      notes: "",
      inScope: true
    }
  ];

  project.connectionState = await connectProject(project, {
    url: "https://example.odoo.test",
    database: "demo",
    username: "admin",
    password: "secret"
  }, fetchImpl);

  const preview = (await previewDomain(project, "inventory", fetchImpl)).previews.find(
    (item) => item.targetModel === "stock.picking.type"
  );

  assert.equal(preview.safetyClass, "conditional");
  assert.equal(preview.executable, false);
  assert.match(preview.blockedReason, /linked warehouse/i);
  disconnectProject(project);
});

test("executePreview applies a safe inventory operation type after warehouse exists live", async () => {
  const { fetchImpl } = createFakeOdooFetch();
  const project = createInitialProjectState();
  project.inventoryConfiguration.warehouses = [
    {
      key: "wh-1",
      warehouseName: "Main Warehouse",
      code: "MAIN",
      companyScope: "",
      purposeNotes: "",
      inScope: true
    }
  ];
  project.inventoryConfiguration.operationTypes = [
    {
      key: "op-1",
      linkedWarehouseKey: "wh-1",
      operationTypeName: "Main Receipts",
      operationTypeKey: "IN",
      flowCategory: "Inbound",
      sequenceOrder: "",
      notes: "",
      inScope: true
    }
  ];

  project.connectionState = await connectProject(project, {
    url: "https://example.odoo.test",
    database: "demo",
    username: "admin",
    password: "secret"
  }, fetchImpl);

  const preview = (await previewDomain(project, "inventory", fetchImpl)).previews.find(
    (item) => item.targetModel === "stock.picking.type"
  );
  const outcome = await executePreview(project, preview, { confirmed: true }, fetchImpl);

  assert.equal(outcome.execution.status, "succeeded");
  assert.equal(outcome.auditEntry.targetModel, "stock.picking.type");
  assert.equal(outcome.auditEntry.prerequisiteStatus, "validated");
  disconnectProject(project);
});

test("master-data inspection captures record-level shared classification state", async () => {
  const { fetchImpl } = createFakeOdooFetch();
  const project = createInitialProjectState();
  project.connectionState = await connectProject(project, {
    url: "https://example.odoo.test",
    database: "demo",
    username: "admin",
    password: "secret"
  }, fetchImpl);

  const inspection = await inspectDomain(project, "master-data", fetchImpl);
  assert.equal(inspection.modelStatus["res.partner.category"], "readable");
  assert.equal(inspection.modelStatus["product.category"], "readable");
  assert.equal(inspection.recordCounts.partnerCategories, 1);
  assert.equal(inspection.recordCounts.productCategories, 1);
  disconnectProject(project);
});

test("master-data preview includes safe and blocked create-first classification actions", async () => {
  const { fetchImpl } = createFakeOdooFetch();
  const project = createInitialProjectState();
  project.masterDataConfiguration.partnerCategoryCapture = [
    { key: "p-1", categoryName: "VIP", stewardshipNote: "", inScope: true },
    { key: "p-2", categoryName: "Regional Customer", stewardshipNote: "", inScope: true }
  ];
  project.masterDataConfiguration.productCategoryCapture = [
    { key: "c-1", categoryName: "Components", parentCategoryName: "Missing Parent", stewardshipNote: "", inScope: true }
  ];
  project.connectionState = await connectProject(project, {
    url: "https://example.odoo.test",
    database: "demo",
    username: "admin",
    password: "secret"
  }, fetchImpl);

  const previews = (await previewDomain(project, "master-data", fetchImpl)).previews;
  const duplicatePartnerPreview = previews.find((item) => item.targetModel === "res.partner.category" && item.targetIdentifier === "VIP");
  const safePartnerPreview = previews.find((item) => item.targetModel === "res.partner.category" && item.targetIdentifier === "Regional Customer");
  const conditionalProductPreview = previews.find((item) => item.targetModel === "product.category");

  assert.equal(duplicatePartnerPreview.safetyClass, "blocked");
  assert.equal(duplicatePartnerPreview.executable, false);
  assert.equal(safePartnerPreview.safetyClass, "safe");
  assert.equal(safePartnerPreview.executable, true);
  assert.equal(conditionalProductPreview.safetyClass, "conditional");
  assert.equal(conditionalProductPreview.executable, false);
  disconnectProject(project);
});

test("master-data executePreview applies safe category creation and refuses stale preview", async () => {
  const { state, fetchImpl } = createFakeOdooFetch();
  const project = createInitialProjectState();
  project.masterDataConfiguration.partnerCategoryCapture = [
    { key: "p-1", categoryName: "Regional Customer", stewardshipNote: "", inScope: true }
  ];
  project.connectionState = await connectProject(project, {
    url: "https://example.odoo.test",
    database: "demo",
    username: "admin",
    password: "secret"
  }, fetchImpl);

  const preview = (await previewDomain(project, "master-data", fetchImpl)).previews.find(
    (item) => item.targetModel === "res.partner.category" && item.executable
  );

  const outcome = await executePreview(project, preview, { confirmed: true }, fetchImpl);
  assert.equal(outcome.execution.status, "succeeded");
  assert.equal(outcome.auditEntry.targetModel, "res.partner.category");

  const stalePreview = structuredClone(preview);
  state.partnerCategories.push({ id: 999, name: "Regional Customer" });
  const staleOutcome = await executePreview(project, stalePreview, { confirmed: true }, fetchImpl);
  assert.equal(staleOutcome.execution.status, "failed");
  assert.match(staleOutcome.execution.failureReason, /stale|no longer matches/i);
  assert.equal(staleOutcome.auditEntry.status, "failed");
  assert.match(staleOutcome.auditEntry.reason, /stale|no longer matches/i);
  disconnectProject(project);
});

test("master-data executePreview refuses forged cross-domain model writes", async () => {
  const { state, fetchImpl } = createFakeOdooFetch();
  const project = createInitialProjectState();
  project.connectionState = await connectProject(project, {
    url: "https://example.odoo.test",
    database: "demo",
    username: "admin",
    password: "secret"
  }, fetchImpl);

  const initialWarehouseCount = state.warehouses.length;
  const forgedPreview = {
    id: "preview-forged-master-data-warehouse",
    domainId: "master-data",
    title: "Forged cross-domain write",
    targetModel: "stock.warehouse",
    targetIdentifier: "Should Not Execute",
    operation: "create",
    safetyClass: "safe",
    executable: true,
    prerequisites: []
  };

  const outcome = await executePreview(project, forgedPreview, { confirmed: true }, fetchImpl);
  assert.equal(outcome.execution.status, "failed");
  assert.match(outcome.execution.failureReason, /stale|unknown preview action|unsupported/i);
  assert.equal(outcome.auditEntry.status, "failed");
  assert.equal(state.warehouses.length, initialWarehouseCount);
  disconnectProject(project);
});
