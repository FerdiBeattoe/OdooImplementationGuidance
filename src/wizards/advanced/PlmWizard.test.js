import test from "node:test";
import assert from "node:assert/strict";
import { PlmWizard, PLM_STEPS, ECO_TYPES, ECO_STATES, DOCUMENT_STATES } from "./PlmWizard.js";

const mockClient = {
  searchRead: async (model, domain, fields) => {
    if (model === 'mrp.eco.type') {
      return [
        { id: 1, name: 'New Product' },
        { id: 2, name: 'Modification' }
      ];
    }
    return [];
  },
  create: async (model, data) => {
    return Math.floor(Math.random() * 10000) + 100;
  },
  companyId: 1
};

test("PlmWizard - initialize loads existing stages", async () => {
  const wizard = new PlmWizard(mockClient);
  const result = await wizard.initialize();

  assert.equal(result.success, true, "Initialize should succeed");
  assert.ok(wizard.state.existingStages !== undefined, "Should have existing stages");
  assert.equal(wizard.state.isLoading, false, "Should not be loading");
});

test("PlmWizard - default state has correct steps", () => {
  const wizard = new PlmWizard(mockClient);

  assert.equal(wizard.state.currentStep, PLM_STEPS.MODULE_SELECTION, "Should start at module selection");
  assert.ok(wizard.state.ecoStages, "Should have eco stages array");
  assert.ok(wizard.state.ecoTypes, "Should have eco types array");
  assert.equal(wizard.state.ecoStages.length, 5, "Should have 5 default stages");
});

test("PlmWizard - default ECO stages are correct", () => {
  const wizard = new PlmWizard(mockClient);

  const stageNames = wizard.state.ecoStages.map(s => s.name);
  assert.deepEqual(stageNames, ['Draft', 'Confirmed', 'In Progress', 'Review', 'Released'], "Should have correct default stages");
});

test("PlmWizard - default ECO types are correct", () => {
  const wizard = new PlmWizard(mockClient);

  assert.equal(wizard.state.ecoTypes.length, 3, "Should have 3 ECO types");
  assert.ok(wizard.state.ecoTypes.find(t => t.type === ECO_TYPES.NEW_PRODUCT), "Should have new product type");
  assert.ok(wizard.state.ecoTypes.find(t => t.type === ECO_TYPES.MODIFICATION), "Should have modification type");
  assert.ok(wizard.state.ecoTypes.find(t => t.type === ECO_TYPES.OBSOLESCENCE), "Should have obsolescence type");
});

test("PlmWizard - setModuleSelection updates selection", () => {
  const wizard = new PlmWizard(mockClient);

  wizard.setModuleSelection({
    install_plm: true,
    install_quality: true,
    install_mrp: true
  });

  assert.equal(wizard.state.moduleSelection.install_plm, true, "Should update install_plm");
  assert.equal(wizard.state.moduleSelection.install_quality, true, "Should update install_quality");
  assert.equal(wizard.state.moduleSelection.install_mrp, true, "Should update install_mrp");
});

test("PlmWizard - updateEcoStage modifies existing stage", () => {
  const wizard = new PlmWizard(mockClient);

  wizard.updateEcoStage(0, { name: 'Concept', sequence: 1 });

  assert.equal(wizard.state.ecoStages[0].name, 'Concept', "Should update name");
  assert.equal(wizard.state.ecoStages[0].sequence, 1, "Should update sequence");
});

test("PlmWizard - addEcoStage adds new stage", () => {
  const wizard = new PlmWizard(mockClient);

  wizard.addEcoStage({ name: 'Validation', fold: false });

  assert.equal(wizard.state.ecoStages.length, 6, "Should have 6 stages");
  assert.equal(wizard.state.ecoStages[5].name, 'Validation', "Should have correct name");
  assert.equal(wizard.state.ecoStages[5].sequence, 6, "Should have correct sequence");
});

test("PlmWizard - removeEcoStage removes and reorders", () => {
  const wizard = new PlmWizard(mockClient);

  wizard.removeEcoStage(0);

  assert.equal(wizard.state.ecoStages.length, 4, "Should have 4 stages");
  assert.equal(wizard.state.ecoStages[0].name, 'Confirmed', "Should have second stage first");
  assert.equal(wizard.state.ecoStages[0].sequence, 1, "Should have sequence 1");
});

test("PlmWizard - setWorkflowConfig updates workflow", () => {
  const wizard = new PlmWizard(mockClient);

  wizard.setWorkflowConfig({
    require_approval: false,
    auto_bom_update: false,
    default_eco_type: ECO_TYPES.NEW_PRODUCT
  });

  assert.equal(wizard.state.workflow.require_approval, false, "Should update require_approval");
  assert.equal(wizard.state.workflow.auto_bom_update, false, "Should update auto_bom_update");
  assert.equal(wizard.state.workflow.default_eco_type, ECO_TYPES.NEW_PRODUCT, "Should update default type");
});

test("PlmWizard - setDocumentControl updates document control", () => {
  const wizard = new PlmWizard(mockClient);

  wizard.setDocumentControl({
    auto_document_creation: false,
    default_life_time: 180,
    auto_new_revision: false
  });

  assert.equal(wizard.state.documentControl.auto_document_creation, false, "Should update auto_document_creation");
  assert.equal(wizard.state.documentControl.default_life_time, 180, "Should update default_life_time");
});

test("PlmWizard - setBomIntegration updates BOM integration", () => {
  const wizard = new PlmWizard(mockClient);

  wizard.setBomIntegration({
    link_boms_to_eco: false,
    update_routing_on_release: true,
    create_bom_variants: true
  });

  assert.equal(wizard.state.bomIntegration.link_boms_to_eco, false, "Should update link_boms_to_eco");
  assert.equal(wizard.state.bomIntegration.update_routing_on_release, true, "Should update update_routing_on_release");
});

test("PlmWizard - nextStep validates ECO stages", async () => {
  const wizard = new PlmWizard(mockClient);
  await wizard.initialize();

  wizard.state.currentStep = PLM_STEPS.ECO_STAGES;
  wizard.state.ecoStages = [{ name: 'Only One' }];

  const result = await wizard.nextStep();

  assert.equal(result.success, false, "Should fail with less than 2 stages");
  assert.ok(wizard.state.errors.stages, "Should have stages error");
});

test("PlmWizard - nextStep requires stage names", async () => {
  const wizard = new PlmWizard(mockClient);
  await wizard.initialize();

  wizard.state.currentStep = PLM_STEPS.ECO_STAGES;
  wizard.state.ecoStages = [
    { name: '' },
    { name: 'Stage 2' }
  ];

  const result = await wizard.nextStep();

  assert.equal(result.success, false, "Should fail without stage names");
});

test("PlmWizard - nextStep proceeds with valid stages", async () => {
  const wizard = new PlmWizard(mockClient);
  await wizard.initialize();

  wizard.state.currentStep = PLM_STEPS.ECO_STAGES;

  const result = await wizard.nextStep();

  assert.equal(result.success, true, "Should proceed with valid stages");
  assert.equal(wizard.state.currentStep, PLM_STEPS.WORKFLOW_CONFIG, "Should advance to workflow config");
});

test("PlmWizard - prevStep goes back", async () => {
  const wizard = new PlmWizard(mockClient);
  await wizard.initialize();

  wizard.state.currentStep = PLM_STEPS.WORKFLOW_CONFIG;

  const result = wizard.prevStep();

  assert.equal(result.success, true, "Should go back");
  assert.equal(wizard.state.currentStep, PLM_STEPS.ECO_STAGES, "Should return to ECO stages");
});

test("PlmWizard - prevStep does nothing at first step", () => {
  const wizard = new PlmWizard(mockClient);

  const result = wizard.prevStep();

  assert.equal(result.success, false, "Should not go back from first step");
});

test("PlmWizard - getStepInfo returns step details", () => {
  const wizard = new PlmWizard(mockClient);

  const info = wizard.getStepInfo(PLM_STEPS.ECO_STAGES);
  assert.ok(info.title, "Should have title");
  assert.equal(info.title, 'ECO Stages', "Should have correct title");
});

test("PlmWizard - getProgress calculates percentage", () => {
  const wizard = new PlmWizard(mockClient);

  const progress = wizard.getProgress();

  assert.equal(progress, 0, "Should be 0% at first step");
});

test("PlmWizard - getDefaultEcoStages returns stages", () => {
  const wizard = new PlmWizard(mockClient);

  const stages = wizard.getDefaultEcoStages();

  assert.ok(stages.length > 0, "Should return stages");
});

test("PlmWizard - getEcoTypePreview returns type preview", () => {
  const wizard = new PlmWizard(mockClient);

  const preview = wizard.getEcoTypePreview();

  assert.ok(preview.types, "Should have types");
  assert.ok(preview.defaultType, "Should have default type");
});

test("PlmWizard - reset restores initial state", async () => {
  const wizard = new PlmWizard(mockClient);
  await wizard.initialize();

  wizard.addEcoStage({ name: 'Custom Stage' });
  wizard.state.currentStep = PLM_STEPS.EXECUTION;
  wizard.reset();

  assert.equal(wizard.state.currentStep, PLM_STEPS.MODULE_SELECTION, "Should reset to first step");
  assert.equal(wizard.state.ecoStages.length, 5, "Should reset to 5 default stages");
});

test("PlmWizard - exportConfig returns configuration", () => {
  const wizard = new PlmWizard(mockClient);

  const config = wizard.exportConfig();

  assert.ok(config.moduleSelection, "Should export module selection");
  assert.ok(config.ecoStages, "Should export ECO stages");
  assert.ok(config.ecoTypes, "Should export ECO types");
  assert.ok(config.workflow, "Should export workflow");
  assert.ok(config.documentControl, "Should export document control");
  assert.ok(config.bomIntegration, "Should export BOM integration");
});

test("PlmWizard - executeSetup creates stages and types", async () => {
  const wizard = new PlmWizard(mockClient);
  await wizard.initialize();
  wizard.state.currentStep = PLM_STEPS.BOM_INTEGRATION;

  const result = await wizard._executeSetup();

  assert.equal(result.success, true, "Should execute successfully");
  assert.ok(wizard.state.executionResult.stagesCreated > 0, "Should create stages");
  assert.ok(wizard.state.executionResult.typesCreated > 0, "Should create types");
});

test("PlmWizard - ECO_STATES and DOCUMENT_STATES are exported", () => {
  assert.ok(ECO_STATES.DRAFT, "Should have DRAFT state");
  assert.ok(ECO_STATES.RELEASED, "Should have RELEASED state");
  assert.ok(DOCUMENT_STATES.DRAFT, "Should have DOCUMENT DRAFT state");
  assert.ok(DOCUMENT_STATES.APPROVED, "Should have APPROVED state");
});
