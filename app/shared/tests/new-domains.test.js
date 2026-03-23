import test from "node:test";
import assert from "node:assert/strict";

import {
  addManufacturingConfigurationRecord,
  getManufacturingConfigurationSections,
  normalizeManufacturingConfigurationState,
  updateManufacturingConfigurationRecord
} from "../manufacturing-configuration.js";
import { normalizeManufacturingEvidenceState, updateManufacturingEvidenceRecord } from "../manufacturing-evidence.js";
import {
  addCrmConfigurationRecord,
  getCrmConfigurationSections,
  normalizeCrmConfigurationState,
  updateCrmConfigurationRecord
} from "../crm-configuration.js";
import { normalizeCrmEvidenceState, updateCrmEvidenceRecord } from "../crm-evidence.js";
import {
  addWebsiteEcommerceConfigurationRecord,
  getWebsiteEcommerceConfigurationSections,
  normalizeWebsiteEcommerceConfigurationState,
  updateWebsiteEcommerceConfigurationRecord
} from "../website-ecommerce-configuration.js";
import { normalizeWebsiteEcommerceEvidenceState, updateWebsiteEcommerceEvidenceRecord } from "../website-ecommerce-evidence.js";
import {
  addPosConfigurationRecord,
  getPosConfigurationSections,
  normalizePosConfigurationState,
  updatePosConfigurationRecord
} from "../pos-configuration.js";
import { normalizePosEvidenceState, updatePosEvidenceRecord } from "../pos-evidence.js";
import {
  createInitialProjectState,
  normalizeProjectState,
  updateCheckpointRecord,
  validateStateShape
} from "../project-state.js";

// ===========================================================================
// MANUFACTURING CONFIGURATION
// ===========================================================================

test("manufacturing capture records are created and preserved across resume", () => {
  let state = createInitialProjectState();
  state = addManufacturingConfigurationRecord(state, "productionModeCapture");
  state = addManufacturingConfigurationRecord(state, "bomGovernanceCapture");

  const sections = getManufacturingConfigurationSections(state);
  const productionSection = sections.find((s) => s.id === "productionModeCapture");
  const bomSection = sections.find((s) => s.id === "bomGovernanceCapture");

  assert.equal(productionSection.records.length, 1);
  assert.equal(bomSection.records.length, 1);

  const resumed = normalizeProjectState(state);
  const resumedSections = getManufacturingConfigurationSections(resumed);
  assert.equal(resumedSections.find((s) => s.id === "productionModeCapture").records.length, 1);
  assert.equal(resumedSections.find((s) => s.id === "bomGovernanceCapture").records.length, 1);
});

test("manufacturing capture does not auto-pass manufacturing checkpoints", () => {
  let state = createInitialProjectState();
  state = addManufacturingConfigurationRecord(state, "productionModeCapture");
  state = updateManufacturingConfigurationRecord(state, "productionModeCapture", state.manufacturingConfiguration.productionModeCapture[0].key, {
    productionModeLabel: "Make to Order",
    inScope: true
  });

  const checkpoint = state.checkpoints.find((cp) => cp.id === "checkpoint-manufacturing-process-mode");
  assert.notEqual(checkpoint?.status, "Pass");
});

test("manufacturing capture remains distinct from read-only checkpoint truth", () => {
  let state = createInitialProjectState();
  state = addManufacturingConfigurationRecord(state, "routingControlCapture");
  state = updateManufacturingConfigurationRecord(state, "routingControlCapture", state.manufacturingConfiguration.routingControlCapture[0].key, {
    routingRequired: true,
    workOrderControlNote: "Work centers required"
  });

  const checkpoint = state.checkpoints.find((cp) => cp.id === "checkpoint-manufacturing-routing-control");
  const section = getManufacturingConfigurationSections(state).find((s) => s.id === "routingControlCapture");

  assert.ok(section.records[0].routingRequired);
  assert.notEqual(checkpoint?.status, "Pass");
});

test("legacy state without manufacturing configuration normalizes cleanly", () => {
  const state = createInitialProjectState();
  delete state.manufacturingConfiguration;

  const normalized = normalizeProjectState(state);
  const sections = getManufacturingConfigurationSections(normalized);

  assert.ok(Array.isArray(sections[0].records));
  assert.equal(validateStateShape(normalized), "");
});

// ===========================================================================
// MANUFACTURING EVIDENCE
// ===========================================================================

test("manufacturing structured capture maps to design_capture only, not system_detected", () => {
  let state = createInitialProjectState();
  state = addManufacturingConfigurationRecord(state, "productionModeCapture");

  const normalized = normalizeProjectState(state);
  const checkpoint = normalized.checkpoints.find((cp) => cp.id === "checkpoint-manufacturing-process-mode");
  const evidence = checkpoint?.manufacturingEvidence;

  assert.ok(evidence);
  assert.equal(evidence.mode, "design_capture");
  assert.notEqual(evidence.mode, "system_detected");
});

test("manufacturing user assertion remains distinct from system_detected", () => {
  let state = createInitialProjectState();
  const checkpoint = state.checkpoints.find((cp) => cp.id === "checkpoint-manufacturing-process-mode");
  assert.ok(checkpoint);

  state = updateManufacturingEvidenceRecord(state, "checkpoint-manufacturing-process-mode", {
    mode: "user_asserted",
    summary: "Reviewed in workshop",
    sourceLabel: "Design workshop",
    recordedActor: "lead"
  });

  const updated = state.checkpoints.find((cp) => cp.id === "checkpoint-manufacturing-process-mode");
  assert.equal(updated.manufacturingEvidence?.mode, "user_asserted");
  assert.notEqual(updated.manufacturingEvidence?.mode, "system_detected");
});

test("blocked manufacturing checkpoints do not auto-pass when evidence is weak", () => {
  let state = createInitialProjectState();
  state = addManufacturingConfigurationRecord(state, "productionModeCapture");
  state = addManufacturingConfigurationRecord(state, "bomGovernanceCapture");

  const normalized = normalizeProjectState(state);
  const processMode = normalized.checkpoints.find((cp) => cp.id === "checkpoint-manufacturing-process-mode");
  const bomGov = normalized.checkpoints.find((cp) => cp.id === "checkpoint-manufacturing-bom-governance");

  assert.notEqual(processMode?.status, "Pass");
  assert.notEqual(bomGov?.status, "Pass");
  assert.equal(processMode?.manufacturingEvidence?.mode, "design_capture");
});

test("attempted user-originated system-detected manufacturing evidence normalizes safely", () => {
  let state = createInitialProjectState();
  state = updateManufacturingEvidenceRecord(state, "checkpoint-manufacturing-process-mode", {
    mode: "system_detected",
    summary: "Fabricated",
    sourceLabel: "Fake system",
    recordedActor: "attacker"
  });

  const checkpoint = state.checkpoints.find((cp) => cp.id === "checkpoint-manufacturing-process-mode");
  const evidence = checkpoint?.manufacturingEvidence;

  assert.ok(evidence);
  assert.notEqual(evidence?.mode, "system_detected");
  assert.ok(["user_asserted", "none", "design_capture"].includes(evidence?.mode));
});

test("invalid system-detected manufacturing evidence without provenance normalizes safely", () => {
  const rawEvidence = {
    mode: "system_detected",
    summary: "",
    sourceLabel: "",
    notes: "",
    recordedActor: "",
    recordedAt: ""
  };

  const normalized = normalizeManufacturingEvidenceState(rawEvidence, "checkpoint-manufacturing-process-mode", null);
  assert.notEqual(normalized.mode, "system_detected");
  assert.equal(normalized.mode, "none");
});

test("resume preserves manufacturing evidence metadata", () => {
  let state = createInitialProjectState();
  state = updateManufacturingEvidenceRecord(state, "checkpoint-manufacturing-bom-governance", {
    mode: "user_asserted",
    summary: "BOM governance reviewed",
    sourceLabel: "Workshop notes",
    recordedActor: "eng-lead",
    recordedAt: "2026-03-01T10:00:00Z"
  });

  const resumed = normalizeProjectState(state);
  const checkpoint = resumed.checkpoints.find((cp) => cp.id === "checkpoint-manufacturing-bom-governance");

  assert.equal(checkpoint?.manufacturingEvidence?.mode, "user_asserted");
  assert.equal(checkpoint?.manufacturingEvidence?.recordedActor, "eng-lead");
});

// ===========================================================================
// CRM CONFIGURATION
// ===========================================================================

test("CRM capture records are created and preserved across resume", () => {
  let state = createInitialProjectState();
  state = addCrmConfigurationRecord(state, "pipelineCapture");
  state = addCrmConfigurationRecord(state, "activityDisciplineCapture");

  const sections = getCrmConfigurationSections(state);
  assert.equal(sections.find((s) => s.id === "pipelineCapture").records.length, 1);
  assert.equal(sections.find((s) => s.id === "activityDisciplineCapture").records.length, 1);

  const resumed = normalizeProjectState(state);
  const resumedSections = getCrmConfigurationSections(resumed);
  assert.equal(resumedSections.find((s) => s.id === "pipelineCapture").records.length, 1);
});

test("CRM capture does not auto-pass CRM checkpoints", () => {
  let state = createInitialProjectState();
  state = addCrmConfigurationRecord(state, "pipelineCapture");
  state = updateCrmConfigurationRecord(state, "pipelineCapture", state.crmConfiguration.pipelineCapture[0].key, {
    stageLabel: "New",
    inScope: true
  });

  const checkpoint = state.checkpoints.find((cp) => cp.id === "checkpoint-crm-pipeline-governance");
  assert.notEqual(checkpoint?.status, "Pass");
});

test("legacy state without CRM configuration normalizes cleanly", () => {
  const state = createInitialProjectState();
  delete state.crmConfiguration;

  const normalized = normalizeProjectState(state);
  const sections = getCrmConfigurationSections(normalized);

  assert.ok(Array.isArray(sections[0].records));
  assert.equal(validateStateShape(normalized), "");
});

// ===========================================================================
// CRM EVIDENCE
// ===========================================================================

test("CRM structured capture maps to design_capture only, not system_detected", () => {
  let state = createInitialProjectState();
  state = addCrmConfigurationRecord(state, "pipelineCapture");

  const normalized = normalizeProjectState(state);
  const checkpoint = normalized.checkpoints.find((cp) => cp.id === "checkpoint-crm-pipeline-governance");

  assert.ok(checkpoint?.crmEvidence);
  assert.equal(checkpoint?.crmEvidence?.mode, "design_capture");
  assert.notEqual(checkpoint?.crmEvidence?.mode, "system_detected");
});

test("attempted user-originated system-detected CRM evidence normalizes safely", () => {
  let state = createInitialProjectState();
  state = updateCrmEvidenceRecord(state, "checkpoint-crm-pipeline-governance", {
    mode: "system_detected",
    summary: "Fabricated",
    sourceLabel: "Fake",
    recordedActor: "attacker"
  });

  const checkpoint = state.checkpoints.find((cp) => cp.id === "checkpoint-crm-pipeline-governance");
  assert.notEqual(checkpoint?.crmEvidence?.mode, "system_detected");
});

test("invalid system-detected CRM evidence without provenance normalizes to none", () => {
  const raw = { mode: "system_detected", summary: "", sourceLabel: "", notes: "", recordedActor: "", recordedAt: "" };
  const normalized = normalizeCrmEvidenceState(raw, "checkpoint-crm-pipeline-governance", null);
  assert.equal(normalized.mode, "none");
});

test("resume preserves CRM evidence metadata", () => {
  let state = createInitialProjectState();
  state = updateCrmEvidenceRecord(state, "checkpoint-crm-sales-team-ownership", {
    mode: "user_asserted",
    summary: "Teams reviewed in workshop",
    sourceLabel: "Sales workshop",
    recordedActor: "crm-lead",
    recordedAt: "2026-03-01T10:00:00Z"
  });

  const resumed = normalizeProjectState(state);
  const checkpoint = resumed.checkpoints.find((cp) => cp.id === "checkpoint-crm-sales-team-ownership");

  assert.equal(checkpoint?.crmEvidence?.mode, "user_asserted");
  assert.equal(checkpoint?.crmEvidence?.recordedActor, "crm-lead");
});

// ===========================================================================
// WEBSITE/ECOMMERCE CONFIGURATION
// ===========================================================================

test("website/eCommerce capture records are created and preserved across resume", () => {
  let state = createInitialProjectState();
  state = addWebsiteEcommerceConfigurationRecord(state, "storefrontCapture");
  state = addWebsiteEcommerceConfigurationRecord(state, "checkoutCapture");

  const sections = getWebsiteEcommerceConfigurationSections(state);
  assert.equal(sections.find((s) => s.id === "storefrontCapture").records.length, 1);
  assert.equal(sections.find((s) => s.id === "checkoutCapture").records.length, 1);

  const resumed = normalizeProjectState(state);
  const resumedSections = getWebsiteEcommerceConfigurationSections(resumed);
  assert.equal(resumedSections.find((s) => s.id === "storefrontCapture").records.length, 1);
});

test("website/eCommerce capture does not auto-pass website checkpoints", () => {
  let state = createInitialProjectState();
  state = addWebsiteEcommerceConfigurationRecord(state, "checkoutCapture");
  state = updateWebsiteEcommerceConfigurationRecord(state, "checkoutCapture", state.websiteEcommerceConfiguration.checkoutCapture[0].key, {
    checkoutFlowLabel: "Standard B2C",
    inScope: true
  });

  const checkpoint = state.checkpoints.find((cp) => cp.id === "checkpoint-website-checkout-baseline");
  assert.notEqual(checkpoint?.status, "Pass");
});

test("legacy state without website/eCommerce configuration normalizes cleanly", () => {
  const state = createInitialProjectState();
  delete state.websiteEcommerceConfiguration;

  const normalized = normalizeProjectState(state);
  const sections = getWebsiteEcommerceConfigurationSections(normalized);

  assert.ok(Array.isArray(sections[0].records));
  assert.equal(validateStateShape(normalized), "");
});

// ===========================================================================
// WEBSITE/ECOMMERCE EVIDENCE
// ===========================================================================

test("website/eCommerce structured capture maps to design_capture only, not system_detected", () => {
  let state = createInitialProjectState();
  state = addWebsiteEcommerceConfigurationRecord(state, "storefrontCapture");

  const normalized = normalizeProjectState(state);
  const checkpoint = normalized.checkpoints.find((cp) => cp.id === "checkpoint-website-catalog-publication");

  assert.ok(checkpoint?.websiteEcommerceEvidence);
  assert.equal(checkpoint?.websiteEcommerceEvidence?.mode, "design_capture");
  assert.notEqual(checkpoint?.websiteEcommerceEvidence?.mode, "system_detected");
});

test("attempted user-originated system-detected website evidence normalizes safely", () => {
  let state = createInitialProjectState();
  state = updateWebsiteEcommerceEvidenceRecord(state, "checkpoint-website-checkout-baseline", {
    mode: "system_detected",
    summary: "Fabricated",
    sourceLabel: "Fake",
    recordedActor: "attacker"
  });

  const checkpoint = state.checkpoints.find((cp) => cp.id === "checkpoint-website-checkout-baseline");
  assert.notEqual(checkpoint?.websiteEcommerceEvidence?.mode, "system_detected");
});

test("invalid system-detected website evidence without provenance normalizes to none", () => {
  const raw = { mode: "system_detected", summary: "", sourceLabel: "", notes: "", recordedActor: "", recordedAt: "" };
  const normalized = normalizeWebsiteEcommerceEvidenceState(raw, "checkpoint-website-checkout-baseline", null);
  assert.equal(normalized.mode, "none");
});

test("resume preserves website/eCommerce evidence metadata", () => {
  let state = createInitialProjectState();
  state = updateWebsiteEcommerceEvidenceRecord(state, "checkpoint-website-catalog-publication", {
    mode: "user_asserted",
    summary: "Catalog scope reviewed",
    sourceLabel: "Website scope notes",
    recordedActor: "website-lead",
    recordedAt: "2026-03-01T10:00:00Z"
  });

  const resumed = normalizeProjectState(state);
  const checkpoint = resumed.checkpoints.find((cp) => cp.id === "checkpoint-website-catalog-publication");

  assert.equal(checkpoint?.websiteEcommerceEvidence?.mode, "user_asserted");
  assert.equal(checkpoint?.websiteEcommerceEvidence?.recordedActor, "website-lead");
});

// ===========================================================================
// POS DOMAIN + CONFIGURATION + EVIDENCE
// ===========================================================================

test("POS checkpoints are seeded into initial state with conservative defaults", () => {
  const state = createInitialProjectState();

  const sessionControl = state.checkpoints.find((cp) => cp.id === "checkpoint-pos-session-control");
  const cashierAccess = state.checkpoints.find((cp) => cp.id === "checkpoint-pos-cashier-access");
  const accountingLinkage = state.checkpoints.find((cp) => cp.id === "checkpoint-pos-accounting-linkage");

  assert.ok(sessionControl, "POS session control checkpoint must be seeded");
  assert.ok(cashierAccess, "POS cashier access checkpoint must be seeded");
  assert.ok(accountingLinkage, "POS accounting linkage checkpoint must be seeded");

  assert.equal(sessionControl.status, "Fail");
  assert.equal(cashierAccess.status, "Fail");
  assert.equal(accountingLinkage.status, "Fail");
  assert.equal(accountingLinkage.checkpointClass, "Go-Live");
});

test("POS capture records are created and preserved across resume", () => {
  let state = createInitialProjectState();
  state = addPosConfigurationRecord(state, "sessionPolicyCapture");
  state = addPosConfigurationRecord(state, "invoicingPolicyCapture");

  const sections = getPosConfigurationSections(state);
  assert.equal(sections.find((s) => s.id === "sessionPolicyCapture").records.length, 1);
  assert.equal(sections.find((s) => s.id === "invoicingPolicyCapture").records.length, 1);

  const resumed = normalizeProjectState(state);
  const resumedSections = getPosConfigurationSections(resumed);
  assert.equal(resumedSections.find((s) => s.id === "sessionPolicyCapture").records.length, 1);
});

test("POS capture does not auto-pass POS checkpoints", () => {
  let state = createInitialProjectState();
  state = addPosConfigurationRecord(state, "sessionPolicyCapture");
  state = updatePosConfigurationRecord(state, "sessionPolicyCapture", state.posConfiguration.sessionPolicyCapture[0].key, {
    sessionOpeningPolicyLabel: "Manual open",
    inScope: true
  });

  const checkpoint = state.checkpoints.find((cp) => cp.id === "checkpoint-pos-session-control");
  assert.notEqual(checkpoint?.status, "Pass");
});

test("POS structured capture maps to design_capture only, not system_detected", () => {
  let state = createInitialProjectState();
  state = addPosConfigurationRecord(state, "sessionPolicyCapture");

  const normalized = normalizeProjectState(state);
  const checkpoint = normalized.checkpoints.find((cp) => cp.id === "checkpoint-pos-session-control");

  assert.ok(checkpoint?.posEvidence);
  assert.equal(checkpoint?.posEvidence?.mode, "design_capture");
  assert.notEqual(checkpoint?.posEvidence?.mode, "system_detected");
});

test("attempted user-originated system-detected POS evidence normalizes safely", () => {
  let state = createInitialProjectState();
  state = updatePosEvidenceRecord(state, "checkpoint-pos-session-control", {
    mode: "system_detected",
    summary: "Fabricated POS data",
    sourceLabel: "Fake system",
    recordedActor: "attacker"
  });

  const checkpoint = state.checkpoints.find((cp) => cp.id === "checkpoint-pos-session-control");
  assert.notEqual(checkpoint?.posEvidence?.mode, "system_detected");
  assert.ok(["user_asserted", "none", "design_capture"].includes(checkpoint?.posEvidence?.mode));
});

test("invalid system-detected POS evidence without provenance normalizes to none", () => {
  const raw = { mode: "system_detected", summary: "", sourceLabel: "", notes: "", recordedActor: "", recordedAt: "" };
  const normalized = normalizePosEvidenceState(raw, "checkpoint-pos-session-control", null);
  assert.equal(normalized.mode, "none");
});

test("legacy state without POS configuration normalizes cleanly", () => {
  const state = createInitialProjectState();
  delete state.posConfiguration;

  const normalized = normalizeProjectState(state);
  const sections = getPosConfigurationSections(normalized);

  assert.ok(Array.isArray(sections[0].records));
  assert.equal(validateStateShape(normalized), "");
});

test("POS go-live accounting-linkage checkpoint depends on session control and cashier access", () => {
  const state = createInitialProjectState();

  const accountingLinkage = state.checkpoints.find((cp) => cp.id === "checkpoint-pos-accounting-linkage");
  assert.ok(accountingLinkage.dependencyIds.includes("checkpoint-pos-session-control"));
  assert.ok(accountingLinkage.dependencyIds.includes("checkpoint-pos-cashier-access"));
});

test("POS cashier access checkpoint depends on session control", () => {
  const state = createInitialProjectState();

  const cashierAccess = state.checkpoints.find((cp) => cp.id === "checkpoint-pos-cashier-access");
  assert.ok(cashierAccess.dependencyIds.includes("checkpoint-pos-session-control"));
});

test("POS session control no longer uses project-mode anchoring", () => {
  const state = createInitialProjectState();

  const sessionControl = state.checkpoints.find((cp) => cp.id === "checkpoint-pos-session-control");
  assert.deepEqual(sessionControl.dependencyIds, []);
});

test("required and go-live POS checkpoints cannot be manually promoted to pass through state patching", () => {
  let state = createInitialProjectState();

  state = updateCheckpointRecord(state, "checkpoint-pos-session-control", {
    status: "Pass",
    evidenceReference: "pos-session-approved"
  });
  state = updateCheckpointRecord(state, "checkpoint-pos-accounting-linkage", {
    status: "Pass",
    evidenceReference: "pos-accounting-approved"
  });

  assert.notEqual(state.checkpoints.find((cp) => cp.id === "checkpoint-pos-session-control")?.status, "Pass");
  assert.notEqual(state.checkpoints.find((cp) => cp.id === "checkpoint-pos-accounting-linkage")?.status, "Pass");
});

test("resumed weak POS pass is normalized to non-passing", () => {
  const state = createInitialProjectState();
  const checkpoint = state.checkpoints.find((cp) => cp.id === "checkpoint-pos-session-control");

  checkpoint.status = "Pass";
  checkpoint.evidenceReference = "weak-pos-support";
  checkpoint.checkpointOwner = "";
  checkpoint.reviewer = "";

  const resumed = normalizeProjectState(state);
  const normalizedCheckpoint = resumed.checkpoints.find((cp) => cp.id === "checkpoint-pos-session-control");

  assert.notEqual(normalizedCheckpoint?.status, "Pass");
  assert.ok(
    ["Awaiting accountable support", "Awaiting dependency resolution"].includes(normalizedCheckpoint?.evidenceStatus)
  );
});

test("save validation rejects weak POS pass support", () => {
  const state = createInitialProjectState();
  const checkpoint = state.checkpoints.find((cp) => cp.id === "checkpoint-pos-session-control");

  checkpoint.status = "Pass";
  checkpoint.evidenceReference = "weak-pos-support";
  checkpoint.checkpointOwner = "";
  checkpoint.reviewer = "";

  assert.match(validateStateShape(state), /checkpoint-pos-session-control/i);
});

test("resume preserves POS evidence metadata", () => {
  let state = createInitialProjectState();
  state = updatePosEvidenceRecord(state, "checkpoint-pos-accounting-linkage", {
    mode: "user_asserted",
    summary: "Accounting linkage reviewed",
    sourceLabel: "Finance workshop notes",
    recordedActor: "finance-lead",
    recordedAt: "2026-03-01T10:00:00Z"
  });

  const resumed = normalizeProjectState(state);
  const checkpoint = resumed.checkpoints.find((cp) => cp.id === "checkpoint-pos-accounting-linkage");

  assert.equal(checkpoint?.posEvidence?.mode, "user_asserted");
  assert.equal(checkpoint?.posEvidence?.recordedActor, "finance-lead");
});

// ===========================================================================
// EXTENDED DOMAIN FOUNDATIONS — seeding and conservative defaults
// ===========================================================================

test("Projects, HR, PLM, Quality, Documents, Sign, Approvals checkpoints are seeded into initial state", () => {
  const state = createInitialProjectState();

  assert.ok(state.checkpoints.find((cp) => cp.id === "checkpoint-projects-structure"));
  assert.ok(state.checkpoints.find((cp) => cp.id === "checkpoint-projects-billing-linkage"));
  assert.ok(state.checkpoints.find((cp) => cp.id === "checkpoint-hr-employee-structure"));
  assert.ok(state.checkpoints.find((cp) => cp.id === "checkpoint-hr-approval-relationships"));
  assert.ok(state.checkpoints.find((cp) => cp.id === "checkpoint-plm-change-control"));
  assert.ok(state.checkpoints.find((cp) => cp.id === "checkpoint-plm-approval-design"));
  assert.ok(state.checkpoints.find((cp) => cp.id === "checkpoint-quality-control-design"));
  assert.ok(state.checkpoints.find((cp) => cp.id === "checkpoint-quality-trigger-rules"));
  assert.ok(state.checkpoints.find((cp) => cp.id === "checkpoint-documents-workspace-governance"));
  assert.ok(state.checkpoints.find((cp) => cp.id === "checkpoint-sign-template-governance"));
  assert.ok(state.checkpoints.find((cp) => cp.id === "checkpoint-approvals-structure"));
});

test("foundation-only extended baselines no longer use project-mode anchoring where it is not required", () => {
  const state = createInitialProjectState();

  assert.deepEqual(state.checkpoints.find((cp) => cp.id === "checkpoint-projects-structure")?.dependencyIds, []);
  assert.deepEqual(state.checkpoints.find((cp) => cp.id === "checkpoint-hr-employee-structure")?.dependencyIds, []);
  assert.deepEqual(state.checkpoints.find((cp) => cp.id === "checkpoint-quality-control-design")?.dependencyIds, []);
  assert.deepEqual(state.checkpoints.find((cp) => cp.id === "checkpoint-documents-workspace-governance")?.dependencyIds, []);
  assert.deepEqual(state.checkpoints.find((cp) => cp.id === "checkpoint-sign-template-governance")?.dependencyIds, []);
});

test("extended domain Required checkpoints start at conservative Fail status", () => {
  const state = createInitialProjectState();

  const domainRequiredIds = [
    "checkpoint-projects-structure",
    "checkpoint-hr-employee-structure",
    "checkpoint-plm-change-control",
    "checkpoint-quality-control-design",
    "checkpoint-pos-session-control",
    "checkpoint-documents-workspace-governance",
    "checkpoint-sign-template-governance",
    "checkpoint-approvals-structure"
  ];

  for (const id of domainRequiredIds) {
    const checkpoint = state.checkpoints.find((cp) => cp.id === id);
    assert.ok(checkpoint, `Checkpoint ${id} must be seeded`);
    assert.equal(checkpoint.status, "Fail", `${id} must start at Fail`);
    assert.ok(checkpoint.blockerFlag, `${id} must have blockerFlag`);
  }
});

test("extended domain Go-Live checkpoints start at conservative Fail status", () => {
  const state = createInitialProjectState();

  const goLiveIds = [
    "checkpoint-projects-billing-linkage",
    "checkpoint-hr-approval-relationships",
    "checkpoint-plm-approval-design",
    "checkpoint-quality-trigger-rules",
    "checkpoint-pos-accounting-linkage"
  ];

  for (const id of goLiveIds) {
    const checkpoint = state.checkpoints.find((cp) => cp.id === id);
    assert.ok(checkpoint, `Go-Live checkpoint ${id} must be seeded`);
    assert.equal(checkpoint.status, "Fail", `${id} must start at Fail`);
  }
});

test("new foundation-only governed checkpoints cannot be manually promoted to pass through state patching", () => {
  let state = createInitialProjectState();

  for (const id of [
    "checkpoint-projects-structure",
    "checkpoint-hr-employee-structure",
    "checkpoint-plm-change-control",
    "checkpoint-quality-control-design",
    "checkpoint-documents-workspace-governance",
    "checkpoint-sign-template-governance",
    "checkpoint-approvals-structure"
  ]) {
    state = updateCheckpointRecord(state, id, {
      status: "Pass",
      evidenceReference: `${id}-support`
    });
  }

  for (const id of [
    "checkpoint-projects-structure",
    "checkpoint-hr-employee-structure",
    "checkpoint-plm-change-control",
    "checkpoint-quality-control-design",
    "checkpoint-documents-workspace-governance",
    "checkpoint-sign-template-governance",
    "checkpoint-approvals-structure"
  ]) {
    assert.notEqual(state.checkpoints.find((cp) => cp.id === id)?.status, "Pass", `${id} must not be manually passable`);
  }
});

test("resumed weak foundation-only pass is normalized to non-passing", () => {
  const state = createInitialProjectState();
  const checkpoint = state.checkpoints.find((cp) => cp.id === "checkpoint-projects-structure");

  checkpoint.status = "Pass";
  checkpoint.evidenceReference = "weak-projects-support";
  checkpoint.checkpointOwner = "";
  checkpoint.reviewer = "";

  const resumed = normalizeProjectState(state);
  const normalizedCheckpoint = resumed.checkpoints.find((cp) => cp.id === "checkpoint-projects-structure");

  assert.notEqual(normalizedCheckpoint?.status, "Pass");
  assert.ok(
    ["Awaiting accountable support", "Awaiting dependency resolution"].includes(normalizedCheckpoint?.evidenceStatus)
  );
});

test("save validation rejects weak foundation-only pass support", () => {
  const state = createInitialProjectState();
  const checkpoint = state.checkpoints.find((cp) => cp.id === "checkpoint-plm-change-control");

  checkpoint.status = "Pass";
  checkpoint.evidenceReference = "weak-plm-support";
  checkpoint.checkpointOwner = "";
  checkpoint.reviewer = "";

  assert.match(validateStateShape(state), /checkpoint-plm-change-control/i);
});

test("legacy state without POS checkpoints normalizes and re-seeds them cleanly", () => {
  let state = createInitialProjectState();
  state.checkpoints = state.checkpoints.filter(
    (cp) => !["checkpoint-pos-session-control", "checkpoint-pos-cashier-access", "checkpoint-pos-accounting-linkage"].includes(cp.id)
  );

  const normalized = normalizeProjectState(state);

  assert.ok(normalized.checkpoints.find((cp) => cp.id === "checkpoint-pos-session-control"));
  assert.ok(normalized.checkpoints.find((cp) => cp.id === "checkpoint-pos-accounting-linkage"));
  assert.equal(validateStateShape(normalized), "");
});

test("legacy state without extended domain checkpoints normalizes and re-seeds them cleanly", () => {
  let state = createInitialProjectState();
  state.checkpoints = state.checkpoints.filter(
    (cp) => !["checkpoint-projects-structure", "checkpoint-hr-employee-structure", "checkpoint-plm-change-control"].includes(cp.id)
  );

  const normalized = normalizeProjectState(state);

  assert.ok(normalized.checkpoints.find((cp) => cp.id === "checkpoint-projects-structure"));
  assert.ok(normalized.checkpoints.find((cp) => cp.id === "checkpoint-hr-employee-structure"));
  assert.ok(normalized.checkpoints.find((cp) => cp.id === "checkpoint-plm-change-control"));
  assert.equal(validateStateShape(normalized), "");
});

test("PLM change-control checkpoint carries manufacturing-BOM dependency", () => {
  const state = createInitialProjectState();

  const plmChangeControl = state.checkpoints.find((cp) => cp.id === "checkpoint-plm-change-control");
  assert.ok(plmChangeControl.dependencyIds.includes("checkpoint-manufacturing-bom-governance"));
});

test("Approvals structure checkpoint carries users role-approval dependency", () => {
  const state = createInitialProjectState();

  const approvalsStructure = state.checkpoints.find((cp) => cp.id === "checkpoint-approvals-structure");
  assert.ok(approvalsStructure.dependencyIds.includes("checkpoint-role-approval-design"));
});

test("PLM dependency propagation blocks change control until manufacturing BOM governance passes", () => {
  const state = createInitialProjectState();
  const plmChangeControl = state.checkpoints.find((cp) => cp.id === "checkpoint-plm-change-control");

  assert.equal(plmChangeControl?.status, "Fail");
  assert.match(plmChangeControl?.blockedReason || "", /Bill of materials governance baseline defined/i);
});

test("Approvals dependency propagation blocks approval structure until role approval design passes", () => {
  const state = createInitialProjectState();
  const approvalsStructure = state.checkpoints.find((cp) => cp.id === "checkpoint-approvals-structure");

  assert.equal(approvalsStructure?.status, "Fail");
  assert.match(approvalsStructure?.blockedReason || "", /Role and approval design assigned/i);
});

test("PLM dependency mutation re-propagates across normalization and resume", () => {
  let state = createInitialProjectState();
  let plmCheckpoint = state.checkpoints.find((cp) => cp.id === "checkpoint-plm-change-control");

  plmCheckpoint.status = "Pass";
  plmCheckpoint.evidenceReference = "plm-change-control-approved";
  plmCheckpoint.checkpointOwner = "Engineering lead";
  plmCheckpoint.reviewer = "Engineering reviewer";

  let normalized = normalizeProjectState(state);
  let normalizedPlm = normalized.checkpoints.find((cp) => cp.id === "checkpoint-plm-change-control");
  assert.equal(normalizedPlm?.status, "Fail");
  assert.match(normalizedPlm?.blockedReason || "", /Bill of materials governance baseline defined/i);

  const projectMode = normalized.checkpoints.find((cp) => cp.id === "checkpoint-project-mode");
  projectMode.status = "Pass";
  projectMode.evidenceReference = "project-mode-approved";
  projectMode.checkpointOwner = "Project owner";
  projectMode.reviewer = "Implementation lead";
  projectMode.blockerFlag = false;
  projectMode.blockedReason = "";

  const processCheckpoint = normalized.checkpoints.find((cp) => cp.id === "checkpoint-manufacturing-process-mode");
  processCheckpoint.status = "Pass";
  processCheckpoint.evidenceReference = "manufacturing-process-approved";
  processCheckpoint.checkpointOwner = "Manufacturing lead";
  processCheckpoint.reviewer = "Manufacturing reviewer";
  processCheckpoint.blockerFlag = false;
  processCheckpoint.blockedReason = "";

  const bomCheckpoint = normalized.checkpoints.find((cp) => cp.id === "checkpoint-manufacturing-bom-governance");
  bomCheckpoint.status = "Pass";
  bomCheckpoint.evidenceReference = "bom-governance-approved";
  bomCheckpoint.checkpointOwner = "Manufacturing lead";
  bomCheckpoint.reviewer = "Manufacturing reviewer";
  bomCheckpoint.blockerFlag = false;
  bomCheckpoint.blockedReason = "";

  normalizedPlm = normalized.checkpoints.find((cp) => cp.id === "checkpoint-plm-change-control");
  normalizedPlm.status = "Pass";
  normalizedPlm.evidenceReference = "plm-change-control-approved";
  normalizedPlm.checkpointOwner = "Engineering lead";
  normalizedPlm.reviewer = "Engineering reviewer";

  normalized = normalizeProjectState(structuredClone(normalized));
  normalizedPlm = normalized.checkpoints.find((cp) => cp.id === "checkpoint-plm-change-control");
  assert.equal(normalizedPlm?.status, "Pass");
  assert.equal(normalizedPlm?.blockedReason, "");

  const regressedBom = normalized.checkpoints.find((cp) => cp.id === "checkpoint-manufacturing-bom-governance");
  regressedBom.status = "Fail";
  regressedBom.evidenceReference = "";
  regressedBom.checkpointOwner = "Manufacturing lead";
  regressedBom.reviewer = "Manufacturing reviewer";
  regressedBom.blockerFlag = true;
  regressedBom.blockedReason = "Manufacturing BOM governance regressed.";

  normalized = normalizeProjectState(structuredClone(normalized));
  normalizedPlm = normalized.checkpoints.find((cp) => cp.id === "checkpoint-plm-change-control");
  assert.equal(normalizedPlm?.status, "Fail");
  assert.match(normalizedPlm?.blockedReason || "", /Dependency not met:/);
  assert.match(normalizedPlm?.blockedReason || "", /Bill of materials governance baseline defined/i);
});

test("Approvals dependency mutation re-propagates across normalization and resume", () => {
  let state = createInitialProjectState();
  let approvalsCheckpoint = state.checkpoints.find((cp) => cp.id === "checkpoint-approvals-structure");

  approvalsCheckpoint.status = "Pass";
  approvalsCheckpoint.evidenceReference = "approvals-structure-approved";
  approvalsCheckpoint.checkpointOwner = "Project owner";
  approvalsCheckpoint.reviewer = "Approvals reviewer";

  let normalized = normalizeProjectState(state);
  let normalizedApprovals = normalized.checkpoints.find((cp) => cp.id === "checkpoint-approvals-structure");
  assert.equal(normalizedApprovals?.status, "Fail");
  assert.match(normalizedApprovals?.blockedReason || "", /Role and approval design assigned/i);

  const projectMode = normalized.checkpoints.find((cp) => cp.id === "checkpoint-project-mode");
  projectMode.status = "Pass";
  projectMode.evidenceReference = "project-mode-approved";
  projectMode.checkpointOwner = "Project owner";
  projectMode.reviewer = "Implementation lead";
  projectMode.blockerFlag = false;
  projectMode.blockedReason = "";

  const usersAccess = normalized.checkpoints.find((cp) => cp.id === "checkpoint-users-access-design");
  usersAccess.status = "Pass";
  usersAccess.evidenceReference = "users-access-approved";
  usersAccess.checkpointOwner = "Project owner";
  usersAccess.reviewer = "Security reviewer";
  usersAccess.blockerFlag = false;
  usersAccess.blockedReason = "";

  const roleApproval = normalized.checkpoints.find((cp) => cp.id === "checkpoint-role-approval-design");
  roleApproval.status = "Pass";
  roleApproval.evidenceReference = "role-approval-approved";
  roleApproval.checkpointOwner = "Security lead";
  roleApproval.reviewer = "Security reviewer";
  roleApproval.blockerFlag = false;
  roleApproval.blockedReason = "";

  normalizedApprovals = normalized.checkpoints.find((cp) => cp.id === "checkpoint-approvals-structure");
  normalizedApprovals.status = "Pass";
  normalizedApprovals.evidenceReference = "approvals-structure-approved";
  normalizedApprovals.checkpointOwner = "Project owner";
  normalizedApprovals.reviewer = "Approvals reviewer";

  normalized = normalizeProjectState(structuredClone(normalized));
  normalizedApprovals = normalized.checkpoints.find((cp) => cp.id === "checkpoint-approvals-structure");
  assert.equal(normalizedApprovals?.status, "Pass");
  assert.equal(normalizedApprovals?.blockedReason, "");

  const regressedRoleApproval = normalized.checkpoints.find((cp) => cp.id === "checkpoint-role-approval-design");
  regressedRoleApproval.status = "Fail";
  regressedRoleApproval.evidenceReference = "";
  regressedRoleApproval.checkpointOwner = "Security lead";
  regressedRoleApproval.reviewer = "Security reviewer";
  regressedRoleApproval.blockerFlag = true;
  regressedRoleApproval.blockedReason = "Role approval design regressed.";

  normalized = normalizeProjectState(structuredClone(normalized));
  normalizedApprovals = normalized.checkpoints.find((cp) => cp.id === "checkpoint-approvals-structure");
  assert.equal(normalizedApprovals?.status, "Fail");
  assert.match(normalizedApprovals?.blockedReason || "", /Dependency not met:/);
  assert.match(normalizedApprovals?.blockedReason || "", /Role and approval design assigned/i);
});

test("all existing prerequisite and operational domains still seed and validate after full expansion", () => {
  const state = createInitialProjectState();

  assert.ok(state.checkpoints.find((cp) => cp.id === "checkpoint-foundation-localization-selection"));
  assert.ok(state.checkpoints.find((cp) => cp.id === "checkpoint-inventory-warehouse-setup"));
  assert.ok(state.checkpoints.find((cp) => cp.id === "checkpoint-finance-policy"));
  assert.ok(state.checkpoints.find((cp) => cp.id === "checkpoint-sales-process-mode"));
  assert.ok(state.checkpoints.find((cp) => cp.id === "checkpoint-purchase-process-mode"));
  assert.ok(state.checkpoints.find((cp) => cp.id === "checkpoint-manufacturing-process-mode"));
  assert.ok(state.checkpoints.find((cp) => cp.id === "checkpoint-crm-pipeline-governance"));
  assert.ok(state.checkpoints.find((cp) => cp.id === "checkpoint-website-scope-baseline"));
  assert.equal(validateStateShape(state), "");
});

test("total checkpoint count increases correctly with new domains", () => {
  const state = createInitialProjectState();
  // Expanded initial state produces 58 checkpoints across all seeded domains
  assert.ok(state.checkpoints.length >= 55, `Expected at least 55 checkpoints, got ${state.checkpoints.length}`);
});

test("manufacturingConfiguration, crmConfiguration, websiteEcommerceConfiguration, posConfiguration initialized in initial state", () => {
  const state = createInitialProjectState();

  assert.ok("manufacturingConfiguration" in state, "manufacturingConfiguration must be in initial state");
  assert.ok("crmConfiguration" in state, "crmConfiguration must be in initial state");
  assert.ok("websiteEcommerceConfiguration" in state, "websiteEcommerceConfiguration must be in initial state");
  assert.ok("posConfiguration" in state, "posConfiguration must be in initial state");
  assert.ok(Array.isArray(state.manufacturingConfiguration.productionModeCapture));
  assert.ok(Array.isArray(state.crmConfiguration.pipelineCapture));
  assert.ok(Array.isArray(state.websiteEcommerceConfiguration.storefrontCapture));
  assert.ok(Array.isArray(state.posConfiguration.sessionPolicyCapture));
});

test("validateStateShape passes on full expanded initial state", () => {
  const state = createInitialProjectState();
  assert.equal(validateStateShape(state), "");
});
