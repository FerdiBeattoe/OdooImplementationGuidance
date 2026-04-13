/**
 * Purchase Wizard - Vendors, Approval Limits, and Purchase Workflow
 * Phase 5: Core Operations Wizards
 * 
 * Validates inputs before next step, checks cross-domain dependencies
 */


export const PURCHASE_STEPS = {
  VENDOR_SETUP: 1,
  PRODUCT_SUPPLIER_INFO: 2,
  APPROVAL_LIMITS: 3,
  PURCHASE_TERMS: 4,
  CROSS_DOMAIN_LINKS: 5,
  COMPLETION: 6
};

export const DEFAULT_VENDOR_CATEGORIES = [
  { name: 'Raw Materials', active: true },
  { name: 'Packaging', active: true },
  { name: 'Services', active: true },
  { name: 'Equipment', active: true }
];

export class PurchaseWizard {
  constructor(client) {
    this.client = client;
    this.state = this._getInitialState();
    this._crossDomainDependencies = {
      requiresInventory: true,
      warehouseId: null,
      requiresAccountPayable: true,
      expenseAccountId: null
    };
  }

  _getInitialState() {
    return {
      currentStep: PURCHASE_STEPS.VENDOR_SETUP,
      vendors: [],
      vendorCategories: [...DEFAULT_VENDOR_CATEGORIES],
      productSupplierInfo: [],
      approvalLimits: {
        requireApproval: true,
        defaultLimit: 1000,
        currency_id: 1,
        limits: []
      },
      purchaseTerms: {
        default_payment_term: null,
        default_invoice_policy: 'order',
        double_validation: 'never',
        double_validation_amount: '5000',
        grace_period: 30
      },
      existingVendors: [],
      existingPaymentTerms: [],
      existingAccounts: [],
      errors: {},
      warnings: [],
      isLoading: false
    };
  }

  async initialize() {
    this._setState({ isLoading: true });

    try {
      const [vendors, paymentTerms, accounts] = await Promise.all([
        this._fetchVendors(),
        this._fetchPaymentTerms(),
        this._fetchAccounts()
      ]);

      this._setState({
        existingVendors: vendors,
        existingPaymentTerms: paymentTerms,
        existingAccounts: accounts,
        isLoading: false
      });

      return { success: true };
    } catch (error) {
      this._setState({ isLoading: false, errors: { general: error.message } });
      return { success: false, error: error.message };
    }
  }

  async _fetchVendors() {
    if (!this.client) return [];
    return this.client.searchRead(
      'res.partner',
      [['supplier_rank', '>', 0]],
      ['id', 'name', 'email', 'phone', 'street', 'city', 'country_id', 'property_payment_term_id'],
      { limit: 200 }
    );
  }

  async _fetchPaymentTerms() {
    if (!this.client) return [];
    return this.client.searchRead(
      'account.payment.term',
      [],
      ['id', 'name', 'line_ids'],
      { limit: 100 }
    );
  }

  async _fetchAccounts() {
    if (!this.client) return [];
    return this.client.searchRead(
      'account.account',
      [['account_type', '=', 'payable']],
      ['id', 'name', 'code', 'account_type'],
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

  addVendor(vendor) {
    const newVendor = {
      id: `new_${Date.now()}`,
      name: '',
      email: '',
      phone: '',
      street: '',
      city: '',
      country_id: null,
      property_payment_term_id: null,
      active: true,
      is_new: true,
      ...vendor
    };
    this.state.vendors.push(newVendor);
  }

  updateVendor(index, field, value) {
    const vendors = [...this.state.vendors];
    vendors[index] = { ...vendors[index], [field]: value };
    this.state.vendors = vendors;
  }

  removeVendor(index) {
    const vendors = [...this.state.vendors];
    vendors.splice(index, 1);
    this.state.vendors = vendors;
  }

  addVendorCategory() {
    this.state.vendorCategories.push({ name: '', active: true });
  }

  updateVendorCategory(index, field, value) {
    const categories = [...this.state.vendorCategories];
    categories[index] = { ...categories[index], [field]: value };
    this.state.vendorCategories = categories;
  }

  removeVendorCategory(index) {
    if (this.state.vendorCategories.length > 1) {
      const categories = [...this.state.vendorCategories];
      categories.splice(index, 1);
      this.state.vendorCategories = categories;
    }
  }

  addProductSupplier(productId, vendorId, data) {
    const key = `${productId}_${vendorId}`;
    this.state.productSupplierInfo.push({
      id: key,
      product_id: productId,
      partner_id: vendorId,
      min_qty: 1,
      price: 0,
      currency_id: 1,
      delay: 7,
      active: true,
      ...data
    });
  }

  updateProductSupplier(supplierKey, field, value) {
    const index = this.state.productSupplierInfo.findIndex(p => p.id === supplierKey);
    if (index !== -1) {
      this.state.productSupplierInfo[index] = {
        ...this.state.productSupplierInfo[index],
        [field]: value
      };
    }
  }

  removeProductSupplier(supplierKey) {
    this.state.productSupplierInfo = this.state.productSupplierInfo.filter(
      p => p.id !== supplierKey
    );
  }

  setApprovalLimits(limits) {
    this.state.approvalLimits = { ...this.state.approvalLimits, ...limits };
  }

  addApprovalLimit(limit) {
    this.state.approvalLimits.limits.push({
      id: Date.now(),
      amount: 0,
      approver_ids: [],
      ...limit
    });
  }

  updateApprovalLimit(index, field, value) {
    const limits = [...this.state.approvalLimits.limits];
    limits[index] = { ...limits[index], [field]: value };
    this.state.approvalLimits.limits = limits;
  }

  removeApprovalLimit(index) {
    const limits = [...this.state.approvalLimits.limits];
    limits.splice(index, 1);
    this.state.approvalLimits.limits = limits;
  }

  setPurchaseTerms(terms) {
    this.state.purchaseTerms = { ...this.state.purchaseTerms, ...terms };
  }

  setCrossDomainLink(field, value) {
    this._crossDomainDependencies[field] = value;

    if (field === 'requiresInventory' && value) {
      this._addWarning('Purchase orders will use selected warehouse for receipts');
    }
    if (field === 'requiresAccountPayable' && !value) {
      this._addWarning('Account payable configuration is required for purchase workflow');
    }
  }

  _validateCurrentStep() {
    const { currentStep, vendors, approvalLimits, purchaseTerms } = this.state;
    const errors = {};

    switch (currentStep) {
      case PURCHASE_STEPS.VENDOR_SETUP:
        const activeVendors = vendors.filter(v => v.active);
        if (activeVendors.length === 0) {
          errors.vendors = 'At least one active vendor is required';
        }
        for (let i = 0; i < vendors.length; i++) {
          if (vendors[i].active && !vendors[i].name) {
            errors[`vendor_${i}`] = `Vendor ${i + 1} must have a name`;
          }
          if (vendors[i].email && !this._isValidEmail(vendors[i].email)) {
            errors[`vendor_email_${i}`] = `Vendor ${i + 1} has invalid email`;
          }
        }
        break;

      case PURCHASE_STEPS.PRODUCT_SUPPLIER_INFO:
        break;

      case PURCHASE_STEPS.APPROVAL_LIMITS:
        if (approvalLimits.requireApproval) {
          if (approvalLimits.defaultLimit <= 0) {
            errors.defaultLimit = 'Default approval limit must be greater than 0';
          }
          const activeLimits = approvalLimits.limits.filter(l => l.amount > 0);
          if (activeLimits.length > 0) {
            for (let i = 0; i < activeLimits.length; i++) {
              if (activeLimits[i].amount <= 0) {
                errors[`limit_${i}`] = `Approval limit ${i + 1} amount must be positive`;
              }
              if (activeLimits[i].approver_ids.length === 0) {
                errors[`limit_approver_${i}`] = `Approval limit ${i + 1} requires approvers`;
              }
            }
          }
        }
        break;

      case PURCHASE_STEPS.PURCHASE_TERMS:
        if (purchaseTerms.double_validation === 'always' &&
            parseFloat(purchaseTerms.double_validation_amount) <= 0) {
          errors.double_validation_amount = 'Double validation amount must be positive';
        }
        if (purchaseTerms.grace_period < 0) {
          errors.grace_period = 'Grace period cannot be negative';
        }
        break;

      case PURCHASE_STEPS.CROSS_DOMAIN_LINKS:
        if (this._crossDomainDependencies.requiresAccountPayable) {
          if (!this._crossDomainDependencies.expenseAccountId) {
            errors.expenseAccount = 'Expense account is required';
          }
        }
        break;
    }

    return { valid: Object.keys(errors).length === 0, errors };
  }

  _isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async nextStep() {
    this._clearErrors();
    const validation = this._validateCurrentStep();

    if (!validation.valid) {
      this.state.errors = validation.errors;
      return { success: false, errors: validation.errors };
    }

    const { currentStep } = this.state;

    if (currentStep === PURCHASE_STEPS.CROSS_DOMAIN_LINKS) {
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
      const { vendors, vendorCategories, approvalLimits, purchaseTerms } = this.state;

      const createdCategoryIds = await this._createVendorCategories(vendorCategories);
      const createdVendorIds = await this._createVendors(vendors);

      if (approvalLimits.requireApproval) {
        await this._createApprovalWorkflow(approvalLimits);
      }

      this._setState({
        currentStep: PURCHASE_STEPS.COMPLETION,
        isLoading: false,
        createdCategoryIds,
        createdVendorIds
      });

      return {
        success: true,
        createdCategoryIds,
        createdVendorIds,
        config: this.exportConfig()
      };
    } catch (error) {
      this._setState({ isLoading: false, errors: { general: error.message } });
      return { success: false, error: error.message };
    }
  }

  async _createVendorCategories(categories) {
    if (!this.client) return [];
    const categoryIds = [];

    for (const category of categories) {
      if (category.active) {
        const categoryId = await this.client.create('res.partner.category', [{
          name: category.name,
          active: true
        }]);
        categoryIds.push(categoryId);
      }
    }

    return categoryIds;
  }

  async _createVendors(vendors) {
    if (!this.client) return [];
    const vendorIds = [];

    for (const vendor of vendors) {
      if (vendor.active && vendor.is_new) {
        const vendorId = await this.client.create('res.partner', [{
          name: vendor.name,
          email: vendor.email || '',
          phone: vendor.phone || '',
          street: vendor.street || '',
          city: vendor.city || '',
          country_id: vendor.country_id || false,
          supplier_rank: 1,
          property_payment_term_id: vendor.property_payment_term_id || false,
          active: true
        }]);
        vendorIds.push(vendorId);
      } else if (vendor.active && !vendor.is_new) {
        vendorIds.push(vendor.id);
      }
    }

    return vendorIds;
  }

  async _createApprovalWorkflow(limits) {
    if (!this.client) return;
    await this.client.create('purchase.approval.rule', [{
      name: `Purchase Approval (>${limits.defaultLimit})`,
      approval_amount: limits.defaultLimit,
      currency_id: limits.currency_id || 1,
      active: true
    }]);

    for (const limit of limits.limits) {
      if (limit.amount > 0 && limit.approver_ids.length > 0) {
        await this.client.create('purchase.approval.rule', [{
          name: `Purchase Approval (>${limit.amount})`,
          approval_amount: limit.amount,
          currency_id: limits.currency_id || 1,
          approver_ids: [[6, 0, limit.approver_ids]],
          active: true
        }]);
      }
    }
  }

  getStepInfo(step) {
    const steps = {
      [PURCHASE_STEPS.VENDOR_SETUP]: {
        title: 'Vendor Setup',
        description: 'Add and manage vendor information'
      },
      [PURCHASE_STEPS.PRODUCT_SUPPLIER_INFO]: {
        title: 'Product Supplier Info',
        description: 'Link products to suppliers and set pricing'
      },
      [PURCHASE_STEPS.APPROVAL_LIMITS]: {
        title: 'Approval Limits',
        description: 'Set purchase order approval thresholds'
      },
      [PURCHASE_STEPS.PURCHASE_TERMS]: {
        title: 'Purchase Terms',
        description: 'Define payment and receipt terms'
      },
      [PURCHASE_STEPS.CROSS_DOMAIN_LINKS]: {
        title: 'Cross-Domain Links',
        description: 'Connect purchase to inventory and accounts'
      },
      [PURCHASE_STEPS.COMPLETION]: {
        title: 'Complete',
        description: 'Purchase setup is complete'
      }
    };
    return steps[step] || {};
  }

  getProgress() {
    const totalSteps = Object.values(PURCHASE_STEPS).length;
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
      warehouseId: null,
      requiresAccountPayable: true,
      expenseAccountId: null
    };
  }

  exportConfig() {
    return {
      vendors: this.state.vendors.filter(v => v.active),
      vendorCategories: this.state.vendorCategories.filter(c => c.active),
      approvalLimits: this.state.approvalLimits,
      purchaseTerms: this.state.purchaseTerms,
      crossDomainDependencies: this._crossDomainDependencies,
      completedAt: this.state.currentStep === PURCHASE_STEPS.COMPLETION
        ? new Date().toISOString()
        : null
    };
  }
}

export default PurchaseWizard;
