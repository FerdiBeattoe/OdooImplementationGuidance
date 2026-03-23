export const PURCHASE_CONFIGURATION_SECTIONS = [
  {
    id: "processCapture",
    label: "Purchase process capture",
    description: "Capture RFQ-to-purchase-order baseline assumptions for implementation planning only.",
    checkpointId: "checkpoint-purchase-process-mode"
  },
  {
    id: "vendorPricingCapture",
    label: "Vendor pricing policy capture",
    description: "Capture vendor terms and pricing assumptions without implying a live vendor-pricing engine state.",
    checkpointId: "checkpoint-purchase-vendor-pricing-policy"
  },
  {
    id: "approvalControlCapture",
    label: "Purchase approval control capture",
    description: "Capture approval and order-control assumptions for bounded implementation planning.",
    checkpointId: "checkpoint-purchase-approval-control"
  },
  {
    id: "inboundHandoffCapture",
    label: "Inbound handoff capture",
    description: "Capture downstream inbound handoff assumptions without expanding into receipt execution behavior.",
    checkpointId: "checkpoint-purchase-inbound-handoff"
  }
];

export function createPurchaseConfigurationState() {
  return {
    processCapture: [],
    vendorPricingCapture: [],
    approvalControlCapture: [],
    inboundHandoffCapture: []
  };
}

export function normalizePurchaseConfigurationState(state = {}) {
  return {
    processCapture: normalizePurchaseRecords("processCapture", state?.processCapture),
    vendorPricingCapture: normalizePurchaseRecords("vendorPricingCapture", state?.vendorPricingCapture),
    approvalControlCapture: normalizePurchaseRecords("approvalControlCapture", state?.approvalControlCapture),
    inboundHandoffCapture: normalizePurchaseRecords("inboundHandoffCapture", state?.inboundHandoffCapture)
  };
}

export function addPurchaseConfigurationRecord(state, sectionId) {
  const nextState = structuredClone(state);
  const configuration = normalizePurchaseConfigurationState(nextState.purchaseConfiguration);
  const record = createPurchaseConfigurationRecord(sectionId);

  configuration[sectionId] = [...(configuration[sectionId] || []), record];
  nextState.purchaseConfiguration = configuration;
  return nextState;
}

export function updatePurchaseConfigurationRecord(state, sectionId, recordKey, patch) {
  const nextState = structuredClone(state);
  const configuration = normalizePurchaseConfigurationState(nextState.purchaseConfiguration);
  const records = configuration[sectionId] || [];
  const index = records.findIndex((record) => record.key === recordKey);

  if (index < 0) {
    nextState.purchaseConfiguration = configuration;
    return nextState;
  }

  records[index] = normalizePurchaseConfigurationRecord(sectionId, {
    ...records[index],
    ...patch
  });

  configuration[sectionId] = records;
  nextState.purchaseConfiguration = configuration;
  return nextState;
}

export function getPurchaseConfigurationSections(project) {
  const configuration = normalizePurchaseConfigurationState(project.purchaseConfiguration);

  return PURCHASE_CONFIGURATION_SECTIONS.map((section) => {
    const checkpoint = (project.checkpoints || []).find((item) => item.id === section.checkpointId) || null;
    const records = configuration[section.id] || [];

    return {
      ...section,
      checkpoint,
      records,
      summary: {
        totalRecords: records.length,
        inScopeRecords: records.filter((record) => record.inScope).length,
        linkedRecords: getPurchaseLinkedRecordCount(section.id, records)
      }
    };
  });
}

function createPurchaseConfigurationRecord(sectionId) {
  const key = `${sectionId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  switch (sectionId) {
    case "processCapture":
      return normalizePurchaseConfigurationRecord(sectionId, {
        key,
        rfqFlowMode: "",
        poConfirmationAssumptions: "",
        exceptionNotes: "",
        inScope: true
      });
    case "vendorPricingCapture":
      return normalizePurchaseConfigurationRecord(sectionId, {
        key,
        pricingApproachLabel: "",
        vendorPricelistUsageAssumption: "",
        priceControlNote: "",
        inScope: true
      });
    case "approvalControlCapture":
      return normalizePurchaseConfigurationRecord(sectionId, {
        key,
        approvalRequired: false,
        approvalOwnerRoleNote: "",
        controlNotes: "",
        inScope: true
      });
    case "inboundHandoffCapture":
      return normalizePurchaseConfigurationRecord(sectionId, {
        key,
        inboundHandoffType: "",
        downstreamHandoffNote: "",
        dependencyNote: "",
        inScope: true
      });
    default:
      return { key, inScope: true };
  }
}

function normalizePurchaseRecords(sectionId, records) {
  return Array.isArray(records)
    ? records.map((record, index) =>
        normalizePurchaseConfigurationRecord(sectionId, {
          key: record?.key || `${sectionId}-${index + 1}`,
          ...record
        })
      )
    : [];
}

function normalizePurchaseConfigurationRecord(sectionId, record) {
  switch (sectionId) {
    case "processCapture":
      return {
        key: normalizeString(record.key),
        rfqFlowMode: normalizeString(record.rfqFlowMode),
        poConfirmationAssumptions: normalizeString(record.poConfirmationAssumptions),
        exceptionNotes: normalizeString(record.exceptionNotes),
        inScope: Boolean(record.inScope)
      };
    case "vendorPricingCapture":
      return {
        key: normalizeString(record.key),
        pricingApproachLabel: normalizeString(record.pricingApproachLabel),
        vendorPricelistUsageAssumption: normalizeString(record.vendorPricelistUsageAssumption),
        priceControlNote: normalizeString(record.priceControlNote),
        inScope: Boolean(record.inScope)
      };
    case "approvalControlCapture":
      return {
        key: normalizeString(record.key),
        approvalRequired: Boolean(record.approvalRequired),
        approvalOwnerRoleNote: normalizeString(record.approvalOwnerRoleNote),
        controlNotes: normalizeString(record.controlNotes),
        inScope: Boolean(record.inScope)
      };
    case "inboundHandoffCapture":
      return {
        key: normalizeString(record.key),
        inboundHandoffType: normalizeString(record.inboundHandoffType),
        downstreamHandoffNote: normalizeString(record.downstreamHandoffNote),
        dependencyNote: normalizeString(record.dependencyNote),
        inScope: Boolean(record.inScope)
      };
    default:
      return {
        key: normalizeString(record.key),
        inScope: Boolean(record.inScope)
      };
  }
}

function getPurchaseLinkedRecordCount(sectionId, records) {
  switch (sectionId) {
    case "approvalControlCapture":
      return records.filter((record) => record.approvalRequired || record.controlNotes).length;
    default:
      return records.filter((record) => record.inScope).length;
  }
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}
