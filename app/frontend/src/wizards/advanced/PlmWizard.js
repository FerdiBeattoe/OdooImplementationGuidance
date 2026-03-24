/**
 * PLM (Product Lifecycle Management) Wizard
 * Guided setup for ECO stages, document control, and engineering workflows
 */

import { OdooClient } from '../../api/OdooClient.js';

export const PLM_STEPS = {
  MODULE_SELECTION: 1,
  ECO_STAGES: 2,
  WORKFLOW_CONFIG: 3,
  DOCUMENT_CONTROL: 4,
  BOM_INTEGRATION: 5,
  EXECUTION: 6,
  COMPLETION: 7
};

export const ECO_TYPES = {
  NEW_PRODUCT: 'new',
  MODIFICATION: 'modify',
  OBSOLESCENCE: 'obsolete'
};

export const ECO_STATES = {
  DRAFT: 'draft',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  RELEASED: 'released',
  REJECTED: 'rejected',
  OBSOLETE: 'obsolete'
};

export const DOCUMENT_STATES = {
  DRAFT: 'draft',
  REVIEW: 'review',
  APPROVED: 'approved',
  RELEASED: 'released',
  ARCHIVED: 'archived'
};

export class PlmWizard {
  constructor(client) {
    this.client = client;
    this.state = this._getInitialState();
  }

  _getInitialState() {
    return {
      currentStep: PLM_STEPS.MODULE_SELECTION,
      moduleSelection: {
        install_plm: true,
        install_quality: false,
        install_mrp: false
      },
      ecoStages: [
        { name: 'Draft', sequence: 1, fold: false, allowed_initial_states: 'draft' },
        { name: 'Confirmed', sequence: 2, fold: false, allowed_initial_states: 'draft,confirmed' },
        { name: 'In Progress', sequence: 3, fold: false, allowed_initial_states: 'confirmed,in_progress' },
        { name: 'Review', sequence: 4, fold: false, allowed_initial_states: 'in_progress,review' },
        { name: 'Released', sequence: 5, fold: true, allowed_initial_states: 'review,released' }
      ],
      ecoTypes: [
        { name: 'New Product', type: ECO_TYPES.NEW_PRODUCT },
        { name: 'Modification', type: ECO_TYPES.MODIFICATION },
        { name: 'Obsolescence', type: ECO_TYPES.OBSOLESCENCE }
      ],
      workflow: {
        require_approval: true,
        auto_bom_update: true,
        require_drawing: false,
        default_eco_type: ECO_TYPES.MODIFICATION,
        approval_emails: true
      },
      documentControl: {
        auto_document_creation: true,
        auto_archive_old_revision: true,
        default_life_time: 365,
        auto_new_revision: true,
        create_from_drawing: false
      },
      bomIntegration: {
        link_boms_to_eco: true,
        update_routing_on_release: false,
        create_bom_variants: false
      },
      existingStages: [],
      errors: {},
      isLoading: false,
      executionResult: null
    };
  }

  async initialize() {
    this._setState({ isLoading: true });

    try {
      const existingStages = await this._fetchExistingStages();
      this._setState({
        existingStages,
        isLoading: false
      });

      return { success: true };
    } catch (error) {
      this._setState({ isLoading: false, errors: { general: error.message } });
      return { success: false, error: error.message };
    }
  }

  async _fetchExistingStages() {
    try {
      return await this.client.searchRead('mrp.eco.type', [], ['id', 'name']);
    } catch {
      return [];
    }
  }

  _setState(updates) {
    this.state = { ...this.state, ...updates };
  }

  setModuleSelection(selection) {
    this.state.moduleSelection = { ...this.state.moduleSelection, ...selection };
  }

  updateEcoStage(index, stage) {
    if (index >= 0 && index < this.state.ecoStages.length) {
      this.state.ecoStages[index] = { ...this.state.ecoStages[index], ...stage };
    }
  }

  addEcoStage(stage) {
    this.state.ecoStages.push({
      sequence: this.state.ecoStages.length + 1,
      fold: false,
      ...stage
    });
  }

  removeEcoStage(index) {
    this.state.ecoStages.splice(index, 1);
    this.state.ecoStages.forEach((stage, i) => {
      stage.sequence = i + 1;
    });
  }

  setWorkflowConfig(config) {
    this.state.workflow = { ...this.state.workflow, ...config };
  }

  setDocumentControl(config) {
    this.state.documentControl = { ...this.state.documentControl, ...config };
  }

  setBomIntegration(config) {
    this.state.bomIntegration = { ...this.state.bomIntegration, ...config };
  }

  async nextStep() {
    this._clearErrors();
    const validation = this._validateCurrentStep();

    if (!validation.valid) {
      this.state.errors = validation.errors;
      return { success: false, errors: validation.errors };
    }

    const { currentStep } = this.state;

    if (currentStep === PLM_STEPS.BOM_INTEGRATION) {
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
    const { currentStep, ecoStages } = this.state;
    const errors = {};

    switch (currentStep) {
      case PLM_STEPS.ECO_STAGES:
        if (ecoStages.length < 2) {
          errors.stages = 'At least 2 ECO stages are required';
        }
        for (let i = 0; i < ecoStages.length; i++) {
          if (!ecoStages[i].name) {
            errors[`stage_${i}`] = `Stage ${i + 1} requires a name`;
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
    this._setState({ isLoading: true, currentStep: PLM_STEPS.EXECUTION });

    try {
      const createdStages = [];
      const createdTypes = [];

      for (const stage of this.state.ecoStages) {
        const stageId = await this.client.create('mrp.eco.stage', [{
          name: stage.name,
          sequence: stage.sequence,
          fold: stage.fold || false,
          allowed_initial_states: stage.allowed_initial_states || 'draft',
          company_id: this.client.companyId
        }]);
        createdStages.push({ name: stage.name, id: stageId });
      }

      for (const ecoType of this.state.ecoTypes) {
        const typeId = await this.client.create('mrp.eco.type', [{
          name: ecoType.name,
          code: ecoType.type.toUpperCase(),
          active: true,
          company_id: this.client.companyId
        }]);
        createdTypes.push({ name: ecoType.name, id: typeId });
      }

      this._setState({
        currentStep: PLM_STEPS.COMPLETION,
        isLoading: false,
        executionResult: {
          stagesCreated: createdStages.length,
          typesCreated: createdTypes.length,
          stages: createdStages,
          types: createdTypes
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
      [PLM_STEPS.MODULE_SELECTION]: {
        title: 'Module Selection',
        description: 'Select which PLM-related modules to enable'
      },
      [PLM_STEPS.ECO_STAGES]: {
        title: 'ECO Stages',
        description: 'Define your Engineering Change Order workflow stages'
      },
      [PLM_STEPS.WORKFLOW_CONFIG]: {
        title: 'Workflow',
        description: 'Configure ECO approval and notification workflow'
      },
      [PLM_STEPS.DOCUMENT_CONTROL]: {
        title: 'Documents',
        description: 'Set up document control and revision management'
      },
      [PLM_STEPS.BOM_INTEGRATION]: {
        title: 'BOM Integration',
        description: 'Configure Bill of Materials integration settings'
      },
      [PLM_STEPS.EXECUTION]: {
        title: 'Creating Setup',
        description: 'Setting up PLM configuration in your database'
      },
      [PLM_STEPS.COMPLETION]: {
        title: 'Complete',
        description: 'PLM setup completed successfully'
      }
    };
    return steps[step] || {};
  }

  getProgress() {
    const totalSteps = Object.values(PLM_STEPS).length;
    return Math.round(((this.state.currentStep - 1) / (totalSteps - 1)) * 100);
  }

  getDefaultEcoStages() {
    return this.state.ecoStages;
  }

  getEcoTypePreview() {
    return {
      types: this.state.ecoTypes,
      defaultType: this.state.workflow.default_eco_type
    };
  }

  reset() {
    this.state = this._getInitialState();
  }

  exportConfig() {
    return {
      moduleSelection: this.state.moduleSelection,
      ecoStages: this.state.ecoStages,
      ecoTypes: this.state.ecoTypes,
      workflow: this.state.workflow,
      documentControl: this.state.documentControl,
      bomIntegration: this.state.bomIntegration,
      completedAt: this.state.currentStep === PLM_STEPS.COMPLETION
        ? new Date().toISOString()
        : null
    };
  }
}

export default PlmWizard;
