/**
 * Tax Configuration Wizard Tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { TaxConfigurationWizard, TAX_STEPS, TAX_TYPES, TAX_AMOUNT_TYPES } from './TaxConfigurationWizard.js';

const mockClient = {
  companyId: 1,
  searchRead: async (model, domain, fields, options) => {
    if (model === 'res.country') {
      return [
        { id: 1, name: 'United States', code: 'US' },
        { id: 2, name: 'United Kingdom', code: 'GB' },
        { id: 3, name: 'Germany', code: 'DE' },
        { id: 4, name: 'South Africa', code: 'ZA' }
      ];
    }
    return [];
  },
  create: async (model, data) => {
    return Math.floor(Math.random() * 10000) + 100;
  }
};

test('TaxConfigurationWizard initializes with correct initial state', () => {
  const wizard = new TaxConfigurationWizard(mockClient);
  
  assert.equal(wizard.state.currentStep, TAX_STEPS.COUNTRY_SELECTION);
  assert.equal(wizard.state.selectedCountry, null);
  assert.deepEqual(wizard.state.taxStructure, {
    has_multiple_vat: false,
    has_reduced_vat: false,
    has_zero_rated: false,
    has_exempt: false,
    has_import_duties: false,
    default_tax_type: TAX_TYPES.SALE
  });
});

test('TaxConfigurationWizard selectCountry sets correct tax rates for US', async () => {
  const wizard = new TaxConfigurationWizard(mockClient);
  
  await wizard.selectCountry(1, 'US');
  
  assert.deepEqual(wizard.state.selectedCountry, { id: 1, code: 'US' });
  assert.deepEqual(wizard.state.countryTaxRates, { standard: 0, reduced: 0, zero: 0, exempt: 0 });
});

test('TaxConfigurationWizard selectCountry sets correct tax rates for GB', async () => {
  const wizard = new TaxConfigurationWizard(mockClient);
  
  await wizard.selectCountry(2, 'GB');
  
  assert.deepEqual(wizard.state.countryTaxRates, { standard: 20, reduced: 5, zero: 0, exempt: 0 });
});

test('TaxConfigurationWizard selectCountry sets correct tax rates for ZA', async () => {
  const wizard = new TaxConfigurationWizard(mockClient);
  
  await wizard.selectCountry(4, 'ZA');
  
  assert.deepEqual(wizard.state.countryTaxRates, { standard: 15, reduced: 5, zero: 0, exempt: 0 });
});

test('TaxConfigurationWizard selectCountry generates default taxes for GB', async () => {
  const wizard = new TaxConfigurationWizard(mockClient);
  
  await wizard.selectCountry(2, 'GB');
  
  assert.ok(wizard.state.taxes.length > 0);
  const standardVat = wizard.state.taxes.find(t => t.name === 'VAT 20%');
  assert.ok(standardVat !== undefined);
  assert.equal(standardVat.amount, 20);
});

test('TaxConfigurationWizard selectCountry generates default taxes for ZA', async () => {
  const wizard = new TaxConfigurationWizard(mockClient);
  
  await wizard.selectCountry(4, 'ZA');
  
  assert.ok(wizard.state.taxes.length > 0);
  const standardVat = wizard.state.taxes.find(t => t.amount === 15);
  assert.ok(standardVat !== undefined);
});

test('TaxConfigurationWizard setTaxStructure updates structure correctly', () => {
  const wizard = new TaxConfigurationWizard(mockClient);
  
  wizard.setTaxStructure({ has_multiple_vat: true, has_reduced_vat: true });
  
  assert.equal(wizard.state.taxStructure.has_multiple_vat, true);
  assert.equal(wizard.state.taxStructure.has_reduced_vat, true);
  assert.equal(wizard.state.taxStructure.has_zero_rated, false);
});

test('TaxConfigurationWizard addTax adds tax to list', () => {
  const wizard = new TaxConfigurationWizard(mockClient);
  
  wizard.addTax({
    name: 'Custom Tax 10%',
    amount: 10,
    amount_type: TAX_AMOUNT_TYPES.PERCENT,
    type_tax_use: TAX_TYPES.SALE
  });
  
  assert.equal(wizard.state.taxes.length, 1);
  assert.equal(wizard.state.taxes[0].name, 'Custom Tax 10%');
});

test('TaxConfigurationWizard updateTax modifies existing tax', () => {
  const wizard = new TaxConfigurationWizard(mockClient);
  
  wizard.addTax({ name: 'Test Tax', amount: 5 });
  wizard.updateTax(0, { amount: 10 });
  
  assert.equal(wizard.state.taxes[0].amount, 10);
});

test('TaxConfigurationWizard removeTax removes tax from list', () => {
  const wizard = new TaxConfigurationWizard(mockClient);
  
  wizard.addTax({ name: 'Tax 1' });
  wizard.addTax({ name: 'Tax 2' });
  assert.equal(wizard.state.taxes.length, 2);
  
  wizard.removeTax(0);
  
  assert.equal(wizard.state.taxes.length, 1);
  assert.equal(wizard.state.taxes[0].name, 'Tax 2');
});

test('TaxConfigurationWizard addFiscalPosition adds position correctly', () => {
  const wizard = new TaxConfigurationWizard(mockClient);
  
  wizard.addFiscalPosition({
    name: 'EU B2B',
    country_id: 3,
    auto_apply: true,
    vat_required: true
  });
  
  assert.equal(wizard.state.fiscalPositions.length, 1);
  assert.equal(wizard.state.fiscalPositions[0].name, 'EU B2B');
});

test('TaxConfigurationWizard nextStep validates country selection', async () => {
  const wizard = new TaxConfigurationWizard(mockClient);
  
  const result = await wizard.nextStep();
  
  assert.equal(result.success, false);
  assert.ok(wizard.state.errors.country);
});

test('TaxConfigurationWizard nextStep advances with valid country', async () => {
  const wizard = new TaxConfigurationWizard(mockClient);
  
  await wizard.selectCountry(4, 'ZA');
  
  const result = await wizard.nextStep();
  
  assert.equal(result.success, true);
  assert.equal(wizard.state.currentStep, TAX_STEPS.TAX_STRUCTURE);
});

test('TaxConfigurationWizard prevStep goes back correctly', () => {
  const wizard = new TaxConfigurationWizard(mockClient);
  
  wizard.state.currentStep = TAX_STEPS.TAX_STRUCTURE;
  
  const result = wizard.prevStep();
  
  assert.equal(result.success, true);
  assert.equal(wizard.state.currentStep, TAX_STEPS.COUNTRY_SELECTION);
});

test('TaxConfigurationWizard getStepInfo returns correct info', () => {
  const wizard = new TaxConfigurationWizard(mockClient);
  
  const info = wizard.getStepInfo(TAX_STEPS.COUNTRY_SELECTION);
  assert.equal(info.title, 'Select Country');
  
  const info2 = wizard.getStepInfo(TAX_STEPS.COMPLETION);
  assert.equal(info2.title, 'Complete');
});

test('TaxConfigurationWizard getProgress calculates correctly', () => {
  const wizard = new TaxConfigurationWizard(mockClient);
  
  wizard.state.currentStep = TAX_STEPS.COUNTRY_SELECTION;
  assert.equal(wizard.getProgress(), 0);
  
  wizard.state.currentStep = TAX_STEPS.COMPLETION;
  assert.equal(wizard.getProgress(), 100);
});

test('TaxConfigurationWizard reset restores initial state', () => {
  const wizard = new TaxConfigurationWizard(mockClient);
  
  wizard.state.currentStep = TAX_STEPS.COMPLETION;
  wizard.state.selectedCountry = { id: 4, code: 'ZA' };
  wizard.addTax({ name: 'Test' });
  
  wizard.reset();
  
  assert.equal(wizard.state.currentStep, TAX_STEPS.COUNTRY_SELECTION);
  assert.equal(wizard.state.selectedCountry, null);
  assert.equal(wizard.state.taxes.length, 0);
});
