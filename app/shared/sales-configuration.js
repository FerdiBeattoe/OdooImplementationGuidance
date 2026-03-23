export const SALES_CONFIGURATION_SECTIONS = [
  {
    id: "processCapture",
    label: "Sales process capture",
    description: "Capture quotation-to-order baseline assumptions for implementation planning only.",
    checkpointId: "checkpoint-sales-process-mode"
  },
  {
    id: "pricingCapture",
    label: "Pricing policy capture",
    description: "Capture pricing and pricelist assumptions without implying a live pricing engine state.",
    checkpointId: "checkpoint-sales-pricing-policy"
  },
  {
    id: "quotationControlCapture",
    label: "Quotation control capture",
    description: "Capture approval and order-control assumptions for bounded implementation planning.",
    checkpointId: "checkpoint-sales-quotation-control"
  },
  {
    id: "fulfillmentHandoffCapture",
    label: "Fulfillment handoff capture",
    description: "Capture downstream handoff assumptions without expanding into cross-domain execution behavior.",
    checkpointId: "checkpoint-sales-fulfillment-handoff"
  }
];

export function createSalesConfigurationState() {
  return {
    processCapture: [],
    pricingCapture: [],
    quotationControlCapture: [],
    fulfillmentHandoffCapture: []
  };
}

export function normalizeSalesConfigurationState(state = {}) {
  return {
    processCapture: normalizeSalesRecords("processCapture", state?.processCapture),
    pricingCapture: normalizeSalesRecords("pricingCapture", state?.pricingCapture),
    quotationControlCapture: normalizeSalesRecords("quotationControlCapture", state?.quotationControlCapture),
    fulfillmentHandoffCapture: normalizeSalesRecords("fulfillmentHandoffCapture", state?.fulfillmentHandoffCapture)
  };
}

export function addSalesConfigurationRecord(state, sectionId) {
  const nextState = structuredClone(state);
  const configuration = normalizeSalesConfigurationState(nextState.salesConfiguration);
  const record = createSalesConfigurationRecord(sectionId);

  configuration[sectionId] = [...(configuration[sectionId] || []), record];
  nextState.salesConfiguration = configuration;
  return nextState;
}

export function updateSalesConfigurationRecord(state, sectionId, recordKey, patch) {
  const nextState = structuredClone(state);
  const configuration = normalizeSalesConfigurationState(nextState.salesConfiguration);
  const records = configuration[sectionId] || [];
  const index = records.findIndex((record) => record.key === recordKey);

  if (index < 0) {
    nextState.salesConfiguration = configuration;
    return nextState;
  }

  records[index] = normalizeSalesConfigurationRecord(sectionId, {
    ...records[index],
    ...patch
  });

  configuration[sectionId] = records;
  nextState.salesConfiguration = configuration;
  return nextState;
}

export function getSalesConfigurationSections(project) {
  const configuration = normalizeSalesConfigurationState(project.salesConfiguration);

  return SALES_CONFIGURATION_SECTIONS.map((section) => {
    const checkpoint = (project.checkpoints || []).find((item) => item.id === section.checkpointId) || null;
    const records = configuration[section.id] || [];

    return {
      ...section,
      checkpoint,
      records,
      summary: {
        totalRecords: records.length,
        inScopeRecords: records.filter((record) => record.inScope).length,
        linkedRecords: getSalesLinkedRecordCount(section.id, records)
      }
    };
  });
}

function createSalesConfigurationRecord(sectionId) {
  const key = `${sectionId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  switch (sectionId) {
    case "processCapture":
      return normalizeSalesConfigurationRecord(sectionId, {
        key,
        quoteFlowMode: "",
        orderConfirmationAssumptions: "",
        exceptionNotes: "",
        inScope: true
      });
    case "pricingCapture":
      return normalizeSalesConfigurationRecord(sectionId, {
        key,
        pricingApproachLabel: "",
        pricelistUsageAssumption: "",
        discountControlNote: "",
        inScope: true
      });
    case "quotationControlCapture":
      return normalizeSalesConfigurationRecord(sectionId, {
        key,
        approvalRequired: false,
        approvalOwnerRoleNote: "",
        controlNotes: "",
        inScope: true
      });
    case "fulfillmentHandoffCapture":
      return normalizeSalesConfigurationRecord(sectionId, {
        key,
        fulfillmentHandoffType: "",
        downstreamHandoffNote: "",
        dependencyNote: "",
        inScope: true
      });
    default:
      return { key, inScope: true };
  }
}

function normalizeSalesRecords(sectionId, records) {
  return Array.isArray(records)
    ? records.map((record, index) =>
        normalizeSalesConfigurationRecord(sectionId, {
          key: record?.key || `${sectionId}-${index + 1}`,
          ...record
        })
      )
    : [];
}

function normalizeSalesConfigurationRecord(sectionId, record) {
  switch (sectionId) {
    case "processCapture":
      return {
        key: normalizeString(record.key),
        quoteFlowMode: normalizeString(record.quoteFlowMode),
        orderConfirmationAssumptions: normalizeString(record.orderConfirmationAssumptions),
        exceptionNotes: normalizeString(record.exceptionNotes),
        inScope: Boolean(record.inScope)
      };
    case "pricingCapture":
      return {
        key: normalizeString(record.key),
        pricingApproachLabel: normalizeString(record.pricingApproachLabel),
        pricelistUsageAssumption: normalizeString(record.pricelistUsageAssumption),
        discountControlNote: normalizeString(record.discountControlNote),
        inScope: Boolean(record.inScope)
      };
    case "quotationControlCapture":
      return {
        key: normalizeString(record.key),
        approvalRequired: Boolean(record.approvalRequired),
        approvalOwnerRoleNote: normalizeString(record.approvalOwnerRoleNote),
        controlNotes: normalizeString(record.controlNotes),
        inScope: Boolean(record.inScope)
      };
    case "fulfillmentHandoffCapture":
      return {
        key: normalizeString(record.key),
        fulfillmentHandoffType: normalizeString(record.fulfillmentHandoffType),
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

function getSalesLinkedRecordCount(sectionId, records) {
  switch (sectionId) {
    case "quotationControlCapture":
      return records.filter((record) => record.approvalRequired || record.controlNotes).length;
    default:
      return records.filter((record) => record.inScope).length;
  }
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}
