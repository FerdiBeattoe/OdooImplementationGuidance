/**
 * Wizard Push — Bridges wizard data to the governed execution pipeline.
 *
 * Each function receives merged wizard data, maps it into the domain-level
 * configuration capture used by the backend (inspect → preview → execute),
 * and dispatches through app-store. Falls back to governed-only persistence
 * when no live Odoo connection is active.
 *
 * REMEDIATION: All 12 push functions now capture data into governed project
 * state and persist via the backend. No fake success responses.
 */
import { addActivityLog } from "../state/implementationStore.js";
import {
  getState,
  inspectDomain,
  previewDomain,
  executePreview,
  persistActiveProject,
  updateProjectIdentity,
  setWizardCapture,
  addInventoryConfiguration,
  updateInventoryConfiguration,
  addSalesConfiguration,
  updateSalesConfiguration,
  addCrmConfiguration,
  updateCrmConfiguration,
  addPurchaseConfiguration,
  updatePurchaseConfiguration,
  addManufacturingConfiguration,
  updateManufacturingConfiguration,
  addPosConfiguration,
  updatePosConfiguration,
  addWebsiteEcommerceConfiguration,
  updateWebsiteEcommerceConfiguration,
  addAccountingConfiguration,
  updateAccountingConfiguration,
  addMasterDataConfiguration,
  updateMasterDataConfiguration
} from "../state/app-store.js";

function pushResult(items) {
  const errors = items.filter(i => !i.success);
  return { ok: errors.length === 0, results: items, errors };
}

function isConnected() {
  const { activeProject } = getState();
  const status = activeProject?.connectionState?.status || "not_connected";
  return status.startsWith("connected");
}

/**
 * Attempt the full governed pipeline for a domain:
 *   1. Inspect (read live state)
 *   2. Preview (diff desired vs live)
 *   3. Execute each safe preview
 *
 * Returns an array of { field, success, detail } result items.
 */
async function governedPush(domainId, label) {
  const results = [];

  try {
    await inspectDomain(domainId);
  } catch (err) {
    results.push({ field: `${label} Inspect`, success: false, detail: `Inspection failed: ${err.message}` });
    return results;
  }

  try {
    await previewDomain(domainId);
  } catch (err) {
    results.push({ field: `${label} Preview`, success: false, detail: `Preview failed: ${err.message}` });
    return results;
  }

  const { activeProject } = getState();
  const previews = activeProject?.previewState?.previews || [];
  const domainPreviews = previews.filter(p => p.domainId === domainId && p.executable && p.safetyClass === "safe");

  if (domainPreviews.length === 0) {
    results.push({ field: label, success: true, detail: "No executable changes — live state already matches configuration." });
    return results;
  }

  for (const preview of domainPreviews) {
    try {
      await executePreview(preview);
      results.push({
        field: preview.title || `${preview.targetModel}`,
        success: true,
        detail: `Executed: ${preview.operation} on ${preview.targetModel}`
      });
    } catch (err) {
      results.push({
        field: preview.title || `${preview.targetModel}`,
        success: false,
        detail: `Execution failed: ${err.message}`
      });
    }
  }

  return results;
}

// ── WIZARD 1: Company Setup ──────────────────────────────────────
export async function pushCompanySetup(data) {
  const results = [];
  try {
    updateProjectIdentity({ organizationName: data.companyName || "" });
    setWizardCapture("company-setup", data);

    if (isConnected()) {
      const governed = await governedPush("foundation-company-localization", "Company Setup");
      results.push(...governed);
    } else {
      results.push({ field: "Company", success: true, detail: `"${data.companyName}" captured in governed project state (no live connection).` });
    }

    await persistActiveProject();
    addActivityLog({ action: `Pushed Company Setup: ${data.companyName}`, module: "Company Setup", status: results.every(r => r.success) ? "success" : "partial" });
  } catch (err) {
    results.push({ field: "Company", success: false, detail: err.message });
  }
  return pushResult(results);
}

// ── WIZARD 2: Users & Access ─────────────────────────────────────
// Domain "users-roles-security" is preview-only (executeSupport: false).
// Precise risk classification:
//   res.users  — GUARDED: creating/writing users triggers security group membership,
//                password policy enforcement, MFA enrollment, and email invitation
//                workflows. A bad write can lock out the admin or grant unintended access.
//   res.groups — GUARDED: writing group membership cascades access rule changes
//                (ir.rule, ir.model.access) across the entire instance.
export async function pushUsersAccess(data) {
  const results = [];
  const users = data.users || [];
  try {
    // Capture user configuration into governed project state
    setWizardCapture("users-access", {
      userCount: users.length,
      users: users.map(u => ({ name: u.name, email: u.email, role: u.role }))
    });

    // Capture user roles as partner categories in master data (Odoo maps users to partners)
    for (const user of users) {
      if (user.role) {
        addMasterDataConfiguration("partner-categories");
        updateMasterDataConfiguration("partner-categories", `role-${user.role}`, { name: user.role, source: "users-wizard" });
      }
    }

    // When connected, inspect live user/group state for verification
    if (isConnected()) {
      try {
        await inspectDomain("users-roles-security");
        results.push({
          field: "Users Inspection",
          success: true,
          detail: "Live Odoo users/groups inspected. res.users and res.groups writes are guarded — user creation triggers security group assignment, password policies, and MFA enrollment. Use Odoo Settings > Users."
        });
      } catch (err) {
        results.push({ field: "Users Inspection", success: false, detail: `Inspection failed: ${err.message}` });
      }
    }

    for (const user of users) {
      results.push({
        field: `User: ${user.name}`,
        success: true,
        detail: `${user.email || user.name} — captured in governed project state.`
      });
    }

    if (users.length === 0) {
      results.push({ field: "Users", success: true, detail: "No users configured. Configuration saved." });
    }

    await persistActiveProject();
    addActivityLog({ action: `Captured ${users.length} users in governed state`, module: "Users", status: "success" });
  } catch (err) {
    results.push({ field: "Users", success: false, detail: err.message });
  }
  return pushResult(results);
}

// ── WIZARD 3: Chart of Accounts ──────────────────────────────────
export async function pushChartOfAccounts(data) {
  const results = [];
  const accounts = data.accounts || [];
  try {
    // Capture accounts into governed accounting configuration
    setWizardCapture("chart-of-accounts", {
      accountCount: accounts.length,
      accounts: accounts.map(a => ({ code: a.code, name: a.name, type: a.type }))
    });

    for (const acct of accounts) {
      addAccountingConfiguration("chart-of-accounts");
      updateAccountingConfiguration("chart-of-accounts", `acct-${acct.code || acct.name}`, {
        code: acct.code,
        name: acct.name,
        type: acct.type || "other"
      });
      results.push({
        field: `Account: ${acct.code || ""} ${acct.name}`,
        success: true,
        detail: "Captured in governed accounting configuration."
      });
    }

    // Attempt governed push if connected (accounting domain)
    if (isConnected()) {
      const governed = await governedPush("accounting", "Chart of Accounts");
      results.push(...governed);
    } else if (accounts.length === 0) {
      results.push({ field: "Accounts", success: true, detail: "No accounts configured. Configuration saved." });
    }

    await persistActiveProject();
    addActivityLog({ action: `Captured ${accounts.length} accounts in governed state`, module: "Accounting", status: "success" });
  } catch (err) {
    results.push({ field: "Accounts", success: false, detail: err.message });
  }
  return pushResult(results);
}

// ── WIZARD 4: Sales Configuration ────────────────────────────────
export async function pushSalesConfig(data) {
  const results = [];
  try {
    setWizardCapture("sales-setup", data);

    for (const team of (data.salesTeams || [])) {
      addSalesConfiguration("sales-teams");
      updateSalesConfiguration("sales-teams", `team-${team.name}`, { name: team.name });
      results.push({ field: `Sales Team: ${team.name}`, success: true, detail: "Captured in governed state." });
    }

    if (isConnected()) {
      const governed = await governedPush("sales", "Sales");
      results.push(...governed);
    } else if ((data.salesTeams || []).length === 0) {
      results.push({ field: "Sales", success: true, detail: "Configuration captured in governed project state." });
    }

    await persistActiveProject();
    addActivityLog({ action: "Pushed Sales Configuration", module: "Sales", status: results.every(r => r.success) ? "success" : "partial" });
  } catch (err) {
    results.push({ field: "Sales", success: false, detail: err.message });
  }
  return pushResult(results);
}

// ── WIZARD 5: CRM Configuration ──────────────────────────────────
export async function pushCrmConfig(data) {
  const results = [];
  try {
    setWizardCapture("crm-setup", data);

    for (const stage of (data.stages || [])) {
      addCrmConfiguration("crm-stages");
      updateCrmConfiguration("crm-stages", `stage-${stage.name}`, { name: stage.name, probability: stage.probability });
      results.push({ field: `Stage: ${stage.name}`, success: true, detail: "Captured in governed state." });
    }

    if (isConnected()) {
      const governed = await governedPush("crm", "CRM");
      results.push(...governed);
    } else if ((data.stages || []).length === 0) {
      results.push({ field: "CRM", success: true, detail: "Configuration captured in governed project state." });
    }

    await persistActiveProject();
    addActivityLog({ action: "Pushed CRM Configuration", module: "CRM", status: results.every(r => r.success) ? "success" : "partial" });
  } catch (err) {
    results.push({ field: "CRM", success: false, detail: err.message });
  }
  return pushResult(results);
}

// ── WIZARD 6: Inventory Configuration ────────────────────────────
export async function pushInventoryConfig(data) {
  const results = [];
  try {
    setWizardCapture("inventory-setup", data);

    for (const wh of (data.warehouses || [])) {
      addInventoryConfiguration("warehouses");
      updateInventoryConfiguration("warehouses", `wh-${wh.shortName || wh.name}`, { name: wh.name, code: wh.shortName });
      results.push({ field: `Warehouse: ${wh.name}`, success: true, detail: `Code: ${wh.shortName}` });
    }
    if (data.operationTypes) {
      for (const ot of data.operationTypes) {
        addInventoryConfiguration("operation-types");
        updateInventoryConfiguration("operation-types", `ot-${ot.name}`, { name: ot.name, code: ot.code });
        results.push({ field: `Op Type: ${ot.name}`, success: true, detail: `Code: ${ot.code}` });
      }
    }

    if (isConnected()) {
      const governed = await governedPush("inventory", "Inventory");
      results.push(...governed);
    } else if ((data.warehouses || []).length === 0 && !(data.operationTypes || []).length) {
      results.push({ field: "Inventory", success: true, detail: "Configuration captured in governed project state." });
    }

    await persistActiveProject();
    addActivityLog({ action: "Pushed Inventory Configuration", module: "Inventory", status: results.every(r => r.success) ? "success" : "partial" });
  } catch (err) {
    results.push({ field: "Inventory", success: false, detail: err.message });
  }
  return pushResult(results);
}

// ── WIZARD 7: Accounting Configuration ───────────────────────────
export async function pushAccountingConfig(data) {
  const results = [];
  try {
    setWizardCapture("accounting-setup", data);

    for (const bank of (data.bankAccounts || [])) {
      addAccountingConfiguration("bank-accounts");
      updateAccountingConfiguration("bank-accounts", `bank-${bank.bankName}`, { bankName: bank.bankName, accountNumber: bank.accountNumber });
      results.push({ field: `Bank: ${bank.bankName}`, success: true, detail: bank.accountNumber });
    }
    for (const tax of (data.taxes || [])) {
      addAccountingConfiguration("taxes");
      updateAccountingConfiguration("taxes", `tax-${tax.name}`, { name: tax.name, rate: tax.rate, type: tax.type });
      results.push({ field: `Tax: ${tax.name}`, success: true, detail: `${tax.rate}% ${tax.type}` });
    }

    // REMEDIATION: Now actually runs governed push when connected
    if (isConnected()) {
      const governed = await governedPush("accounting", "Accounting");
      results.push(...governed);
    } else if ((data.bankAccounts || []).length === 0 && (data.taxes || []).length === 0) {
      results.push({ field: "Accounting", success: true, detail: "Configuration captured in governed project state." });
    }

    await persistActiveProject();
    addActivityLog({ action: "Pushed Accounting Configuration", module: "Accounting", status: results.every(r => r.success) ? "success" : "partial" });
  } catch (err) {
    results.push({ field: "Accounting", success: false, detail: err.message });
  }
  return pushResult(results);
}

// ── WIZARD 8: Purchase Configuration ─────────────────────────────
export async function pushPurchaseConfig(data) {
  const results = [];
  try {
    setWizardCapture("purchase-setup", data);

    // Capture purchase-specific data into governed state
    for (const vendor of (data.preferredVendors || [])) {
      addPurchaseConfiguration("preferred-vendors");
      updatePurchaseConfiguration("preferred-vendors", `vendor-${vendor.name}`, { name: vendor.name });
      results.push({ field: `Vendor: ${vendor.name}`, success: true, detail: "Captured in governed state." });
    }

    if (isConnected()) {
      const governed = await governedPush("purchase", "Purchase");
      results.push(...governed);
    } else {
      results.push({ field: "Purchase Settings", success: true, detail: "Configuration captured in governed project state." });
    }

    await persistActiveProject();
    addActivityLog({ action: "Pushed Purchase Configuration", module: "Purchase", status: results.every(r => r.success) ? "success" : "partial" });
  } catch (err) {
    results.push({ field: "Purchase", success: false, detail: err.message });
  }
  return pushResult(results);
}

// ── WIZARD 9: Manufacturing Configuration ────────────────────────
export async function pushManufacturingConfig(data) {
  const results = [];
  try {
    setWizardCapture("manufacturing-setup", data);

    for (const wc of (data.workcenters || [])) {
      addManufacturingConfiguration("workcenters");
      updateManufacturingConfiguration("workcenters", `wc-${wc.name}`, { name: wc.name, efficiency: wc.efficiency });
      results.push({ field: `Workcenter: ${wc.name}`, success: true, detail: `Eff: ${wc.efficiency}%` });
    }

    if (isConnected()) {
      const governed = await governedPush("manufacturing-mrp", "Manufacturing");
      results.push(...governed);
    } else if ((data.workcenters || []).length === 0) {
      results.push({ field: "Manufacturing", success: true, detail: "Configuration captured in governed project state." });
    }

    await persistActiveProject();
    addActivityLog({ action: "Pushed Manufacturing Configuration", module: "Manufacturing", status: results.every(r => r.success) ? "success" : "partial" });
  } catch (err) {
    results.push({ field: "Manufacturing", success: false, detail: err.message });
  }
  return pushResult(results);
}

// ── WIZARD 10: HR & Payroll ──────────────────────────────────────
// Domain "hr" now supports bounded execution for safe models:
//   hr.department — SAFE (live-executable): organizational label, no cascading side-effects
//   hr.job        — SAFE (live-executable): job position label, no cascading side-effects
//   hr.employee   — GUARDED (preview-only): linked to res.users, payroll, leave allocations
export async function pushHrPayroll(data) {
  const results = [];
  try {
    setWizardCapture("hr-setup", {
      departments: data.departments || [],
      jobPositions: data.jobPositions || [],
      leaveTypes: data.leaveTypes || [],
      payrollRules: data.payrollRules || []
    });

    for (const dept of (data.departments || [])) {
      addMasterDataConfiguration("partner-categories");
      updateMasterDataConfiguration("partner-categories", `dept-${dept.name}`, {
        name: dept.name,
        source: "hr-wizard",
        manager: dept.manager || ""
      });
      results.push({
        field: `Department: ${dept.name}`,
        success: true,
        detail: `${dept.manager || "No manager"} — captured in governed state.`
      });
    }
    for (const job of (data.jobPositions || [])) {
      addMasterDataConfiguration("partner-categories");
      updateMasterDataConfiguration("partner-categories", `job-${job.name}`, {
        name: job.name,
        source: "hr-wizard",
        department: job.department || ""
      });
      results.push({
        field: `Position: ${job.name}`,
        success: true,
        detail: `${job.department || ""} — captured in governed state.`
      });
    }

    // When connected, run governed pipeline for safe HR models (department, job)
    // hr.employee execution is blocked by engine.js with a precise error message
    if (isConnected()) {
      const governed = await governedPush("hr", "HR");
      results.push(...governed);
    }

    if ((data.departments || []).length === 0 && (data.jobPositions || []).length === 0) {
      results.push({ field: "HR", success: true, detail: "Configuration captured in governed project state." });
    }

    await persistActiveProject();
    addActivityLog({ action: "Pushed HR & Payroll Configuration", module: "HR", status: results.every(r => r.success) ? "success" : "partial" });
  } catch (err) {
    results.push({ field: "HR", success: false, detail: err.message });
  }
  return pushResult(results);
}

// ── WIZARD 11: Website & eCommerce ───────────────────────────────
export async function pushWebsiteEcommerce(data) {
  const results = [];
  try {
    setWizardCapture("website-setup", data);

    if (data.websiteName) {
      addWebsiteEcommerceConfiguration("website-settings");
      updateWebsiteEcommerceConfiguration("website-settings", "main", { websiteName: data.websiteName });
    }
    for (const sm of (data.shippingMethods || [])) {
      addWebsiteEcommerceConfiguration("shipping-methods");
      updateWebsiteEcommerceConfiguration("shipping-methods", `ship-${sm.name}`, { name: sm.name, price: sm.price });
      results.push({ field: `Shipping: ${sm.name}`, success: true, detail: `${sm.price}` });
    }

    if (isConnected()) {
      const governed = await governedPush("website-ecommerce", "Website");
      results.push(...governed);
    } else {
      results.push({ field: "Website Settings", success: true, detail: data.websiteName ? `"${data.websiteName}" captured in governed state.` : "Configuration captured in governed project state." });
    }

    await persistActiveProject();
    addActivityLog({ action: "Pushed Website & eCommerce Configuration", module: "Website", status: results.every(r => r.success) ? "success" : "partial" });
  } catch (err) {
    results.push({ field: "Website", success: false, detail: err.message });
  }
  return pushResult(results);
}

// ── WIZARD 12: Point of Sale ─────────────────────────────────────
export async function pushPosConfig(data) {
  const results = [];
  try {
    setWizardCapture("pos-setup", data);

    if (data.posName) {
      addPosConfiguration("pos-terminals");
      updatePosConfiguration("pos-terminals", "main", { posName: data.posName });
    }

    if (isConnected()) {
      const governed = await governedPush("pos", "POS");
      results.push(...governed);
    } else {
      results.push({ field: "POS Terminal", success: true, detail: data.posName ? `"${data.posName}" captured in governed state.` : "Configuration captured in governed project state." });
    }

    await persistActiveProject();
    addActivityLog({ action: "Pushed POS Configuration", module: "POS", status: results.every(r => r.success) ? "success" : "partial" });
  } catch (err) {
    results.push({ field: "POS", success: false, detail: err.message });
  }
  return pushResult(results);
}

// ── PUSH MAP ─────────────────────────────────────────────────────
export const WIZARD_PUSH_MAP = {
  "company-setup": pushCompanySetup,
  "users-access": pushUsersAccess,
  "chart-of-accounts": pushChartOfAccounts,
  "sales-setup": pushSalesConfig,
  "crm-setup": pushCrmConfig,
  "inventory-setup": pushInventoryConfig,
  "accounting-setup": pushAccountingConfig,
  "purchase-setup": pushPurchaseConfig,
  "manufacturing-setup": pushManufacturingConfig,
  "hr-setup": pushHrPayroll,
  "website-setup": pushWebsiteEcommerce,
  "pos-setup": pushPosConfig
};
