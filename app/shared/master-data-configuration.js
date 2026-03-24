export const MASTER_DATA_CONFIGURATION_SECTIONS = [
  {
    id: "partnerCategoryCapture",
    label: "Partner classification capture",
    description: "Capture customer/vendor/contact classification tags required for shared data governance.",
    checkpointId: "checkpoint-master-data-structure"
  },
  {
    id: "productCategoryCapture",
    label: "Product category capture",
    description: "Capture product category structure required for downstream operational consistency.",
    checkpointId: "checkpoint-master-data-structure"
  },
  {
    id: "uomCategoryCapture",
    label: "Unit category capture",
    description: "Capture units-of-measure category baselines used by downstream product structures.",
    checkpointId: "checkpoint-master-data-readiness"
  }
];

export function createMasterDataConfigurationState() {
  return {
    partnerCategoryCapture: [],
    productCategoryCapture: [],
    uomCategoryCapture: []
  };
}

export function normalizeMasterDataConfigurationState(state = {}) {
  return {
    partnerCategoryCapture: normalizeMasterDataRecords("partnerCategoryCapture", state?.partnerCategoryCapture),
    productCategoryCapture: normalizeMasterDataRecords("productCategoryCapture", state?.productCategoryCapture),
    uomCategoryCapture: normalizeMasterDataRecords("uomCategoryCapture", state?.uomCategoryCapture)
  };
}

export function addMasterDataConfigurationRecord(state, sectionId) {
  const nextState = structuredClone(state);
  const configuration = normalizeMasterDataConfigurationState(nextState.masterDataConfiguration);
  const record = createMasterDataConfigurationRecord(sectionId);

  configuration[sectionId] = [...(configuration[sectionId] || []), record];
  nextState.masterDataConfiguration = configuration;
  return nextState;
}

export function updateMasterDataConfigurationRecord(state, sectionId, recordKey, patch) {
  const nextState = structuredClone(state);
  const configuration = normalizeMasterDataConfigurationState(nextState.masterDataConfiguration);
  const records = configuration[sectionId] || [];
  const index = records.findIndex((record) => record.key === recordKey);

  if (index < 0) {
    nextState.masterDataConfiguration = configuration;
    return nextState;
  }

  records[index] = normalizeMasterDataConfigurationRecord(sectionId, {
    ...records[index],
    ...patch
  });

  configuration[sectionId] = records;
  nextState.masterDataConfiguration = configuration;
  return nextState;
}

export function getMasterDataConfigurationSections(project) {
  const configuration = normalizeMasterDataConfigurationState(project.masterDataConfiguration);

  return MASTER_DATA_CONFIGURATION_SECTIONS.map((section) => {
    const checkpoint = (project.checkpoints || []).find((item) => item.id === section.checkpointId) || null;
    const records = configuration[section.id] || [];

    return {
      ...section,
      checkpoint,
      records,
      summary: {
        totalRecords: records.length,
        inScopeRecords: records.filter((record) => record.inScope).length,
        linkedRecords: records.filter((record) => hasMasterDataLinkedRecord(section.id, record)).length
      }
    };
  });
}

function createMasterDataConfigurationRecord(sectionId) {
  const key = `${sectionId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  switch (sectionId) {
    case "partnerCategoryCapture":
      return normalizeMasterDataConfigurationRecord(sectionId, {
        key,
        categoryName: "",
        stewardshipNote: "",
        inScope: true
      });
    case "productCategoryCapture":
      return normalizeMasterDataConfigurationRecord(sectionId, {
        key,
        categoryName: "",
        parentCategoryName: "",
        stewardshipNote: "",
        inScope: true
      });
    case "uomCategoryCapture":
      return normalizeMasterDataConfigurationRecord(sectionId, {
        key,
        categoryName: "",
        stewardshipNote: "",
        inScope: true
      });
    default:
      return {
        key,
        inScope: true
      };
  }
}

function normalizeMasterDataRecords(sectionId, records) {
  return Array.isArray(records)
    ? records.map((record, index) =>
        normalizeMasterDataConfigurationRecord(sectionId, {
          key: record?.key || `${sectionId}-${index + 1}`,
          ...record
        })
      )
    : [];
}

function normalizeMasterDataConfigurationRecord(sectionId, record) {
  switch (sectionId) {
    case "partnerCategoryCapture":
      return {
        key: normalizeString(record.key),
        categoryName: normalizeString(record.categoryName),
        stewardshipNote: normalizeString(record.stewardshipNote),
        inScope: Boolean(record.inScope)
      };
    case "productCategoryCapture":
      return {
        key: normalizeString(record.key),
        categoryName: normalizeString(record.categoryName),
        parentCategoryName: normalizeString(record.parentCategoryName),
        stewardshipNote: normalizeString(record.stewardshipNote),
        inScope: Boolean(record.inScope)
      };
    case "uomCategoryCapture":
      return {
        key: normalizeString(record.key),
        categoryName: normalizeString(record.categoryName),
        stewardshipNote: normalizeString(record.stewardshipNote),
        inScope: Boolean(record.inScope)
      };
    default:
      return {
        key: normalizeString(record.key),
        inScope: Boolean(record.inScope)
      };
  }
}

function hasMasterDataLinkedRecord(sectionId, record) {
  switch (sectionId) {
    case "productCategoryCapture":
      return Boolean(record.categoryName || record.parentCategoryName);
    default:
      return Boolean(record.categoryName);
  }
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}
