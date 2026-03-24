/**
 * Chart of Accounts Wizard
 * Guided setup for importing or generating chart of accounts
 * Supports 20+ country-specific COA templates following Odoo's official structure
 */

import { OdooClient } from '../../api/OdooClient.js';
import { AVAILABLE_TEMPLATES, getTemplateByCountry, getTemplateByCode } from '../../templates/coa/index.js';

export const COA_STEPS = {
  COUNTRY_SELECTION: 1,
  TEMPLATE_PREVIEW: 2,
  OPTIONS: 3,
  MAPPING_REVIEW: 4,
  EXECUTION: 5,
  COMPLETION: 6
};

export const IMPORT_MODES = {
  TEMPLATE: 'template',
  CSV_IMPORT: 'csv_import',
  MANUAL: 'manual'
};

export class ChartOfAccountsWizard {
  constructor(client) {
    this.client = client;
    this.state = this._getInitialState();
  }

  _getInitialState() {
    return {
      currentStep: COA_STEPS.COUNTRY_SELECTION,
      importMode: IMPORT_MODES.TEMPLATE,
      selectedCountry: null,
      selectedTemplate: null,
      templateData: null,
      countries: [],
      availableTemplates: AVAILABLE_TEMPLATES,
      options: {
        generateTaxTemplates: true,
        createBankAccounts: false,
        createDefaultExpenses: true,
        parentAccountId: null,
        defaultBankAccountId: null,
        currencyConversion: false,
        journalIds: []
      },
      accountMapping: [],
      csvFile: null,
      csvData: null,
      errors: {},
      isLoading: false,
      executionResult: null
    };
  }

  async initialize() {
    this._setState({ isLoading: true });

    try {
      const countries = await this._fetchCountries();
      this._setState({
        countries,
        isLoading: false
      });

      return { success: true };
    } catch (error) {
      this._setState({ isLoading: false, errors: { general: error.message } });
      return { success: false, error: error.message };
    }
  }

  async _fetchCountries() {
    return this.client.searchRead('res.country', [], ['id', 'name', 'code']);
  }

  _setState(updates) {
    this.state = { ...this.state, ...updates };
  }

  setImportMode(mode) {
    this.state.importMode = mode;
    this.state.errors = {};
  }

  async selectCountry(countryId, countryCode) {
    this.state.selectedCountry = { id: countryId, code: countryCode };
    
    const template = getTemplateByCountry(countryCode);
    if (template) {
      this.state.selectedTemplate = template;
      this.state.templateData = this._prepareTemplateData(template);
    }
  }

  async selectTemplate(templateCode) {
    const template = getTemplateByCode(templateCode);
    if (template) {
      this.state.selectedTemplate = template;
      this.state.templateData = this._prepareTemplateData(template);
    }
  }

  _prepareTemplateData(template) {
    if (!template) return null;

    return {
      name: template.name,
      description: template.description,
      accountCount: template.accounts?.length || 0,
      taxCount: template.taxes?.length || 0,
      accountTypes: this._categorizeAccounts(template.accounts || []),
      preview: template.accounts?.slice(0, 10) || []
    };
  }

  _categorizeAccounts(accounts) {
    const categories = {
      asset: { count: 0, total: 0 },
      liability: { count: 0, total: 0 },
      equity: { count: 0, total: 0 },
      revenue: { count: 0, total: 0 },
      expense: { count: 0, total: 0 }
    };

    accounts.forEach(account => {
      const type = account.type || 'expense';
      if (categories[type]) {
        categories[type].count++;
      }
    });

    return categories;
  }

  setOption(option, value) {
    this.state.options = { ...this.state.options, [option]: value };
  }

  async loadCsvFile(file) {
    this._setState({ isLoading: true, csvFile: file.name });

    try {
      const text = await file.text();
      const parsed = this._parseCsv(text);
      
      this._setState({
        csvData: parsed,
        isLoading: false,
        errors: {}
      });

      return { success: true, rowCount: parsed.length };
    } catch (error) {
      this._setState({
        isLoading: false,
        errors: { csv: 'Failed to parse CSV file: ' + error.message }
      });
      return { success: false, error: error.message };
    }
  }

  _parseCsv(text) {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['code', 'name', 'type', 'reconcile'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
    }

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }

    return rows;
  }

  async nextStep() {
    this._clearErrors();
    const validation = this._validateCurrentStep();

    if (!validation.valid) {
      this.state.errors = validation.errors;
      return { success: false, errors: validation.errors };
    }

    const { currentStep } = this.state;

    if (currentStep === COA_STEPS.MAPPING_REVIEW) {
      return this._executeImport();
    }

    this.state.currentStep = currentStep + 1;
    return { success: true };
  }

  prevStep() {
    const { currentStep } = this.state;
    if (currentStep > 1) {
      this.state.currentStep = currentStep - 1;
      this.state.errors = {};
      return { success: true };
    }
    return { success: false };
  }

  _validateCurrentStep() {
    const { currentStep, importMode, selectedCountry, csvData } = this.state;
    const errors = {};

    switch (currentStep) {
      case COA_STEPS.COUNTRY_SELECTION:
        if (importMode === IMPORT_MODES.TEMPLATE && !selectedCountry) {
          errors.country = 'Please select a country for the chart of accounts';
        }
        break;

      case COA_STEPS.TEMPLATE_PREVIEW:
        if (importMode === IMPORT_MODES.TEMPLATE && !this.state.selectedTemplate) {
          errors.template = 'Please select a chart of accounts template';
        }
        break;

      case COA_STEPS.CSV_IMPORT:
        if (importMode === IMPORT_MODES.CSV_IMPORT && (!csvData || csvData.length === 0)) {
          errors.csv = 'Please upload a CSV file with account data';
        }
        break;
    }

    return { valid: Object.keys(errors).length === 0, errors };
  }

  _clearErrors() {
    this.state.errors = {};
  }

  async _executeImport() {
    this._setState({ isLoading: true, currentStep: COA_STEPS.EXECUTION });

    try {
      let result;

      switch (this.state.importMode) {
        case IMPORT_MODES.TEMPLATE:
          result = await this._importFromTemplate();
          break;
        case IMPORT_MODES.CSV_IMPORT:
          result = await this._importFromCsv();
          break;
        case IMPORT_MODES.MANUAL:
          result = await this._importManually();
          break;
        default:
          throw new Error('Invalid import mode');
      }

      this._setState({
        currentStep: COA_STEPS.COMPLETION,
        isLoading: false,
        executionResult: result
      });

      return { success: true, result };
    } catch (error) {
      this._setState({
        isLoading: false,
        errors: { general: error.message }
      });
      return { success: false, error: error.message };
    }
  }

  async _importFromTemplate() {
    const template = this.state.selectedTemplate;
    const { options } = this.state;

    const createdAccounts = [];
    const createdTaxes = [];

    // Get or create account type
    const accountTypes = await this._getAccountTypes();
    
    // Create fiscal position if multi-country
    let fiscalPositionId = null;

    // Create accounts from template
    for (const account of template.accounts || []) {
      const accountTypeId = this._findAccountTypeId(account.type, accountTypes);
      
      const accountId = await this.client.create('account.account', [{
        code: account.code,
        name: account.name,
        user_type_id: accountTypeId,
        reconcile: account.reconcile || false,
        currency_id: options.currencyId || null,
        company_id: this.client.companyId
      }]);

      createdAccounts.push({ code: account.code, name: account.name, id: accountId });
    }

    // Create tax templates and taxes if requested
    if (options.generateTaxTemplates && template.taxes) {
      const taxTemplateMapping = await this._createTaxTemplates(template.taxes);
      createdTaxes.push(...taxTemplateMapping);
    }

    // Create default expense accounts if requested
    if (options.createDefaultExpenses) {
      await this._createDefaultExpenseAccounts();
    }

    return {
      accountsCreated: createdAccounts.length,
      taxesCreated: createdTaxes.length,
      accounts: createdAccounts,
      taxes: createdTaxes
    };
  }

  async _getAccountTypes() {
    const types = await this.client.searchRead('account.account.type', [], ['id', 'name']);
    return types.reduce((acc, type) => {
      acc[type.name] = type.id;
      return acc;
    }, {});
  }

  _findAccountTypeId(type, accountTypes) {
    const typeMapping = {
      'asset': 'account.data_account_type_fixed_assets',
      'liability': 'account.data_account_type_non_current_liabilities',
      'equity': 'account.data_account_type_equity',
      'revenue': 'account.data_account_type_revenue',
      'expense': 'account.data_account_type_expenses',
      'bank': 'account.data_account_type_liquidity',
      'receivable': 'account.data_account_type_receivable',
      'payable': 'account.data_account_type_payable',
      'cash': 'account.data_account_type_liquidity'
    };

    const typeName = typeMapping[type] || 'account.data_account_type_expenses';
    return accountTypes[typeName] || Object.values(accountTypes)[0];
  }

  async _createTaxTemplates(taxes) {
    const createdTaxes = [];

    for (const tax of taxes) {
      const taxData = {
        name: tax.name,
        amount: tax.amount || 0,
        amount_type: tax.amount_type || 'percent',
        type_tax_use: tax.type_tax_use || 'sale',
        description: tax.description || '',
        tax_group_id: tax.tax_group_id || null,
        company_id: this.client.companyId,
        sequence: tax.sequence || 1
      };

      const taxId = await this.client.create('account.tax', [taxData]);
      createdTaxes.push({ name: tax.name, amount: tax.amount, id: taxId });
    }

    return createdTaxes;
  }

  async _createDefaultExpenseAccounts() {
    const accountTypes = await this._getAccountTypes();
    const expenseTypeId = accountTypes['account.data_account_type_expenses'] || Object.values(accountTypes)[0];

    const defaultExpenses = [
      { code: '621000', name: 'Salaries and Wages' },
      { code: '622000', name: 'Rent Expense' },
      { code: '623000', name: 'Utilities Expense' },
      { code: '624000', name: 'Office Supplies Expense' },
      { code: '625000', name: 'Travel Expense' }
    ];

    for (const expense of defaultExpenses) {
      await this.client.create('account.account', [{
        ...expense,
        user_type_id: expenseTypeId,
        reconcile: false,
        company_id: this.client.companyId
      }]);
    }
  }

  async _importFromCsv() {
    const { csvData, options } = this.state;
    const accountTypes = await this._getAccountTypes();
    const createdAccounts = [];

    for (const row of csvData) {
      const accountTypeId = this._findAccountTypeId(row.type, accountTypes);
      
      const accountId = await this.client.create('account.account', [{
        code: row.code,
        name: row.name,
        user_type_id: accountTypeId,
        reconcile: row.reconcile === 'true' || row.reconcile === '1',
        currency_id: options.currencyId || null,
        company_id: this.client.companyId
      }]);

      createdAccounts.push({ code: row.code, name: row.name, id: accountId });
    }

    return {
      accountsCreated: createdAccounts.length,
      taxesCreated: 0,
      accounts: createdAccounts,
      taxes: []
    };
  }

  async _importManually() {
    return {
      accountsCreated: 0,
      taxesCreated: 0,
      accounts: [],
      taxes: [],
      message: 'Manual import - no accounts created via template'
    };
  }

  getStepInfo(step) {
    const steps = {
      [COA_STEPS.COUNTRY_SELECTION]: {
        title: 'Select Country',
        description: 'Choose the country for your chart of accounts'
      },
      [COA_STEPS.TEMPLATE_PREVIEW]: {
        title: 'Template Selection',
        description: 'Review and select an account template'
      },
      [COA_STEPS.OPTIONS]: {
        title: 'Import Options',
        description: 'Configure how accounts will be imported'
      },
      [COA_STEPS.MAPPING_REVIEW]: {
        title: 'Review & Execute',
        description: 'Review mapping and execute import'
      },
      [COA_STEPS.EXECUTION]: {
        title: 'Importing',
        description: 'Creating accounts in your database'
      },
      [COA_STEPS.COMPLETION]: {
        title: 'Complete',
        description: 'Chart of accounts import completed'
      }
    };
    return steps[step] || {};
  }

  getProgress() {
    const totalSteps = Object.values(COA_STEPS).length;
    return Math.round(((this.state.currentStep - 1) / (totalSteps - 1)) * 100);
  }

  getAvailableTemplates() {
    return AVAILABLE_TEMPLATES;
  }

  getTemplatePreview() {
    return this.state.templateData;
  }

  reset() {
    this.state = this._getInitialState();
  }

  exportConfig() {
    return {
      importMode: this.state.importMode,
      selectedCountry: this.state.selectedCountry,
      selectedTemplate: this.state.selectedTemplate?.code,
      options: this.state.options,
      completedAt: this.state.currentStep === COA_STEPS.COMPLETION
        ? new Date().toISOString()
        : null
    };
  }
}

export default ChartOfAccountsWizard;
