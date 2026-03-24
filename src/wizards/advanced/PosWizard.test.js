/**
 * POS Wizard Tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { PosWizard, POS_STEPS, PAYMENT_INTERFACE_TYPES, SESSION_STATES } from './PosWizard.js';

const mockClient = {
  companyId: 1,
  searchRead: async (model, domain, fields) => {
    if (model === 'product.pricelist') {
      return [
        { id: 1, name: 'Public Pricelist', currency_id: 1 },
        { id: 2, name: 'VIP Pricelist', currency_id: 1 }
      ];
    }
    if (model === 'account.journal') {
      return [
        { id: 1, name: 'Cash', code: 'CSH', type: 'cash', currency: null, active: true },
        { id: 2, name: 'Bank', code: 'BNK1', type: 'bank', currency: null, active: true },
        { id: 3, name: 'Sales', code: 'SAL', type: 'sale', currency: null, active: true }
      ];
    }
    return [];
  },
  create: async (model, data) => {
    return Math.floor(Math.random() * 10000) + 100;
  }
};

test('PosWizard initializes with correct initial state', () => {
  const wizard = new PosWizard(mockClient);
  
  assert.equal(wizard.state.currentStep, POS_STEPS.MODULE_SELECTION);
  assert.deepEqual(wizard.state.moduleSelection, {
    install_pos_restaurant: false,
    install_pos_loyalty: false,
    install_pos_gift_card: false
  });
  assert.equal(wizard.state.terminals.length, 0);
  assert.equal(wizard.state.paymentMethods.length, 1);
});

test('PosWizard has default payment methods configured', () => {
  const wizard = new PosWizard(mockClient);
  
  const methods = wizard.state.paymentMethods;
  assert.equal(methods.length, 1);
  assert.equal(methods[0].name, 'Cash');
  assert.equal(methods[0].interface_type, PAYMENT_INTERFACE_TYPES.CASH);
  assert.equal(methods[0].is_cash_count, true);
});

test('PosWizard has default receipt configuration', () => {
  const wizard = new PosWizard(mockClient);
  
  const receipt = wizard.state.receipt;
  assert.equal(receipt.receipt_footer, 'Thank you for your business!');
  assert.equal(receipt.iface_preprint, false);
});

test('PosWizard has default session configuration', () => {
  const wizard = new PosWizard(mockClient);
  
  const session = wizard.state.session;
  assert.equal(session.auto_closing, false);
  assert.equal(session.max_difference, 10);
});

test('PosWizard setModuleSelection updates selection correctly', () => {
  const wizard = new PosWizard(mockClient);
  
  wizard.setModuleSelection({
    install_pos_restaurant: true,
    install_pos_loyalty: true
  });
  
  assert.equal(wizard.state.moduleSelection.install_pos_restaurant, true);
  assert.equal(wizard.state.moduleSelection.install_pos_loyalty, true);
});

test('PosWizard addTerminal adds terminal correctly', () => {
  const wizard = new PosWizard(mockClient);
  
  wizard.addTerminal({
    name: 'Main POS',
    journal_id: 1
  });
  
  assert.equal(wizard.state.terminals.length, 1);
  assert.equal(wizard.state.terminals[0].name, 'Main POS');
  assert.ok(wizard.state.terminals[0].isNew);
});

test('PosWizard updateTerminal modifies terminal', () => {
  const wizard = new PosWizard(mockClient);
  
  wizard.addTerminal({ name: 'Terminal 1' });
  wizard.updateTerminal(0, { name: 'Updated Terminal', journal_id: 2 });
  
  assert.equal(wizard.state.terminals[0].name, 'Updated Terminal');
});

test('PosWizard removeTerminal removes terminal', () => {
  const wizard = new PosWizard(mockClient);
  
  wizard.addTerminal({ name: 'Terminal 1' });
  wizard.addTerminal({ name: 'Terminal 2' });
  wizard.removeTerminal(0);
  
  assert.equal(wizard.state.terminals.length, 1);
  assert.equal(wizard.state.terminals[0].name, 'Terminal 2');
});

test('PosWizard addPaymentMethod adds method correctly', () => {
  const wizard = new PosWizard(mockClient);
  
  wizard.addPaymentMethod({
    name: 'Credit Card',
    journal_id: 2,
    interface_type: PAYMENT_INTERFACE_TYPES.CARD
  });
  
  assert.equal(wizard.state.paymentMethods.length, 2);
  assert.equal(wizard.state.paymentMethods[1].name, 'Credit Card');
});

test('PosWizard updatePaymentMethod modifies method', () => {
  const wizard = new PosWizard(mockClient);
  
  wizard.addPaymentMethod({ name: 'Old Name' });
  wizard.updatePaymentMethod(1, { name: 'New Name' });
  
  assert.equal(wizard.state.paymentMethods[1].name, 'New Name');
});

test('PosWizard removePaymentMethod removes method (not default cash)', () => {
  const wizard = new PosWizard(mockClient);
  
  wizard.addPaymentMethod({ name: 'Extra Method' });
  wizard.removePaymentMethod(1);
  
  assert.equal(wizard.state.paymentMethods.length, 1);
  assert.equal(wizard.state.paymentMethods[0].name, 'Cash');
});

test('PosWizard setPricelistConfig updates pricelist config', () => {
  const wizard = new PosWizard(mockClient);
  
  wizard.setPricelistConfig({
    use_pricelist: true,
    default_pricelist_id: 2
  });
  
  assert.equal(wizard.state.pricelist.use_pricelist, true);
  assert.equal(wizard.state.pricelist.default_pricelist_id, 2);
});

test('PosWizard setReceiptConfig updates receipt config', () => {
  const wizard = new PosWizard(mockClient);
  
  wizard.setReceiptConfig({
    receipt_header: 'Welcome to Store',
    receipt_footer: 'Come again!',
    iface_preprint: true
  });
  
  assert.equal(wizard.state.receipt.receipt_header, 'Welcome to Store');
  assert.equal(wizard.state.receipt.iface_preprint, true);
});

test('PosWizard setSessionConfig updates session config', () => {
  const wizard = new PosWizard(mockClient);
  
  wizard.setSessionConfig({
    auto_closing: true,
    max_difference: 50
  });
  
  assert.equal(wizard.state.session.auto_closing, true);
  assert.equal(wizard.state.session.max_difference, 50);
});

test('PosWizard nextStep validates terminals requirement', async () => {
  const wizard = new PosWizard(mockClient);
  
  wizard.state.currentStep = POS_STEPS.HARDWARE_SETUP;
  
  const result = await wizard.nextStep();
  
  assert.equal(result.success, false);
  assert.ok(wizard.state.errors.terminals);
});

test('PosWizard nextStep validates terminal name requirement', async () => {
  const wizard = new PosWizard(mockClient);
  
  wizard.state.currentStep = POS_STEPS.HARDWARE_SETUP;
  wizard.addTerminal({ name: '' });
  
  const result = await wizard.nextStep();
  
  assert.equal(result.success, false);
  assert.ok(wizard.state.errors['terminal_0']);
});

test('PosWizard nextStep advances with valid terminals', async () => {
  const wizard = new PosWizard(mockClient);
  
  wizard.state.currentStep = POS_STEPS.HARDWARE_SETUP;
  wizard.addTerminal({ name: 'Main POS' });
  
  const result = await wizard.nextStep();
  
  assert.equal(result.success, true);
  assert.equal(wizard.state.currentStep, POS_STEPS.PAYMENT_METHODS);
});

test('PosWizard prevStep goes back correctly', () => {
  const wizard = new PosWizard(mockClient);
  
  wizard.state.currentStep = POS_STEPS.PAYMENT_METHODS;
  
  const result = wizard.prevStep();
  
  assert.equal(result.success, true);
  assert.equal(wizard.state.currentStep, POS_STEPS.HARDWARE_SETUP);
});

test('PosWizard prevStep does nothing on first step', () => {
  const wizard = new PosWizard(mockClient);
  
  wizard.state.currentStep = POS_STEPS.MODULE_SELECTION;
  
  const result = wizard.prevStep();
  
  assert.equal(result.success, false);
});

test('PosWizard getStepInfo returns correct info', () => {
  const wizard = new PosWizard(mockClient);
  
  const info = wizard.getStepInfo(POS_STEPS.HARDWARE_SETUP);
  assert.equal(info.title, 'Terminal Setup');
  
  const info2 = wizard.getStepInfo(POS_STEPS.COMPLETION);
  assert.equal(info2.title, 'Complete');
});

test('PosWizard getProgress calculates correctly', () => {
  const wizard = new PosWizard(mockClient);
  
  wizard.state.currentStep = POS_STEPS.MODULE_SELECTION;
  assert.equal(wizard.getProgress(), 0);
  
  wizard.state.currentStep = POS_STEPS.EXECUTION;
  const progress = wizard.getProgress();
  assert.ok(progress > 0 && progress < 100);
  
  wizard.state.currentStep = POS_STEPS.COMPLETION;
  assert.equal(wizard.getProgress(), 100);
});

test('PosWizard reset restores initial state', () => {
  const wizard = new PosWizard(mockClient);
  
  wizard.state.currentStep = POS_STEPS.COMPLETION;
  wizard.addTerminal({ name: 'Test Terminal' });
  
  wizard.reset();
  
  assert.equal(wizard.state.currentStep, POS_STEPS.MODULE_SELECTION);
  assert.equal(wizard.state.terminals.length, 0);
});

test('PosWizard exportConfig exports correct structure', () => {
  const wizard = new PosWizard(mockClient);
  
  wizard.addTerminal({ name: 'Main POS' });
  
  const config = wizard.exportConfig();
  
  assert.ok(config.moduleSelection !== undefined);
  assert.equal(config.terminals.length, 1);
  assert.equal(config.completedAt, null);
});
