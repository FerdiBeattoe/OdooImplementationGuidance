/**
 * Purchase Wizard Tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { PurchaseWizard, PURCHASE_STEPS, DEFAULT_VENDOR_CATEGORIES } from './PurchaseWizard.js';

const mockClient = {
  searchRead: async (model, domain, fields, options) => {
    if (model === 'res.partner') return [{ id: 1, name: 'Vendor Inc', is_company: true }];
    if (model === 'account.payment.term') return [{ id: 1, name: 'Net 30' }];
    if (model === 'account.account') return [{ id: 1, name: 'Expenses' }];
    return [];
  },
  create: async (model, data) => Math.floor(Math.random() * 10000) + 100,
  write: async (model, ids, data) => true
};

test('PurchaseWizard initializes with correct initial state', () => {
  const wizard = new PurchaseWizard(mockClient);
  
  assert.equal(wizard.state.currentStep, PURCHASE_STEPS.VENDOR_SETUP);
  assert.equal(wizard.state.vendorCategories.length, DEFAULT_VENDOR_CATEGORIES.length);
  assert.equal(wizard.state.approvalLimits.requireApproval, true);
});

test('PurchaseWizard initialize fetches existing data', async () => {
  const wizard = new PurchaseWizard(mockClient);
  
  const result = await wizard.initialize();
  
  assert.equal(result.success, true);
  assert.equal(wizard.state.existingVendors.length, 1);
  assert.equal(wizard.state.existingPaymentTerms.length, 1);
});

test('PurchaseWizard addVendor adds new vendor', () => {
  const wizard = new PurchaseWizard(mockClient);
  
  wizard.addVendor({ name: 'New Vendor', email: 'vendor@example.com' });
  
  assert.equal(wizard.state.vendors.length, 1);
  assert.equal(wizard.state.vendors[0].name, 'New Vendor');
});

test('PurchaseWizard removeVendor removes vendor', () => {
  const wizard = new PurchaseWizard(mockClient);
  wizard.addVendor({ name: 'Vendor 1' });
  wizard.addVendor({ name: 'Vendor 2' });
  
  wizard.removeVendor(0);
  
  assert.equal(wizard.state.vendors.length, 1);
});

test('PurchaseWizard addVendorCategory adds category', () => {
  const wizard = new PurchaseWizard(mockClient);
  
  wizard.addVendorCategory({ name: 'Electronics', active: true });
  
  assert.equal(wizard.state.vendorCategories.length, DEFAULT_VENDOR_CATEGORIES.length + 1);
});

test('PurchaseWizard nextStep validates with invalid vendor', async () => {
  const wizard = new PurchaseWizard(mockClient);
  wizard.addVendor({ name: '' });
  
  const result = await wizard.nextStep();
  
  assert.equal(result.success, false);
});

test('PurchaseWizard nextStep advances with valid data', async () => {
  const wizard = new PurchaseWizard(mockClient);
  wizard.addVendor({ name: 'Valid Vendor', email: 'valid@test.com' });
  
  const result = await wizard.nextStep();
  
  assert.equal(result.success, true);
  assert.equal(wizard.state.currentStep, PURCHASE_STEPS.PRODUCT_SUPPLIER_INFO);
});

test('PurchaseWizard prevStep goes back correctly', () => {
  const wizard = new PurchaseWizard(mockClient);
  wizard.state.currentStep = PURCHASE_STEPS.PRODUCT_SUPPLIER_INFO;
  
  const result = wizard.prevStep();
  
  assert.equal(result.success, true);
  assert.equal(wizard.state.currentStep, PURCHASE_STEPS.VENDOR_SETUP);
});

test('PurchaseWizard getStepInfo returns correct info', () => {
  const wizard = new PurchaseWizard(mockClient);
  
  const info = wizard.getStepInfo(PURCHASE_STEPS.VENDOR_SETUP);
  assert.ok(info.title);
});

test('PurchaseWizard reset restores initial state', () => {
  const wizard = new PurchaseWizard(mockClient);
  wizard.addVendor({ name: 'Temp' });
  wizard.state.currentStep = PURCHASE_STEPS.COMPLETION;
  
  wizard.reset();
  
  assert.equal(wizard.state.vendors.length, 0);
  assert.equal(wizard.state.currentStep, PURCHASE_STEPS.VENDOR_SETUP);
});
