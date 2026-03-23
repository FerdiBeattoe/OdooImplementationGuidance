import test from "node:test";
import assert from "node:assert/strict";

import { ODOO_VERSION } from "../constants.js";
import {
  addAccountingConfigurationRecord,
  getAccountingConfigurationSections,
  updateAccountingConfigurationRecord
} from "../accounting-configuration.js";
import {
  addSalesConfigurationRecord,
  getSalesConfigurationSections,
  updateSalesConfigurationRecord
} from "../sales-configuration.js";
import {
  addPurchaseConfigurationRecord,
  getPurchaseConfigurationSections,
  updatePurchaseConfigurationRecord
} from "../purchase-configuration.js";
import { normalizePurchaseEvidenceState, updatePurchaseEvidenceRecord } from "../purchase-evidence.js";
import { normalizeSalesEvidenceState, updateSalesEvidenceRecord } from "../sales-evidence.js";
import { normalizeAccountingEvidenceState, updateAccountingEvidenceRecord } from "../accounting-evidence.js";
import {
  addInventoryConfigurationRecord,
  getInventoryConfigurationSections,
  updateInventoryConfigurationRecord
} from "../inventory-configuration.js";
import { normalizeInventoryEvidenceState, updateInventoryEvidenceRecord } from "../inventory-evidence.js";
import { createInitialProjectState, deferCheckpointRecord, normalizeProjectState, updateCheckpointRecord, validateStateShape } from "../project-state.js";

test("initial project state is pinned to Odoo 19", () => {
  const state = createInitialProjectState();
  assert.equal(state.projectIdentity.version, ODOO_VERSION);
  assert.equal(validateStateShape(state), "");
});

test("initial project state includes checkpoint provenance fields", () => {
  const state = createInitialProjectState();
  const checkpoint = state.checkpoints[0];

  assert.ok("checkpointOwner" in checkpoint);
  assert.ok("reviewer" in checkpoint);
  assert.ok("evidenceReference" in checkpoint);
  assert.ok("blockedReason" in checkpoint);
  assert.ok("reviewPoint" in checkpoint);
  assert.ok("lastTransitionBy" in checkpoint);
});

test("inventory operation types remain blocked until warehouse setup passes", () => {
  const state = createInitialProjectState();
  const operationTypes = state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-inventory-operation-types");

  assert.equal(operationTypes.status, "Fail");
  assert.match(operationTypes.blockedReason, /Dependency not met|warehouse/i);
});

test("accounting stock mapping remains blocked until valuation method policy passes", () => {
  const state = createInitialProjectState();
  const stockMapping = state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-accounting-stock-mapping-prerequisites");

  assert.equal(stockMapping.status, "Fail");
  assert.match(stockMapping.blockedReason, /Inventory valuation method policy confirmed/i);
});

test("inventory valuation remains blocked until accounting-sensitive prerequisites pass", () => {
  const state = createInitialProjectState();
  const valuation = state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-inventory-valuation");

  assert.equal(valuation.status, "Fail");
  assert.match(valuation.blockedReason, /Inventory valuation method policy confirmed|Stock accounting mapping prerequisites confirmed/i);
});

test("foundation, users, and master-data scaffold checkpoints are seeded into initial state", () => {
  const state = createInitialProjectState();

  assert.ok(state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-foundation-localization-selection"));
  assert.ok(state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-users-access-design"));
  assert.ok(state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-master-data-core-ownership"));
  assert.ok(state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-sales-process-mode"));
});

test("scaffolded domain checkpoints derive blocked states conservatively", () => {
  const state = createInitialProjectState();
  const localization = state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-foundation-localization-selection");
  const privilegedAccess = state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-users-privileged-access-review");
  const masterDataReadiness = state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-master-data-readiness");

  assert.equal(localization.status, "Fail");
  assert.match(localization.blockedReason, /Project mode confirmed/i);
  assert.equal(privilegedAccess.status, "Fail");
  assert.match(privilegedAccess.blockedReason, /Role and approval design assigned/i);
  assert.equal(masterDataReadiness.status, "Fail");
  assert.match(masterDataReadiness.blockedReason, /Shared classification structure defined/i);
});

test("legacy state without scaffolded domain checkpoints normalizes cleanly", () => {
  const state = createInitialProjectState();
  state.checkpoints = state.checkpoints.filter((checkpoint) =>
    ![
      "checkpoint-foundation-localization-selection",
      "checkpoint-foundation-operating-assumptions",
      "checkpoint-users-access-design",
      "checkpoint-users-privileged-access-review",
      "checkpoint-master-data-core-ownership",
      "checkpoint-master-data-structure",
      "checkpoint-master-data-readiness"
    ].includes(checkpoint.id)
  );

  const normalized = normalizeProjectState(state);

  assert.ok(normalized.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-foundation-localization-selection"));
  assert.ok(normalized.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-users-access-design"));
  assert.ok(normalized.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-master-data-core-ownership"));
  assert.equal(validateStateShape(normalized), "");
});

test("inventory and accounting checkpoint slices remain seeded after scaffold expansion", () => {
  const state = createInitialProjectState();

  assert.ok(state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-finance-policy"));
  assert.ok(state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-inventory-warehouse-setup"));
  assert.ok(state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-sales-process-mode"));
});

test("sales pricing and quotation control remain blocked until baseline sales checkpoints pass", () => {
  const state = createInitialProjectState();
  const pricing = state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-sales-pricing-policy");
  const quotationControl = state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-sales-quotation-control");

  assert.equal(pricing.status, "Fail");
  assert.match(pricing.blockedReason, /Quotation-to-order baseline defined/i);
  assert.equal(quotationControl.status, "Fail");
  assert.match(quotationControl.blockedReason, /Quotation-to-order baseline defined|Pricing and pricelist baseline defined/i);
});

test("purchase vendor policy and approval control remain blocked until baseline purchase checkpoints pass", () => {
  const state = createInitialProjectState();
  const vendorPolicy = state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-purchase-vendor-pricing-policy");
  const approvalControl = state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-purchase-approval-control");

  assert.equal(vendorPolicy.status, "Fail");
  assert.match(vendorPolicy.blockedReason, /RFQ-to-purchase-order baseline defined/i);
  assert.equal(approvalControl.status, "Fail");
  assert.match(approvalControl.blockedReason, /RFQ-to-purchase-order baseline defined|Vendor terms and pricing baseline defined/i);
});

test("manufacturing BOM governance and routing control remain blocked until baseline manufacturing checkpoints pass", () => {
  const state = createInitialProjectState();
  const bomGovernance = state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-manufacturing-bom-governance");
  const routingControl = state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-manufacturing-routing-control");

  assert.equal(bomGovernance.status, "Fail");
  assert.match(bomGovernance.blockedReason, /Manufacturing process mode baseline defined/i);
  assert.equal(routingControl.status, "Fail");
  assert.match(routingControl.blockedReason, /Manufacturing process mode baseline defined|Bill of materials governance baseline defined/i);
});

test("legacy state without manufacturing checkpoints normalizes cleanly", () => {
  const state = createInitialProjectState();
  state.checkpoints = state.checkpoints.filter((checkpoint) =>
    ![
      "checkpoint-manufacturing-process-mode",
      "checkpoint-manufacturing-bom-governance",
      "checkpoint-manufacturing-routing-control",
      "checkpoint-manufacturing-production-handoff"
    ].includes(checkpoint.id)
  );

  const normalized = normalizeProjectState(state);

  assert.ok(normalized.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-manufacturing-process-mode"));
  assert.ok(normalized.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-manufacturing-bom-governance"));
  assert.ok(normalized.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-manufacturing-routing-control"));
  assert.ok(normalized.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-manufacturing-production-handoff"));
  assert.equal(validateStateShape(normalized), "");
});

test("required and go-live manufacturing checkpoints cannot be manually promoted to pass through state patching", () => {
  let state = createInitialProjectState();
  state = seedSupportedProjectModePass(state);

  state = updateCheckpointRecord(state, "checkpoint-manufacturing-process-mode", {
    status: "Pass",
    evidenceReference: "manufacturing-process-approved"
  });
  state = updateCheckpointRecord(state, "checkpoint-manufacturing-bom-governance", {
    status: "Pass",
    evidenceReference: "manufacturing-bom-approved"
  });
  state = updateCheckpointRecord(state, "checkpoint-manufacturing-routing-control", {
    status: "Pass",
    evidenceReference: "manufacturing-routing-approved"
  });

  assert.equal(
    state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-manufacturing-process-mode").status,
    "Fail"
  );
  assert.equal(
    state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-manufacturing-bom-governance").status,
    "Fail"
  );
  assert.equal(
    state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-manufacturing-routing-control").status,
    "Fail"
  );
});

test("resumed weak manufacturing pass is normalized to non-passing", () => {
  const state = seedSupportedProjectModePass(createInitialProjectState());
  const checkpoint = state.checkpoints.find((item) => item.id === "checkpoint-manufacturing-process-mode");
  checkpoint.status = "Pass";
  checkpoint.evidenceReference = "";
  checkpoint.checkpointOwner = "";
  checkpoint.reviewer = "";
  checkpoint.blockerFlag = false;
  checkpoint.blockedReason = "";

  const resumed = normalizeProjectState(structuredClone(state));
  const normalizedCheckpoint = resumed.checkpoints.find((item) => item.id === "checkpoint-manufacturing-process-mode");

  assert.equal(normalizedCheckpoint.status, "Warning");
  assert.equal(normalizedCheckpoint.evidenceStatus, "Awaiting accountable support");
});

test("save validation rejects weak manufacturing pass support", () => {
  const state = createInitialProjectState();
  const checkpoint = state.checkpoints.find((item) => item.id === "checkpoint-manufacturing-process-mode");
  checkpoint.status = "Pass";
  checkpoint.evidenceReference = "";
  checkpoint.checkpointOwner = "";
  checkpoint.reviewer = "";
  checkpoint.blockerFlag = false;
  checkpoint.blockedReason = "";

  const error = validateStateShape(state);

  assert.match(error, /checkpoint-manufacturing-process-mode/i);
});

test("legacy state without purchase checkpoints normalizes cleanly", () => {
  const state = createInitialProjectState();
  state.checkpoints = state.checkpoints.filter((checkpoint) =>
    ![
      "checkpoint-purchase-process-mode",
      "checkpoint-purchase-vendor-pricing-policy",
      "checkpoint-purchase-approval-control",
      "checkpoint-purchase-inbound-handoff"
    ].includes(checkpoint.id)
  );

  const normalized = normalizeProjectState(state);

  assert.ok(normalized.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-purchase-process-mode"));
  assert.ok(normalized.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-purchase-vendor-pricing-policy"));
  assert.ok(normalized.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-purchase-approval-control"));
  assert.ok(normalized.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-purchase-inbound-handoff"));
  assert.equal(validateStateShape(normalized), "");
});

test("required and go-live purchase checkpoints cannot be manually promoted to pass through state patching", () => {
  let state = createInitialProjectState();
  state = seedSupportedProjectModePass(state);

  state = updateCheckpointRecord(state, "checkpoint-purchase-process-mode", {
    status: "Pass",
    evidenceReference: "purchase-process-approved"
  });
  state = updateCheckpointRecord(state, "checkpoint-purchase-vendor-pricing-policy", {
    status: "Pass",
    evidenceReference: "purchase-vendor-policy-approved"
  });
  state = updateCheckpointRecord(state, "checkpoint-purchase-approval-control", {
    status: "Pass",
    evidenceReference: "purchase-approval-control-approved"
  });

  assert.equal(
    state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-purchase-process-mode").status,
    "Fail"
  );
  assert.equal(
    state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-purchase-vendor-pricing-policy").status,
    "Fail"
  );
  assert.equal(
    state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-purchase-approval-control").status,
    "Fail"
  );
});

test("resumed weak purchase pass is normalized to non-passing", () => {
  const state = seedSupportedProjectModePass(createInitialProjectState());
  const checkpoint = state.checkpoints.find((item) => item.id === "checkpoint-purchase-process-mode");
  checkpoint.status = "Pass";
  checkpoint.evidenceReference = "";
  checkpoint.checkpointOwner = "";
  checkpoint.reviewer = "";
  checkpoint.blockerFlag = false;
  checkpoint.blockedReason = "";

  const resumed = normalizeProjectState(structuredClone(state));
  const normalizedCheckpoint = resumed.checkpoints.find((item) => item.id === "checkpoint-purchase-process-mode");

  assert.equal(normalizedCheckpoint.status, "Warning");
  assert.equal(normalizedCheckpoint.evidenceStatus, "Awaiting accountable support");
});

test("save validation rejects weak purchase pass support", () => {
  const state = createInitialProjectState();
  const checkpoint = state.checkpoints.find((item) => item.id === "checkpoint-purchase-process-mode");
  checkpoint.status = "Pass";
  checkpoint.evidenceReference = "";
  checkpoint.checkpointOwner = "";
  checkpoint.reviewer = "";
  checkpoint.blockerFlag = false;
  checkpoint.blockedReason = "";

  const error = validateStateShape(state);

  assert.match(error, /checkpoint-purchase-process-mode/i);
});

test("legacy state without purchase configuration normalizes cleanly", () => {
  const legacyState = createInitialProjectState();
  delete legacyState.purchaseConfiguration;

  const normalized = normalizeProjectState(legacyState);

  assert.deepEqual(normalized.purchaseConfiguration, {
    processCapture: [],
    vendorPricingCapture: [],
    approvalControlCapture: [],
    inboundHandoffCapture: []
  });
  assert.equal(validateStateShape(normalized), "");
});

test("purchase capture records are created and preserved across resume", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(addPurchaseConfigurationRecord(state, "processCapture"));
  state = normalizeProjectState(addPurchaseConfigurationRecord(state, "vendorPricingCapture"));
  state = normalizeProjectState(addPurchaseConfigurationRecord(state, "approvalControlCapture"));
  state = normalizeProjectState(addPurchaseConfigurationRecord(state, "inboundHandoffCapture"));

  const processKey = state.purchaseConfiguration.processCapture[0].key;
  const pricingKey = state.purchaseConfiguration.vendorPricingCapture[0].key;
  const controlKey = state.purchaseConfiguration.approvalControlCapture[0].key;
  const handoffKey = state.purchaseConfiguration.inboundHandoffCapture[0].key;

  state = normalizeProjectState(
    updatePurchaseConfigurationRecord(state, "processCapture", processKey, {
      rfqFlowMode: "RFQ then named purchase approval",
      poConfirmationAssumptions: "Purchase lead confirms before vendor commitment",
      exceptionNotes: "Urgent buys reviewed separately",
      inScope: true
    })
  );
  state = normalizeProjectState(
    updatePurchaseConfigurationRecord(state, "vendorPricingCapture", pricingKey, {
      pricingApproachLabel: "Approved vendor terms with bounded exceptions",
      vendorPricelistUsageAssumption: "Single baseline vendor term pattern in phase 1",
      priceControlNote: "Price exceptions require named approval",
      inScope: true
    })
  );
  state = normalizeProjectState(
    updatePurchaseConfigurationRecord(state, "approvalControlCapture", controlKey, {
      approvalRequired: true,
      approvalOwnerRoleNote: "Procurement manager",
      controlNotes: "Non-standard POs require explicit review",
      inScope: true
    })
  );
  state = normalizeProjectState(
    updatePurchaseConfigurationRecord(state, "inboundHandoffCapture", handoffKey, {
      inboundHandoffType: "Confirmed PO to inbound operations queue",
      downstreamHandoffNote: "Receipt execution remains governed outside this slice",
      dependencyNote: "Inventory-sensitive inbound assumptions remain reviewable",
      inScope: true
    })
  );

  const resumed = normalizeProjectState(structuredClone(state));

  assert.equal(resumed.purchaseConfiguration.processCapture[0].rfqFlowMode, "RFQ then named purchase approval");
  assert.equal(resumed.purchaseConfiguration.vendorPricingCapture[0].pricingApproachLabel, "Approved vendor terms with bounded exceptions");
  assert.equal(resumed.purchaseConfiguration.approvalControlCapture[0].approvalOwnerRoleNote, "Procurement manager");
  assert.equal(resumed.purchaseConfiguration.inboundHandoffCapture[0].inboundHandoffType, "Confirmed PO to inbound operations queue");

  const sections = getPurchaseConfigurationSections(resumed);
  assert.equal(sections.find((section) => section.id === "processCapture").summary.totalRecords, 1);
  assert.equal(sections.find((section) => section.id === "vendorPricingCapture").summary.totalRecords, 1);
});

test("purchase capture does not auto-pass purchase checkpoints", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(addPurchaseConfigurationRecord(state, "processCapture"));
  const recordKey = state.purchaseConfiguration.processCapture[0].key;
  state = normalizeProjectState(
    updatePurchaseConfigurationRecord(state, "processCapture", recordKey, {
      rfqFlowMode: "RFQ then controlled confirmation",
      poConfirmationAssumptions: "Confirmation is explicit",
      exceptionNotes: "Exceptions are reviewed",
      inScope: true
    })
  );

  const checkpoint = state.checkpoints.find((item) => item.id === "checkpoint-purchase-process-mode");

  assert.equal(checkpoint.status, "Fail");
  assert.equal(checkpoint.blockerFlag, true);
});

test("purchase capture remains distinct from read-only checkpoint truth", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(addPurchaseConfigurationRecord(state, "approvalControlCapture"));
  const recordKey = state.purchaseConfiguration.approvalControlCapture[0].key;
  state = normalizeProjectState(
    updatePurchaseConfigurationRecord(state, "approvalControlCapture", recordKey, {
      approvalRequired: true,
      approvalOwnerRoleNote: "Procurement lead",
      controlNotes: "Approval required for non-standard POs",
      inScope: true
    })
  );

  const sections = getPurchaseConfigurationSections(state);
  const section = sections.find((item) => item.id === "approvalControlCapture");

  assert.equal(section.checkpoint.id, "checkpoint-purchase-approval-control");
  assert.equal(section.checkpoint.status, "Fail");
  assert.equal(section.summary.totalRecords, 1);
  assert.equal(section.summary.linkedRecords, 1);
});

test("legacy state without purchase evidence normalizes cleanly", () => {
  const state = createInitialProjectState();
  for (const checkpoint of state.checkpoints) {
    delete checkpoint.purchaseEvidence;
  }

  const normalized = normalizeProjectState(state);
  const purchaseCheckpoint = normalized.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-purchase-process-mode");

  assert.equal(purchaseCheckpoint.purchaseEvidence.mode, "none");
});

test("purchase structured capture maps to design_capture only, not system_detected", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(addPurchaseConfigurationRecord(state, "processCapture"));
  const recordKey = state.purchaseConfiguration.processCapture[0].key;
  state = normalizeProjectState(
    updatePurchaseConfigurationRecord(state, "processCapture", recordKey, {
      rfqFlowMode: "RFQ then confirmation",
      poConfirmationAssumptions: "Explicit confirmation path",
      exceptionNotes: "Exceptions are reviewed",
      inScope: true
    })
  );

  const checkpoint = state.checkpoints.find((item) => item.id === "checkpoint-purchase-process-mode");

  assert.equal(checkpoint.purchaseEvidence.mode, "design_capture");
  assert.notEqual(checkpoint.purchaseEvidence.mode, "system_detected");
});

test("purchase user assertion remains distinct from system_detected", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(
    updatePurchaseEvidenceRecord(state, "checkpoint-purchase-vendor-pricing-policy", {
      mode: "user_asserted",
      summary: "Procurement lead confirmed vendor policy direction.",
      sourceLabel: "User assertion",
      notes: "Awaiting reviewer support.",
      recordedActor: "purchase-ui-user"
    })
  );

  const checkpoint = state.checkpoints.find((item) => item.id === "checkpoint-purchase-vendor-pricing-policy");

  assert.equal(checkpoint.purchaseEvidence.mode, "user_asserted");
  assert.notEqual(checkpoint.purchaseEvidence.mode, "system_detected");
  assert.equal(checkpoint.purchaseEvidence.recordedActor, "purchase-ui-user");
});

test("blocked purchase checkpoints do not auto-pass when evidence is weak", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(
    updatePurchaseEvidenceRecord(state, "checkpoint-purchase-approval-control", {
      mode: "user_asserted",
      summary: "Purchase approvals asserted as ready.",
      sourceLabel: "User assertion",
      recordedActor: "purchase-ui-user"
    })
  );

  const checkpoint = state.checkpoints.find((item) => item.id === "checkpoint-purchase-approval-control");

  assert.equal(checkpoint.status, "Fail");
  assert.equal(checkpoint.blockerFlag, true);
});

test("resume preserves purchase evidence metadata", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(
    updatePurchaseEvidenceRecord(state, "checkpoint-purchase-inbound-handoff", {
      mode: "user_asserted",
      summary: "Inbound handoff assumptions reviewed for phase 1.",
      sourceLabel: "User assertion",
      notes: "Still recommended rather than required.",
      recordedActor: "purchase-ui-user",
      recordedAt: "2026-03-22T08:30:00.000Z"
    })
  );

  const resumed = normalizeProjectState(structuredClone(state));
  const checkpoint = resumed.checkpoints.find((item) => item.id === "checkpoint-purchase-inbound-handoff");

  assert.equal(checkpoint.purchaseEvidence.mode, "user_asserted");
  assert.equal(checkpoint.purchaseEvidence.summary, "Inbound handoff assumptions reviewed for phase 1.");
  assert.equal(checkpoint.purchaseEvidence.recordedAt, "2026-03-22T08:30:00.000Z");
});

test("purchase evidence provenance remains separate from checkpoint support fields", () => {
  let state = seedSupportedProjectModePass(createInitialProjectState());
  state = normalizeProjectState(
    updatePurchaseEvidenceRecord(state, "checkpoint-purchase-process-mode", {
      mode: "user_asserted",
      summary: "Purchase process direction confirmed by owner.",
      sourceLabel: "User assertion",
      recordedActor: "purchase-ui-user",
      recordedAt: "2026-03-22T09:00:00.000Z"
    })
  );
  state = updateCheckpointRecord(state, "checkpoint-purchase-process-mode", {
    evidenceReference: "purchase-process-reference",
    checkpointOwner: "Procurement lead",
    reviewer: "Procurement reviewer"
  });

  const checkpoint = state.checkpoints.find((item) => item.id === "checkpoint-purchase-process-mode");

  assert.equal(checkpoint.purchaseEvidence.summary, "Purchase process direction confirmed by owner.");
  assert.equal(checkpoint.evidenceReference, "purchase-process-reference");
  assert.notEqual(checkpoint.purchaseEvidence.recordedAt, "");
});

test("attempted user-originated system-detected purchase evidence normalizes safely", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(
    updatePurchaseEvidenceRecord(state, "checkpoint-purchase-process-mode", {
      mode: "system_detected",
      summary: "Claimed detected purchase process",
      sourceLabel: "System import",
      recordedActor: "purchase-ui-user"
    })
  );

  const checkpoint = state.checkpoints.find((item) => item.id === "checkpoint-purchase-process-mode");

  assert.equal(checkpoint.purchaseEvidence.mode, "user_asserted");
});

test("invalid system-detected purchase evidence without explicit provenance normalizes safely", () => {
  const evidence = normalizePurchaseEvidenceState(
    {
      mode: "system_detected",
      summary: "Claimed detected purchase evidence",
      sourceLabel: "Manual note",
      recordedActor: "purchase-ui-user"
    },
    "checkpoint-purchase-vendor-pricing-policy",
    {}
  );

  assert.equal(evidence.mode, "user_asserted");
});

test("legacy state without sales checkpoints normalizes cleanly", () => {
  const state = createInitialProjectState();
  state.checkpoints = state.checkpoints.filter((checkpoint) =>
    ![
      "checkpoint-sales-process-mode",
      "checkpoint-sales-pricing-policy",
      "checkpoint-sales-quotation-control",
      "checkpoint-sales-fulfillment-handoff"
    ].includes(checkpoint.id)
  );

  const normalized = normalizeProjectState(state);

  assert.ok(normalized.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-sales-process-mode"));
  assert.ok(normalized.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-sales-pricing-policy"));
  assert.ok(normalized.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-sales-quotation-control"));
  assert.ok(normalized.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-sales-fulfillment-handoff"));
  assert.equal(validateStateShape(normalized), "");
});

test("legacy state without sales configuration normalizes cleanly", () => {
  const legacyState = createInitialProjectState();
  delete legacyState.salesConfiguration;

  const normalized = normalizeProjectState(legacyState);

  assert.deepEqual(normalized.salesConfiguration, {
    processCapture: [],
    pricingCapture: [],
    quotationControlCapture: [],
    fulfillmentHandoffCapture: []
  });
  assert.equal(validateStateShape(normalized), "");
});

test("required and go-live sales checkpoints cannot be manually promoted to pass through state patching", () => {
  let state = createInitialProjectState();
  state = seedSupportedProjectModePass(state);

  state = updateCheckpointRecord(state, "checkpoint-sales-process-mode", {
    status: "Pass",
    evidenceReference: "sales-process-approved"
  });
  state = updateCheckpointRecord(state, "checkpoint-sales-pricing-policy", {
    status: "Pass",
    evidenceReference: "pricing-policy-approved"
  });
  state = updateCheckpointRecord(state, "checkpoint-sales-quotation-control", {
    status: "Pass",
    evidenceReference: "quotation-control-approved"
  });

  assert.equal(
    state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-sales-process-mode").status,
    "Fail"
  );
  assert.equal(
    state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-sales-pricing-policy").status,
    "Fail"
  );
  assert.equal(
    state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-sales-quotation-control").status,
    "Fail"
  );
});

test("resumed weak sales pass is normalized to non-passing", () => {
  const state = seedSupportedProjectModePass(createInitialProjectState());
  const checkpoint = state.checkpoints.find((item) => item.id === "checkpoint-sales-process-mode");
  checkpoint.status = "Pass";
  checkpoint.evidenceReference = "";
  checkpoint.checkpointOwner = "";
  checkpoint.reviewer = "";
  checkpoint.blockerFlag = false;
  checkpoint.blockedReason = "";

  const resumed = normalizeProjectState(structuredClone(state));
  const normalizedCheckpoint = resumed.checkpoints.find((item) => item.id === "checkpoint-sales-process-mode");

  assert.equal(normalizedCheckpoint.status, "Warning");
  assert.equal(normalizedCheckpoint.evidenceStatus, "Awaiting accountable support");
});

test("save validation rejects weak sales pass support", () => {
  const state = createInitialProjectState();
  const checkpoint = state.checkpoints.find((item) => item.id === "checkpoint-sales-process-mode");
  checkpoint.status = "Pass";
  checkpoint.evidenceReference = "";
  checkpoint.checkpointOwner = "";
  checkpoint.reviewer = "";
  checkpoint.blockerFlag = false;
  checkpoint.blockedReason = "";

  const error = validateStateShape(state);

  assert.match(error, /checkpoint-sales-process-mode/i);
});

test("sales capture records are created and preserved across resume", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(addSalesConfigurationRecord(state, "processCapture"));
  state = normalizeProjectState(addSalesConfigurationRecord(state, "pricingCapture"));
  state = normalizeProjectState(addSalesConfigurationRecord(state, "quotationControlCapture"));
  state = normalizeProjectState(addSalesConfigurationRecord(state, "fulfillmentHandoffCapture"));

  const processKey = state.salesConfiguration.processCapture[0].key;
  const pricingKey = state.salesConfiguration.pricingCapture[0].key;
  const controlKey = state.salesConfiguration.quotationControlCapture[0].key;
  const handoffKey = state.salesConfiguration.fulfillmentHandoffCapture[0].key;

  state = normalizeProjectState(
    updateSalesConfigurationRecord(state, "processCapture", processKey, {
      quoteFlowMode: "Quotation then manual confirmation",
      orderConfirmationAssumptions: "Sales manager confirms before operational handoff",
      exceptionNotes: "Large deals reviewed separately",
      inScope: true
    })
  );
  state = normalizeProjectState(
    updateSalesConfigurationRecord(state, "pricingCapture", pricingKey, {
      pricingApproachLabel: "Standard pricelist with bounded exceptions",
      pricelistUsageAssumption: "Single baseline pricelist in phase 1",
      discountControlNote: "Discount exceptions require named approval",
      inScope: true
    })
  );
  state = normalizeProjectState(
    updateSalesConfigurationRecord(state, "quotationControlCapture", controlKey, {
      approvalRequired: true,
      approvalOwnerRoleNote: "Sales manager",
      controlNotes: "Non-standard quotations require explicit review",
      inScope: true
    })
  );
  state = normalizeProjectState(
    updateSalesConfigurationRecord(state, "fulfillmentHandoffCapture", handoffKey, {
      fulfillmentHandoffType: "Confirmed order to downstream operations queue",
      downstreamHandoffNote: "Operational execution remains governed outside this slice",
      dependencyNote: "Inventory-sensitive handoff assumptions remain reviewable",
      inScope: true
    })
  );

  const resumed = normalizeProjectState(structuredClone(state));

  assert.equal(resumed.salesConfiguration.processCapture[0].quoteFlowMode, "Quotation then manual confirmation");
  assert.equal(resumed.salesConfiguration.pricingCapture[0].pricingApproachLabel, "Standard pricelist with bounded exceptions");
  assert.equal(resumed.salesConfiguration.quotationControlCapture[0].approvalOwnerRoleNote, "Sales manager");
  assert.equal(resumed.salesConfiguration.fulfillmentHandoffCapture[0].fulfillmentHandoffType, "Confirmed order to downstream operations queue");

  const sections = getSalesConfigurationSections(resumed);
  assert.equal(sections.find((section) => section.id === "processCapture").summary.totalRecords, 1);
  assert.equal(sections.find((section) => section.id === "pricingCapture").summary.totalRecords, 1);
});

test("sales capture does not auto-pass sales checkpoints", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(addSalesConfigurationRecord(state, "processCapture"));
  const recordKey = state.salesConfiguration.processCapture[0].key;
  state = normalizeProjectState(
    updateSalesConfigurationRecord(state, "processCapture", recordKey, {
      quoteFlowMode: "Quotation then confirmation",
      orderConfirmationAssumptions: "Confirmation is explicit",
      exceptionNotes: "Exceptions are reviewed",
      inScope: true
    })
  );

  const checkpoint = state.checkpoints.find((item) => item.id === "checkpoint-sales-process-mode");

  assert.equal(checkpoint.status, "Fail");
  assert.equal(checkpoint.blockerFlag, true);
});

test("sales capture remains distinct from read-only checkpoint truth", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(addSalesConfigurationRecord(state, "quotationControlCapture"));
  const recordKey = state.salesConfiguration.quotationControlCapture[0].key;
  state = normalizeProjectState(
    updateSalesConfigurationRecord(state, "quotationControlCapture", recordKey, {
      approvalRequired: true,
      approvalOwnerRoleNote: "Sales lead",
      controlNotes: "Approval required for non-standard quotations",
      inScope: true
    })
  );

  const sections = getSalesConfigurationSections(state);
  const section = sections.find((item) => item.id === "quotationControlCapture");

  assert.equal(section.checkpoint.id, "checkpoint-sales-quotation-control");
  assert.equal(section.checkpoint.status, "Fail");
  assert.equal(section.summary.totalRecords, 1);
  assert.equal(section.summary.linkedRecords, 1);
});

test("legacy state without sales evidence normalizes cleanly", () => {
  const state = createInitialProjectState();
  for (const checkpoint of state.checkpoints) {
    delete checkpoint.salesEvidence;
  }

  const normalized = normalizeProjectState(state);
  const salesCheckpoint = normalized.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-sales-process-mode");

  assert.equal(salesCheckpoint.salesEvidence.mode, "none");
});

test("sales structured capture maps to design_capture only, not system_detected", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(addSalesConfigurationRecord(state, "processCapture"));
  const recordKey = state.salesConfiguration.processCapture[0].key;
  state = normalizeProjectState(
    updateSalesConfigurationRecord(state, "processCapture", recordKey, {
      quoteFlowMode: "Quotation then confirmation",
      orderConfirmationAssumptions: "Explicit confirmation path",
      exceptionNotes: "Exceptions are reviewed",
      inScope: true
    })
  );

  const checkpoint = state.checkpoints.find((item) => item.id === "checkpoint-sales-process-mode");

  assert.equal(checkpoint.salesEvidence.mode, "design_capture");
  assert.notEqual(checkpoint.salesEvidence.mode, "system_detected");
});

test("sales user assertion remains distinct from system_detected", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(
    updateSalesEvidenceRecord(state, "checkpoint-sales-pricing-policy", {
      mode: "user_asserted",
      summary: "Sales lead confirmed pricing policy direction.",
      sourceLabel: "User assertion",
      notes: "Awaiting reviewer support.",
      recordedActor: "sales-ui-user"
    })
  );

  const checkpoint = state.checkpoints.find((item) => item.id === "checkpoint-sales-pricing-policy");

  assert.equal(checkpoint.salesEvidence.mode, "user_asserted");
  assert.notEqual(checkpoint.salesEvidence.mode, "system_detected");
  assert.equal(checkpoint.salesEvidence.recordedActor, "sales-ui-user");
});

test("blocked sales checkpoints do not auto-pass when evidence is weak", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(
    updateSalesEvidenceRecord(state, "checkpoint-sales-quotation-control", {
      mode: "user_asserted",
      summary: "Quotation control asserted as ready.",
      sourceLabel: "User assertion",
      recordedActor: "sales-ui-user"
    })
  );

  const checkpoint = state.checkpoints.find((item) => item.id === "checkpoint-sales-quotation-control");

  assert.equal(checkpoint.status, "Fail");
  assert.equal(checkpoint.blockerFlag, true);
});

test("resume preserves sales evidence metadata", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(
    updateSalesEvidenceRecord(state, "checkpoint-sales-fulfillment-handoff", {
      mode: "user_asserted",
      summary: "Fulfillment handoff assumptions reviewed for phase 1.",
      sourceLabel: "User assertion",
      notes: "Still bounded to downstream review context.",
      recordedActor: "sales-ui-user",
      recordedAt: "2026-03-22T08:00:00.000Z"
    })
  );

  const resumed = normalizeProjectState(structuredClone(state));
  const checkpoint = resumed.checkpoints.find((item) => item.id === "checkpoint-sales-fulfillment-handoff");

  assert.equal(checkpoint.salesEvidence.mode, "user_asserted");
  assert.equal(checkpoint.salesEvidence.summary, "Fulfillment handoff assumptions reviewed for phase 1.");
  assert.equal(checkpoint.salesEvidence.recordedAt, "2026-03-22T08:00:00.000Z");
});

test("sales evidence provenance remains separate from checkpoint support fields", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(
    updateSalesEvidenceRecord(state, "checkpoint-sales-process-mode", {
      mode: "user_asserted",
      summary: "Sales process direction confirmed by owner.",
      sourceLabel: "User assertion",
      recordedActor: "sales-ui-user",
      recordedAt: "2026-03-22T08:00:00.000Z"
    })
  );

  const checkpoint = state.checkpoints.find((item) => item.id === "checkpoint-sales-process-mode");

  assert.equal(checkpoint.salesEvidence.summary, "Sales process direction confirmed by owner.");
  assert.equal(checkpoint.evidenceReference, "");
  assert.equal(checkpoint.checkpointOwner, "Sales lead");
  assert.equal(checkpoint.reviewer, "");
});

test("attempted user-originated system-detected sales evidence normalizes safely", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(
    updateSalesEvidenceRecord(state, "checkpoint-sales-process-mode", {
      mode: "system_detected",
      summary: "Claimed detected sales process baseline",
      sourceLabel: "System import",
      recordedActor: "sales-ui-user"
    })
  );

  const checkpoint = state.checkpoints.find((item) => item.id === "checkpoint-sales-process-mode");

  assert.equal(checkpoint.salesEvidence.mode, "user_asserted");
});

test("invalid system-detected sales evidence without explicit provenance normalizes safely", () => {
  const evidence = normalizeSalesEvidenceState(
    {
      mode: "system_detected",
      summary: "Claimed detected sales evidence",
      sourceLabel: "Manual note",
      recordedActor: "sales-ui-user"
    },
    "checkpoint-sales-pricing-policy",
    {}
  );

  assert.equal(evidence.mode, "user_asserted");
});

test("scaffolded foundation, users, and master-data checkpoints cannot be manually promoted to pass through state patching", () => {
  let state = createInitialProjectState();
  state = updateCheckpointRecord(state, "checkpoint-project-mode", {
    status: "Pass",
    evidenceReference: "project-mode-confirmed"
  });

  state = updateCheckpointRecord(state, "checkpoint-foundation-localization-selection", {
    status: "Pass",
    evidenceReference: "localization-approved"
  });
  state = updateCheckpointRecord(state, "checkpoint-users-access-design", {
    status: "Pass",
    evidenceReference: "access-design-approved"
  });
  state = updateCheckpointRecord(state, "checkpoint-master-data-core-ownership", {
    status: "Pass",
    evidenceReference: "master-data-owner-approved"
  });

  assert.equal(
    state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-foundation-localization-selection").status,
    "Fail"
  );
  assert.equal(
    state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-users-access-design").status,
    "Fail"
  );
  assert.equal(
    state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-master-data-core-ownership").status,
    "Fail"
  );
});

test("checkpoint-project-mode cannot be manually promoted to pass through the shared update path", () => {
  let state = createInitialProjectState();
  state = updateCheckpointRecord(state, "checkpoint-project-mode", {
    status: "Pass",
    evidenceReference: "project-mode-confirmed",
    checkpointOwner: "Project owner",
    reviewer: "Implementation lead"
  });

  const checkpoint = state.checkpoints.find((item) => item.id === "checkpoint-project-mode");

  assert.equal(checkpoint.status, "Fail");
});

test("resumed weak scaffold passes are normalized to non-passing states", () => {
  const state = createInitialProjectState();

  for (const checkpointId of [
    "checkpoint-foundation-localization-selection",
    "checkpoint-users-access-design",
    "checkpoint-master-data-core-ownership"
  ]) {
    const checkpoint = state.checkpoints.find((item) => item.id === checkpointId);
    checkpoint.status = "Pass";
    checkpoint.evidenceReference = "";
    checkpoint.checkpointOwner = "";
    checkpoint.reviewer = "";
    checkpoint.blockerFlag = false;
    checkpoint.blockedReason = "";
  }

  const resumed = normalizeProjectState(structuredClone(state));

  assert.equal(
    resumed.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-foundation-localization-selection").status,
    "Fail"
  );
  assert.equal(
    resumed.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-users-access-design").status,
    "Fail"
  );
  assert.equal(
    resumed.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-master-data-core-ownership").status,
    "Fail"
  );
});

test("resumed weak project-mode pass is normalized to non-passing", () => {
  const state = createInitialProjectState();
  const checkpoint = state.checkpoints.find((item) => item.id === "checkpoint-project-mode");
  checkpoint.status = "Pass";
  checkpoint.evidenceReference = "";
  checkpoint.checkpointOwner = "";
  checkpoint.reviewer = "";
  checkpoint.blockerFlag = false;
  checkpoint.blockedReason = "";

  const resumed = normalizeProjectState(structuredClone(state));
  const normalizedCheckpoint = resumed.checkpoints.find((item) => item.id === "checkpoint-project-mode");

  assert.equal(normalizedCheckpoint.status, "Warning");
  assert.equal(normalizedCheckpoint.evidenceStatus, "Awaiting accountable support");
});

test("save validation rejects weak scaffold pass support", () => {
  const state = createInitialProjectState();
  const checkpoint = state.checkpoints.find((item) => item.id === "checkpoint-users-access-design");
  checkpoint.status = "Pass";
  checkpoint.evidenceReference = "";
  checkpoint.checkpointOwner = "";
  checkpoint.reviewer = "";
  checkpoint.blockerFlag = false;
  checkpoint.blockedReason = "";

  const error = validateStateShape(state);

  assert.match(error, /checkpoint-users-access-design/i);
});

test("checkpoint-odoo-sh-target cannot be manually promoted through the shared update path but remains a sync-managed exception", () => {
  let state = createInitialProjectState();
  const targetCheckpoint = state.checkpoints.find((item) => item.id === "checkpoint-odoo-sh-target");
  targetCheckpoint.status = "Fail";
  targetCheckpoint.blockerFlag = true;
  targetCheckpoint.blockedReason = "Awaiting synced branch target.";

  state = updateCheckpointRecord(state, "checkpoint-odoo-sh-target", {
    status: "Pass",
    evidenceReference: "manual-branch-target"
  });

  const checkpoint = state.checkpoints.find((item) => item.id === "checkpoint-odoo-sh-target");

  assert.equal(checkpoint.status, "Fail");
  assert.equal(validateStateShape(state), "");
});

test("required and go-live inventory checkpoints cannot be manually promoted to pass through state patching", () => {
  let state = createInitialProjectState();
  state = seedSupportedProjectModePass(state);

  state = updateCheckpointRecord(state, "checkpoint-inventory-warehouse-setup", {
    status: "Pass",
    evidenceReference: "warehouse-approved"
  });

  let checkpoint = state.checkpoints.find((item) => item.id === "checkpoint-inventory-warehouse-setup");
  assert.equal(checkpoint.status, "Fail");

  state = updateCheckpointRecord(state, "checkpoint-inventory-operation-types", {
    evidenceReference: "operation-types-evidence"
  });
  state = updateCheckpointRecord(state, "checkpoint-inventory-routes", {
    status: "Pass",
    evidenceReference: "routes-approved"
  });

  checkpoint = state.checkpoints.find((item) => item.id === "checkpoint-inventory-routes");
  assert.equal(checkpoint.status, "Fail");
});

test("required and go-live accounting checkpoints cannot be manually promoted to pass through state patching", () => {
  let state = createInitialProjectState();
  state = seedSupportedProjectModePass(state);

  state = updateCheckpointRecord(state, "checkpoint-finance-policy", {
    status: "Pass",
    evidenceReference: "finance-policy-approved"
  });

  let checkpoint = state.checkpoints.find((item) => item.id === "checkpoint-finance-policy");
  assert.equal(checkpoint.status, "Fail");

  state = updateCheckpointRecord(state, "checkpoint-accounting-stock-mapping-prerequisites", {
    status: "Pass",
    evidenceReference: "stock-mapping-approved"
  });

  checkpoint = state.checkpoints.find((item) => item.id === "checkpoint-accounting-stock-mapping-prerequisites");
  assert.equal(checkpoint.status, "Fail");
});

test("recommended inventory checkpoint can be formally deferred once dependencies pass", () => {
  let state = seedResolvedInventoryState();
  state = updateCheckpointRecord(state, "checkpoint-inventory-landed-costs", { status: "Warning" });

  const result = deferCheckpointRecord(state, "checkpoint-inventory-landed-costs", {
    checkpointOwner: "Finance lead",
    defermentReason: "Landed costs will be enabled in phase 2 after procurement readiness.",
    defermentConstraint: "No landed-cost posting path may be assumed before the policy is approved.",
    reviewPoint: "Revisit before finance go-live readiness review.",
    actor: "inventory-ui-user"
  });

  const checkpoint = result.state.checkpoints.find((item) => item.id === "checkpoint-inventory-landed-costs");

  assert.equal(result.error, "");
  assert.equal(checkpoint.defermentFlag, true);
  assert.equal(checkpoint.status, "Warning");
  assert.equal(checkpoint.reviewPoint, "Revisit before finance go-live readiness review.");
  assert.equal(checkpoint.lastTransitionBy, "inventory-ui-user");
});

test("required or go-live inventory checkpoints cannot be deferred", () => {
  const state = createInitialProjectState();

  const requiredResult = deferCheckpointRecord(state, "checkpoint-inventory-warehouse-setup", {
    checkpointOwner: "Operations lead",
    defermentReason: "Attempted bypass",
    defermentConstraint: "None",
    reviewPoint: "Later",
    actor: "inventory-ui-user"
  });
  const goLiveResult = deferCheckpointRecord(state, "checkpoint-inventory-routes", {
    checkpointOwner: "Operations lead",
    defermentReason: "Attempted bypass",
    defermentConstraint: "None",
    reviewPoint: "Later",
    actor: "inventory-ui-user"
  });

  assert.match(requiredResult.error, /cannot be deferred/i);
  assert.match(goLiveResult.error, /cannot be deferred/i);
});

test("dependency-blocked inventory checkpoint cannot be deferred away", () => {
  const state = createInitialProjectState();
  const result = deferCheckpointRecord(state, "checkpoint-inventory-landed-costs", {
    checkpointOwner: "Finance lead",
    defermentReason: "Try to skip dependency",
    defermentConstraint: "None",
    reviewPoint: "Later",
    actor: "inventory-ui-user"
  });
  const checkpoint = result.state.checkpoints.find((item) => item.id === "checkpoint-inventory-landed-costs");

  assert.match(result.error, /dependencies pass/i);
  assert.equal(checkpoint.status, "Fail");
  assert.equal(checkpoint.defermentFlag, false);
});

test("resume normalization preserves deferred checkpoint metadata", () => {
  let state = seedResolvedInventoryState();
  state = updateCheckpointRecord(state, "checkpoint-inventory-landed-costs", { status: "Warning" });

  const deferred = deferCheckpointRecord(state, "checkpoint-inventory-landed-costs", {
    checkpointOwner: "Finance lead",
    defermentReason: "Phase 2 costing rollout.",
    defermentConstraint: "No landed costs before approval.",
    reviewPoint: "Before readiness sign-off.",
    actor: "inventory-ui-user"
  }).state;

  const resumed = normalizeProjectState(structuredClone(deferred));
  const checkpoint = resumed.checkpoints.find((item) => item.id === "checkpoint-inventory-landed-costs");

  assert.equal(checkpoint.defermentFlag, true);
  assert.equal(checkpoint.defermentReason, "Phase 2 costing rollout.");
  assert.equal(checkpoint.defermentConstraint, "No landed costs before approval.");
  assert.equal(checkpoint.reviewPoint, "Before readiness sign-off.");
  assert.equal(checkpoint.lastTransitionBy, "inventory-ui-user");
});

test("resumed accounting pass without accountable support is normalized to non-passing", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(addAccountingConfigurationRecord(state, "policyCapture"));
  state = normalizeProjectState(
    updateAccountingEvidenceRecord(state, "checkpoint-accounting-valuation-method-prerequisites", {
      mode: "user_asserted",
      summary: "Valuation policy reviewed.",
      sourceLabel: "User assertion",
      notes: "Evidence exists but should not grant pass support.",
      recordedActor: "accounting-ui-user"
    })
  );
  const checkpoint = state.checkpoints.find((item) => item.id === "checkpoint-accounting-valuation-method-prerequisites");
  checkpoint.status = "Pass";
  checkpoint.evidenceReference = "";
  checkpoint.checkpointOwner = "";
  checkpoint.reviewer = "";
  checkpoint.blockerFlag = false;
  checkpoint.blockedReason = "";

  const resumed = normalizeProjectState(structuredClone(state));
  const normalizedCheckpoint = resumed.checkpoints.find((item) => item.id === "checkpoint-accounting-valuation-method-prerequisites");

  assert.equal(normalizedCheckpoint.status, "Fail");
  assert.equal(normalizedCheckpoint.blockerFlag, true);
});

test("legacy state without inventory configuration normalizes cleanly", () => {
  const legacyState = createInitialProjectState();
  delete legacyState.inventoryConfiguration;

  const normalized = normalizeProjectState(legacyState);

  assert.deepEqual(normalized.inventoryConfiguration, {
    warehouses: [],
    operationTypes: [],
    routes: []
  });
  assert.equal(validateStateShape(normalized), "");
});

test("legacy state without accounting configuration normalizes cleanly", () => {
  const legacyState = createInitialProjectState();
  delete legacyState.accountingConfiguration;

  const normalized = normalizeProjectState(legacyState);

  assert.deepEqual(normalized.accountingConfiguration, {
    policyCapture: [],
    stockMappingCapture: [],
    landedCostCapture: []
  });
  assert.equal(validateStateShape(normalized), "");
});

test("legacy state without accounting evidence normalizes cleanly", () => {
  const legacyState = createInitialProjectState();
  for (const checkpoint of legacyState.checkpoints) {
    if (
      [
        "checkpoint-finance-policy",
        "checkpoint-accounting-valuation-method-prerequisites",
        "checkpoint-accounting-stock-mapping-prerequisites",
        "checkpoint-accounting-landed-cost-prerequisites"
      ].includes(checkpoint.id)
    ) {
      delete checkpoint.accountingEvidence;
    }
  }

  const normalized = normalizeProjectState(legacyState);
  for (const checkpointId of [
    "checkpoint-finance-policy",
    "checkpoint-accounting-valuation-method-prerequisites",
    "checkpoint-accounting-stock-mapping-prerequisites",
    "checkpoint-accounting-landed-cost-prerequisites"
  ]) {
    const checkpoint = normalized.checkpoints.find((item) => item.id === checkpointId);
    assert.ok(checkpoint.accountingEvidence);
    assert.equal(checkpoint.accountingEvidence.mode, "none");
  }
  assert.equal(validateStateShape(normalized), "");
});

test("legacy state without scoped accounting checkpoints normalizes cleanly", () => {
  const legacyState = createInitialProjectState();
  legacyState.checkpoints = legacyState.checkpoints.filter(
    (checkpoint) =>
      ![
        "checkpoint-accounting-valuation-method-prerequisites",
        "checkpoint-accounting-stock-mapping-prerequisites",
        "checkpoint-accounting-landed-cost-prerequisites"
      ].includes(checkpoint.id)
  );

  const normalized = normalizeProjectState(legacyState);

  assert.ok(normalized.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-accounting-valuation-method-prerequisites"));
  assert.ok(normalized.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-accounting-stock-mapping-prerequisites"));
  assert.ok(normalized.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-accounting-landed-cost-prerequisites"));
  assert.equal(validateStateShape(normalized), "");
});

test("relevant Accounting structured capture derives design_capture only", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(addAccountingConfigurationRecord(state, "policyCapture"));
  state = normalizeProjectState(addAccountingConfigurationRecord(state, "stockMappingCapture"));
  state = normalizeProjectState(addAccountingConfigurationRecord(state, "landedCostCapture"));

  const financePolicy = state.checkpoints.find((item) => item.id === "checkpoint-finance-policy");
  const valuationMethod = state.checkpoints.find((item) => item.id === "checkpoint-accounting-valuation-method-prerequisites");
  const stockMapping = state.checkpoints.find((item) => item.id === "checkpoint-accounting-stock-mapping-prerequisites");
  const landedCosts = state.checkpoints.find((item) => item.id === "checkpoint-accounting-landed-cost-prerequisites");

  assert.equal(financePolicy.accountingEvidence.mode, "design_capture");
  assert.equal(valuationMethod.accountingEvidence.mode, "design_capture");
  assert.equal(stockMapping.accountingEvidence.mode, "design_capture");
  assert.equal(landedCosts.accountingEvidence.mode, "design_capture");
  assert.match(financePolicy.accountingEvidence.summary, /policy capture record/i);
  assert.match(stockMapping.accountingEvidence.summary, /stock mapping capture record/i);
  assert.match(landedCosts.accountingEvidence.summary, /landed-cost capture record/i);
});

test("user assertion remains distinct from design_capture", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(addAccountingConfigurationRecord(state, "policyCapture"));

  state = normalizeProjectState(
    updateAccountingEvidenceRecord(state, "checkpoint-finance-policy", {
      mode: "user_asserted",
      summary: "Finance lead confirmed accounting direction.",
      sourceLabel: "User assertion",
      notes: "Explicit owner decision.",
      recordedActor: "accounting-ui-user"
    })
  );

  const beforeCapture = state.checkpoints.find((item) => item.id === "checkpoint-finance-policy");
  assert.equal(beforeCapture.accountingEvidence.mode, "user_asserted");

  state = normalizeProjectState(addAccountingConfigurationRecord(state, "stockMappingCapture"));
  const afterCapture = state.checkpoints.find((item) => item.id === "checkpoint-finance-policy");

  assert.equal(afterCapture.accountingEvidence.mode, "user_asserted");
  assert.equal(afterCapture.accountingEvidence.summary, "Finance lead confirmed accounting direction.");
  assert.notEqual(afterCapture.accountingEvidence.mode, "design_capture");
});

test("attempted unsupported system-detected Accounting evidence normalizes safely", () => {
  const evidence = normalizeAccountingEvidenceState(
    {
      mode: "system_detected",
      summary: "Unsupported system evidence",
      sourceLabel: "Imported note",
      notes: "Attempted detector path",
      recordedActor: "system-ui-user"
    },
    "checkpoint-finance-policy",
    createInitialProjectState().accountingConfiguration
  );

  assert.equal(evidence.mode, "user_asserted");
  assert.notEqual(evidence.mode, "system_detected");
});

test("resume preserves Accounting evidence metadata cleanly", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(addAccountingConfigurationRecord(state, "policyCapture"));
  state = normalizeProjectState(
    updateAccountingEvidenceRecord(state, "checkpoint-finance-policy", {
      mode: "user_asserted",
      summary: "Finance owner confirmed policy direction.",
      sourceLabel: "User assertion",
      notes: "Recorded before save.",
      recordedActor: "accounting-ui-user",
      recordedAt: "2026-03-21T11:00:00.000Z"
    })
  );

  const resumed = normalizeProjectState(structuredClone(state));
  const checkpoint = resumed.checkpoints.find((item) => item.id === "checkpoint-finance-policy");

  assert.equal(checkpoint.accountingEvidence.mode, "user_asserted");
  assert.equal(checkpoint.accountingEvidence.summary, "Finance owner confirmed policy direction.");
  assert.equal(checkpoint.accountingEvidence.recordedAt, "2026-03-21T11:00:00.000Z");
});

test("accounting capture records are created and preserved across resume", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(addAccountingConfigurationRecord(state, "policyCapture"));
  state = normalizeProjectState(addAccountingConfigurationRecord(state, "stockMappingCapture"));
  state = normalizeProjectState(addAccountingConfigurationRecord(state, "landedCostCapture"));

  const policyKey = state.accountingConfiguration.policyCapture[0].key;
  const stockKey = state.accountingConfiguration.stockMappingCapture[0].key;
  const landedKey = state.accountingConfiguration.landedCostCapture[0].key;

  state = normalizeProjectState(
    updateAccountingConfigurationRecord(state, "policyCapture", policyKey, {
      companyAccountingScope: "Holding company",
      policyTopic: "Inventory valuation",
      valuationMethodLabel: "AVCO",
      inventoryScopeNotes: "Stock valuation control only",
      decisionOwnerNotes: "Finance lead",
      downstreamConstraintNotes: "Do not infer pass status from capture rows",
      inScope: true
    })
  );
  state = normalizeProjectState(
    updateAccountingConfigurationRecord(state, "stockMappingCapture", stockKey, {
      companyAccountingScope: "Holding company",
      productScopeNotes: "Tracked stock products",
      stockInputReference: "Input locations",
      stockOutputReference: "Output locations",
      valuationReference: "Valuation mapping",
      supportNotes: "Capture only",
      inScope: true
    })
  );
  state = normalizeProjectState(
    updateAccountingConfigurationRecord(state, "landedCostCapture", landedKey, {
      companyAccountingScope: "Holding company",
      landedCostPolicyLabel: "Standard landed costs",
      allocationBasisNotes: "Proportional allocation",
      accountingTreatmentNotes: "Planning-only capture",
      supportNotes: "No live-state inference",
      inScope: true
    })
  );

  const resumed = normalizeProjectState(structuredClone(state));

  assert.equal(resumed.accountingConfiguration.policyCapture[0].policyTopic, "Inventory valuation");
  assert.equal(resumed.accountingConfiguration.stockMappingCapture[0].stockInputReference, "Input locations");
  assert.equal(resumed.accountingConfiguration.landedCostCapture[0].landedCostPolicyLabel, "Standard landed costs");

  const sections = getAccountingConfigurationSections(resumed);
  assert.equal(sections.find((section) => section.id === "policyCapture").records.length, 1);
  assert.equal(sections.find((section) => section.id === "stockMappingCapture").records.length, 1);
  assert.equal(sections.find((section) => section.id === "landedCostCapture").records.length, 1);
});

test("accounting capture does not auto-pass Accounting checkpoints", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(addAccountingConfigurationRecord(state, "policyCapture"));
  const policyKey = state.accountingConfiguration.policyCapture[0].key;
  state = normalizeProjectState(
    updateAccountingConfigurationRecord(state, "policyCapture", policyKey, {
      companyAccountingScope: "Holding company",
      policyTopic: "Finance policy",
      valuationMethodLabel: "AVCO",
      inventoryScopeNotes: "Implementation capture only",
      decisionOwnerNotes: "Finance lead",
      downstreamConstraintNotes: "No checkpoint truth",
      inScope: true
    })
  );

  const financePolicy = state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-finance-policy");
  const valuationMethod = state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-accounting-valuation-method-prerequisites");

  assert.equal(financePolicy.status, "Fail");
  assert.equal(valuationMethod.status, "Fail");
});

test("Accounting pass still requires accountable support even when accounting evidence is present", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(
    updateAccountingEvidenceRecord(state, "checkpoint-finance-policy", {
      mode: "user_asserted",
      summary: "Finance lead asserted support context.",
      sourceLabel: "User assertion",
      recordedActor: "accounting-ui-user"
    })
  );
  const checkpoint = state.checkpoints.find((item) => item.id === "checkpoint-finance-policy");
  checkpoint.status = "Pass";
  checkpoint.blockerFlag = false;
  checkpoint.blockedReason = "";

  const resumed = normalizeProjectState(structuredClone(state));
  const normalizedCheckpoint = resumed.checkpoints.find((item) => item.id === "checkpoint-finance-policy");

  assert.equal(normalizedCheckpoint.status, "Fail");
  assert.equal(normalizedCheckpoint.blockerFlag, true);
});

test("Accounting evidence does not unblock Inventory valuation when Accounting checkpoint truth is non-passing", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(
    updateAccountingEvidenceRecord(state, "checkpoint-accounting-valuation-method-prerequisites", {
      mode: "user_asserted",
      summary: "Finance asserted valuation-method support.",
      sourceLabel: "User assertion",
      recordedActor: "accounting-ui-user"
    })
  );
  state = normalizeProjectState(
    updateAccountingEvidenceRecord(state, "checkpoint-accounting-stock-mapping-prerequisites", {
      mode: "user_asserted",
      summary: "Finance asserted stock-mapping support.",
      sourceLabel: "User assertion",
      recordedActor: "accounting-ui-user"
    })
  );

  const valuation = state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-inventory-valuation");

  assert.equal(valuation.status, "Fail");
  assert.match(valuation.blockedReason, /Inventory valuation method policy confirmed|Stock accounting mapping prerequisites confirmed/i);
});

test("Accounting evidence does not unblock Inventory landed costs when Accounting prerequisite is non-passing", () => {
  let state = seedResolvedInventoryState();
  state = updateCheckpointRecord(state, "checkpoint-accounting-landed-cost-prerequisites", { status: "Warning" });
  state = normalizeProjectState(
    updateAccountingEvidenceRecord(state, "checkpoint-accounting-landed-cost-prerequisites", {
      mode: "user_asserted",
      summary: "Finance asserted landed-cost support.",
      sourceLabel: "User assertion",
      recordedActor: "accounting-ui-user"
    })
  );

  const landedCosts = state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-inventory-landed-costs");

  assert.equal(landedCosts.status, "Fail");
  assert.match(landedCosts.blockedReason, /Landed cost accounting prerequisites decided/i);
});

test("inventory valuation remains blocked until both accounting prerequisites pass in sequence", () => {
  let state = createInitialProjectState();
  let valuation = state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-inventory-valuation");

  assert.equal(valuation.status, "Fail");

  state = seedSupportedAccountingPass(state, "checkpoint-finance-policy");
  state = seedSupportedAccountingPass(state, "checkpoint-accounting-valuation-method-prerequisites");
  valuation = state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-inventory-valuation");
  assert.equal(valuation.status, "Fail");
  assert.match(valuation.blockedReason, /Stock accounting mapping prerequisites confirmed/i);

  state = seedSupportedAccountingPass(state, "checkpoint-accounting-stock-mapping-prerequisites");
  valuation = state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-inventory-valuation");
  assert.equal(valuation.status, "Fail");
  assert.match(valuation.blockedReason, /Warehouse structure defined/i);
});

test("inventory landed costs remains blocked until valuation and accounting landed-cost prerequisites pass in sequence", () => {
  let state = createInitialProjectState();
  let landedCosts = state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-inventory-landed-costs");

  assert.equal(landedCosts.status, "Fail");

  state = seedSupportedAccountingPass(state, "checkpoint-finance-policy");
  state = seedSupportedAccountingPass(state, "checkpoint-accounting-valuation-method-prerequisites");
  state = seedSupportedAccountingPass(state, "checkpoint-accounting-stock-mapping-prerequisites");
  state = seedSupportedAccountingPass(state, "checkpoint-accounting-landed-cost-prerequisites");
  landedCosts = state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-inventory-landed-costs");
  assert.equal(landedCosts.status, "Fail");
  assert.match(landedCosts.blockedReason, /Inventory valuation policy confirmed/i);
});

test("blocked accounting prerequisites keep dependent inventory landed-cost truth blocked", () => {
  const state = createInitialProjectState();
  const landedCosts = state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-inventory-landed-costs");

  assert.equal(landedCosts.status, "Fail");
  assert.match(landedCosts.blockedReason, /Landed cost accounting prerequisites decided/i);
});

test("inventory configuration records can be created and preserved", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(addInventoryConfigurationRecord(state, "warehouses"));
  const warehouseKey = state.inventoryConfiguration.warehouses[0].key;

  state = normalizeProjectState(
    updateInventoryConfigurationRecord(state, "warehouses", warehouseKey, {
      warehouseName: "Main warehouse",
      code: "WH1",
      companyScope: "Holding company",
      purposeNotes: "Primary stock storage",
      inScope: true
    })
  );
  state = normalizeProjectState(addInventoryConfigurationRecord(state, "operationTypes"));
  const operationTypeKey = state.inventoryConfiguration.operationTypes[0].key;
  state = normalizeProjectState(
    updateInventoryConfigurationRecord(state, "operationTypes", operationTypeKey, {
      linkedWarehouseKey: warehouseKey,
      operationTypeName: "Receipts",
      operationTypeKey: "IN",
      flowCategory: "Inbound",
      sequenceOrder: "10",
      notes: "Inbound receiving flow",
      inScope: true
    })
  );
  state = normalizeProjectState(addInventoryConfigurationRecord(state, "routes"));
  const routeKey = state.inventoryConfiguration.routes[0].key;
  state = normalizeProjectState(
    updateInventoryConfigurationRecord(state, "routes", routeKey, {
      routeName: "Buy",
      scopeCategory: "Procurement",
      linkedWarehouseKeys: [warehouseKey],
      linkedOperationTypeKeys: [operationTypeKey],
      purposeNotes: "Vendor replenishment path",
      inScope: true
    })
  );

  assert.equal(state.inventoryConfiguration.warehouses[0].warehouseName, "Main warehouse");
  assert.equal(state.inventoryConfiguration.operationTypes[0].linkedWarehouseKey, warehouseKey);
  assert.deepEqual(state.inventoryConfiguration.routes[0].linkedWarehouseKeys, [warehouseKey]);
  assert.deepEqual(state.inventoryConfiguration.routes[0].linkedOperationTypeKeys, [operationTypeKey]);
});

test("inventory configuration capture does not auto-promote blocked checkpoints", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(addInventoryConfigurationRecord(state, "warehouses"));
  const warehouseKey = state.inventoryConfiguration.warehouses[0].key;
  state = normalizeProjectState(
    updateInventoryConfigurationRecord(state, "warehouses", warehouseKey, {
      warehouseName: "Main warehouse",
      code: "WH1",
      companyScope: "Holding company",
      purposeNotes: "Primary stock storage",
      inScope: true
    })
  );

  const warehouseCheckpoint = state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-inventory-warehouse-setup");

  assert.equal(warehouseCheckpoint.status, "Fail");
  assert.equal(warehouseCheckpoint.blockerFlag, true);
});

test("resume preserves inventory configuration capture state", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(addInventoryConfigurationRecord(state, "routes"));
  const routeKey = state.inventoryConfiguration.routes[0].key;
  state = normalizeProjectState(
    updateInventoryConfigurationRecord(state, "routes", routeKey, {
      routeName: "Manufacture",
      scopeCategory: "Production",
      linkedWarehouseKeys: ["wh-main"],
      linkedOperationTypeKeys: ["op-pick", "op-produce"],
      purposeNotes: "Controlled production flow",
      inScope: true
    })
  );

  const resumed = normalizeProjectState(structuredClone(state));

  assert.equal(resumed.inventoryConfiguration.routes[0].routeName, "Manufacture");
  assert.deepEqual(resumed.inventoryConfiguration.routes[0].linkedWarehouseKeys, ["wh-main"]);
  assert.deepEqual(resumed.inventoryConfiguration.routes[0].linkedOperationTypeKeys, ["op-pick", "op-produce"]);
});

test("derived checkpoint linkage remains read-only relative to editable inventory capture", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(addInventoryConfigurationRecord(state, "operationTypes"));
  const recordKey = state.inventoryConfiguration.operationTypes[0].key;
  state = normalizeProjectState(
    updateInventoryConfigurationRecord(state, "operationTypes", recordKey, {
      linkedWarehouseKey: "wh-main",
      operationTypeName: "Delivery orders",
      operationTypeKey: "OUT",
      flowCategory: "Outbound",
      sequenceOrder: "20",
      notes: "Outbound shipping flow",
      inScope: true
    })
  );

  const sections = getInventoryConfigurationSections(state);
  const operationTypesSection = sections.find((section) => section.id === "operationTypes");

  assert.equal(operationTypesSection.checkpoint.id, "checkpoint-inventory-operation-types");
  assert.equal(operationTypesSection.checkpoint.status, "Fail");
  assert.equal(operationTypesSection.summary.totalRecords, 1);
  assert.equal(operationTypesSection.summary.linkedRecords, 1);
});

test("legacy state without inventory evidence normalizes cleanly", () => {
  const state = createInitialProjectState();
  for (const checkpoint of state.checkpoints) {
    delete checkpoint.inventoryEvidence;
  }

  const normalized = normalizeProjectState(state);
  const inventoryCheckpoint = normalized.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-inventory-warehouse-setup");

  assert.equal(inventoryCheckpoint.inventoryEvidence.mode, "none");
});

test("structured capture maps to design capture only, not system detected", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(addInventoryConfigurationRecord(state, "warehouses"));
  const warehouseKey = state.inventoryConfiguration.warehouses[0].key;
  state = normalizeProjectState(
    updateInventoryConfigurationRecord(state, "warehouses", warehouseKey, {
      warehouseName: "Main warehouse",
      code: "WH1",
      companyScope: "Holding company",
      purposeNotes: "Primary stock storage",
      inScope: true
    })
  );

  const warehouseCheckpoint = state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-inventory-warehouse-setup");

  assert.equal(warehouseCheckpoint.inventoryEvidence.mode, "design_capture");
  assert.notEqual(warehouseCheckpoint.inventoryEvidence.mode, "system_detected");
});

test("user assertion remains distinct from system detected", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(
    updateInventoryEvidenceRecord(state, "checkpoint-inventory-valuation", {
      mode: "user_asserted",
      summary: "Finance lead confirmed valuation design readiness.",
      sourceLabel: "User assertion",
      notes: "Awaiting final reviewer sign-off.",
      recordedActor: "inventory-ui-user"
    })
  );

  const valuationCheckpoint = state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-inventory-valuation");

  assert.equal(valuationCheckpoint.inventoryEvidence.mode, "user_asserted");
  assert.notEqual(valuationCheckpoint.inventoryEvidence.mode, "system_detected");
  assert.equal(valuationCheckpoint.inventoryEvidence.recordedActor, "inventory-ui-user");
});

test("blocked checkpoints do not auto-pass when evidence is weak", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(
    updateInventoryEvidenceRecord(state, "checkpoint-inventory-routes", {
      mode: "user_asserted",
      summary: "Routes asserted as ready.",
      sourceLabel: "User assertion",
      recordedActor: "inventory-ui-user"
    })
  );

  const routesCheckpoint = state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-inventory-routes");

  assert.equal(routesCheckpoint.status, "Fail");
  assert.equal(routesCheckpoint.blockerFlag, true);
});

test("resume preserves inventory evidence metadata", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(
    updateInventoryEvidenceRecord(state, "checkpoint-inventory-landed-costs", {
      mode: "user_asserted",
      summary: "Landed-cost handling reviewed for phase 2.",
      sourceLabel: "User assertion",
      notes: "Still recommended rather than required.",
      recordedActor: "inventory-ui-user",
      recordedAt: "2026-03-21T10:00:00.000Z"
    })
  );

  const resumed = normalizeProjectState(structuredClone(state));
  const checkpoint = resumed.checkpoints.find((item) => item.id === "checkpoint-inventory-landed-costs");

  assert.equal(checkpoint.inventoryEvidence.mode, "user_asserted");
  assert.equal(checkpoint.inventoryEvidence.summary, "Landed-cost handling reviewed for phase 2.");
  assert.equal(checkpoint.inventoryEvidence.recordedAt, "2026-03-21T10:00:00.000Z");
});

test("resume preserves scoped accounting checkpoint state", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(
    updateCheckpointRecord(state, "checkpoint-accounting-valuation-method-prerequisites", {
      checkpointOwner: "Finance lead",
      reviewer: "Controller",
      evidenceReference: "valuation-policy-decision"
    })
  );

  const resumed = normalizeProjectState(structuredClone(state));
  const checkpoint = resumed.checkpoints.find((item) => item.id === "checkpoint-accounting-valuation-method-prerequisites");

  assert.equal(checkpoint.checkpointOwner, "Finance lead");
  assert.equal(checkpoint.reviewer, "Controller");
  assert.equal(checkpoint.evidenceReference, "valuation-policy-decision");
});

test("evidence provenance remains separate from deferment metadata", () => {
  let state = seedResolvedInventoryState();
  state = updateCheckpointRecord(state, "checkpoint-inventory-landed-costs", { status: "Warning" });
  state = normalizeProjectState(
    updateInventoryEvidenceRecord(state, "checkpoint-inventory-landed-costs", {
      mode: "user_asserted",
      summary: "Finance confirmed deferred policy handling.",
      sourceLabel: "User assertion",
      recordedActor: "inventory-ui-user",
      recordedAt: "2026-03-21T10:00:00.000Z"
    })
  );
  state = deferCheckpointRecord(state, "checkpoint-inventory-landed-costs", {
    checkpointOwner: "Finance lead",
    defermentReason: "Phase 2 rollout.",
    defermentConstraint: "No landed costs before approval.",
    reviewPoint: "Before readiness sign-off.",
    actor: "inventory-ui-user"
  }).state;

  const checkpoint = state.checkpoints.find((item) => item.id === "checkpoint-inventory-landed-costs");

  assert.equal(checkpoint.inventoryEvidence.summary, "Finance confirmed deferred policy handling.");
  assert.equal(checkpoint.defermentReason, "Phase 2 rollout.");
  assert.notEqual(checkpoint.inventoryEvidence.recordedAt, "");
  assert.equal(checkpoint.reviewPoint, "Before readiness sign-off.");
});

test("invalid system-detected evidence without explicit provenance normalizes safely", () => {
  const evidence = normalizeInventoryEvidenceState(
    {
      mode: "system_detected",
      summary: "Claimed detected evidence",
      sourceLabel: "Manual note",
      recordedActor: "inventory-ui-user"
    },
    "checkpoint-inventory-valuation",
    {}
  );

  assert.equal(evidence.mode, "user_asserted");
});

test("user-originated system-detected evidence is disabled and normalizes to user asserted", () => {
  let state = createInitialProjectState();
  state = normalizeProjectState(
    updateInventoryEvidenceRecord(state, "checkpoint-inventory-warehouse-setup", {
      mode: "system_detected",
      summary: "Claimed detected warehouse structure",
      sourceLabel: "System import",
      recordedActor: "system-ui-user"
    })
  );

  const checkpoint = state.checkpoints.find((item) => item.id === "checkpoint-inventory-warehouse-setup");

  assert.equal(checkpoint.inventoryEvidence.mode, "user_asserted");
});

test("save validation checks all relevant inventory checkpoints instead of only the first", () => {
  const state = createInitialProjectState();
  delete state.checkpoints.find((item) => item.id === "checkpoint-inventory-routes").inventoryEvidence;

  const error = validateStateShape(state);

  assert.match(error, /checkpoint-inventory-routes/i);
});

test("CRM checkpoints derive conservative non-passing defaults without project-mode anchoring", () => {
  const state = createInitialProjectState();
  const leadOpportunity = state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-crm-lead-opportunity-model");
  const pipeline = state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-crm-pipeline-governance");

  assert.equal(leadOpportunity.status, "Fail");
  assert.match(leadOpportunity.blockedReason, /lead and opportunity model must be explicit before controlled progression/i);
  assert.equal(pipeline.status, "Fail");
  assert.match(pipeline.blockedReason, /lead and opportunity model/i);
});

test("CRM legacy normalization restores checkpoint seeding", () => {
  const state = createInitialProjectState();
  state.checkpoints = state.checkpoints.filter((checkpoint) => !checkpoint.id.startsWith("checkpoint-crm-"));

  const normalized = normalizeProjectState(state);

  assert.ok(normalized.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-crm-lead-opportunity-model"));
  assert.ok(normalized.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-crm-pipeline-governance"));
  assert.ok(normalized.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-crm-sales-team-ownership"));
  assert.ok(normalized.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-crm-quotation-handoff"));
  assert.equal(validateStateShape(normalized), "");
});

test("CRM manual weak-pass rejection hardens checkpoint truth", () => {
  const state = seedSupportedProjectModePass(createInitialProjectState());
  const updated = updateCheckpointRecord(state, "checkpoint-crm-lead-opportunity-model", {
    status: "Pass",
    evidenceReference: ""
  });

  const checkpoint = updated.checkpoints.find((item) => item.id === "checkpoint-crm-lead-opportunity-model");

  assert.equal(checkpoint.status, "Fail");
  assert.equal(checkpoint.blockerFlag, true);
});

test("CRM resumed weak-pass hardening normalizes to non-passing", () => {
  const state = seedSupportedProjectModePass(createInitialProjectState());
  const checkpoint = state.checkpoints.find((item) => item.id === "checkpoint-crm-lead-opportunity-model");
  checkpoint.status = "Pass";
  checkpoint.evidenceReference = "";
  checkpoint.checkpointOwner = "";
  checkpoint.reviewer = "";
  checkpoint.blockerFlag = false;
  checkpoint.blockedReason = "";

  const resumed = normalizeProjectState(structuredClone(state));
  const normalizedCheckpoint = resumed.checkpoints.find((item) => item.id === "checkpoint-crm-lead-opportunity-model");

  assert.equal(normalizedCheckpoint.status, "Warning");
  assert.equal(normalizedCheckpoint.evidenceStatus, "Awaiting accountable support");
});

test("CRM save validation rejects weak pass support", () => {
  const state = seedSupportedProjectModePass(createInitialProjectState());
  const checkpoint = state.checkpoints.find((item) => item.id === "checkpoint-crm-lead-opportunity-model");
  checkpoint.status = "Pass";
  checkpoint.evidenceReference = "";
  checkpoint.checkpointOwner = "";
  checkpoint.reviewer = "";
  checkpoint.blockerFlag = false;
  checkpoint.blockedReason = "";

  const error = validateStateShape(state);

  assert.match(error, /checkpoint-crm-lead-opportunity-model/i);
});

test("Website/eCommerce checkpoints derive conservative non-passing defaults without project-mode anchoring", () => {
  const state = createInitialProjectState();
  const scopeBaseline = state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-website-scope-baseline");
  const catalogPublication = state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-website-catalog-publication");

  assert.equal(scopeBaseline.status, "Fail");
  assert.match(scopeBaseline.blockedReason, /website scope baseline must be explicit before controlled progression/i);
  assert.equal(catalogPublication.status, "Fail");
  assert.match(catalogPublication.blockedReason, /website scope baseline/i);
});

test("Website/eCommerce legacy normalization restores checkpoint seeding", () => {
  const state = createInitialProjectState();
  state.checkpoints = state.checkpoints.filter((checkpoint) => !checkpoint.id.startsWith("checkpoint-website-"));

  const normalized = normalizeProjectState(state);

  assert.ok(normalized.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-website-scope-baseline"));
  assert.ok(normalized.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-website-catalog-publication"));
  assert.ok(normalized.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-website-customer-access-model"));
  assert.ok(normalized.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-website-checkout-baseline"));
  assert.ok(normalized.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-website-delivery-handoff"));
  assert.equal(validateStateShape(normalized), "");
});

test("Website/eCommerce manual weak-pass rejection hardens checkpoint truth", () => {
  const state = seedSupportedProjectModePass(createInitialProjectState());
  const updated = updateCheckpointRecord(state, "checkpoint-website-scope-baseline", {
    status: "Pass",
    evidenceReference: ""
  });

  const checkpoint = updated.checkpoints.find((item) => item.id === "checkpoint-website-scope-baseline");

  assert.equal(checkpoint.status, "Fail");
  assert.equal(checkpoint.blockerFlag, true);
});

test("Website/eCommerce resumed weak-pass hardening normalizes to non-passing", () => {
  const state = seedSupportedProjectModePass(createInitialProjectState());
  const checkpoint = state.checkpoints.find((item) => item.id === "checkpoint-website-scope-baseline");
  checkpoint.status = "Pass";
  checkpoint.evidenceReference = "";
  checkpoint.checkpointOwner = "";
  checkpoint.reviewer = "";
  checkpoint.blockerFlag = false;
  checkpoint.blockedReason = "";

  const resumed = normalizeProjectState(structuredClone(state));
  const normalizedCheckpoint = resumed.checkpoints.find((item) => item.id === "checkpoint-website-scope-baseline");

  assert.equal(normalizedCheckpoint.status, "Warning");
  assert.equal(normalizedCheckpoint.evidenceStatus, "Awaiting accountable support");
});

test("Website/eCommerce save validation rejects weak pass support", () => {
  const state = seedSupportedProjectModePass(createInitialProjectState());
  const checkpoint = state.checkpoints.find((item) => item.id === "checkpoint-website-scope-baseline");
  checkpoint.status = "Pass";
  checkpoint.evidenceReference = "";
  checkpoint.checkpointOwner = "";
  checkpoint.reviewer = "";
  checkpoint.blockerFlag = false;
  checkpoint.blockedReason = "";

  const error = validateStateShape(state);

  assert.match(error, /checkpoint-website-scope-baseline/i);
});

test("existing prerequisite and operational domains still seed and validate after CRM and website expansion", () => {
  const state = createInitialProjectState();

  assert.ok(state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-finance-policy"));
  assert.ok(state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-inventory-warehouse-setup"));
  assert.ok(state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-sales-process-mode"));
  assert.ok(state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-purchase-process-mode"));
  assert.ok(state.checkpoints.find((checkpoint) => checkpoint.id === "checkpoint-manufacturing-process-mode"));
  assert.equal(validateStateShape(state), "");
});

function seedResolvedInventoryState() {
  const nextState = structuredClone(createInitialProjectState());
  let state = seedSupportedProjectModePass(nextState);
  state = seedSupportedAccountingPass(state, "checkpoint-finance-policy");
  state = seedSupportedAccountingPass(state, "checkpoint-accounting-valuation-method-prerequisites");
  state = seedSupportedAccountingPass(state, "checkpoint-accounting-stock-mapping-prerequisites");
  state = seedSupportedAccountingPass(state, "checkpoint-accounting-landed-cost-prerequisites");

  const inventoryIds = [
    "checkpoint-inventory-warehouse-setup",
    "checkpoint-inventory-valuation"
  ];

  for (const checkpointId of inventoryIds) {
    const checkpoint = state.checkpoints.find((item) => item.id === checkpointId);
    checkpoint.status = "Pass";
    checkpoint.evidenceReference = `${checkpointId}-approved`;
    checkpoint.blockerFlag = false;
    checkpoint.blockedReason = "";
  }

  return normalizeProjectState(state);
}

function seedSupportedAccountingPass(state, checkpointId) {
  const nextState = structuredClone(state);
  const checkpoint = nextState.checkpoints.find((item) => item.id === checkpointId);
  checkpoint.status = "Pass";
  checkpoint.evidenceReference = `${checkpointId}-approved`;
  checkpoint.checkpointOwner = "Finance lead";
  checkpoint.reviewer = "Controller";
  checkpoint.blockerFlag = false;
  checkpoint.blockedReason = "";
  return normalizeProjectState(nextState);
}

function seedSupportedProjectModePass(state) {
  const nextState = structuredClone(state);
  const checkpoint = nextState.checkpoints.find((item) => item.id === "checkpoint-project-mode");
  checkpoint.status = "Pass";
  checkpoint.evidenceReference = "checkpoint-project-mode-approved";
  checkpoint.checkpointOwner = "Project owner";
  checkpoint.reviewer = "Implementation lead";
  checkpoint.blockerFlag = false;
  checkpoint.blockedReason = "";
  return normalizeProjectState(nextState);
}
