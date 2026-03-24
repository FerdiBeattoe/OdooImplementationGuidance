/**
 * Bank Setup Wizard
 * Guided setup for bank accounts, payment methods, and bank feeds
 */

import { OdooClient } from '../../api/OdooClient.js';

export const BANK_STEPS = {
  BANK_ACCOUNTS: 1,
  PAYMENT_METHODS: 2,
  BANK_FEEDS: 3,
  RECONCILIATION: 4,
  EXECUTION: 5,
  COMPLETION: 6
};

export const PAYMENT_TYPES = {
  MANUAL: 'manual',
  AUTOMATIC: 'automatic',
  BANK_TRANSFER: 'bank_transfer'
};

export const JOURNAL_TYPES = {
  BANK: 'bank',
  CASH: 'cash',
  CREDIT: 'credit'
};

export class BankSetupWizard {
  constructor(client) {
    this.client = client;
    this.state = this._getInitialState();
  }

  _getInitialState() {
    return {
      currentStep: BANK_STEPS.BANK_ACCOUNTS,
      bankAccounts: [],
      paymentMethods: [],
      selectedBankId: null,
      banks: [],
      journals: [],
      accounts: [],
      errors: {},
      isLoading: false,
      executionResult: null
    };
  }

  async initialize() {
    this._setState({ isLoading: true });

    try {
      const [banks, journals, accounts] = await Promise.all([
        this._fetchBanks(),
        this._fetchJournals(),
        this._fetchAccounts()
      ]);

      this._setState({
        banks,
        journals,
        accounts,
        isLoading: false
      });

      return { success: true };
    } catch (error) {
      this._setState({ isLoading: false, errors: { general: error.message } });
      return { success: false, error: error.message };
    }
  }

  async _fetchBanks() {
    return this.client.searchRead('res.bank', [], ['id', 'name', 'bic', 'code', 'country']);
  }

  async _fetchJournals() {
    return this.client.searchRead('account.journal', [], [
      'id', 'name', 'code', 'type', 'bank_account_id',
      'default_account_id', 'currency_id', 'active'
    ]);
  }

  async _fetchAccounts() {
    return this.client.searchRead('account.account', [], [
      'id', 'code', 'name', 'user_type_id', 'reconcile'
    ]);
  }

  _setState(updates) {
    this.state = { ...this.state, ...updates };
  }

  addBankAccount(account) {
    this.state.bankAccounts.push({
      id: `temp_${Date.now()}`,
      ...account,
      isNew: true
    });
  }

  updateBankAccount(index, account) {
    if (index >= 0 && index < this.state.bankAccounts.length) {
      this.state.bankAccounts[index] = {
        ...this.state.bankAccounts[index],
        ...account
      };
    }
  }

  removeBankAccount(index) {
    this.state.bankAccounts.splice(index, 1);
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
    this.state.paymentMethods.splice(index, 1);
  }

  async nextStep() {
    this._clearErrors();
    const validation = this._validateCurrentStep();

    if (!validation.valid) {
      this.state.errors = validation.errors;
      return { success: false, errors: validation.errors };
    }

    const { currentStep } = this.state;

    if (currentStep === BANK_STEPS.RECONCILIATION) {
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
    const { currentStep, bankAccounts, paymentMethods } = this.state;
    const errors = {};

    switch (currentStep) {
      case BANK_STEPS.BANK_ACCOUNTS:
        if (bankAccounts.length === 0) {
          errors.bankAccounts = 'At least one bank account is required';
        }
        for (let i = 0; i < bankAccounts.length; i++) {
          const acc = bankAccounts[i];
          if (!acc.name) {
            errors[`bank_${i}`] = `Bank account ${i + 1} requires a name`;
          }
          if (!acc.currency_id) {
            errors[`bank_currency_${i}`] = `Bank account ${i + 1} requires a currency`;
          }
        }
        break;

      case BANK_STEPS.PAYMENT_METHODS:
        for (let i = 0; i < paymentMethods.length; i++) {
          const method = paymentMethods[i];
          if (!method.name) {
            errors[`method_${i}`] = `Payment method ${i + 1} requires a name`;
          }
          if (!method.journal_id) {
            errors[`method_journal_${i}`] = `Payment method ${i + 1} requires a journal`;
          }
        }
        break;
    }

    return { valid: Object.keys(errors).length === 0, errors };
  }

  _clearErrors() {
    this.state.errors = {};
  }

  async _executeSetup() {
    this._setState({ isLoading: true, currentStep: BANK_STEPS.EXECUTION });

    try {
      const createdAccounts = [];
      const createdJournals = [];
      const createdPaymentMethods = [];

      for (const bankAcc of this.state.bankAccounts) {
        const accountId = await this.client.create('account.account', [{
          name: bankAcc.name,
          code: bankAcc.code || `BNK${Date.now()}`,
          user_type_id: bankAcc.user_type_id || 'account.data_account_type_liquidity',
          reconcile: true,
          currency_id: bankAcc.currency_id || null,
          company_id: this.client.companyId
        }]);
        createdAccounts.push({ name: bankAcc.name, id: accountId });

        const partnerBankId = await this.client.create('res.partner.bank', [{
          acc_number: bankAcc.acc_number || bankAcc.account_number || '',
          bank_id: bankAcc.bank_id || null,
          partner_id: this.client.partnerId,
          company_id: this.client.companyId
        }]);

        const journalId = await this.client.create('account.journal', [{
          name: bankAcc.name,
          code: bankAcc.code?.slice(0, 5) || 'BNK',
          type: 'bank',
          default_account_id: accountId,
          bank_account_id: partnerBankId,
          currency_id: bankAcc.currency_id || null,
          active: true,
          company_id: this.client.companyId
        }]);
        createdJournals.push({ name: bankAcc.name, id: journalId });
      }

      for (const method of this.state.paymentMethods) {
        const journal = createdJournals.find(j => j.name === method.journal_name);
        if (journal) {
          createdPaymentMethods.push({
            name: method.name,
            journal_id: journal.id
          });
        }
      }

      this._setState({
        currentStep: BANK_STEPS.COMPLETION,
        isLoading: false,
        executionResult: {
          accountsCreated: createdAccounts.length,
          journalsCreated: createdJournals.length,
          paymentMethodsCreated: createdPaymentMethods.length,
          accounts: createdAccounts,
          journals: createdJournals,
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
      [BANK_STEPS.BANK_ACCOUNTS]: {
        title: 'Bank Accounts',
        description: 'Add your company bank accounts'
      },
      [BANK_STEPS.PAYMENT_METHODS]: {
        title: 'Payment Methods',
        description: 'Configure payment methods and processors'
      },
      [BANK_STEPS.BANK_FEEDS]: {
        title: 'Bank Feeds',
        description: 'Set up automatic bank feed integration'
      },
      [BANK_STEPS.RECONCILIATION]: {
        title: 'Reconciliation',
        description: 'Configure automatic reconciliation rules'
      },
      [BANK_STEPS.EXECUTION]: {
        title: 'Creating Setup',
        description: 'Setting up bank accounts and payment methods'
      },
      [BANK_STEPS.COMPLETION]: {
        title: 'Complete',
        description: 'Bank setup completed successfully'
      }
    };
    return steps[step] || {};
  }

  getProgress() {
    const totalSteps = Object.values(BANK_STEPS).length;
    return Math.round(((this.state.currentStep - 1) / (totalSteps - 1)) * 100);
  }

  getAvailableBanks() {
    return this.state.banks;
  }

  getAvailableJournals() {
    return this.state.journals;
  }

  getAvailableAccounts() {
    return this.state.accounts.filter(acc =>
      acc.user_type_id?.includes('liquidity') || acc.user_type_id?.includes('bank')
    );
  }

  getLiquidityAccounts() {
    return this.state.accounts.filter(acc =>
      acc.user_type_id?.includes('liquidity') ||
      acc.user_type_id?.includes('cash') ||
      acc.code?.startsWith('1') || acc.code?.startsWith('2')
    );
  }

  reset() {
    this.state = this._getInitialState();
  }

  exportConfig() {
    return {
      bankAccounts: this.state.bankAccounts,
      paymentMethods: this.state.paymentMethods,
      completedAt: this.state.currentStep === BANK_STEPS.COMPLETION
        ? new Date().toISOString()
        : null
    };
  }
}

export default BankSetupWizard;
