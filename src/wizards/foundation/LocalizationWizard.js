/**
 * Localization Wizard
 * Country-specific setup including taxes, chart of accounts, and fiscal positions
 */

import { OdooClient } from '../../api/OdooClient.js';

export const LOCALIZATION_STEPS = {
  COUNTRY_SELECTION: 1,
  CHART_OF_ACCOUNTS: 2,
  TAX_CONFIGURATION: 3,
  FISCAL_POSITIONS: 4,
  BANK_ACCOUNT: 5,
  COMPLETION: 6
};

export class LocalizationWizard {
  constructor(client) {
    this.client = client;
    this.state = this._getInitialState();
  }

  _getInitialState() {
    return {
      currentStep: LOCALIZATION_STEPS.COUNTRY_SELECTION,
      country: {
        id: null,
        name: '',
        code: ''
      },
      chartOfAccounts: {
        country_id: null,
        chartTemplate: null,
        existingAccounts: []
      },
      taxes: {
        saleTaxes: [],
        purchaseTaxes: [],
        taxTemplateMapping: []
      },
      fiscalPositions: [],
      bankAccount: {
        acc_number: '',
        bank_id: null,
        partner_id: null,
        bank_name: ''
      },
      countries: [],
      availableCharts: [],
      taxTemplates: [],
      banks: [],
      errors: {},
      isLoading: false
    };
  }

  async initialize() {
    this._setState({ isLoading: true });
    
    try {
      const countries = await this.client.searchRead(
        'res.country', 
        [], 
        ['id', 'name', 'code', 'phone_code'],
        { limit: 300 }
      );

      const banks = await this.client.searchRead(
        'res.bank', 
        [['active', '=', true]], 
        ['id', 'name', 'bic', 'code', 'country']
      );

      this._setState({ countries, banks, isLoading: false });
      return { success: true };
    } catch (error) {
      this._setState({ isLoading: false, errors: { general: error.message } });
      return { success: false, error: error.message };
    }
  }

  _setState(updates) {
    this.state = { ...this.state, ...updates };
  }

  async setCountry(countryId) {
    this._clearErrors();
    const country = this.state.countries.find(c => c.id === countryId);
    
    if (!country) {
      this.state.errors.country = 'Invalid country selection';
      return { success: false };
    }

    this.state.country = {
      id: country.id,
      name: country.name,
      code: country.code
    };
    this.state.chartOfAccounts.country_id = countryId;

    await this._loadChartTemplates(countryId);
    
    return { success: true };
  }

  async _loadChartTemplates(countryId) {
    this._setState({ isLoading: true });
    
    try {
      const templates = await this.client.searchRead(
        'account.chart.template',
        [['country_id', '=', countryId]],
        ['id', 'name', 'code', 'visible', 'currency_id']
      );

      this._setState({
        availableCharts: templates,
        isLoading: false
      });
    } catch (error) {
      this._setState({ isLoading: false });
    }
  }

  setChartTemplate(templateId) {
    this.state.chartOfAccounts.chartTemplate = templateId;
  }

  async generateChartOfAccounts() {
    if (!this.state.chartOfAccounts.chartTemplate) {
      this.state.errors.chart = 'Please select a chart of accounts template';
      return { success: false };
    }

    this._setState({ isLoading: true });

    try {
      await this.client.executeKw('account.chart.template', 'try_loading', [
        [this.state.chartOfAccounts.chartTemplate],
        {
          'company_id': 1,
          'transfer_account_id': 1467,
          'code_digits': 6
        }
      ]);

      const existingAccounts = await this.client.searchRead(
        'account.account',
        [],
        ['id', 'code', 'name', 'account_type', 'user_type_id'],
        { limit: 100 }
      );

      this.state.chartOfAccounts.existingAccounts = existingAccounts;

      this._setState({ isLoading: false });
      return { success: true };
    } catch (error) {
      this._setState({ isLoading: false, errors: { general: error.message } });
      return { success: false, error: error.message };
    }
  }

  async loadTaxTemplates() {
    if (!this.state.country.id) return;

    this._setState({ isLoading: true });

    try {
      const taxTemplates = await this.client.searchRead(
        'account.tax.template',
        [],
        ['id', 'name', 'type_tax_use', 'amount', 'tax_group_id', 'description'],
        { limit: 100 }
      );

      this._setState({
        taxTemplates,
        taxes: {
          saleTaxes: taxTemplates.filter(t => t.type_tax_use === 'sale'),
          purchaseTaxes: taxTemplates.filter(t => t.type_tax_use === 'purchase')
        },
        isLoading: false
      });
    } catch (error) {
      this._setState({ isLoading: false });
    }
  }

  async generateTaxes() {
    if (!this.state.chartOfAccounts.chartTemplate) {
      return { success: false, error: 'Chart of accounts must be loaded first' };
    }

    this._setState({ isLoading: true });

    try {
      await this.client.executeKw('account.chart.template', 'try_loading_for_current_company', [
        [this.state.chartOfAccounts.chartTemplate],
        { 'with_tax': true }
      ]);

      const saleTaxes = await this.client.searchRead(
        'account.tax',
        [['type_tax_use', 'in', ['sale', 'all']]],
        ['id', 'name', 'amount', 'type_tax_use', 'tax_group_id']
      );

      const purchaseTaxes = await this.client.searchRead(
        'account.tax',
        [['type_tax_use', 'in', ['purchase', 'all']]],
        ['id', 'name', 'amount', 'type_tax_use', 'tax_group_id']
      );

      this._setState({
        taxes: { saleTaxes, purchaseTaxes, taxTemplateMapping: [] },
        isLoading: false
      });

      return { success: true };
    } catch (error) {
      this._setState({ isLoading: false, errors: { general: error.message } });
      return { success: false, error: error.message };
    }
  }

  addFiscalPosition(position) {
    this.state.fiscalPositions.push({
      id: Date.now(),
      name: position.name || '',
      country_id: position.country_id || this.state.country.id,
      auto_apply: position.auto_apply || true,
      tax_ids: [],
      account_ids: []
    });
  }

  removeFiscalPosition(index) {
    this.state.fiscalPositions.splice(index, 1);
  }

  async addBankAccount(accountData) {
    this._setState({ isLoading: true });

    try {
      const partnerId = await this._getMainPartner();
      
      const bankId = await this.client.create('res.partner.bank', {
        acc_number: accountData.acc_number,
        bank_id: accountData.bank_id || null,
        partner_id: partnerId,
        bank_name: accountData.bank_name || '',
        sequence: 10
      });

      this.state.bankAccount = {
        ...accountData,
        partner_id: partnerId,
        id: bankId
      };

      this._setState({ isLoading: false });
      return { success: true, bankId };
    } catch (error) {
      this._setState({ isLoading: false, errors: { general: error.message } });
      return { success: false, error: error.message };
    }
  }

  async _getMainPartner() {
    const companies = await this.client.searchRead('res.company', [], ['partner_id']);
    if (companies.length > 0 && companies[0].partner_id) {
      return companies[0].partner_id[0];
    }
    return null;
  }

  async nextStep() {
    this._clearErrors();
    const validation = this._validateCurrentStep();
    
    if (!validation.valid) {
      this.state.errors = validation.errors;
      return { success: false, errors: validation.errors };
    }

    const { currentStep } = this.state;
    
    if (currentStep === LOCALIZATION_STEPS.BANK_ACCOUNT) {
      return this._executeSetup();
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
    const { currentStep, country, chartOfAccounts } = this.state;
    const errors = {};

    switch (currentStep) {
      case LOCALIZATION_STEPS.COUNTRY_SELECTION:
        if (!country.id) {
          errors.country = 'Please select a country';
        }
        break;

      case LOCALIZATION_STEPS.CHART_OF_ACCOUNTS:
        if (!chartOfAccounts.chartTemplate && chartOfAccounts.existingAccounts.length === 0) {
          errors.chart = 'Please select or generate a chart of accounts';
        }
        break;
    }

    return { valid: Object.keys(errors).length === 0, errors };
  }

  _clearErrors() {
    this.state.errors = {};
  }

  async _executeSetup() {
    this._setState({ isLoading: true });
    
    try {
      this._setState({
        currentStep: LOCALIZATION_STEPS.COMPLETION,
        isLoading: false
      });

      return { 
        success: true,
        config: this.exportConfig()
      };
    } catch (error) {
      this._setState({ isLoading: false, errors: { general: error.message } });
      return { success: false, error: error.message };
    }
  }

  getStepInfo(step) {
    const steps = {
      [LOCALIZATION_STEPS.COUNTRY_SELECTION]: {
        title: 'Country Selection',
        description: 'Select your primary country for localization'
      },
      [LOCALIZATION_STEPS.CHART_OF_ACCOUNTS]: {
        title: 'Chart of Accounts',
        description: 'Select and generate chart of accounts'
      },
      [LOCALIZATION_STEPS.TAX_CONFIGURATION]: {
        title: 'Tax Configuration',
        description: 'Configure tax rates for your country'
      },
      [LOCALIZATION_STEPS.FISCAL_POSITIONS]: {
        title: 'Fiscal Positions',
        description: 'Set up fiscal position mappings'
      },
      [LOCALIZATION_STEPS.BANK_ACCOUNT]: {
        title: 'Bank Account',
        description: 'Add company bank account'
      },
      [LOCALIZATION_STEPS.COMPLETION]: {
        title: 'Complete',
        description: 'Localization setup is complete'
      }
    };
    return steps[step] || {};
  }

  getProgress() {
    const totalSteps = Object.values(LOCALIZATION_STEPS).length;
    return Math.round(((this.state.currentStep - 1) / (totalSteps - 1)) * 100);
  }

  reset() {
    this.state = this._getInitialState();
  }

  exportConfig() {
    return {
      country: this.state.country,
      chartOfAccounts: {
        template: this.state.chartOfAccounts.chartTemplate,
        accountCount: this.state.chartOfAccounts.existingAccounts.length
      },
      taxes: {
        saleTaxCount: this.state.taxes.saleTaxes.length,
        purchaseTaxCount: this.state.taxes.purchaseTaxes.length
      },
      fiscalPositions: this.state.fiscalPositions.map(p => ({ name: p.name })),
      bankAccount: this.state.bankAccount.acc_number ? {
        acc_number: this.state.bankAccount.acc_number,
        bank_name: this.state.bankAccount.bank_name
      } : null,
      completedAt: new Date().toISOString()
    };
  }
}

export default LocalizationWizard;
