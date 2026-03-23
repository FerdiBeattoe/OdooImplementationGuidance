export const ACCOUNTING_CONFIGURATION_SECTIONS = [
  {
    id: "policyCapture",
    label: "Policy capture",
    description:
      "Capture finance and valuation policy inputs for implementation planning. These rows are not live-system proof.",
    checkpointId: "checkpoint-finance-policy",
    checkpointIds: ["checkpoint-finance-policy", "checkpoint-accounting-valuation-method-prerequisites"]
  },
  {
    id: "stockMappingCapture",
    label: "Stock mapping capture",
    description:
      "Capture stock/input/output and valuation mapping inputs without implying live ERP execution.",
    checkpointId: "checkpoint-accounting-stock-mapping-prerequisites",
    checkpointIds: ["checkpoint-accounting-stock-mapping-prerequisites"]
  },
  {
    id: "landedCostCapture",
    label: "Landed-cost capture",
    description:
      "Capture landed-cost accounting inputs for controlled planning and downstream review.",
    checkpointId: "checkpoint-accounting-landed-cost-prerequisites",
    checkpointIds: ["checkpoint-accounting-landed-cost-prerequisites"]
  }
];

export function createAccountingConfigurationState() {
  return {
    policyCapture: [],
    stockMappingCapture: [],
    landedCostCapture: []
  };
}

export function normalizeAccountingConfigurationState(state = {}) {
  const hasNewPolicyCapture = Array.isArray(state?.policyCapture) && state.policyCapture.length > 0;

  return {
    policyCapture: hasNewPolicyCapture
      ? normalizeAccountingRecords("policyCapture", state.policyCapture)
      : [
          ...normalizeLegacyPolicyCaptureRecords(state?.financePolicySupport),
          ...normalizeLegacyPolicyCaptureRecords(state?.valuationMethodSupport, "valuation")
        ],
    stockMappingCapture: normalizeAccountingRecords(
      "stockMappingCapture",
      Array.isArray(state?.stockMappingCapture) && state.stockMappingCapture.length ? state.stockMappingCapture : state?.stockMappingSupport
    ),
    landedCostCapture: normalizeAccountingRecords(
      "landedCostCapture",
      Array.isArray(state?.landedCostCapture) && state.landedCostCapture.length ? state.landedCostCapture : state?.landedCostSupport
    )
  };
}

export function addAccountingConfigurationRecord(state, sectionId) {
  const nextState = structuredClone(state);
  const configuration = normalizeAccountingConfigurationState(nextState.accountingConfiguration);
  const record = createAccountingConfigurationRecord(sectionId);

  configuration[sectionId] = [...(configuration[sectionId] || []), record];
  nextState.accountingConfiguration = configuration;
  return nextState;
}

export function updateAccountingConfigurationRecord(state, sectionId, recordKey, patch) {
  const nextState = structuredClone(state);
  const configuration = normalizeAccountingConfigurationState(nextState.accountingConfiguration);
  const records = configuration[sectionId] || [];
  const index = records.findIndex((record) => record.key === recordKey);

  if (index < 0) {
    nextState.accountingConfiguration = configuration;
    return nextState;
  }

  records[index] = normalizeAccountingConfigurationRecord(sectionId, {
    ...records[index],
    ...patch
  });

  configuration[sectionId] = records;
  nextState.accountingConfiguration = configuration;
  return nextState;
}

export function getAccountingConfigurationSections(project) {
  const configuration = normalizeAccountingConfigurationState(project.accountingConfiguration);

  return ACCOUNTING_CONFIGURATION_SECTIONS.map((section) => {
    const checkpointIds = section.checkpointIds || [section.checkpointId];
    const linkedCheckpoints = checkpointIds
      .map((checkpointId) => (project.checkpoints || []).find((item) => item.id === checkpointId) || null)
      .filter(Boolean);
    const records = configuration[section.id] || [];

    return {
      ...section,
      checkpoint: linkedCheckpoints[0] || null,
      linkedCheckpoints,
      records,
      summary: {
        totalRecords: records.length,
        inScopeRecords: records.filter((record) => record.inScope).length,
        linkedRecords: getAccountingLinkedRecordCount(section.id, records)
      }
    };
  });
}

function createAccountingConfigurationRecord(sectionId) {
  const key = `${sectionId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  switch (sectionId) {
    case "policyCapture":
      return normalizeAccountingConfigurationRecord(sectionId, {
        key,
        companyAccountingScope: "",
        policyTopic: "",
        valuationMethodLabel: "",
        inventoryScopeNotes: "",
        decisionOwnerNotes: "",
        downstreamConstraintNotes: "",
        inScope: true
      });
    case "stockMappingCapture":
      return normalizeAccountingConfigurationRecord(sectionId, {
        key,
        companyAccountingScope: "",
        productScopeNotes: "",
        stockInputReference: "",
        stockOutputReference: "",
        valuationReference: "",
        supportNotes: "",
        inScope: true
      });
    case "landedCostCapture":
      return normalizeAccountingConfigurationRecord(sectionId, {
        key,
        companyAccountingScope: "",
        landedCostPolicyLabel: "",
        allocationBasisNotes: "",
        accountingTreatmentNotes: "",
        supportNotes: "",
        inScope: true
      });
    default:
      return { key, inScope: true };
  }
}

function normalizeAccountingRecords(sectionId, records) {
  return Array.isArray(records)
    ? records.map((record, index) =>
        normalizeAccountingConfigurationRecord(sectionId, {
          key: record?.key || `${sectionId}-${index + 1}`,
          ...record
        })
      )
    : [];
}

function normalizeLegacyPolicyCaptureRecords(records, source = "finance") {
  return Array.isArray(records)
    ? records.map((record, index) =>
        normalizeAccountingConfigurationRecord("policyCapture", {
          key: record?.key || `policyCapture-${source}-${index + 1}`,
          companyAccountingScope: record?.companyAccountingScope,
          policyTopic: source === "finance" ? record?.policyTopic : "",
          valuationMethodLabel: source === "valuation" ? record?.valuationMethodLabel : "",
          inventoryScopeNotes: source === "valuation" ? record?.inventoryScopeNotes : "",
          decisionOwnerNotes: record?.decisionOwnerNotes,
          downstreamConstraintNotes: record?.downstreamConstraintNotes,
          inScope: record?.inScope
        })
      )
    : [];
}

function normalizeAccountingConfigurationRecord(sectionId, record) {
  switch (sectionId) {
    case "policyCapture":
      return {
        key: normalizeString(record.key),
        companyAccountingScope: normalizeString(record.companyAccountingScope),
        policyTopic: normalizeString(record.policyTopic),
        valuationMethodLabel: normalizeString(record.valuationMethodLabel),
        inventoryScopeNotes: normalizeString(record.inventoryScopeNotes),
        decisionOwnerNotes: normalizeString(record.decisionOwnerNotes),
        downstreamConstraintNotes: normalizeString(record.downstreamConstraintNotes),
        inScope: Boolean(record.inScope)
      };
    case "stockMappingCapture":
      return {
        key: normalizeString(record.key),
        companyAccountingScope: normalizeString(record.companyAccountingScope),
        productScopeNotes: normalizeString(record.productScopeNotes),
        stockInputReference: normalizeString(record.stockInputReference),
        stockOutputReference: normalizeString(record.stockOutputReference),
        valuationReference: normalizeString(record.valuationReference),
        supportNotes: normalizeString(record.supportNotes),
        inScope: Boolean(record.inScope)
      };
    case "landedCostCapture":
      return {
        key: normalizeString(record.key),
        companyAccountingScope: normalizeString(record.companyAccountingScope),
        landedCostPolicyLabel: normalizeString(record.landedCostPolicyLabel),
        allocationBasisNotes: normalizeString(record.allocationBasisNotes),
        accountingTreatmentNotes: normalizeString(record.accountingTreatmentNotes),
        supportNotes: normalizeString(record.supportNotes),
        inScope: Boolean(record.inScope)
      };
    default:
      return {
        key: normalizeString(record.key),
        inScope: Boolean(record.inScope)
      };
  }
}

function getAccountingLinkedRecordCount(sectionId, records) {
  switch (sectionId) {
    case "stockMappingCapture":
      return records.filter(
        (record) => record.stockInputReference || record.stockOutputReference || record.valuationReference
      ).length;
    default:
      return records.filter((record) => record.inScope).length;
  }
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}
