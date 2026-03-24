/**
 * CRM Wizard Tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { CrmWizard, CRM_STEPS, DEFAULT_PIPELINE_STAGES, DEFAULT_TEAMS, DEFAULT_LEAD_SOURCES } from './CrmWizard.js';

const mockClient = {
  searchRead: async (model, domain, fields, options) => {
    if (model === 'crm.team') return [{ id: 1, name: 'Sales Team', alias_name: 'sales' }];
    if (model === 'crm.stage') return [{ id: 1, name: 'New', sequence: 1 }];
    if (model === 'utm.source') return [{ id: 1, name: 'Website' }];
    return [];
  },
  create: async (model, data) => Math.floor(Math.random() * 10000) + 100,
  write: async (model, ids, data) => true
};

test('CrmWizard initializes with correct initial state', () => {
  const wizard = new CrmWizard(mockClient);
  
  assert.equal(wizard.state.currentStep, CRM_STEPS.PIPELINE_CONFIG);
  assert.equal(wizard.state.stages.length, DEFAULT_PIPELINE_STAGES.length);
  assert.equal(wizard.state.teams.length, DEFAULT_TEAMS.length);
  assert.equal(wizard.state.leadSources.length, DEFAULT_LEAD_SOURCES.length);
});

test('CrmWizard initialize fetches existing data', async () => {
  const wizard = new CrmWizard(mockClient);
  
  const result = await wizard.initialize();
  
  assert.equal(result.success, true);
  assert.equal(wizard.state.existingTeams.length, 1);
});

test('CrmWizard addStage adds new stage', () => {
  const wizard = new CrmWizard(mockClient);
  
  wizard.addStage({ name: 'Custom Stage', sequence: 10 });
  
  assert.equal(wizard.state.stages.length, DEFAULT_PIPELINE_STAGES.length + 1);
});

test('CrmWizard removeStage removes stage', () => {
  const wizard = new CrmWizard(mockClient);
  
  wizard.removeStage(0);
  
  assert.equal(wizard.state.stages.length, DEFAULT_PIPELINE_STAGES.length - 1);
});

test('CrmWizard addTeam adds new team', () => {
  const wizard = new CrmWizard(mockClient);
  
  wizard.addTeam({ name: 'Marketing Team', alias_name: 'marketing' });
  
  assert.equal(wizard.state.teams.length, DEFAULT_TEAMS.length + 1);
});

test('CrmWizard addLeadSource adds new source', () => {
  const wizard = new CrmWizard(mockClient);
  
  wizard.addLeadSource({ name: 'LinkedIn', active: true });
  
  assert.equal(wizard.state.leadSources.length, DEFAULT_LEAD_SOURCES.length + 1);
});

test('CrmWizard setAssignmentRules updates rules', () => {
  const wizard = new CrmWizard(mockClient);
  
  wizard.setAssignmentRules({ autoAssign: true, assignByRoundRobin: true });
  
  assert.equal(wizard.state.assignmentRules.autoAssign, true);
  assert.equal(wizard.state.assignmentRules.assignByRoundRobin, true);
});

test('CrmWizard nextStep validates pipeline name required', async () => {
  const wizard = new CrmWizard(mockClient);
  wizard.state.pipeline.name = '';
  
  const result = await wizard.nextStep();
  
  assert.equal(result.success, false);
  assert.ok(wizard.state.errors.name);
});

test('CrmWizard nextStep advances with valid data', async () => {
  const wizard = new CrmWizard(mockClient);
  wizard.state.stages = DEFAULT_PIPELINE_STAGES.map(s => ({ ...s }));
  
  const result = await wizard.nextStep();
  
  assert.equal(result.success, true);
  assert.equal(wizard.state.currentStep, CRM_STEPS.STAGE_DEFINITION);
});

test('CrmWizard prevStep goes back correctly', () => {
  const wizard = new CrmWizard(mockClient);
  wizard.state.currentStep = CRM_STEPS.STAGE_DEFINITION;
  
  const result = wizard.prevStep();
  
  assert.equal(result.success, true);
  assert.equal(wizard.state.currentStep, CRM_STEPS.PIPELINE_CONFIG);
});

test('CrmWizard getStepInfo returns correct info', () => {
  const wizard = new CrmWizard(mockClient);
  
  const info = wizard.getStepInfo(CRM_STEPS.PIPELINE_CONFIG);
  assert.equal(info.title, 'Pipeline Configuration');
});

test('CrmWizard reset restores initial state', () => {
  const wizard = new CrmWizard(mockClient);
  wizard.addStage({ name: 'Custom' });
  wizard.state.currentStep = CRM_STEPS.COMPLETION;
  
  wizard.reset();
  
  assert.equal(wizard.state.stages.length, DEFAULT_PIPELINE_STAGES.length);
  assert.equal(wizard.state.currentStep, CRM_STEPS.PIPELINE_CONFIG);
});
