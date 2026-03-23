export const INVENTORY_CONFIGURATION_SECTIONS = [
  {
    id: "warehouses",
    label: "Warehouse structure",
    description: "Capture planned warehouse records for implementation design. This is not live-system proof.",
    checkpointId: "checkpoint-inventory-warehouse-setup"
  },
  {
    id: "operationTypes",
    label: "Operation-type structure",
    description: "Capture operation-type design and warehouse linkage for controlled implementation planning.",
    checkpointId: "checkpoint-inventory-operation-types"
  },
  {
    id: "routes",
    label: "Route structure",
    description: "Capture route design and the relevant warehouse and operation-type linkage.",
    checkpointId: "checkpoint-inventory-routes"
  }
];

export function createInventoryConfigurationState() {
  return {
    warehouses: [],
    operationTypes: [],
    routes: []
  };
}

export function normalizeInventoryConfigurationState(state = {}) {
  return {
    warehouses: normalizeWarehouseRecords(state?.warehouses),
    operationTypes: normalizeOperationTypeRecords(state?.operationTypes),
    routes: normalizeRouteRecords(state?.routes)
  };
}

export function addInventoryConfigurationRecord(state, sectionId) {
  const nextState = structuredClone(state);
  const configuration = normalizeInventoryConfigurationState(nextState.inventoryConfiguration);
  const record = createInventoryConfigurationRecord(sectionId);

  configuration[sectionId] = [...(configuration[sectionId] || []), record];
  nextState.inventoryConfiguration = configuration;
  return nextState;
}

export function updateInventoryConfigurationRecord(state, sectionId, recordKey, patch) {
  const nextState = structuredClone(state);
  const configuration = normalizeInventoryConfigurationState(nextState.inventoryConfiguration);
  const records = configuration[sectionId] || [];
  const index = records.findIndex((record) => record.key === recordKey);

  if (index < 0) {
    nextState.inventoryConfiguration = configuration;
    return nextState;
  }

  records[index] = normalizeInventoryConfigurationRecord(sectionId, {
    ...records[index],
    ...patch
  });

  configuration[sectionId] = records;
  nextState.inventoryConfiguration = configuration;
  return nextState;
}

export function getInventoryConfigurationSections(project) {
  const configuration = normalizeInventoryConfigurationState(project.inventoryConfiguration);

  return INVENTORY_CONFIGURATION_SECTIONS.map((section) => {
    const checkpoint = (project.checkpoints || []).find((item) => item.id === section.checkpointId) || null;
    const records = configuration[section.id] || [];

    return {
      ...section,
      checkpoint,
      records,
      summary: {
        totalRecords: records.length,
        inScopeRecords: records.filter((record) => record.inScope).length,
        linkedRecords: getLinkedRecordCount(section.id, records)
      }
    };
  });
}

function createInventoryConfigurationRecord(sectionId) {
  const key = `${sectionId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  switch (sectionId) {
    case "warehouses":
      return normalizeInventoryConfigurationRecord(sectionId, {
        key,
        warehouseName: "",
        code: "",
        companyScope: "",
        purposeNotes: "",
        inScope: true
      });
    case "operationTypes":
      return normalizeInventoryConfigurationRecord(sectionId, {
        key,
        linkedWarehouseKey: "",
        operationTypeName: "",
        operationTypeKey: "",
        flowCategory: "",
        sequenceOrder: "",
        notes: "",
        inScope: true
      });
    case "routes":
      return normalizeInventoryConfigurationRecord(sectionId, {
        key,
        routeName: "",
        scopeCategory: "",
        linkedWarehouseKeys: [],
        linkedOperationTypeKeys: [],
        purposeNotes: "",
        inScope: true
      });
    default:
      return { key, inScope: true };
  }
}

function normalizeWarehouseRecords(records) {
  return Array.isArray(records)
    ? records.map((record, index) =>
        normalizeInventoryConfigurationRecord("warehouses", {
          key: record?.key || `warehouses-${index + 1}`,
          ...record
        })
      )
    : [];
}

function normalizeOperationTypeRecords(records) {
  return Array.isArray(records)
    ? records.map((record, index) =>
        normalizeInventoryConfigurationRecord("operationTypes", {
          key: record?.key || `operation-types-${index + 1}`,
          ...record
        })
      )
    : [];
}

function normalizeRouteRecords(records) {
  return Array.isArray(records)
    ? records.map((record, index) =>
        normalizeInventoryConfigurationRecord("routes", {
          key: record?.key || `routes-${index + 1}`,
          ...record
        })
      )
    : [];
}

function normalizeInventoryConfigurationRecord(sectionId, record) {
  switch (sectionId) {
    case "warehouses":
      return {
        key: normalizeString(record.key),
        warehouseName: normalizeString(record.warehouseName),
        code: normalizeString(record.code),
        companyScope: normalizeString(record.companyScope),
        purposeNotes: normalizeString(record.purposeNotes),
        inScope: Boolean(record.inScope)
      };
    case "operationTypes":
      return {
        key: normalizeString(record.key),
        linkedWarehouseKey: normalizeString(record.linkedWarehouseKey),
        operationTypeName: normalizeString(record.operationTypeName),
        operationTypeKey: normalizeString(record.operationTypeKey),
        flowCategory: normalizeString(record.flowCategory),
        sequenceOrder: normalizeString(record.sequenceOrder),
        notes: normalizeString(record.notes),
        inScope: Boolean(record.inScope)
      };
    case "routes":
      return {
        key: normalizeString(record.key),
        routeName: normalizeString(record.routeName),
        scopeCategory: normalizeString(record.scopeCategory),
        linkedWarehouseKeys: normalizeList(record.linkedWarehouseKeys),
        linkedOperationTypeKeys: normalizeList(record.linkedOperationTypeKeys),
        purposeNotes: normalizeString(record.purposeNotes),
        inScope: Boolean(record.inScope)
      };
    default:
      return {
        key: normalizeString(record.key),
        inScope: Boolean(record.inScope)
      };
  }
}

function getLinkedRecordCount(sectionId, records) {
  switch (sectionId) {
    case "operationTypes":
      return records.filter((record) => record.linkedWarehouseKey).length;
    case "routes":
      return records.filter((record) => record.linkedWarehouseKeys.length || record.linkedOperationTypeKeys.length).length;
    default:
      return records.length;
  }
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeString(item)).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}
