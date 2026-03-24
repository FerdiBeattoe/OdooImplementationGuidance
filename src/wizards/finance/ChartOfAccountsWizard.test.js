/**
 * Chart of Accounts Wizard Tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { ChartOfAccountsWizard, COA_STEPS, IMPORT_MODES } from './ChartOfAccountsWizard.js';
import { AVAILABLE_TEMPLATES, getTemplateByCountry, getTemplateByCode } from '../../templates/coa/index.js';

const mockClient = {
  companyId: 1,
  partnerId: 1,
  searchRead: async (model, domain, fields) => {
    if (model === 'res.country') {
      return [
        { id: 1, name: 'United States', code: 'US' },
        { id: 2, name: 'United Kingdom', code: 'GB' },
        { id: 3, name: 'Germany', code: 'DE' },
        { id: 4, name: 'South Africa', code: 'ZA' }
      ];
    }
    if (model === 'account.account.type') {
      return [
        { id: 1, name: 'account.data_account_type_receivable' },
        { id: 2, name: 'account.data_account_type_payable' },
        { id: 3, name: 'account.data_account_type_liquidity' },
        { id: 4, name: 'account.data_account_type_revenue' },
        { id: 5, name: 'account.data_account_type_expenses' }
      ];
    }
    return [];
  },
  create: async (model, data) => {
    return Math.floor(Math.random() * 10000) + 100;
  }
};

test('ChartOfAccountsWizard initializes with correct initial state', () => {
  const wizard = new ChartOfAccountsWizard(mockClient);
  
  assert.equal(wizard.state.currentStep, COA_STEPS.COUNTRY_SELECTION);
  assert.equal(wizard.state.importMode, IMPORT_MODES.TEMPLATE);
  assert.equal(wizard.state.selectedCountry, null);
  assert.equal(wizard.state.selectedTemplate, null);
  assert.deepEqual(wizard.state.options, {
    generateTaxTemplates: true,
    createBankAccounts: false,
    createDefaultExpenses: true,
    parentAccountId: null,
    defaultBankAccountId: null,
    currencyConversion: false,
    journalIds: []
  });
});

test('ChartOfAccountsWizard setImportMode updates state correctly', () => {
  const wizard = new ChartOfAccountsWizard(mockClient);
  
  wizard.setImportMode(IMPORT_MODES.CSV_IMPORT);
  assert.equal(wizard.state.importMode, IMPORT_MODES.CSV_IMPORT);
  
  wizard.setImportMode(IMPORT_MODES.MANUAL);
  assert.equal(wizard.state.importMode, IMPORT_MODES.MANUAL);
  
  wizard.setImportMode(IMPORT_MODES.TEMPLATE);
  assert.equal(wizard.state.importMode, IMPORT_MODES.TEMPLATE);
});

test('ChartOfAccountsWizard selectCountry sets template for valid country', async () => {
  const wizard = new ChartOfAccountsWizard(mockClient);
  
  await wizard.selectCountry(1, 'US');
  
  assert.deepEqual(wizard.state.selectedCountry, { id: 1, code: 'US' });
  assert.ok(wizard.state.selectedTemplate !== null);
  assert.equal(wizard.state.selectedTemplate.country, 'US');
});

test('ChartOfAccountsWizard selectCountry sets no template for unknown country', async () => {
  const wizard = new ChartOfAccountsWizard(mockClient);
  
  await wizard.selectCountry(99, 'XX');
  
  assert.deepEqual(wizard.state.selectedCountry, { id: 99, code: 'XX' });
  assert.equal(wizard.state.selectedTemplate, null);
});

test('ChartOfAccountsWizard selectTemplate retrieves correct template', async () => {
  const wizard = new ChartOfAccountsWizard(mockClient);
  
  await wizard.selectTemplate('us_gaap');
  
  assert.ok(wizard.state.selectedTemplate !== null);
  assert.equal(wizard.state.selectedTemplate.code, 'us_gaap');
  assert.equal(wizard.state.selectedTemplate.country, 'US');
});

test('ChartOfAccountsWizard _prepareTemplateData formats data correctly', async () => {
  const wizard = new ChartOfAccountsWizard(mockClient);
  
  await wizard.selectTemplate('us_gaap');
  
  const templateData = wizard.state.templateData;
  assert.ok(templateData !== null);
  assert.equal(templateData.name, 'United States - US GAAP');
  assert.ok(templateData.accountCount > 0);
});

test('ChartOfAccountsWizard setOption updates options correctly', () => {
  const wizard = new ChartOfAccountsWizard(mockClient);
  
  wizard.setOption('generateTaxTemplates', false);
  assert.equal(wizard.state.options.generateTaxTemplates, false);
  
  wizard.setOption('createBankAccounts', true);
  assert.equal(wizard.state.options.createBankAccounts, true);
});

test('ChartOfAccountsWizard nextStep validates country selection', async () => {
  const wizard = new ChartOfAccountsWizard(mockClient);
  
  const result = await wizard.nextStep();
  
  assert.equal(result.success, false);
  assert.ok(wizard.state.errors.country);
});

test('ChartOfAccountsWizard nextStep advances with valid country', async () => {
  const wizard = new ChartOfAccountsWizard(mockClient);
  
  wizard.state.importMode = IMPORT_MODES.TEMPLATE;
  await wizard.selectCountry(1, 'US');
  
  const result = await wizard.nextStep();
  
  assert.equal(result.success, true);
  assert.equal(wizard.state.currentStep, COA_STEPS.TEMPLATE_PREVIEW);
});

test('ChartOfAccountsWizard prevStep goes back correctly', () => {
  const wizard = new ChartOfAccountsWizard(mockClient);
  
  wizard.state.currentStep = COA_STEPS.TEMPLATE_PREVIEW;
  
  const result = wizard.prevStep();
  
  assert.equal(result.success, true);
  assert.equal(wizard.state.currentStep, COA_STEPS.COUNTRY_SELECTION);
});

test('ChartOfAccountsWizard prevStep does nothing on first step', () => {
  const wizard = new ChartOfAccountsWizard(mockClient);
  
  wizard.state.currentStep = COA_STEPS.COUNTRY_SELECTION;
  
  const result = wizard.prevStep();
  
  assert.equal(result.success, false);
  assert.equal(wizard.state.currentStep, COA_STEPS.COUNTRY_SELECTION);
});

test('ChartOfAccountsWizard getStepInfo returns correct info', () => {
  const wizard = new ChartOfAccountsWizard(mockClient);
  
  const info = wizard.getStepInfo(COA_STEPS.COUNTRY_SELECTION);
  assert.equal(info.title, 'Select Country');
  
  const info2 = wizard.getStepInfo(COA_STEPS.COMPLETION);
  assert.equal(info2.title, 'Complete');
});

test('ChartOfAccountsWizard getProgress calculates correctly', () => {
  const wizard = new ChartOfAccountsWizard(mockClient);
  
  wizard.state.currentStep = COA_STEPS.COUNTRY_SELECTION;
  assert.equal(wizard.getProgress(), 0);
  
  wizard.state.currentStep = COA_STEPS.EXECUTION;
  const progress = wizard.getProgress();
  assert.ok(progress > 0 && progress < 100);
  
  wizard.state.currentStep = COA_STEPS.COMPLETION;
  assert.equal(wizard.getProgress(), 100);
});

test('ChartOfAccountsWizard reset restores initial state', () => {
  const wizard = new ChartOfAccountsWizard(mockClient);
  
  wizard.state.currentStep = COA_STEPS.COMPLETION;
  wizard.state.selectedCountry = { id: 1, code: 'US' };
  wizard.state.errors = { someError: 'test' };
  
  wizard.reset();
  
  assert.equal(wizard.state.currentStep, COA_STEPS.COUNTRY_SELECTION);
  assert.equal(wizard.state.selectedCountry, null);
  assert.deepEqual(wizard.state.errors, {});
});

test('ChartOfAccountsWizard exportConfig exports correct structure', () => {
  const wizard = new ChartOfAccountsWizard(mockClient);
  
  wizard.state.importMode = IMPORT_MODES.TEMPLATE;
  wizard.state.selectedCountry = { id: 1, code: 'US' };
  
  const config = wizard.exportConfig();
  
  assert.equal(config.importMode, IMPORT_MODES.TEMPLATE);
  assert.deepEqual(config.selectedCountry, { id: 1, code: 'US' });
  assert.equal(config.completedAt, null);
});

test('ChartOfAccountsWizard getAvailableTemplates returns all templates', () => {
  const wizard = new ChartOfAccountsWizard(mockClient);
  
  const templates = wizard.getAvailableTemplates();
  
  assert.ok(templates.length >= 20);
  assert.ok(templates.some(t => t.country === 'US'));
  assert.ok(templates.some(t => t.country === 'ZA'));
  assert.ok(templates.some(t => t.country === 'GB'));
});

test('COA template index exports correct templates', () => {
  assert.ok(AVAILABLE_TEMPLATES.length >= 20);
  
  const us = getTemplateByCountry('US');
  assert.ok(us !== undefined);
  assert.equal(us.code, 'us_gaap');
  
  const za = getTemplateByCountry('ZA');
  assert.ok(za !== undefined);
  assert.equal(za.code, 'za_basic');
  
  const byCode = getTemplateByCode('us_gaap');
  assert.deepEqual(us, byCode);
});
