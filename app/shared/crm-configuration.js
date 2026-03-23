export const CRM_CONFIGURATION_SECTIONS = [
  {
    id: "pipelineCapture",
    label: "Pipeline design capture",
    description: "Capture pipeline stage and sequence assumptions for implementation planning only. This is not live-system proof.",
    checkpointId: "checkpoint-crm-pipeline-governance"
  },
  {
    id: "activityDisciplineCapture",
    label: "Activity discipline capture",
    description: "Capture activity type and ownership assumptions without implying a configured or live CRM state.",
    checkpointId: "checkpoint-crm-sales-team-ownership"
  },
  {
    id: "quotationHandoffCapture",
    label: "Quotation handoff capture",
    description: "Capture downstream quotation handoff assumptions for bounded implementation planning only.",
    checkpointId: "checkpoint-crm-quotation-handoff"
  }
];

export function createCrmConfigurationState() {
  return {
    pipelineCapture: [],
    activityDisciplineCapture: [],
    quotationHandoffCapture: []
  };
}

export function normalizeCrmConfigurationState(state = {}) {
  return {
    pipelineCapture: normalizeCrmRecords("pipelineCapture", state?.pipelineCapture),
    activityDisciplineCapture: normalizeCrmRecords("activityDisciplineCapture", state?.activityDisciplineCapture),
    quotationHandoffCapture: normalizeCrmRecords("quotationHandoffCapture", state?.quotationHandoffCapture)
  };
}

export function addCrmConfigurationRecord(state, sectionId) {
  const nextState = structuredClone(state);
  const configuration = normalizeCrmConfigurationState(nextState.crmConfiguration);
  const record = createCrmConfigurationRecord(sectionId);

  configuration[sectionId] = [...(configuration[sectionId] || []), record];
  nextState.crmConfiguration = configuration;
  return nextState;
}

export function updateCrmConfigurationRecord(state, sectionId, recordKey, patch) {
  const nextState = structuredClone(state);
  const configuration = normalizeCrmConfigurationState(nextState.crmConfiguration);
  const records = configuration[sectionId] || [];
  const index = records.findIndex((record) => record.key === recordKey);

  if (index < 0) {
    nextState.crmConfiguration = configuration;
    return nextState;
  }

  records[index] = normalizeCrmConfigurationRecord(sectionId, {
    ...records[index],
    ...patch
  });

  configuration[sectionId] = records;
  nextState.crmConfiguration = configuration;
  return nextState;
}

export function getCrmConfigurationSections(project) {
  const configuration = normalizeCrmConfigurationState(project.crmConfiguration);

  return CRM_CONFIGURATION_SECTIONS.map((section) => {
    const checkpoint = (project.checkpoints || []).find((item) => item.id === section.checkpointId) || null;
    const records = configuration[section.id] || [];

    return {
      ...section,
      checkpoint,
      records,
      summary: {
        totalRecords: records.length,
        inScopeRecords: records.filter((record) => record.inScope).length,
        linkedRecords: getCrmLinkedRecordCount(section.id, records)
      }
    };
  });
}

function createCrmConfigurationRecord(sectionId) {
  const key = `${sectionId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  switch (sectionId) {
    case "pipelineCapture":
      return normalizeCrmConfigurationRecord(sectionId, {
        key,
        stageLabel: "",
        stageSequenceNotes: "",
        conversionPolicyNotes: "",
        inScope: true
      });
    case "activityDisciplineCapture":
      return normalizeCrmConfigurationRecord(sectionId, {
        key,
        salesTeamLabel: "",
        ownerRoleNote: "",
        activityTypeNotes: "",
        inScope: true
      });
    case "quotationHandoffCapture":
      return normalizeCrmConfigurationRecord(sectionId, {
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

function normalizeCrmRecords(sectionId, records) {
  return Array.isArray(records)
    ? records.map((record, index) =>
        normalizeCrmConfigurationRecord(sectionId, {
          key: record?.key || `${sectionId}-${index + 1}`,
          ...record
        })
      )
    : [];
}

function normalizeCrmConfigurationRecord(sectionId, record) {
  switch (sectionId) {
    case "pipelineCapture":
      return {
        key: normalizeString(record.key),
        stageLabel: normalizeString(record.stageLabel),
        stageSequenceNotes: normalizeString(record.stageSequenceNotes),
        conversionPolicyNotes: normalizeString(record.conversionPolicyNotes),
        inScope: Boolean(record.inScope)
      };
    case "activityDisciplineCapture":
      return {
        key: normalizeString(record.key),
        salesTeamLabel: normalizeString(record.salesTeamLabel),
        ownerRoleNote: normalizeString(record.ownerRoleNote),
        activityTypeNotes: normalizeString(record.activityTypeNotes),
        inScope: Boolean(record.inScope)
      };
    case "quotationHandoffCapture":
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

function getCrmLinkedRecordCount(sectionId, records) {
  switch (sectionId) {
    case "activityDisciplineCapture":
      return records.filter((record) => record.salesTeamLabel || record.ownerRoleNote).length;
    default:
      return records.filter((record) => record.inScope).length;
  }
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}
