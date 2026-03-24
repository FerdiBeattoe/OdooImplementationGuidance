/**
 * Odoo Implementation Platform - Phase 7-8 Finance & Advanced Wizards
 * Export all finance and advanced module wizards
 */

// Finance Wizards
export { ChartOfAccountsWizard, COA_STEPS, IMPORT_MODES } from './wizards/finance/ChartOfAccountsWizard.js';
export { TaxConfigurationWizard, TAX_STEPS, TAX_TYPES, TAX_AMOUNT_TYPES } from './wizards/finance/TaxConfigurationWizard.js';
export { BankSetupWizard, BANK_STEPS, PAYMENT_TYPES, JOURNAL_TYPES } from './wizards/finance/BankSetupWizard.js';

// Advanced Module Wizards
export { PlmWizard, PLM_STEPS, ECO_TYPES, ECO_STATES, DOCUMENT_STATES } from './wizards/advanced/PlmWizard.js';
export { PosWizard, POS_STEPS, PAYMENT_INTERFACE_TYPES, SESSION_STATES } from './wizards/advanced/PosWizard.js';
export { WebsiteWizard, WEBSITE_STEPS, DELIVERY_TYPES } from './wizards/advanced/WebsiteWizard.js';

// Foundation Wizards (existing)
export { CompanySetupWizard, COMPANY_STEPS } from './wizards/foundation/CompanySetupWizard.js';
export { LocalizationWizard } from './wizards/foundation/LocalizationWizard.js';
export { MasterDataWizard } from './wizards/foundation/MasterDataWizard.js';
export { UsersSetupWizard } from './wizards/foundation/UsersSetupWizard.js';

// Operations Wizards (existing)
export { CrmWizard, CRM_STAGES } from './wizards/operations/CrmWizard.js';
export { SalesWizard, SALES_STEPS } from './wizards/operations/SalesWizard.js';
export { PurchaseWizard, PURCHASE_STEPS } from './wizards/operations/PurchaseWizard.js';
export { InventoryWizard, INVENTORY_STEPS } from './wizards/operations/InventoryWizard.js';

// Manufacturing Wizards (existing)
export { BomBuilder, BOM_STEPS } from './wizards/manufacturing/BomBuilder.js';
export { WorkcenterWizard, WORKCENTER_STEPS } from './wizards/manufacturing/WorkcenterWizard.js';

// Database Creation Wizard
export { DatabaseCreationWizard, DB_CREATION_STEPS } from './wizards/DatabaseCreationWizard.js';

// COA Templates
export { AVAILABLE_TEMPLATES, getTemplateByCountry, getTemplateByCode, searchTemplates } from './templates/coa/index.js';

// Re-export API client
export { OdooClient, OdooError } from './api/OdooClient.js';
