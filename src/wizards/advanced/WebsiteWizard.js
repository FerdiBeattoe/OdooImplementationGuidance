/**
 * Website/eCommerce Wizard
 * Guided setup for online shop, payment, and shipping configuration
 */

import { OdooClient } from '../../api/OdooClient.js';

export const WEBSITE_STEPS = {
  MODULE_SELECTION: 1,
  SHOP_CONFIG: 2,
  PAYMENT_PROVIDERS: 3,
  SHIPPING_METHODS: 4,
  PRODUCT_SETTINGS: 5,
  SEO_CONFIG: 6,
  EXECUTION: 7,
  COMPLETION: 8
};

export const DELIVERY_TYPES = {
  FIXED: 'fixed',
  BASE_ON_RULE: 'base_on_rule',
  ROUTE_BASED: 'route'
};

export class WebsiteWizard {
  constructor(client) {
    this.client = client;
    this.state = this._getInitialState();
  }

  _getInitialState() {
    return {
      currentStep: WEBSITE_STEPS.MODULE_SELECTION,
      moduleSelection: {
        install_ecommerce: true,
        install_delivery: false,
        install_google_analytics: false,
        install_social_marketing: false
      },
      shopConfig: {
        website_name: '',
        website_domain: '',
        company_id: null,
        pricelist_id: null,
        default_pricelist: 'public',
        cart_recovery_emails: true,
        cart_abandoned_delay: 1,
        add_to_cart_action: 'go_to_cart'
      },
      paymentProviders: [],
      shippingMethods: [
        {
          name: 'Standard Shipping',
          delivery_type: DELIVERY_TYPES.FIXED,
          fixed_price: 10,
          estimated_days: '3-5',
          active: true
        }
      ],
      productSettings: {
        allow_out_of_stock: false,
        notify_customer: true,
        invoice_policy: 'order',
        invoice_onDelivery: false,
        self_pickup: true
      },
      seoConfig: {
        website_public: true,
        channel_ids: [],
        default_lang_id: null,
        social_share: true
      },
      existingPricelists: [],
      existingDeliveryCarriers: [],
      errors: {},
      isLoading: false,
      executionResult: null
    };
  }

  async initialize() {
    this._setState({ isLoading: true });

    try {
      const [pricelists, carriers] = await Promise.all([
        this._fetchPricelists(),
        this._fetchDeliveryCarriers()
      ]);

      this._setState({
        existingPricelists: pricelists,
        existingDeliveryCarriers: carriers,
        isLoading: false
      });

      return { success: true };
    } catch (error) {
      this._setState({ isLoading: false, errors: { general: error.message } });
      return { success: false, error: error.message };
    }
  }

  async _fetchPricelists() {
    return this.client.searchRead('product.pricelist', [], ['id', 'name', 'currency_id', 'active']);
  }

  async _fetchDeliveryCarriers() {
    try {
      return await this.client.searchRead('delivery.carrier', [], [
        'id', 'name', 'delivery_type', 'product_id', 'active'
      ]);
    } catch {
      return [];
    }
  }

  _setState(updates) {
    this.state = { ...this.state, ...updates };
  }

  setModuleSelection(selection) {
    this.state.moduleSelection = { ...this.state.moduleSelection, ...selection };
  }

  setShopConfig(config) {
    this.state.shopConfig = { ...this.state.shopConfig, ...config };
  }

  addPaymentProvider(provider) {
    this.state.paymentProviders.push({
      id: `temp_${Date.now()}`,
      ...provider,
      isNew: true
    });
  }

  updatePaymentProvider(index, provider) {
    if (index >= 0 && index < this.state.paymentProviders.length) {
      this.state.paymentProviders[index] = {
        ...this.state.paymentProviders[index],
        ...provider
      };
    }
  }

  removePaymentProvider(index) {
    this.state.paymentProviders.splice(index, 1);
  }

  addShippingMethod(method) {
    this.state.shippingMethods.push({
      id: `temp_${Date.now()}`,
      ...method,
      isNew: true
    });
  }

  updateShippingMethod(index, method) {
    if (index >= 0 && index < this.state.shippingMethods.length) {
      this.state.shippingMethods[index] = {
        ...this.state.shippingMethods[index],
        ...method
      };
    }
  }

  removeShippingMethod(index) {
    this.state.shippingMethods.splice(index, 1);
  }

  setProductSettings(settings) {
    this.state.productSettings = { ...this.state.productSettings, ...settings };
  }

  setSeoConfig(config) {
    this.state.seoConfig = { ...this.state.seoConfig, ...config };
  }

  async nextStep() {
    this._clearErrors();
    const validation = this._validateCurrentStep();

    if (!validation.valid) {
      this.state.errors = validation.errors;
      return { success: false, errors: validation.errors };
    }

    const { currentStep } = this.state;

    if (currentStep === WEBSITE_STEPS.SEO_CONFIG) {
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
    const { currentStep, shopConfig } = this.state;
    const errors = {};

    switch (currentStep) {
      case WEBSITE_STEPS.SHOP_CONFIG:
        if (!shopConfig.website_name) {
          errors.website_name = 'Website name is required';
        }
        break;
    }

    return { valid: Object.keys(errors).length === 0, errors };
  }

  _clearErrors() {
    this.state.errors = {};
  }

  async _executeSetup() {
    this._setState({ isLoading: true, currentStep: WEBSITE_STEPS.EXECUTION });

    try {
      const createdShippingMethods = [];

      for (const method of this.state.shippingMethods) {
        const productId = await this.client.create('product.product', [{
          name: `Shipping - ${method.name}`,
          type: 'service',
          list_price: method.fixed_price || 0,
          active: method.active !== false,
          company_id: this.client.companyId
        }]);

        const carrierId = await this.client.create('delivery.carrier', [{
          name: method.name,
          delivery_type: method.delivery_type || DELIVERY_TYPES.FIXED,
          product_id: productId,
          fixed_price: method.fixed_price || 0,
          active: method.active !== false,
          company_id: this.client.companyId
        }]);

        createdShippingMethods.push({ name: method.name, id: carrierId });
      }

      this._setState({
        currentStep: WEBSITE_STEPS.COMPLETION,
        isLoading: false,
        executionResult: {
          shippingMethodsCreated: createdShippingMethods.length,
          shippingMethods: createdShippingMethods
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
      [WEBSITE_STEPS.MODULE_SELECTION]: {
        title: 'Module Selection',
        description: 'Select eCommerce modules to enable'
      },
      [WEBSITE_STEPS.SHOP_CONFIG]: {
        title: 'Shop Setup',
        description: 'Configure your online shop basic settings'
      },
      [WEBSITE_STEPS.PAYMENT_PROVIDERS]: {
        title: 'Payments',
        description: 'Set up payment providers'
      },
      [WEBSITE_STEPS.SHIPPING_METHODS]: {
        title: 'Shipping',
        description: 'Configure shipping methods and carriers'
      },
      [WEBSITE_STEPS.PRODUCT_SETTINGS]: {
        title: 'Products',
        description: 'Set default product settings'
      },
      [WEBSITE_STEPS.SEO_CONFIG]: {
        title: 'SEO & Social',
        description: 'Configure SEO and social sharing'
      },
      [WEBSITE_STEPS.EXECUTION]: {
        title: 'Creating Setup',
        description: 'Setting up eCommerce in your database'
      },
      [WEBSITE_STEPS.COMPLETION]: {
        title: 'Complete',
        description: 'eCommerce setup completed successfully'
      }
    };
    return steps[step] || {};
  }

  getProgress() {
    const totalSteps = Object.values(WEBSITE_STEPS).length;
    return Math.round(((this.state.currentStep - 1) / (totalSteps - 1)) * 100);
  }

  getAvailablePricelists() {
    return this.state.existingPricelists;
  }

  getDeliveryTypeOptions() {
    return [
      { value: DELIVERY_TYPES.FIXED, label: 'Fixed Price' },
      { value: DELIVERY_TYPES.BASE_ON_RULE, label: 'Based on Rules' },
      { value: DELIVERY_TYPES.ROUTE_BASED, label: 'Route Based' }
    ];
  }

  reset() {
    this.state = this._getInitialState();
  }

  exportConfig() {
    return {
      moduleSelection: this.state.moduleSelection,
      shopConfig: this.state.shopConfig,
      paymentProviders: this.state.paymentProviders,
      shippingMethods: this.state.shippingMethods,
      productSettings: this.state.productSettings,
      seoConfig: this.state.seoConfig,
      completedAt: this.state.currentStep === WEBSITE_STEPS.COMPLETION
        ? new Date().toISOString()
        : null
    };
  }
}

export default WebsiteWizard;
