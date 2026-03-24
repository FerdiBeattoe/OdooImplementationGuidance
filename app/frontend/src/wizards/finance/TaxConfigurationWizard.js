/**
 * Tax Configuration Wizard
 * Guided setup for tax rules, fiscal positions, and tax groups
 * Supports country-specific tax regulations following Odoo's official structure
 */

import { OdooClient } from '../../api/OdooClient.js';

export const TAX_STEPS = {
  COUNTRY_SELECTION: 1,
  TAX_STRUCTURE: 2,
  TAX_CODES: 3,
  FISCAL_POSITIONS: 4,
  TAX_MAPPING: 5,
  EXECUTION: 6,
  COMPLETION: 7
};

export const TAX_TYPES = {
  SALE: 'sale',
  PURCHASE: 'purchase',
  NONE: 'none'
};

export const TAX_AMOUNT_TYPES = {
  PERCENT: 'percent',
  FIXED: 'fixed',
  DIVISION: 'division',
  GROUP: 'group'
};

export class TaxConfigurationWizard {
  constructor(client) {
    this.client = client;
    this.state = this._getInitialState();
  }

  _getInitialState() {
    return {
      currentStep: TAX_STEPS.COUNTRY_SELECTION,
      selectedCountry: null,
      selectedCountryCode: null,
      taxStructure: {
        has_multiple_vat: false,
        has_reduced_vat: false,
        has_zero_rated: false,
        has_exempt: false,
        has_import_duties: false,
        default_tax_type: TAX_TYPES.SALE
      },
      taxes: [],
      taxGroups: [],
      fiscalPositions: [],
      countryTaxRates: null,
      countries: [],
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
    return this.client.searchRead('res.country', [], ['id', 'name', 'code'], { limit: 300 });
  }

  _setState(updates) {
    this.state = { ...this.state, ...updates };
  }

  async selectCountry(countryId, countryCode) {
    this.state.selectedCountry = { id: countryId, code: countryCode };
    this.state.selectedCountryCode = countryCode;

    const taxRates = this._getCountryTaxRates(countryCode);
    this.state.countryTaxRates = taxRates;
    this.state.taxes = this._generateDefaultTaxes(countryCode, taxRates);
  }

  _getCountryTaxRates(countryCode) {
    const taxDatabase = {
      US: { standard: 0, reduced: 0, zero: 0, exempt: 0 },
      GB: { standard: 20, reduced: 5, zero: 0, exempt: 0 },
      DE: { standard: 19, reduced: 7, zero: 0, exempt: 0 },
      FR: { standard: 20, reduced: 5.5, zero: 0, exempt: 0 },
      ES: { standard: 21, reduced: 10, zero: 4, exempt: 0 },
      IT: { standard: 22, reduced: 10, zero: 4, exempt: 0 },
      NL: { standard: 21, reduced: 9, zero: 0, exempt: 0 },
      BE: { standard: 21, reduced: 12, zero: 0, exempt: 0 },
      PT: { standard: 23, reduced: 13, zero: 6, exempt: 0 },
      PL: { standard: 23, reduced: 8, zero: 5, exempt: 0 },
      SE: { standard: 25, reduced: 12, zero: 6, exempt: 0 },
      NO: { standard: 25, reduced: 15, zero: 0, exempt: 0 },
      DK: { standard: 25, reduced: 0, zero: 0, exempt: 0 },
      FI: { standard: 24, reduced: 14, zero: 0, exempt: 0 },
      AT: { standard: 20, reduced: 10, zero: 0, exempt: 0 },
      CH: { standard: 8.1, reduced: 2.6, zero: 0, exempt: 0 },
      AU: { standard: 10, reduced: 0, zero: 0, exempt: 0 },
      NZ: { standard: 15, reduced: 0, zero: 0, exempt: 0 },
      CA: { standard: 5, reduced: 0, zero: 0, exempt: 0, has_provincial: true },
      MX: { standard: 16, reduced: 8, zero: 0, exempt: 0 },
      BR: { standard: 10, reduced: 7, zero: 0, exempt: 0, has_icms: true },
      ZA: { standard: 15, reduced: 5, zero: 0, exempt: 0 },
      IN: { standard: 18, reduced: 12, zero: 5, exempt: 0, has_igst: true },
      JP: { standard: 10, reduced: 8, zero: 0, exempt: 0 },
      CN: { standard: 13, reduced: 9, zero: 0, exempt: 0 }
    };

    return taxDatabase[countryCode] || { standard: 20, reduced: 10, zero: 0, exempt: 0 };
  }

  _generateDefaultTaxes(countryCode, taxRates) {
    const taxes = [];

    if (taxRates.standard > 0) {
      taxes.push({
        name: `VAT ${taxRates.standard}%`,
        amount: taxRates.standard,
        amount_type: TAX_AMOUNT_TYPES.PERCENT,
        type_tax_use: TAX_TYPES.SALE,
        description: `Standard rate VAT ${taxRates.standard}%`,
        active: true
      });
      taxes.push({
        name: `Purchase VAT ${taxRates.standard}%`,
        amount: taxRates.standard,
        amount_type: TAX_AMOUNT_TYPES.PERCENT,
        type_tax_use: TAX_TYPES.PURCHASE,
        description: `Standard rate Purchase VAT ${taxRates.standard}%`,
        active: true
      });
    }

    if (taxRates.reduced > 0) {
      taxes.push({
        name: `Reduced VAT ${taxRates.reduced}%`,
        amount: taxRates.reduced,
        amount_type: TAX_AMOUNT_TYPES.PERCENT,
        type_tax_use: TAX_TYPES.SALE,
        description: `Reduced rate VAT ${taxRates.reduced}%`,
        active: true
      });
      taxes.push({
        name: `Purchase Reduced VAT ${taxRates.reduced}%`,
        amount: taxRates.reduced,
        amount_type: TAX_AMOUNT_TYPES.PERCENT,
        type_tax_use: TAX_TYPES.PURCHASE,
        description: `Reduced rate Purchase VAT ${taxRates.reduced}%`,
        active: true
      });
    }

    if (taxRates.zero > 0) {
      taxes.push({
        name: 'Zero Rate VAT 0%',
        amount: 0,
        amount_type: TAX_AMOUNT_TYPES.PERCENT,
        type_tax_use: TAX_TYPES.SALE,
        description: 'Zero rate VAT 0%',
        active: true
      });
    }

    if (taxRates.exempt > 0) {
      taxes.push({
        name: 'Exempt VAT',
        amount: 0,
        amount_type: TAX_AMOUNT_TYPES.PERCENT,
        type_tax_use: TAX_TYPES.SALE,
        description: 'Exempt VAT (0% with exemption)',
        active: true
      });
    }

    return taxes;
  }

  setTaxStructure(structure) {
    this.state.taxStructure = { ...this.state.taxStructure, ...structure };
  }

  addTax(tax) {
    this.state.taxes.push(tax);
  }

  updateTax(index, tax) {
    if (index >= 0 && index < this.state.taxes.length) {
      this.state.taxes[index] = { ...this.state.taxes[index], ...tax };
    }
  }

  removeTax(index) {
    this.state.taxes.splice(index, 1);
  }

  addFiscalPosition(position) {
    this.state.fiscalPositions.push(position);
  }

  updateFiscalPosition(index, position) {
    if (index >= 0 && index < this.state.fiscalPositions.length) {
      this.state.fiscalPositions[index] = { ...this.state.fiscalPositions[index], ...position };
    }
  }

  removeFiscalPosition(index) {
    this.state.fiscalPositions.splice(index, 1);
  }

  async nextStep() {
    this._clearErrors();
    const validation = this._validateCurrentStep();

    if (!validation.valid) {
      this.state.errors = validation.errors;
      return { success: false, errors: validation.errors };
    }

    const { currentStep } = this.state;

    if (currentStep === TAX_STEPS.TAX_MAPPING) {
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
    const { currentStep, selectedCountry, taxes } = this.state;
    const errors = {};

    switch (currentStep) {
      case TAX_STEPS.COUNTRY_SELECTION:
        if (!selectedCountry) {
          errors.country = 'Please select a country for tax configuration';
        }
        break;

      case TAX_STEPS.TAX_CODES:
        if (taxes.length === 0) {
          errors.taxes = 'At least one tax rate is required';
        }
        break;
    }

    return { valid: Object.keys(errors).length === 0, errors };
  }

  _clearErrors() {
    this.state.errors = {};
  }

  async _executeSetup() {
    this._setState({ isLoading: true, currentStep: TAX_STEPS.EXECUTION });

    try {
      const createdTaxes = [];
      const createdGroups = [];
      const createdFiscalPositions = [];

      for (const tax of this.state.taxes) {
        const taxId = await this.client.create('account.tax', [{
          name: tax.name,
          amount: tax.amount,
          amount_type: tax.amount_type,
          type_tax_use: tax.type_tax_use,
          description: tax.description || '',
          active: tax.active !== false,
          company_id: this.client.companyId,
          tax_group_id: tax.tax_group_id || null
        }]);
        createdTaxes.push({ name: tax.name, amount: tax.amount, id: taxId });
      }

      for (const position of this.state.fiscalPositions) {
        const positionId = await this.client.create('account.fiscal.position', [{
          name: position.name,
          country_id: position.country_id || null,
          auto_apply: position.auto_apply || false,
          vat_required: position.vat_required || false
        }]);
        createdFiscalPositions.push({ name: position.name, id: positionId });
      }

      this._setState({
        currentStep: TAX_STEPS.COMPLETION,
        isLoading: false,
        executionResult: {
          taxesCreated: createdTaxes.length,
          groupsCreated: createdGroups.length,
          fiscalPositionsCreated: createdFiscalPositions.length,
          taxes: createdTaxes,
          fiscalPositions: createdFiscalPositions
        }
      });

      return { success: true };
    } catch (error) {
      this._setState({
        isLoading: false,
        errors: { general: error.message }
      });
      return { success: false, error: error.message };
    }
  }

  getStepInfo(step) {
    const steps = {
      [TAX_STEPS.COUNTRY_SELECTION]: {
        title: 'Select Country',
        description: 'Choose the country for your tax configuration'
      },
      [TAX_STEPS.TAX_STRUCTURE]: {
        title: 'Tax Structure',
        description: 'Define your tax structure requirements'
      },
      [TAX_STEPS.TAX_CODES]: {
        title: 'Tax Rates',
        description: 'Configure tax rates and codes'
      },
      [TAX_STEPS.FISCAL_POSITIONS]: {
        title: 'Fiscal Positions',
        description: 'Set up fiscal positions for multi-country transactions'
      },
      [TAX_STEPS.TAX_MAPPING]: {
        title: 'Review & Execute',
        description: 'Review tax mapping and execute setup'
      },
      [TAX_STEPS.EXECUTION]: {
        title: 'Creating Taxes',
        description: 'Setting up taxes in your database'
      },
      [TAX_STEPS.COMPLETION]: {
        title: 'Complete',
        description: 'Tax configuration completed'
      }
    };
    return steps[step] || {};
  }

  getProgress() {
    const totalSteps = Object.values(TAX_STEPS).length;
    return Math.round(((this.state.currentStep - 1) / (totalSteps - 1)) * 100);
  }

  getCountryTaxPreview() {
    const { selectedCountryCode, countryTaxRates } = this.state;
    if (!countryTaxRates) return null;

    return {
      country: selectedCountryCode,
      rates: countryTaxRates,
      suggestedTaxes: this.state.taxes.length
    };
  }

  reset() {
    this.state = this._getInitialState();
  }

  exportConfig() {
    return {
      selectedCountry: this.state.selectedCountry,
      taxStructure: this.state.taxStructure,
      taxes: this.state.taxes,
      fiscalPositions: this.state.fiscalPositions,
      completedAt: this.state.currentStep === TAX_STEPS.COMPLETION
        ? new Date().toISOString()
        : null
    };
  }
}

export default TaxConfigurationWizard;
