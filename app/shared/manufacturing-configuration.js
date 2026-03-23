export const MANUFACTURING_CONFIGURATION_SECTIONS = [
  {
    id: "productionModeCapture",
    label: "Production mode capture",
    description: "Capture production mode baseline assumptions for implementation planning only. This is not live-system proof.",
    checkpointId: "checkpoint-manufacturing-process-mode"
  },
  {
    id: "bomGovernanceCapture",
    label: "BOM governance capture",
    description: "Capture bill-of-materials governance and ownership assumptions for bounded implementation planning.",
    checkpointId: "checkpoint-manufacturing-bom-governance"
  },
  {
    id: "routingControlCapture",
    label: "Routing control capture",
    description: "Capture work-order and routing control assumptions without expanding into live production execution behavior.",
    checkpointId: "checkpoint-manufacturing-routing-control"
  },
  {
    id: "productionHandoffCapture",
    label: "Production handoff capture",
    description: "Capture downstream handoff assumptions from production completion without claiming controlled cross-domain execution.",
    checkpointId: "checkpoint-manufacturing-production-handoff"
  }
];

export function createManufacturingConfigurationState() {
  return {
    productionModeCapture: [],
    bomGovernanceCapture: [],
    routingControlCapture: [],
    productionHandoffCapture: []
  };
}

export function normalizeManufacturingConfigurationState(state = {}) {
  return {
    productionModeCapture: normalizeManufacturingRecords("productionModeCapture", state?.productionModeCapture),
    bomGovernanceCapture: normalizeManufacturingRecords("bomGovernanceCapture", state?.bomGovernanceCapture),
    routingControlCapture: normalizeManufacturingRecords("routingControlCapture", state?.routingControlCapture),
    productionHandoffCapture: normalizeManufacturingRecords("productionHandoffCapture", state?.productionHandoffCapture)
  };
}

export function addManufacturingConfigurationRecord(state, sectionId) {
  const nextState = structuredClone(state);
  const configuration = normalizeManufacturingConfigurationState(nextState.manufacturingConfiguration);
  const record = createManufacturingConfigurationRecord(sectionId);

  configuration[sectionId] = [...(configuration[sectionId] || []), record];
  nextState.manufacturingConfiguration = configuration;
  return nextState;
}

export function updateManufacturingConfigurationRecord(state, sectionId, recordKey, patch) {
  const nextState = structuredClone(state);
  const configuration = normalizeManufacturingConfigurationState(nextState.manufacturingConfiguration);
  const records = configuration[sectionId] || [];
  const index = records.findIndex((record) => record.key === recordKey);

  if (index < 0) {
    nextState.manufacturingConfiguration = configuration;
    return nextState;
  }

  records[index] = normalizeManufacturingConfigurationRecord(sectionId, {
    ...records[index],
    ...patch
  });

  configuration[sectionId] = records;
  nextState.manufacturingConfiguration = configuration;
  return nextState;
}

export function getManufacturingConfigurationSections(project) {
  const configuration = normalizeManufacturingConfigurationState(project.manufacturingConfiguration);

  return MANUFACTURING_CONFIGURATION_SECTIONS.map((section) => {
    const checkpoint = (project.checkpoints || []).find((item) => item.id === section.checkpointId) || null;
    const records = configuration[section.id] || [];

    return {
      ...section,
      checkpoint,
      records,
      summary: {
        totalRecords: records.length,
        inScopeRecords: records.filter((record) => record.inScope).length,
        linkedRecords: getManufacturingLinkedRecordCount(section.id, records)
      }
    };
  });
}

function createManufacturingConfigurationRecord(sectionId) {
  const key = `${sectionId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  switch (sectionId) {
    case "productionModeCapture":
      return normalizeManufacturingConfigurationRecord(sectionId, {
        key,
        productionModeLabel: "",
        productionStrategyNotes: "",
        exceptionNotes: "",
        inScope: true
      });
    case "bomGovernanceCapture":
      return normalizeManufacturingConfigurationRecord(sectionId, {
        key,
        bomOwnerRoleNote: "",
        bomReviewPolicyNotes: "",
        revisionControlNotes: "",
        inScope: true
      });
    case "routingControlCapture":
      return normalizeManufacturingConfigurationRecord(sectionId, {
        key,
        routingRequired: false,
        workOrderControlNote: "",
        controlNotes: "",
        inScope: true
      });
    case "productionHandoffCapture":
      return normalizeManufacturingConfigurationRecord(sectionId, {
        key,
        handoffType: "",
        downstreamHandoffNote: "",
        dependencyNote: "",
        inScope: true
      });
    default:
      return { key, inScope: true };
  }
}

function normalizeManufacturingRecords(sectionId, records) {
  return Array.isArray(records)
    ? records.map((record, index) =>
        normalizeManufacturingConfigurationRecord(sectionId, {
          key: record?.key || `${sectionId}-${index + 1}`,
          ...record
        })
      )
    : [];
}

function normalizeManufacturingConfigurationRecord(sectionId, record) {
  switch (sectionId) {
    case "productionModeCapture":
      return {
        key: normalizeString(record.key),
        productionModeLabel: normalizeString(record.productionModeLabel),
        productionStrategyNotes: normalizeString(record.productionStrategyNotes),
        exceptionNotes: normalizeString(record.exceptionNotes),
        inScope: Boolean(record.inScope)
      };
    case "bomGovernanceCapture":
      return {
        key: normalizeString(record.key),
        bomOwnerRoleNote: normalizeString(record.bomOwnerRoleNote),
        bomReviewPolicyNotes: normalizeString(record.bomReviewPolicyNotes),
        revisionControlNotes: normalizeString(record.revisionControlNotes),
        inScope: Boolean(record.inScope)
      };
    case "routingControlCapture":
      return {
        key: normalizeString(record.key),
        routingRequired: Boolean(record.routingRequired),
        workOrderControlNote: normalizeString(record.workOrderControlNote),
        controlNotes: normalizeString(record.controlNotes),
        inScope: Boolean(record.inScope)
      };
    case "productionHandoffCapture":
      return {
        key: normalizeString(record.key),
        handoffType: normalizeString(record.handoffType),
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

function getManufacturingLinkedRecordCount(sectionId, records) {
  switch (sectionId) {
    case "routingControlCapture":
      return records.filter((record) => record.routingRequired || record.controlNotes).length;
    default:
      return records.filter((record) => record.inScope).length;
  }
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}
