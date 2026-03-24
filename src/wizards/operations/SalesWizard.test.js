/**
 * Sales Wizard Tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { SalesWizard, SALES_STEPS, DEFAULT_PRICELIST_TYPES } from './SalesWizard.js';

const mockClient = {
  searchRead: async (model, domain, fields, options) => {
    if (model === 'product.pricelist') return [{ id: 1, name: 'Default', type: 'sale' }];
    if (model === 'stock.warehouse') return [{ id: 1, name: 'Main WH' }];
    if (model === 'crm.team') return [{ id: 1, name: 'Sales' }];
    return [];
  },
  create: async (model, data) => Math.floor(Math.random() * 10000) + 100,
  write: async (model, ids, data) => true
};

test('SalesWizard initializes with correct initial state', () => {
  const wizard = new SalesWizard(mockClient);
  
  assert.equal(wizard.state.currentStep, SALES_STEPS.QUOTATION_SETTINGS);
  assert.equal(wizard.state.pricelists.length, DEFAULT_PRICELIST_TYPES.length);
  assert.equal(wizard.state.quotationSettings.default_validity_days, 30);
});

test('SalesWizard initialize fetches existing data', async () => {
  const wizard = new SalesWizard(mockClient);
  
  const result = await wizard.initialize();
  
  assert.equal(result.success, true);
  assert.equal(wizard.state.existingPricelists.length, 1);
});

test('SalesWizard addPricelist adds new pricelist', () => {
  const wizard = new SalesWizard(mockClient);
  
  wizard.addPricelist({ name: 'VIP', type: 'sale' });
  
  assert.equal(wizard.state.pricelists.length, DEFAULT_PRICELIST_TYPES.length + 1);
});

test('SalesWizard removePricelist removes pricelist', () => {
  const wizard = new SalesWizard(mockClient);
  wizard.addPricelist({ name: 'Extra' });
  
  wizard.removePricelist(2);
  
  assert.equal(wizard.state.pricelists.length, 2);
});

test('SalesWizard nextStep advances with valid data', async () => {
  const wizard = new SalesWizard(mockClient);
  
  const result = await wizard.nextStep();
  
  assert.equal(result.success, true);
  assert.equal(wizard.state.currentStep, SALES_STEPS.PRICELIST_SETUP);
});

test('SalesWizard prevStep goes back correctly', () => {
  const wizard = new SalesWizard(mockClient);
  wizard.state.currentStep = SALES_STEPS.PRICELIST_SETUP;
  
  const result = wizard.prevStep();
  
  assert.equal(result.success, true);
  assert.equal(wizard.state.currentStep, SALES_STEPS.QUOTATION_SETTINGS);
});

test('SalesWizard getStepInfo returns correct info', () => {
  const wizard = new SalesWizard(mockClient);
  
  const info = wizard.getStepInfo(SALES_STEPS.QUOTATION_SETTINGS);
  assert.ok(info.title);
});

test('SalesWizard reset restores initial state', () => {
  const wizard = new SalesWizard(mockClient);
  wizard.addPricelist({ name: 'Extra' });
  wizard.state.currentStep = SALES_STEPS.COMPLETION;
  
  wizard.reset();
  
  assert.equal(wizard.state.pricelists.length, DEFAULT_PRICELIST_TYPES.length);
  assert.equal(wizard.state.currentStep, SALES_STEPS.QUOTATION_SETTINGS);
});
