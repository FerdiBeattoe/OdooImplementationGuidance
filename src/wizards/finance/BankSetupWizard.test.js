/**
 * Bank Setup Wizard Tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { BankSetupWizard, BANK_STEPS, PAYMENT_TYPES, JOURNAL_TYPES } from './BankSetupWizard.js';

const mockClient = {
  companyId: 1,
  partnerId: 1,
  searchRead: async (model, domain, fields) => {
    if (model === 'res.bank') {
      return [
        { id: 1, name: 'Standard Bank', bic: 'SBZAZAJJ', code: 'SB', country: 4 },
        { id: 2, name: 'First National Bank', bic: 'FIRNZAJJ', code: 'FNB', country: 4 }
      ];
    }
    if (model === 'account.journal') {
      return [
        { id: 1, name: 'Cash', code: 'CSH', type: 'cash', currency: null, active: true },
        { id: 2, name: 'Bank', code: 'BNK1', type: 'bank', currency: null, active: true }
      ];
    }
    if (model === 'account.account') {
      return [
        { id: 1, code: '1000', name: 'Cash at Bank', user_type_id: 'liquidity', reconcile: true },
        { id: 2, code: '2000', name: 'Accounts Payable', user_type_id: 'payable', reconcile: true }
      ];
    }
    return [];
  },
  create: async (model, data) => {
    return Math.floor(Math.random() * 10000) + 100;
  }
};

test('BankSetupWizard initializes with correct initial state', () => {
  const wizard = new BankSetupWizard(mockClient);
  
  assert.equal(wizard.state.currentStep, BANK_STEPS.BANK_ACCOUNTS);
  assert.deepEqual(wizard.state.bankAccounts, []);
  assert.deepEqual(wizard.state.paymentMethods, []);
  assert.equal(wizard.state.selectedBankId, null);
});

test('BankSetupWizard addBankAccount adds account correctly', () => {
  const wizard = new BankSetupWizard(mockClient);
  
  wizard.addBankAccount({
    name: 'Business Account',
    code: 'BNK1',
    acc_number: '1234567890',
    currency_id: 1,
    bank_id: 1
  });
  
  assert.equal(wizard.state.bankAccounts.length, 1);
  assert.equal(wizard.state.bankAccounts[0].name, 'Business Account');
  assert.ok(wizard.state.bankAccounts[0].isNew);
});

test('BankSetupWizard updateBankAccount modifies account', () => {
  const wizard = new BankSetupWizard(mockClient);
  
  wizard.addBankAccount({ name: 'Old Name', code: 'BNK1' });
  wizard.updateBankAccount(0, { name: 'New Name', code: 'BNK2' });
  
  assert.equal(wizard.state.bankAccounts[0].name, 'New Name');
  assert.equal(wizard.state.bankAccounts[0].code, 'BNK2');
});

test('BankSetupWizard removeBankAccount removes account', () => {
  const wizard = new BankSetupWizard(mockClient);
  
  wizard.addBankAccount({ name: 'Account 1' });
  wizard.addBankAccount({ name: 'Account 2' });
  wizard.removeBankAccount(0);
  
  assert.equal(wizard.state.bankAccounts.length, 1);
  assert.equal(wizard.state.bankAccounts[0].name, 'Account 2');
});

test('BankSetupWizard addPaymentMethod adds method correctly', () => {
  const wizard = new BankSetupWizard(mockClient);
  
  wizard.addPaymentMethod({
    name: 'Credit Card',
    journal_id: 1,
    interface_type: 'card'
  });
  
  assert.equal(wizard.state.paymentMethods.length, 1);
  assert.equal(wizard.state.paymentMethods[0].name, 'Credit Card');
  assert.ok(wizard.state.paymentMethods[0].isNew);
});

test('BankSetupWizard updatePaymentMethod modifies method', () => {
  const wizard = new BankSetupWizard(mockClient);
  
  wizard.addPaymentMethod({ name: 'Cash', journal_id: 1 });
  wizard.updatePaymentMethod(0, { name: 'Petty Cash', journal_id: 2 });
  
  assert.equal(wizard.state.paymentMethods[0].name, 'Petty Cash');
});

test('BankSetupWizard removePaymentMethod removes method', () => {
  const wizard = new BankSetupWizard(mockClient);
  
  wizard.addPaymentMethod({ name: 'Method 1' });
  wizard.addPaymentMethod({ name: 'Method 2' });
  wizard.removePaymentMethod(0);
  
  assert.equal(wizard.state.paymentMethods.length, 1);
  assert.equal(wizard.state.paymentMethods[0].name, 'Method 2');
});

test('BankSetupWizard nextStep validates bank accounts requirement', async () => {
  const wizard = new BankSetupWizard(mockClient);
  
  const result = await wizard.nextStep();
  
  assert.equal(result.success, false);
  assert.ok(wizard.state.errors.bankAccounts);
});

test('BankSetupWizard nextStep validates bank account details', async () => {
  const wizard = new BankSetupWizard(mockClient);
  
  wizard.addBankAccount({ name: '' }); // Missing name
  
  const result = await wizard.nextStep();
  
  assert.equal(result.success, false);
  assert.ok(wizard.state.errors['bank_0']);
});

test('BankSetupWizard nextStep advances with valid bank accounts', async () => {
  const wizard = new BankSetupWizard(mockClient);
  
  wizard.addBankAccount({
    name: 'Business Account',
    currency_id: 1
  });
  
  const result = await wizard.nextStep();
  
  assert.equal(result.success, true);
  assert.equal(wizard.state.currentStep, BANK_STEPS.PAYMENT_METHODS);
});

test('BankSetupWizard prevStep goes back correctly', () => {
  const wizard = new BankSetupWizard(mockClient);
  
  wizard.state.currentStep = BANK_STEPS.PAYMENT_METHODS;
  
  const result = wizard.prevStep();
  
  assert.equal(result.success, true);
  assert.equal(wizard.state.currentStep, BANK_STEPS.BANK_ACCOUNTS);
});

test('BankSetupWizard prevStep does nothing on first step', () => {
  const wizard = new BankSetupWizard(mockClient);
  
  wizard.state.currentStep = BANK_STEPS.BANK_ACCOUNTS;
  
  const result = wizard.prevStep();
  
  assert.equal(result.success, false);
});

test('BankSetupWizard getStepInfo returns correct info', () => {
  const wizard = new BankSetupWizard(mockClient);
  
  const info = wizard.getStepInfo(BANK_STEPS.BANK_ACCOUNTS);
  assert.equal(info.title, 'Bank Accounts');
  
  const info2 = wizard.getStepInfo(BANK_STEPS.COMPLETION);
  assert.equal(info2.title, 'Complete');
});

test('BankSetupWizard getProgress calculates correctly', () => {
  const wizard = new BankSetupWizard(mockClient);
  
  wizard.state.currentStep = BANK_STEPS.BANK_ACCOUNTS;
  assert.equal(wizard.getProgress(), 0);
  
  wizard.state.currentStep = BANK_STEPS.EXECUTION;
  const progress = wizard.getProgress();
  assert.ok(progress > 0 && progress < 100);
  
  wizard.state.currentStep = BANK_STEPS.COMPLETION;
  assert.equal(wizard.getProgress(), 100);
});

test('BankSetupWizard reset restores initial state', () => {
  const wizard = new BankSetupWizard(mockClient);
  
  wizard.state.currentStep = BANK_STEPS.COMPLETION;
  wizard.addBankAccount({ name: 'Test' });
  
  wizard.reset();
  
  assert.equal(wizard.state.currentStep, BANK_STEPS.BANK_ACCOUNTS);
  assert.equal(wizard.state.bankAccounts.length, 0);
});

test('BankSetupWizard exportConfig exports correct structure', () => {
  const wizard = new BankSetupWizard(mockClient);
  
  wizard.addBankAccount({ name: 'Business Account', code: 'BNK1' });
  wizard.addPaymentMethod({ name: 'Cash', journal_id: 1 });
  
  const config = wizard.exportConfig();
  
  assert.equal(config.bankAccounts.length, 1);
  assert.equal(config.paymentMethods.length, 1);
  assert.equal(config.completedAt, null);
});
