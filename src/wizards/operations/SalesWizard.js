/**
 * Sales Wizard - Quotation Flow, Pricelists, and Sales Configuration
 * Phase 5: Core Operations Wizards
 */

import { OdooClient } from '../../api/OdooClient.js';

export const SALES_STEPS = {
  QUOTATION_SETTINGS: 1,
  PRICELIST_SETUP: 2,
  TERMS_CONDITIONS: 3,
  APPROVAL_WORKFLOWS: 4,
  CROSS_DOMAIN_LINKS: 5,
  COMPLETION: 6
};

export const DEFAULT_PRICELIST_TYPES = [
  { name: 'Public Pricelist', type: 'public', active: true },
  { name: 'Sales Pricelist', type: 'sale', active: true }
];

export const QUOTATION_VALIDITY_OPTIONS = [
  { days: 7, label: '7 days' },
  { days: 14, label: '14 days' },
  { days: 30, label: '30 days' },
  { days: 60, label: '60 days' }
];

export class SalesWizard {
  constructor(client) {
    this.client = client;
    this.state = this._getInitialState();
    this._crossDomainDependencies = {
      requiresInventory: true,
      requiresWarehouse: null,
      warehouseIds: [],
      requiresCRM: true,
      crmTeamIds: [],
      inventoryRouteIds: []
    };
  }

  _getInitialState() {
    return {
      currentStep: SALES_STEPS.QUOTATION_SETTINGS,
      quotationSettings: {
        use_quotation_number: true,
        quotation_prefix: 'QUO',
        default_validity_days: 30,
        require_signature: true,
        require_payment: true,
        minimum_sale_amount: 0,
        default_invoice_policy: 'order',
        deposit_percent: 0,
        auto_invoice: false
      },
      pricelists: [...DEFAULT_PRICELIST_TYPES],
      pricelistItems: [],
      termsConditions: {
        default_terms: '',
        warranty_terms: '',
        return_policy: ''
      },
      approvalWorkflows: {
        requireApproval: false,
        approvalAmount: 5000,
        approverIds: []
      },
      existingPricelists: [],
      existingWarehouses: [],
      existingTeams: [],
      errors: {},
      warnings: [],
      isLoading: false
    };
  }

  async initialize() {
    this._setState({ isLoading: true });

    try {
      const [pricelists, warehouses, teams] = await Promise.all([
        this._fetchPricelists(),
        this._fetchWarehouses(),
        this._fetchCrmTeams()
      ]);

      this._setState({
        existingPricelists: pricelists,
        existingWarehouses: warehouses,
        existingTeams: teams,
        isLoading: false
      });

      return { success: true };
    } catch (error) {
      this._setState({ isLoading: false, errors: { general: error.message } });
      return { success: false, error: error.message };
    }
  }

  async _fetchPricelists() {
    return this.client.searchRead(
      'product.pricelist',
      [],
      ['id', 'name', 'active', 'currency_id', 'pricelist_type'],
      { limit: 100 }
    );
  }

  async _fetchWarehouses() {
    return this.client.searchRead(
      'stock.warehouse',
      [],
      ['id', 'name', 'code', 'partner_id'],
      { limit: 100 }
    );
  }

  async _fetchCrmTeams() {
    return this.client.searchRead(
      'crm.team',
      [],
      ['id', 'name', 'member_ids'],
      { limit: 100 }
    );
  }

  _setState(updates) {
    this.state = { ...this.state, ...updates };
  }

  _clearErrors() {
    this.state.errors = {};
  }

  _addWarning(message) {
    if (!this.state.warnings.includes(message)) {
      this.state.warnings.push(message);
    }
  }

  setQuotationField(field, value) {
    this.state.quotationSettings = { ...this.state.quotationSettings, [field]: value };
  }

  updatePricelist(index, field, value) {
    const pricelists = [...this.state.pricelists];
    pricelists[index] = { ...pricelists[index], [field]: value };
    this.state.pricelists = pricelists;
  }

  addPricelist() {
    this.state.pricelists.push({
      name: `Pricelist ${this.state.pricelists.length + 1}`,
      type: 'sale',
      active: true
    });
  }

  removePricelist(index) {
    if (this.state.pricelists.length > 1) {
      const pricelists = [...this.state.pricelists];
      pricelists.splice(index, 1);
      this.state.pricelists = pricelists;
    } else {
      this.state.errors.pricelists = 'At least one pricelist is required';
    }
  }

  addPricelistItem(pricelistIndex, item) {
    const key = `pricelist_${pricelistIndex}_items`;
    const items = this.state.pricelistItems[key] || [];
    items.push({
      id: Date.now(),
      min_quantity: 1,
      compute_price: 'fixed',
      fixed_price: 0,
      percent_price: 0,
      ...item
    });
    this.state.pricelistItems[key] = items;
  }

  updatePricelistItem(pricelistIndex, itemId, field, value) {
    const key = `pricelist_${pricelistIndex}_items`;
    const items = this.state.pricelistItems[key] || [];
    const index = items.findIndex(i => i.id === itemId);
    if (index !== -1) {
      items[index] = { ...items[index], [field]: value };
      this.state.pricelistItems[key] = items;
    }
  }

  removePricelistItem(pricelistIndex, itemId) {
    const key = `pricelist_${pricelistIndex}_items`;
    const items = this.state.pricelistItems[key] || [];
    this.state.pricelistItems[key] = items.filter(i => i.id !== itemId);
  }

  setTermsConditions(terms) {
    this.state.termsConditions = { ...this.state.termsConditions, ...terms };
  }

  setApprovalWorkflow(workflow) {
    this.state.approvalWorkflows = { ...this.state.approvalWorkflows, ...workflow };
  }

  addApprover(userId) {
    if (!this.state.approvalWorkflows.approverIds.includes(userId)) {
      this.state.approvalWorkflows.approverIds.push(userId);
    }
  }

  removeApprover(userId) {
    const index = this.state.approvalWorkflows.approverIds.indexOf(userId);
    if (index !== -1) {
      this.state.approvalWorkflows.approverIds.splice(index, 1);
    }
  }

  setCrossDomainLink(field, value) {
    this._crossDomainDependencies[field] = value;
    
    if (field === 'requiresWarehouse' && value) {
      this._addWarning('Sales orders will use selected warehouse for delivery');
    }
    if (field === 'requiresCRM' && value) {
      this._addWarning('Sales orders can be linked to CRM teams');
    }
  }

  _validateCurrentStep() {
    const { currentStep, quotationSettings, pricelists, approvalWorkflows } = this.state;
    const errors = {};

    switch (currentStep) {
      case SALES_STEPS.QUOTATION_SETTINGS:
        if (quotationSettings.minimum_sale_amount < 0) {
          errors.minimum_sale_amount = 'Minimum amount cannot be negative';
        }
        if (quotationSettings.deposit_percent < 0 || quotationSettings.deposit_percent > 100) {
          errors.deposit_percent = 'Deposit must be between 0 and 100';
        }
        break;

      case SALES_STEPS.PRICELIST_SETUP:
        if (!pricelists || pricelists.length === 0) {
          errors.pricelists = 'At least one pricelist is required';
        }
        for (let i = 0; i < pricelists.length; i++) {
          if (!pricelists[i].name || pricelists[i].name.trim().length === 0) {
            errors[`pricelist_${i}`] = `Pricelist ${i + 1} must have a name`;
          }
        }
        break;

      case SALES_STEPS.TERMS_CONDITIONS:
        break;

      case SALES_STEPS.APPROVAL_WORKFLOWS:
        if (approvalWorkflows.requireApproval) {
          if (approvalWorkflows.approvalAmount <= 0) {
            errors.approvalAmount = 'Approval amount must be greater than 0';
          }
          if (approvalWorkflows.approverIds.length === 0) {
            errors.approverIds = 'At least one approver is required';
          }
        }
        break;

      case SALES_STEPS.CROSS_DOMAIN_LINKS:
        if (this._crossDomainDependencies.requiresWarehouse) {
          if (!this._crossDomainDependencies.warehouseIds || 
              this._crossDomainDependencies.warehouseIds.length === 0) {
            errors.warehouse = 'At least one warehouse must be selected';
          }
        }
        break;
    }

    return { valid: Object.keys(errors).length === 0, errors };
  }

  async nextStep() {
    this._clearErrors();
    const validation = this._validateCurrentStep();

    if (!validation.valid) {
      this.state.errors = validation.errors;
      return { success: false, errors: validation.errors };
    }

    const { currentStep } = this.state;

    if (currentStep === SALES_STEPS.CROSS_DOMAIN_LINKS) {
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

  async _executeSetup() {
    this._setState({ isLoading: true });

    try {
      const { quotationSettings, pricelists, termsConditions, approvalWorkflows } = this.state;

      const createdPricelistIds = await this._createPricelists(pricelists);

      if (approvalWorkflows.requireApproval) {
        await this._createApprovalWorkflow(approvalWorkflows);
      }

      this._setState({
        currentStep: SALES_STEPS.COMPLETION,
        isLoading: false,
        createdPricelistIds
      });

      return {
        success: true,
        createdPricelistIds,
        config: this.exportConfig()
      };
    } catch (error) {
      this._setState({ isLoading: false, errors: { general: error.message } });
      return { success: false, error: error.message };
    }
  }

  async _createPricelists(pricelists) {
    const pricelistIds = [];

    for (const pricelist of pricelists) {
      const pricelistId = await this.client.create('product.pricelist', [{
        name: pricelist.name,
        active: pricelist.active,
        currency_id: pricelist.currency_id || 1,
        pricelist_type: pricelist.type || 'sale'
      }]);
      pricelistIds.push(pricelistId);
    }

    return pricelistIds;
  }

  async _createApprovalWorkflow(workflow) {
    const groupData = {
      name: 'Sales Approval Group',
      implied_ids: [[4, await this._getGroupId('sales_team.group_sale_manager')]],
      users: [[6, 0, workflow.approverIds]]
    };

    const groupId = await this.client.create('res.groups', [groupData]);

    await this.client.create('sale.approval.rule', [{
      name: `Sales Approval (>${workflow.approvalAmount})`,
      approval_amount: workflow.approvalAmount,
      approval_group_id: groupId,
      active: true
    }]);

    return groupId;
  }

  async _getGroupId(groupXmlId) {
    const groups = await this.client.searchRead(
      'res.groups',
      [['xml_id', '=', groupXmlId]],
      ['id']
    );
    return groups.length > 0 ? groups[0].id : 1;
  }

  getStepInfo(step) {
    const steps = {
      [SALES_STEPS.QUOTATION_SETTINGS]: {
        title: 'Quotation Settings',
        description: 'Configure quotation numbering, validity, and defaults'
      },
      [SALES_STEPS.PRICELIST_SETUP]: {
        title: 'Pricelist Setup',
        description: 'Set up product pricelists and pricing rules'
      },
      [SALES_STEPS.TERMS_CONDITIONS]: {
        title: 'Terms & Conditions',
        description: 'Define default terms, warranties, and policies'
      },
      [SALES_STEPS.APPROVAL_WORKFLOWS]: {
        title: 'Approval Workflows',
        description: 'Set up order approval rules'
      },
      [SALES_STEPS.CROSS_DOMAIN_LINKS]: {
        title: 'Cross-Domain Links',
        description: 'Connect sales to inventory and CRM'
      },
      [SALES_STEPS.COMPLETION]: {
        title: 'Complete',
        description: 'Sales setup is complete'
      }
    };
    return steps[step] || {};
  }

  getProgress() {
    const totalSteps = Object.values(SALES_STEPS).length;
    return Math.round(((this.state.currentStep - 1) / (totalSteps - 1)) * 100);
  }

  getCrossDomainDependencies() {
    return this._crossDomainDependencies;
  }

  getWarnings() {
    return this.state.warnings;
  }

  reset() {
    this.state = this._getInitialState();
    this._crossDomainDependencies = {
      requiresInventory: true,
      requiresWarehouse: null,
      warehouseIds: [],
      requiresCRM: true,
      crmTeamIds: [],
      inventoryRouteIds: []
    };
  }

  exportConfig() {
    return {
      quotationSettings: this.state.quotationSettings,
      pricelists: this.state.pricelists.filter(p => p.active),
      termsConditions: this.state.termsConditions,
      approvalWorkflows: this.state.approvalWorkflows,
      crossDomainDependencies: this._crossDomainDependencies,
      completedAt: this.state.currentStep === SALES_STEPS.COMPLETION
        ? new Date().toISOString()
        : null
    };
  }
}

export default SalesWizard;
