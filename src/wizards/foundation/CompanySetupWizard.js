/**
 * Company Setup Wizard
 * Guided setup for company structure, currency, and fiscal year
 */

import { OdooClient } from '../../api/OdooClient.js';

export const COMPANY_STEPS = {
  COMPANY_INFO: 1,
  ADDRESS: 2,
  CURRENCY: 3,
  FISCAL_YEAR: 4,
  COMPANY_SETTINGS: 5,
  COMPLETION: 6
};

export class CompanySetupWizard {
  constructor(client) {
    this.client = client;
    this.state = this._getInitialState();
  }

  _getInitialState() {
    return {
      currentStep: COMPANY_STEPS.COMPANY_INFO,
      company: {
        name: '',
        partner_id: null,
        logo: null,
        website: '',
        phone: '',
        email: '',
        vat: '',
        company_type: 'company'
      },
      address: {
        street: '',
        street2: '',
        city: '',
        state_id: null,
        zip: '',
        country_id: null
      },
      currency: {
        id: null,
        name: '',
        symbol: '',
        rate: 1
      },
      fiscalYear: {
        period: 'annual',
        start_month: 1,
        start_day: 1
      },
      settings: {
        fiscal_year_last_day: 31,
        fiscal_year_last_month: 12,
        transfer_account_id: null,
        expects_chart_of_accounts: true,
        currency_id: null
      },
      countries: [],
      currencies: [],
      states: [],
      errors: {},
      isLoading: false
    };
  }

  async initialize() {
    this._setState({ isLoading: true });
    
    try {
      const [countries, currencies, companies] = await Promise.all([
        this._fetchCountries(),
        this._fetchCurrencies(),
        this._fetchCompanies()
      ]);

      let companyData = this.state.company;
      if (companies.length > 0) {
        companyData = {
          ...companies[0],
          partner_id: companies[0].partner_id?.[0] || null
        };
      }

      this._setState({
        countries,
        currencies,
        company: companyData,
        settings: {
          ...this.state.settings,
          currency_id: companyData.currency_id?.[0] || null
        },
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

  async _fetchCurrencies() {
    return this.client.searchRead('res.currency', [['active', '=', true]], ['id', 'name', 'symbol', 'rate']);
  }

  async _fetchCompanies() {
    return this.client.searchRead('res.company', [], [
      'name', 'partner_id', 'logo', 'website', 'phone', 'email', 
      'vat', 'company_type', 'country_id', 'state_id', 'city',
      'street', 'street2', 'zip', 'currency_id', 'fiscal_year_last_day',
      'fiscal_year_last_month', 'transfer_account_id', 'expects_chart_of_accounts'
    ]);
  }

  _setState(updates) {
    this.state = { ...this.state, ...updates };
  }

  _setField(section, field, value) {
    this.state[section] = { ...this.state[section], [field]: value };
  }

  setCompanyField(field, value) {
    this._setField('company', field, value);
  }

  setAddressField(field, value) {
    this._setField('address', field, value);
  }

  setCurrency(currency) {
    this.state.currency = currency;
    this.state.settings.currency_id = currency.id;
  }

  setFiscalYear(fiscalYear) {
    this.state.fiscalYear = { ...this.state.fiscalYear, ...fiscalYear };
  }

  async setCountry(countryId) {
    this.state.address.country_id = countryId;
    if (countryId) {
      this.state.states = await this.client.searchRead(
        'res.country.state', 
        [['country_id', '=', countryId]], 
        ['id', 'name', 'code']
      );
    } else {
      this.state.states = [];
    }
  }

  async nextStep() {
    this._clearErrors();
    const validation = this._validateCurrentStep();
    
    if (!validation.valid) {
      this.state.errors = validation.errors;
      return { success: false, errors: validation.errors };
    }

    const { currentStep } = this.state;
    
    if (currentStep === COMPANY_STEPS.COMPANY_SETTINGS) {
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
    const { currentStep, company, address, currency } = this.state;
    const errors = {};

    switch (currentStep) {
      case COMPANY_STEPS.COMPANY_INFO:
        if (!company.name || company.name.trim().length < 2) {
          errors.name = 'Company name is required (min 2 characters)';
        }
        if (company.email && !this._isValidEmail(company.email)) {
          errors.email = 'Invalid email format';
        }
        break;

      case COMPANY_STEPS.ADDRESS:
        if (!address.street) {
          errors.street = 'Street address is required';
        }
        if (!address.city) {
          errors.city = 'City is required';
        }
        if (!address.country_id) {
          errors.country_id = 'Country is required';
        }
        break;

      case COMPANY_STEPS.CURRENCY:
        if (!currency.id) {
          errors.currency = 'Currency selection is required';
        }
        break;
    }

    return { valid: Object.keys(errors).length === 0, errors };
  }

  _isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  _clearErrors() {
    this.state.errors = {};
  }

  async _executeSetup() {
    this._setState({ isLoading: true });
    
    try {
      const { company, address, settings } = this.state;
      
      const companyId = await this._createOrUpdateCompany({
        name: company.name,
        website: company.website,
        phone: company.phone,
        email: company.email,
        vat: company.vat,
        company_type: company.company_type,
        country_id: address.country_id,
        state_id: address.state_id,
        street: address.street,
        street2: address.street2,
        city: address.city,
        zip: address.zip,
        currency_id: settings.currency_id,
        fiscal_year_last_day: settings.fiscal_year_last_day,
        fiscal_year_last_month: settings.fiscal_year_last_month,
        transfer_account_id: settings.transfer_account_id,
        expects_chart_of_accounts: settings.expects_chart_of_accounts
      });

      this._setState({
        currentStep: COMPANY_STEPS.COMPLETION,
        isLoading: false,
        companyId
      });

      return { success: true, companyId };
    } catch (error) {
      this._setState({ isLoading: false, errors: { general: error.message } });
      return { success: false, error: error.message };
    }
  }

  async _createOrUpdateCompany(values) {
    const companies = await this.client.searchRead('res.company', []);
    
    if (companies.length > 0) {
      await this.client.write('res.company', [companies[0].id], values);
      return companies[0].id;
    }
    
    return await this.client.create('res.company', [values]);
  }

  getStepInfo(step) {
    const steps = {
      [COMPANY_STEPS.COMPANY_INFO]: {
        title: 'Company Information',
        description: 'Basic company details and identification'
      },
      [COMPANY_STEPS.ADDRESS]: {
        title: 'Address',
        description: 'Company physical address and contact'
      },
      [COMPANY_STEPS.CURRENCY]: {
        title: 'Currency',
        description: 'Primary currency and exchange rate settings'
      },
      [COMPANY_STEPS.FISCAL_YEAR]: {
        title: 'Fiscal Year',
        description: 'Financial year configuration'
      },
      [COMPANY_STEPS.COMPANY_SETTINGS]: {
        title: 'Settings',
        description: 'Final company settings'
      },
      [COMPANY_STEPS.COMPLETION]: {
        title: 'Complete',
        description: 'Company setup is complete'
      }
    };
    return steps[step] || {};
  }

  getProgress() {
    const totalSteps = Object.values(COMPANY_STEPS).length;
    return Math.round(((this.state.currentStep - 1) / (totalSteps - 1)) * 100);
  }

  reset() {
    this.state = this._getInitialState();
  }

  exportConfig() {
    return {
      company: this.state.company,
      address: this.state.address,
      currency: this.state.currency,
      fiscalYear: this.state.fiscalYear,
      settings: this.state.settings,
      completedAt: this.state.currentStep === COMPANY_STEPS.COMPLETION 
        ? new Date().toISOString() 
        : null
    };
  }
}

export default CompanySetupWizard;
