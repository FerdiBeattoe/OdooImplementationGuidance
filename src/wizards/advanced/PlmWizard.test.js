/**
 * PLM Wizard Tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { PlmWizard, PLM_STEPS, ECO_TYPES, ECO_STATES, DOCUMENT_STATES } from './PlmWizard.js';

const mockClient = {
  companyId: 1,
  searchRead: async (model, domain, fields) => {
    if (model === 'mrp.eco.type') {
      return [
        { id: 1, name: 'New Product' },
        { id: 2, name: 'Modification' },
        { id: 3, name: 'Obsolescence' }
      ];
    }
    return [];
  },
  create: async (model, data) => {
    return Math.floor(Math.random() * 10000) + 100;
  }
};

test('PlmWizard initializes with correct initial state', () => {
  const wizard = new PlmWizard(mockClient);
  
  assert.equal(wizard.state.currentStep, PLM_STEPS.MODULE_SELECTION);
  assert.deepEqual(wizard.state.moduleSelection, {
    install_plm: true,
    install_quality: false,
    install_mrp: false
  });
  assert.equal(wizard.state.ecoStages.length, 5);
  assert.equal(wizard.state.ecoTypes.length, 3);
});

test('PlmWizard has default ECO stages configured', () => {
  const wizard = new PlmWizard(mockClient);
  
  const stages = wizard.state.ecoStages;
  assert.equal(stages.length, 5);
  assert.equal(stages[0].name, 'Draft');
  assert.equal(stages[4].name, 'Released');
  assert.equal(stages[4].fold, true);
});

test('PlmWizard has default ECO types configured', () => {
  const wizard = new PlmWizard(mockClient);
  
  const types = wizard.state.ecoTypes;
  assert.equal(types.length, 3);
  assert.ok(types.some(t => t.type === ECO_TYPES.NEW_PRODUCT));
  assert.ok(types.some(t => t.type === ECO_TYPES.MODIFICATION));
  assert.ok(types.some(t => t.type === ECO_TYPES.OBSOLESCENCE));
});

test('PlmWizard has default workflow configuration', () => {
  const wizard = new PlmWizard(mockClient);
  
  const workflow = wizard.state.workflow;
  assert.equal(workflow.require_approval, true);
  assert.equal(workflow.auto_bom_update, true);
  assert.equal(workflow.default_eco_type, ECO_TYPES.MODIFICATION);
});

test('PlmWizard has default document control settings', () => {
  const wizard = new PlmWizard(mockClient);
  
  const docControl = wizard.state.documentControl;
  assert.equal(docControl.auto_document_creation, true);
  assert.equal(docControl.auto_new_revision, true);
  assert.equal(docControl.default_life_time, 365);
});

test('PlmWizard has default BOM integration settings', () => {
  const wizard = new PlmWizard(mockClient);
  
  const bomIntegration = wizard.state.bomIntegration;
  assert.equal(bomIntegration.link_boms_to_eco, true);
  assert.equal(bomIntegration.update_routing_on_release, false);
});

test('PlmWizard setModuleSelection updates selection correctly', () => {
  const wizard = new PlmWizard(mockClient);
  
  wizard.setModuleSelection({ install_quality: true, install_mrp: true });
  
  assert.equal(wizard.state.moduleSelection.install_plm, true);
  assert.equal(wizard.state.moduleSelection.install_quality, true);
  assert.equal(wizard.state.moduleSelection.install_mrp, true);
});

test('PlmWizard updateEcoStage modifies existing stage', () => {
  const wizard = new PlmWizard(mockClient);
  
  wizard.updateEcoStage(0, { name: 'New Draft', sequence: 2 });
  
  assert.equal(wizard.state.ecoStages[0].name, 'New Draft');
  assert.equal(wizard.state.ecoStages[0].sequence, 2);
});

test('PlmWizard addEcoStage adds new stage', () => {
  const wizard = new PlmWizard(mockClient);
  
  wizard.addEcoStage({ name: 'Pending Approval', fold: false });
  
  assert.equal(wizard.state.ecoStages.length, 6);
  assert.equal(wizard.state.ecoStages[5].name, 'Pending Approval');
});

test('PlmWizard removeEcoStage removes stage and reorders', () => {
  const wizard = new PlmWizard(mockClient);
  
  const initialCount = wizard.state.ecoStages.length;
  wizard.removeEcoStage(0);
  
  assert.equal(wizard.state.ecoStages.length, initialCount - 1);
  assert.equal(wizard.state.ecoStages[0].name, 'Confirmed');
  assert.equal(wizard.state.ecoStages[0].sequence, 1);
});

test('PlmWizard setWorkflowConfig updates workflow correctly', () => {
  const wizard = new PlmWizard(mockClient);
  
  wizard.setWorkflowConfig({
    require_approval: false,
    auto_bom_update: false
  });
  
  assert.equal(wizard.state.workflow.require_approval, false);
  assert.equal(wizard.state.workflow.auto_bom_update, false);
});

test('PlmWizard setDocumentControl updates document control correctly', () => {
  const wizard = new PlmWizard(mockClient);
  
  wizard.setDocumentControl({
    auto_new_revision: false,
    default_life_time: 180
  });
  
  assert.equal(wizard.state.documentControl.auto_new_revision, false);
  assert.equal(wizard.state.documentControl.default_life_time, 180);
});

test('PlmWizard setBomIntegration updates BOM integration correctly', () => {
  const wizard = new PlmWizard(mockClient);
  
  wizard.setBomIntegration({
    update_routing_on_release: true,
    create_bom_variants: true
  });
  
  assert.equal(wizard.state.bomIntegration.update_routing_on_release, true);
  assert.equal(wizard.state.bomIntegration.create_bom_variants, true);
});

test('PlmWizard nextStep validates ECO stages requirement', async () => {
  const wizard = new PlmWizard(mockClient);
  
  wizard.state.currentStep = PLM_STEPS.ECO_STAGES;
  wizard.state.ecoStages = [{ name: '' }];
  
  const result = await wizard.nextStep();
  
  assert.equal(result.success, false);
  assert.ok(wizard.state.errors['stage_0']);
});

test('PlmWizard nextStep requires at least 2 ECO stages', async () => {
  const wizard = new PlmWizard(mockClient);
  
  wizard.state.currentStep = PLM_STEPS.ECO_STAGES;
  wizard.state.ecoStages = [{ name: 'Single Stage' }];
  
  const result = await wizard.nextStep();
  
  assert.equal(result.success, false);
  assert.ok(wizard.state.errors.stages);
});

test('PlmWizard nextStep advances when validation passes', async () => {
  const wizard = new PlmWizard(mockClient);
  
  wizard.state.currentStep = PLM_STEPS.ECO_STAGES;
  
  const result = await wizard.nextStep();
  
  assert.equal(result.success, true);
  assert.equal(wizard.state.currentStep, PLM_STEPS.WORKFLOW_CONFIG);
});

test('PlmWizard prevStep goes back correctly', () => {
  const wizard = new PlmWizard(mockClient);
  
  wizard.state.currentStep = PLM_STEPS.WORKFLOW_CONFIG;
  
  const result = wizard.prevStep();
  
  assert.equal(result.success, true);
  assert.equal(wizard.state.currentStep, PLM_STEPS.ECO_STAGES);
});

test('PlmWizard prevStep does nothing on first step', () => {
  const wizard = new PlmWizard(mockClient);
  
  wizard.state.currentStep = PLM_STEPS.MODULE_SELECTION;
  
  const result = wizard.prevStep();
  
  assert.equal(result.success, false);
});

test('PlmWizard getStepInfo returns correct info', () => {
  const wizard = new PlmWizard(mockClient);
  
  const info = wizard.getStepInfo(PLM_STEPS.ECO_STAGES);
  assert.equal(info.title, 'ECO Stages');
  
  const info2 = wizard.getStepInfo(PLM_STEPS.COMPLETION);
  assert.equal(info2.title, 'Complete');
});

test('PlmWizard getProgress calculates correctly', () => {
  const wizard = new PlmWizard(mockClient);
  
  wizard.state.currentStep = PLM_STEPS.MODULE_SELECTION;
  assert.equal(wizard.getProgress(), 0);
  
  wizard.state.currentStep = PLM_STEPS.ECO_STAGES;
  const progress = wizard.getProgress();
  assert.ok(progress > 0 && progress < 100);
  
  wizard.state.currentStep = PLM_STEPS.COMPLETION;
  assert.equal(wizard.getProgress(), 100);
});

test('PlmWizard getDefaultEcoStages returns configured stages', () => {
  const wizard = new PlmWizard(mockClient);
  
  const stages = wizard.getDefaultEcoStages();
  
  assert.ok(stages.length > 0);
  assert.equal(stages[0].name, 'Draft');
});

test('PlmWizard getEcoTypePreview returns correct preview', () => {
  const wizard = new PlmWizard(mockClient);
  
  const preview = wizard.getEcoTypePreview();
  
  assert.equal(preview.types.length, 3);
  assert.equal(preview.defaultType, ECO_TYPES.MODIFICATION);
});

test('PlmWizard reset restores initial state', () => {
  const wizard = new PlmWizard(mockClient);
  
  wizard.state.currentStep = PLM_STEPS.COMPLETION;
  wizard.state.ecoStages = [{ name: 'Custom Stage' }];
  wizard.setModuleSelection({ install_plm: false });
  
  wizard.reset();
  
  assert.equal(wizard.state.currentStep, PLM_STEPS.MODULE_SELECTION);
  assert.equal(wizard.state.ecoStages.length, 5);
  assert.equal(wizard.state.moduleSelection.install_plm, true);
});

test('PlmWizard exportConfig exports correct structure', () => {
  const wizard = new PlmWizard(mockClient);
  
  const config = wizard.exportConfig();
  
  assert.ok(config.moduleSelection !== undefined);
  assert.ok(config.ecoStages !== undefined);
  assert.ok(config.ecoTypes !== undefined);
  assert.ok(config.workflow !== undefined);
  assert.ok(config.documentControl !== undefined);
  assert.ok(config.bomIntegration !== undefined);
  assert.equal(config.completedAt, null);
});
