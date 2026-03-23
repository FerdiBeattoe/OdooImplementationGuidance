export const POS_CONFIGURATION_SECTIONS = [
  {
    id: "sessionPolicyCapture",
    label: "Session policy capture",
    description: "Capture POS session control and cashier policy assumptions for implementation planning only. This is not live-system proof.",
    checkpointId: "checkpoint-pos-session-control"
  },
  {
    id: "invoicingPolicyCapture",
    label: "Invoicing policy capture",
    description: "Capture POS invoicing and accounting-linkage assumptions for bounded implementation planning only.",
    checkpointId: "checkpoint-pos-accounting-linkage"
  }
];

export function createPosConfigurationState() {
  return {
    sessionPolicyCapture: [],
    invoicingPolicyCapture: []
  };
}

export function normalizePosConfigurationState(state = {}) {
  return {
    sessionPolicyCapture: normalizePosRecords("sessionPolicyCapture", state?.sessionPolicyCapture),
    invoicingPolicyCapture: normalizePosRecords("invoicingPolicyCapture", state?.invoicingPolicyCapture)
  };
}

export function addPosConfigurationRecord(state, sectionId) {
  const nextState = structuredClone(state);
  const configuration = normalizePosConfigurationState(nextState.posConfiguration);
  const record = createPosConfigurationRecord(sectionId);

  configuration[sectionId] = [...(configuration[sectionId] || []), record];
  nextState.posConfiguration = configuration;
  return nextState;
}

export function updatePosConfigurationRecord(state, sectionId, recordKey, patch) {
  const nextState = structuredClone(state);
  const configuration = normalizePosConfigurationState(nextState.posConfiguration);
  const records = configuration[sectionId] || [];
  const index = records.findIndex((record) => record.key === recordKey);

  if (index < 0) {
    nextState.posConfiguration = configuration;
    return nextState;
  }

  records[index] = normalizePosConfigurationRecord(sectionId, {
    ...records[index],
    ...patch
  });

  configuration[sectionId] = records;
  nextState.posConfiguration = configuration;
  return nextState;
}

export function getPosConfigurationSections(project) {
  const configuration = normalizePosConfigurationState(project.posConfiguration);

  return POS_CONFIGURATION_SECTIONS.map((section) => {
    const checkpoint = (project.checkpoints || []).find((item) => item.id === section.checkpointId) || null;
    const records = configuration[section.id] || [];

    return {
      ...section,
      checkpoint,
      records,
      summary: {
        totalRecords: records.length,
        inScopeRecords: records.filter((record) => record.inScope).length,
        linkedRecords: getPosLinkedRecordCount(section.id, records)
      }
    };
  });
}

function createPosConfigurationRecord(sectionId) {
  const key = `${sectionId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  switch (sectionId) {
    case "sessionPolicyCapture":
      return normalizePosConfigurationRecord(sectionId, {
        key,
        sessionOpeningPolicyLabel: "",
        cashierRoleNotes: "",
        offlinePolicyNotes: "",
        inScope: true
      });
    case "invoicingPolicyCapture":
      return normalizePosConfigurationRecord(sectionId, {
        key,
        invoicingPolicyLabel: "",
        journalLinkageNotes: "",
        cashControlNotes: "",
        inScope: true
      });
    default:
      return { key, inScope: true };
  }
}

function normalizePosRecords(sectionId, records) {
  return Array.isArray(records)
    ? records.map((record, index) =>
        normalizePosConfigurationRecord(sectionId, {
          key: record?.key || `${sectionId}-${index + 1}`,
          ...record
        })
      )
    : [];
}

function normalizePosConfigurationRecord(sectionId, record) {
  switch (sectionId) {
    case "sessionPolicyCapture":
      return {
        key: normalizeString(record.key),
        sessionOpeningPolicyLabel: normalizeString(record.sessionOpeningPolicyLabel),
        cashierRoleNotes: normalizeString(record.cashierRoleNotes),
        offlinePolicyNotes: normalizeString(record.offlinePolicyNotes),
        inScope: Boolean(record.inScope)
      };
    case "invoicingPolicyCapture":
      return {
        key: normalizeString(record.key),
        invoicingPolicyLabel: normalizeString(record.invoicingPolicyLabel),
        journalLinkageNotes: normalizeString(record.journalLinkageNotes),
        cashControlNotes: normalizeString(record.cashControlNotes),
        inScope: Boolean(record.inScope)
      };
    default:
      return {
        key: normalizeString(record.key),
        inScope: Boolean(record.inScope)
      };
  }
}

function getPosLinkedRecordCount(sectionId, records) {
  switch (sectionId) {
    case "invoicingPolicyCapture":
      return records.filter((record) => record.invoicingPolicyLabel || record.journalLinkageNotes).length;
    default:
      return records.filter((record) => record.inScope).length;
  }
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}
