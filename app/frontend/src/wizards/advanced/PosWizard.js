/**
 * POS (Point of Sale) Wizard
 * Guided setup for POS terminals, payment methods, and session management
 */

import { OdooClient } from '../../api/OdooClient.js';

export const POS_STEPS = {
  MODULE_SELECTION: 1,
  HARDWARE_SETUP: 2,
  PAYMENT_METHODS: 3,
  PRICELIST_CONFIG: 4,
  RECEIPT_LAYOUT: 5,
  SESSION_CONFIG: 6,
  EXECUTION: 7,
  COMPLETION: 8
};

export const PAYMENT_INTERFACE_TYPES = {
  CASH: 'cash',
  BANK: 'bank',
  CARD: 'card',
  MIXED: 'mixed'
};

export const SESSION_STATES = {
  OPEN: 'opened',
  CLOSED: 'closed'
};

export class PosWizard {
  constructor(client) {
    this.client = client;
    this.state = this._getInitialState();
  }

  _getInitialState() {
    return {
      currentStep: POS_STEPS.MODULE_SELECTION,
      moduleSelection: {
        install_pos_restaurant: false,
        install_pos_loyalty: false,
        install_pos_gift_card: false
      },
      terminals: [],
      paymentMethods: [
        {
          name: 'Cash',
          journal_id: null,
          interface_type: PAYMENT_INTERFACE_TYPES.CASH,
          is_cash_count: true,
          cash_journal_id: null
        }
      ],
      pricelist: {
        use_pricelist: true,
        default_pricelist_id: null,
        available_pricelists: []
      },
      receipt: {
        receipt_footer: 'Thank you for your business!',
        receipt_header: '',
        invoice_footer: '',
        iface_preprint: false,
        iface_big_scrollbars: false,
        iface_automatic_opening: false
      },
      session: {
        auto_closing: false,
        default_cash_journal_id: null,
        opening_cash_id: null,
        safe_amount: 0,
        max_difference: 10
      },
      existingPricelists: [],
      existingJournals: [],
      errors: {},
      isLoading: false,
      executionResult: null
    };
  }

  async initialize() {
    this._setState({ isLoading: true });

    try {
      const [pricelists, journals] = await Promise.all([
        this._fetchPricelists(),
        this._fetchJournals()
      ]);

      this._setState({
        existingPricelists: pricelists,
        existingJournals: journals,
        isLoading: false
      });

      return { success: true };
    } catch (error) {
      this._setState({ isLoading: false, errors: { general: error.message } });
      return { success: false, error: error.message };
    }
  }

  async _fetchPricelists() {
    return this.client.searchRead('product.pricelist', [], ['id', 'name', 'currency_id']);
  }

  async _fetchJournals() {
    return this.client.searchRead('account.journal', [], [
      'id', 'name', 'code', 'type', 'currency_id', 'default_account_id'
    ]);
  }

  _setState(updates) {
    this.state = { ...this.state, ...updates };
  }

  setModuleSelection(selection) {
    this.state.moduleSelection = { ...this.state.moduleSelection, ...selection };
  }

  addTerminal(terminal) {
    this.state.terminals.push({
      id: `temp_${Date.now()}`,
      ...terminal,
      isNew: true
    });
  }

  updateTerminal(index, terminal) {
    if (index >= 0 && index < this.state.terminals.length) {
      this.state.terminals[index] = {
        ...this.state.terminals[index],
        ...terminal
      };
    }
  }

  removeTerminal(index) {
    this.state.terminals.splice(index, 1);
  }

  addPaymentMethod(method) {
    this.state.paymentMethods.push({
      id: `temp_${Date.now()}`,
      ...method,
      isNew: true
    });
  }

  updatePaymentMethod(index, method) {
    if (index >= 0 && index < this.state.paymentMethods.length) {
      this.state.paymentMethods[index] = {
        ...this.state.paymentMethods[index],
        ...method
      };
    }
  }

  removePaymentMethod(index) {
    if (index > 0) {
      this.state.paymentMethods.splice(index, 1);
    }
  }

  setPricelistConfig(config) {
    this.state.pricelist = { ...this.state.pricelist, ...config };
  }

  setReceiptConfig(config) {
    this.state.receipt = { ...this.state.receipt, ...config };
  }

  setSessionConfig(config) {
    this.state.session = { ...this.state.session, ...config };
  }

  async nextStep() {
    this._clearErrors();
    const validation = this._validateCurrentStep();

    if (!validation.valid) {
      this.state.errors = validation.errors;
      return { success: false, errors: validation.errors };
    }

    const { currentStep } = this.state;

    if (currentStep === POS_STEPS.SESSION_CONFIG) {
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
    const { currentStep, terminals, paymentMethods } = this.state;
    const errors = {};

    switch (currentStep) {
      case POS_STEPS.HARDWARE_SETUP:
        if (terminals.length === 0) {
          errors.terminals = 'At least one POS terminal is required';
        }
        for (let i = 0; i < terminals.length; i++) {
          if (!terminals[i].name) {
            errors[`terminal_${i}`] = `Terminal ${i + 1} requires a name`;
          }
        }
        break;

      case POS_STEPS.PAYMENT_METHODS:
        if (paymentMethods.length === 0) {
          errors.paymentMethods = 'At least one payment method is required';
        }
        break;
    }

    return { valid: Object.keys(errors).length === 0, errors };
  }

  _clearErrors() {
    this.state.errors = {};
  }

  async _executeSetup() {
    this._setState({ isLoading: true, currentStep: POS_STEPS.EXECUTION });

    try {
      const createdPointOfSale = [];
      const createdPaymentMethods = [];

      for (const terminal of this.state.terminals) {
        const posId = await this.client.create('pos.config', [{
          name: terminal.name,
          company_id: this.client.companyId,
          journal_id: terminal.journal_id || null,
          picking_type_id: terminal.picking_type_id || null,
          iface_self_checkout: terminal.iface_self_checkout || false,
          iface_order_transfer: terminal.iface_order_transfer || false,
          iface_splitbill: terminal.iface_splitbill || false,
          active: true
        }]);
        createdPointOfSale.push({ name: terminal.name, id: posId });

        for (const method of this.state.paymentMethods) {
          if (method.journal_id) {
            createdPaymentMethods.push({
              name: method.name,
              pos_id: posId,
              journal_id: method.journal_id
            });
          }
        }
      }

      this._setState({
        currentStep: POS_STEPS.COMPLETION,
        isLoading: false,
        executionResult: {
          terminalsCreated: createdPointOfSale.length,
          paymentMethodsCreated: createdPaymentMethods.length,
          terminals: createdPointOfSale,
          paymentMethods: createdPaymentMethods
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
      [POS_STEPS.MODULE_SELECTION]: {
        title: 'Module Selection',
        description: 'Select POS module options'
      },
      [POS_STEPS.HARDWARE_SETUP]: {
        title: 'Terminal Setup',
        description: 'Configure your POS terminals'
      },
      [POS_STEPS.PAYMENT_METHODS]: {
        title: 'Payments',
        description: 'Set up payment methods and processors'
      },
      [POS_STEPS.PRICELIST_CONFIG]: {
        title: 'Pricing',
        description: 'Configure pricelists for POS'
      },
      [POS_STEPS.RECEIPT_LAYOUT]: {
        title: 'Receipts',
        description: 'Customize receipt header and footer'
      },
      [POS_STEPS.SESSION_CONFIG]: {
        title: 'Sessions',
        description: 'Configure POS session management'
      },
      [POS_STEPS.EXECUTION]: {
        title: 'Creating Setup',
        description: 'Setting up POS in your database'
      },
      [POS_STEPS.COMPLETION]: {
        title: 'Complete',
        description: 'POS setup completed successfully'
      }
    };
    return steps[step] || {};
  }

  getProgress() {
    const totalSteps = Object.values(POS_STEPS).length;
    return Math.round(((this.state.currentStep - 1) / (totalSteps - 1)) * 100);
  }

  getAvailablePricelists() {
    return this.state.existingPricelists;
  }

  getAvailableJournals() {
    return this.state.existingJournals.filter(j =>
      j.type === 'cash' || j.type === 'bank' || j.type === 'sale'
    );
  }

  getCashJournals() {
    return this.state.existingJournals.filter(j => j.type === 'cash');
  }

  reset() {
    this.state = this._getInitialState();
  }

  exportConfig() {
    return {
      moduleSelection: this.state.moduleSelection,
      terminals: this.state.terminals,
      paymentMethods: this.state.paymentMethods,
      pricelist: this.state.pricelist,
      receipt: this.state.receipt,
      session: this.state.session,
      completedAt: this.state.currentStep === POS_STEPS.COMPLETION
        ? new Date().toISOString()
        : null
    };
  }
}

export default PosWizard;
