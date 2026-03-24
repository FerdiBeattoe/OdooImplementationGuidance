/**
 * CRM Wizard - Pipeline Stages, Teams, and Lead Sources Setup
 * Phase 5: Core Operations Wizards
 * 
 * Validates inputs before next step, checks cross-domain dependencies
 */

import { OdooClient } from '../../../tools/src/api/OdooClient.js';

export const CRM_STEPS = {
  PIPELINE_CONFIG: 1,
  STAGE_DEFINITION: 2,
  TEAM_SETUP: 3,
  LEAD_SOURCES: 4,
  ASSIGNMENT_RULES: 5,
  COMPLETION: 6
};

export const DEFAULT_PIPELINE_STAGES = [
  { name: 'New', sequence: 1, is_won: false, is_unwanted: false },
  { name: 'Qualified', sequence: 2, is_won: false, is_unwanted: false },
  { name: 'Proposition', sequence: 3, is_won: false, is_unwanted: false },
  { name: 'Negotiation', sequence: 4, is_won: false, is_unwanted: false },
  { name: 'Won', sequence: 5, is_won: true, is_unwanted: false },
  { name: 'Lost', sequence: 6, is_won: false, is_unwanted: true }
];

export const DEFAULT_TEAMS = [
  { name: 'Sales Team', alias_name: 'sales', members: [] }
];

export const DEFAULT_LEAD_SOURCES = [
  { name: 'Website', active: true },
  { name: 'Phone Call', active: true },
  { name: 'Email Campaign', active: true },
  { name: 'Social Media', active: true },
  { name: 'Referral', active: true },
  { name: 'Trade Show', active: true }
];

export class CrmWizard {
  constructor(client) {
    this.client = client;
    this.state = this._getInitialState();
    this._crossDomainDependencies = {
      requiresInventory: false,
      requiresSales: false,
      inventoryWarehouseId: null
    };
  }

  _getInitialState() {
    return {
      currentStep: CRM_STEPS.PIPELINE_CONFIG,
      pipeline: {
        name: 'Sales Pipeline',
        use_leads: true,
        use_opportunities: true,
        team_id: null
      },
      stages: [...DEFAULT_PIPELINE_STAGES],
      teams: [...DEFAULT_TEAMS],
      leadSources: [...DEFAULT_LEAD_SOURCES],
      assignmentRules: {
        autoAssign: false,
        assignByTerritory: false,
        assignByRoundRobin: false,
        min_lead_days: 3
      },
      existingTeams: [],
      existingStages: [],
      errors: {},
      warnings: [],
      isLoading: false
    };
  }

  async initialize() {
    this._setState({ isLoading: true });

    try {
      const [teams, stages] = await Promise.all([
        this._fetchExistingTeams(),
        this._fetchExistingStages()
      ]);

      this._setState({
        existingTeams: teams,
        existingStages: stages,
        isLoading: false
      });

      return { success: true };
    } catch (error) {
      this._setState({ isLoading: false, errors: { general: error.message } });
      return { success: false, error: error.message };
    }
  }

  async _fetchExistingTeams() {
    if (!this.client) return [];
    return this.client.searchRead(
      'crm.team',
      [],
      ['id', 'name', 'member_ids', 'alias_name', 'active'],
      { limit: 100 }
    );
  }

  async _fetchExistingStages() {
    if (!this.client) return [];
    return this.client.searchRead(
      'crm.stage',
      [],
      ['id', 'name', 'sequence', 'is_won', 'is_unwanted', 'team_id', 'fold']
    );
  }

  _setState(updates) {
    this.state = { ...this.state, ...updates };
  }

  _clearErrors() {
    this.state.errors = {};
  }

  _addWarning(message) {
    if (!this.state.warnings.includes(message)) {
      this.state.warnings.push(message);
    }
  }

  setPipelineField(field, value) {
    this.state.pipeline = { ...this.state.pipeline, [field]: value };
  }

  updateStage(index, field, value) {
    const stages = [...this.state.stages];
    stages[index] = { ...stages[index], [field]: value };
    this.state.stages = stages;
  }

  addStage() {
    const newSequence = this.state.stages.length + 1;
    this.state.stages.push({
      name: `Stage ${newSequence}`,
      sequence: newSequence,
      is_won: false,
      is_unwanted: false
    });
  }

  removeStage(index) {
    if (this.state.stages.length > 2) {
      const stages = [...this.state.stages];
      stages.splice(index, 1);
      this.state.stages = stages.map((s, i) => ({ ...s, sequence: i + 1 }));
    } else {
      this.state.errors.stages = 'Minimum 2 stages required';
    }
  }

  updateTeam(index, field, value) {
    const teams = [...this.state.teams];
    teams[index] = { ...teams[index], [field]: value };
    this.state.teams = teams;
  }

  addTeam() {
    this.state.teams.push({
      name: `Sales Team ${this.state.teams.length + 1}`,
      alias_name: `sales_${this.state.teams.length + 1}`,
      members: []
    });
  }

  removeTeam(index) {
    if (this.state.teams.length > 1) {
      const teams = [...this.state.teams];
      teams.splice(index, 1);
      this.state.teams = teams;
    }
  }

  addTeamMember(teamIndex, userId) {
    const teams = [...this.state.teams];
    if (!teams[teamIndex].members.includes(userId)) {
      teams[teamIndex].members.push(userId);
      this.state.teams = teams;
    }
  }

  removeTeamMember(teamIndex, userId) {
    const teams = [...this.state.teams];
    const memberIndex = teams[teamIndex].members.indexOf(userId);
    if (memberIndex !== -1) {
      teams[teamIndex].members.splice(memberIndex, 1);
      this.state.teams = teams;
    }
  }

  updateLeadSource(index, field, value) {
    const sources = [...this.state.leadSources];
    sources[index] = { ...sources[index], [field]: value };
    this.state.leadSources = sources;
  }

  addLeadSource() {
    this.state.leadSources.push({ name: 'New Source', active: true });
  }

  removeLeadSource(index) {
    if (this.state.leadSources.length > 1) {
      const sources = [...this.state.leadSources];
      sources.splice(index, 1);
      this.state.leadSources = sources;
    }
  }

  setAssignmentRules(rules) {
    this.state.assignmentRules = { ...this.state.assignmentRules, ...rules };
  }

  setCrossDomainDependency(field, value) {
    this._crossDomainDependencies[field] = value;
    if (field === 'requiresInventory' && value === true) {
      this._addWarning('CRM will reference inventory warehouse for delivery lead times');
    }
  }

  _validateCurrentStep() {
    const { currentStep, pipeline, stages, teams, leadSources } = this.state;
    const errors = {};

    switch (currentStep) {
      case CRM_STEPS.PIPELINE_CONFIG:
        if (!pipeline.name || pipeline.name.trim().length < 2) {
          errors.name = 'Pipeline name is required (min 2 characters)';
        }
        break;

      case CRM_STEPS.STAGE_DEFINITION:
        if (!stages || stages.length < 2) {
          errors.stages = 'Minimum 2 stages required';
        }
        const hasWon = stages.some(s => s.is_won);
        const hasLost = stages.some(s => s.is_unwanted);
        if (!hasWon) {
          errors.stages = 'At least one Won stage is required';
        }
        if (stages.some(s => !s.name || s.name.trim().length === 0)) {
          errors.stages = 'All stages must have names';
        }
        break;

      case CRM_STEPS.TEAM_SETUP:
        if (!teams || teams.length === 0) {
          errors.teams = 'At least one team is required';
        }
        for (let i = 0; i < teams.length; i++) {
          if (!teams[i].name || teams[i].name.trim().length === 0) {
            errors[`team_${i}`] = `Team ${i + 1} must have a name`;
          }
        }
        break;

      case CRM_STEPS.LEAD_SOURCES:
        const activeSources = leadSources.filter(s => s.active);
        if (activeSources.length === 0) {
          errors.leadSources = 'At least one active lead source is required';
        }
        break;

      case CRM_STEPS.ASSIGNMENT_RULES:
        if (this.state.assignmentRules.autoAssign) {
          const teamWithMembers = teams.some(t => t.members && t.members.length > 0);
          if (!teamWithMembers) {
            errors.assignmentRules = 'Auto-assignment requires team members';
          }
        }
        break;
    }

    return { valid: Object.keys(errors).length === 0, errors };
  }

  async nextStep() {
    this._clearErrors();
    const validation = this._validateCurrentStep();

    if (!validation.valid) {
      this.state.errors = validation.errors;
      return { success: false, errors: validation.errors };
    }

    const { currentStep } = this.state;

    if (currentStep === CRM_STEPS.ASSIGNMENT_RULES) {
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

  async _executeSetup() {
    this._setState({ isLoading: true });

    try {
      const { pipeline, stages, teams, leadSources, assignmentRules } = this.state;

      const createdStageIds = await this._createStages(stages);
      const createdTeamIds = await this._createTeams(teams);
      await this._createLeadSources(leadSources);

      if (assignmentRules.autoAssign) {
        await this._createAssignmentRules(teams);
      }

      this._setState({
        currentStep: CRM_STEPS.COMPLETION,
        isLoading: false,
        createdStageIds,
        createdTeamIds
      });

      return {
        success: true,
        createdStageIds,
        createdTeamIds,
        config: this.exportConfig()
      };
    } catch (error) {
      this._setState({ isLoading: false, errors: { general: error.message } });
      return { success: false, error: error.message };
    }
  }

  async _createStages(stages) {
    if (!this.client) return [];
    const stageIds = [];

    for (const stage of stages) {
      const stageId = await this.client.create('crm.stage', [{
        name: stage.name,
        sequence: stage.sequence,
        is_won: stage.is_won,
        is_unwanted: stage.is_unwanted || false,
        fold: false
      }]);
      stageIds.push(stageId);
    }

    return stageIds;
  }

  async _createTeams(teams) {
    if (!this.client) return [];
    const teamIds = [];

    for (const team of teams) {
      const teamId = await this.client.create('crm.team', [{
        name: team.name,
        alias_name: team.alias_name || team.name.toLowerCase().replace(/\s+/g, '_'),
        member_ids: team.members.length > 0
          ? [[6, 0, team.members]]
          : [[6, 0, []]],
        active: true
      }]);
      teamIds.push(teamId);
    }

    return teamIds;
  }

  async _createLeadSources(leadSources) {
    if (!this.client) return [];
    const sourceIds = [];

    for (const source of leadSources) {
      if (source.active) {
        const sourceId = await this.client.create('crm.lead.source', [{
          name: source.name,
          active: true
        }]);
        sourceIds.push(sourceId);
      }
    }

    return sourceIds;
  }

  async _createAssignmentRules(teams) {
    if (!this.client) return;
    for (const team of teams) {
      if (team.members && team.members.length > 0) {
        await this.client.create('crm.assignment.rule', [{
          name: `Auto-assign to ${team.name}`,
          team_id: team.id,
          user_ids: [[6, 0, team.members]],
          mode: this.state.assignmentRules.assignByRoundRobin ? 'round_robin' : 'balance',
          min_lead_days: this.state.assignmentRules.min_lead_days || 3
        }]);
      }
    }
  }

  getStepInfo(step) {
    const steps = {
      [CRM_STEPS.PIPELINE_CONFIG]: {
        title: 'Pipeline Configuration',
        description: 'Set up your sales pipeline name and basic settings'
      },
      [CRM_STEPS.STAGE_DEFINITION]: {
        title: 'Stage Definition',
        description: 'Define the stages leads flow through'
      },
      [CRM_STEPS.TEAM_SETUP]: {
        title: 'Team Setup',
        description: 'Create sales teams and assign members'
      },
      [CRM_STEPS.LEAD_SOURCES]: {
        title: 'Lead Sources',
        description: 'Configure where leads originate from'
      },
      [CRM_STEPS.ASSIGNMENT_RULES]: {
        title: 'Assignment Rules',
        description: 'Set up automatic lead assignment rules'
      },
      [CRM_STEPS.COMPLETION]: {
        title: 'Complete',
        description: 'CRM setup is complete'
      }
    };
    return steps[step] || {};
  }

  getProgress() {
    const totalSteps = Object.values(CRM_STEPS).length;
    return Math.round(((this.state.currentStep - 1) / (totalSteps - 1)) * 100);
  }

  getCrossDomainDependencies() {
    return this._crossDomainDependencies;
  }

  getWarnings() {
    return this.state.warnings;
  }

  reset() {
    this.state = this._getInitialState();
    this._crossDomainDependencies = {
      requiresInventory: false,
      requiresSales: false,
      inventoryWarehouseId: null
    };
  }

  exportConfig() {
    return {
      pipeline: this.state.pipeline,
      stages: this.state.stages,
      teams: this.state.teams,
      leadSources: this.state.leadSources.filter(s => s.active),
      assignmentRules: this.state.assignmentRules,
      crossDomainDependencies: this._crossDomainDependencies,
      completedAt: this.state.currentStep === CRM_STEPS.COMPLETION
        ? new Date().toISOString()
        : null
    };
  }
}

export default CrmWizard;
