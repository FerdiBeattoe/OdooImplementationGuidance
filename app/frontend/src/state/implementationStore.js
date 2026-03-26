/**
 * Implementation Store — Cross-wizard shared state
 * All wizard outputs are stored here and available as dropdown options
 * in subsequent wizards. Persists to localStorage.
 */

const STORAGE_KEY = "odoo_implementation_store";

const DEFAULT_STATE = {
  // Wizard completion data
  wizardData: {
    companySetup: null,       // Wizard 1
    usersAccess: null,        // Wizard 2
    chartOfAccounts: null,    // Wizard 3
    salesConfig: null,        // Wizard 4
    crmConfig: null,          // Wizard 5
    inventoryConfig: null,    // Wizard 6
    accountingConfig: null,   // Wizard 7
    purchaseConfig: null,     // Wizard 8
    manufacturingConfig: null,// Wizard 9
    hrPayrollConfig: null,    // Wizard 10
    websiteEcommerce: null,   // Wizard 11
    posConfig: null           // Wizard 12
  },
  // Roadmap step statuses
  roadmapSteps: {},
  // Recent activity log
  activityLog: [],
  // Data import records
  importedData: {
    products: [],
    productVariants: [],
    customers: [],
    vendors: [],
    billsOfMaterials: [],
    employees: [],
    openingBalances: [],
    salesOrders: []
  },
  // Analytics
  syncHistory: []
};

let _state = loadFromStorage();
const _listeners = new Set();

// Expose bridge for governed state → implementationStore sync (avoids circular imports)
if (typeof window !== "undefined") {
  window.__implStoreBridge = {
    setWizardData: (key, data) => setWizardData(key, data),
    setImportedData: (entity, rows) => setImportedData(entity, rows)
  };
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return deepMerge(DEFAULT_STATE, JSON.parse(raw));
    }
  } catch {
    // ignore
  }
  return structuredClone(DEFAULT_STATE);
}

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_state));
  } catch {
    // ignore storage errors
  }
}

function notify() {
  _listeners.forEach(fn => fn(_state));
}

export function subscribeToImplementationStore(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

export function getImplementationState() {
  return _state;
}

export function getWizardData(wizardKey) {
  return _state.wizardData[wizardKey] || null;
}

export function setWizardData(wizardKey, data) {
  _state = {
    ..._state,
    wizardData: { ..._state.wizardData, [wizardKey]: data }
  };
  saveToStorage();
  notify();
}

export function getRoadmapStepStatus(stepId) {
  return _state.roadmapSteps[stepId] || "todo";
}

export function setRoadmapStepStatus(stepId, status) {
  _state = {
    ..._state,
    roadmapSteps: { ..._state.roadmapSteps, [stepId]: status }
  };
  saveToStorage();
  notify();
}

export function getAllRoadmapStatuses() {
  return _state.roadmapSteps;
}

export function addActivityLog(entry) {
  const item = {
    id: `act-${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...entry
  };
  _state = {
    ..._state,
    activityLog: [item, ..._state.activityLog].slice(0, 100)
  };
  saveToStorage();
  notify();
  return item;
}

export function getActivityLog() {
  return _state.activityLog;
}

export function getImportedData(entity) {
  return _state.importedData[entity] || [];
}

export function setImportedData(entity, rows) {
  _state = {
    ..._state,
    importedData: { ..._state.importedData, [entity]: rows }
  };
  saveToStorage();
  notify();
}

// ── Cross-wizard dropdown helpers ─────────────────────────────

/** Returns users from Wizard 2 as dropdown options */
export function getUserOptions() {
  const data = _state.wizardData.usersAccess;
  if (!data?.users?.length) return [];
  return data.users.map(u => ({ value: u.email || u.name, label: u.name, user: u }));
}

/** Returns currency from Wizard 1 (Company Setup) */
export function getDefaultCurrency() {
  return _state.wizardData.companySetup?.currency || "USD";
}

/** Returns country from Wizard 1 */
export function getDefaultCountry() {
  return _state.wizardData.companySetup?.country || "";
}

/** Returns warehouses from Wizard 6 (Inventory) */
export function getWarehouseOptions() {
  const data = _state.wizardData.inventoryConfig;
  if (!data?.warehouses?.length) return [];
  return data.warehouses.map(w => ({ value: w.shortName || w.name, label: w.name }));
}

/** Returns sales teams from Wizard 4 (Sales) */
export function getSalesTeamOptions() {
  const data = _state.wizardData.salesConfig;
  if (!data?.salesTeams?.length) return [];
  return data.salesTeams.map(t => ({ value: t.name, label: t.name }));
}

/** Returns chart of accounts from Wizard 3 */
export function getAccountOptions() {
  const data = _state.wizardData.chartOfAccounts;
  if (!data?.accounts?.length) return [];
  return data.accounts.map(a => ({ value: a.code || a.name, label: `${a.code ? a.code + " — " : ""}${a.name}` }));
}

/** Returns departments from Wizard 10 (HR) */
export function getDepartmentOptions() {
  const data = _state.wizardData.hrPayrollConfig;
  if (!data?.departments?.length) return [];
  return data.departments.map(d => ({ value: d.name, label: d.name }));
}

/** Returns job positions from Wizard 10 */
export function getJobPositionOptions() {
  const data = _state.wizardData.hrPayrollConfig;
  if (!data?.jobPositions?.length) return [];
  return data.jobPositions.map(p => ({ value: p.name, label: p.name }));
}

/** Returns pricelists from Wizard 4 */
export function getPricelistOptions() {
  const data = _state.wizardData.salesConfig;
  if (!data?.pricelists?.length) return [];
  return data.pricelists.map(p => ({ value: p.name, label: p.name }));
}

/** Returns payment terms from Wizard 4 */
export function getPaymentTermOptions() {
  const data = _state.wizardData.salesConfig;
  if (!data?.paymentTerms?.length) return [];
  return data.paymentTerms.map(t => ({ value: t.name, label: t.name }));
}

/** Returns products from imported data grid */
export function getProductOptions() {
  return _state.importedData.products.map(p => ({
    value: p.internalRef || p.name,
    label: p.name
  }));
}

/** Returns customers from imported data grid */
export function getCustomerOptions() {
  return _state.importedData.customers.map(c => ({
    value: c.name,
    label: c.name
  }));
}

/** Returns vendors from imported data grid */
export function getVendorOptions() {
  return _state.importedData.vendors.map(v => ({
    value: v.name,
    label: v.name
  }));
}

/** Add sync history entry */
export function addSyncEntry(entry) {
  _state = {
    ..._state,
    syncHistory: [
      { id: `sync-${Date.now()}`, timestamp: new Date().toISOString(), ...entry },
      ..._state.syncHistory
    ].slice(0, 50)
  };
  saveToStorage();
  notify();
}

export function getSyncHistory() {
  return _state.syncHistory;
}

export function clearImplementationStore() {
  _state = structuredClone(DEFAULT_STATE);
  saveToStorage();
  notify();
}
