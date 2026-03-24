/**
 * Workcenter Wizard - Work Centers and Capacity Planning
 * Phase 6: Manufacturing & Advanced Operations
 */

import { OdooClient } from '../../api/OdooClient.js';

export const WORKCENTER_STEPS = {
  WORKCENTER_BASICS: 1,
  CAPACITY_PLANNING: 2,
  WORKING_HOURS: 3,
  CROSS_DOMAIN_LINKS: 4,
  COMPLETION: 5
};

export const DEFAULT_WORKCENTER_DATA = {
  name: '',
  code: '',
  description: '',
  capacity_efficiency: 1.0,
  time_efficiency: 1.0,
  costs_hour: 0,
  costs_hour_categorical: 0,
  capacity_cycle_count: 0,
  routing_line_ids: []
};

export const DEFAULT_WORKING_HOURS = {
  monday: { working: true, hours: [{ hour_from: 8, hour_to: 17 }] },
  tuesday: { working: true, hours: [{ hour_from: 8, hour_to: 17 }] },
  wednesday: { working: true, hours: [{ hour_from: 8, hour_to: 17 }] },
  thursday: { working: true, hours: [{ hour_from: 8, hour_to: 17 }] },
  friday: { working: true, hours: [{ hour_from: 8, hour_to: 17 }] },
  saturday: { working: false, hours: [] },
  sunday: { working: false, hours: [] }
};

export class WorkcenterWizard {
  constructor(client) {
    this.client = client;
    this.state = this._getInitialState();
    this._crossDomainDependencies = {
      requiresInventory: true,
      locationId: null,
      requiresProduct: true,
      productCategoryIds: []
    };
  }

  _getInitialState() {
    return {
      currentStep: WORKCENTER_STEPS.WORKCENTER_BASICS,
      workcenters: [{ ...DEFAULT_WORKCENTER_DATA, id: 1 }],
      workingHours: { ...DEFAULT_WORKING_HOURS },
      workingHoursTemplates: [
        { id: 'standard', name: 'Standard (8-17 Mon-Fri)' },
        { id: 'extended', name: 'Extended (6-22 Mon-Sat)' },
        { id: '24_7', name: '24/7 Operations' },
        { id: 'custom', name: 'Custom Hours' }
      ],
      resourceCalendar: null,
      capacityPlanning: {
        defaultCapacity: 1,
        maxCapacity: 1,
        overtimePossible: false,
        timeStart: 0,
        timeStop: 24
      },
      existingWorkcenters: [],
      existingLocations: [],
      existingProducts: [],
      errors: {},
      warnings: [],
      isLoading: false
    };
  }

  async initialize() {
    this._setState({ isLoading: true });

    try {
      const [workcenters, locations, products] = await Promise.all([
        this._fetchWorkcenters(),
        this._fetchLocations(),
        this._fetchProducts()
      ]);

      this._setState({
        existingWorkcenters: workcenters,
        existingLocations: locations,
        existingProducts: products,
        isLoading: false
      });

      return { success: true };
    } catch (error) {
      this._setState({ isLoading: false, errors: { general: error.message } });
      return { success: false, error: error.message };
    }
  }

  async _fetchWorkcenters() {
    return this.client.searchRead(
      'mrp.workcenter',
      [],
      ['id', 'name', 'code', 'capacity', 'costs_hour', 'active', 'resource_id'],
      { limit: 200 }
    );
  }

  async _fetchLocations() {
    return this.client.searchRead(
      'stock.location',
      [['usage', '=', 'internal']],
      ['id', 'name', 'location_id', 'complete_name'],
      { limit: 100 }
    );
  }

  async _fetchProducts() {
    return this.client.searchRead(
      'product.product',
      [],
      ['id', 'name', 'default_code', 'type'],
      { limit: 100 }
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

  addWorkcenter() {
    const newId = this.state.workcenters.length + 1;
    this.state.workcenters.push({
      ...DEFAULT_WORKCENTER_DATA,
      id: newId,
      name: `Work Center ${newId}`,
      code: `WC${newId}`
    });
  }

  updateWorkcenter(index, field, value) {
    const workcenters = [...this.state.workcenters];
    workcenters[index] = { ...workcenters[index], [field]: value };
    this.state.workcenters = workcenters;
  }

  removeWorkcenter(index) {
    if (this.state.workcenters.length > 1) {
      const workcenters = [...this.state.workcenters];
      workcenters.splice(index, 1);
      this.state.workcenters = workcenters;
    } else {
      this.state.errors.workcenters = 'At least one work center is required';
    }
  }

  setWorkingHours(day, hours) {
    this.state.workingHours[day] = { ...this.state.workingHours[day], ...hours };
  }

  applyWorkingHoursTemplate(templateId) {
    switch (templateId) {
      case 'standard':
        this.state.workingHours = {
          monday: { working: true, hours: [{ hour_from: 8, hour_to: 17 }] },
          tuesday: { working: true, hours: [{ hour_from: 8, hour_to: 17 }] },
          wednesday: { working: true, hours: [{ hour_from: 8, hour_to: 17 }] },
          thursday: { working: true, hours: [{ hour_from: 8, hour_to: 17 }] },
          friday: { working: true, hours: [{ hour_from: 8, hour_to: 17 }] },
          saturday: { working: false, hours: [] },
          sunday: { working: false, hours: [] }
        };
        break;
      case 'extended':
        this.state.workingHours = {
          monday: { working: true, hours: [{ hour_from: 6, hour_to: 22 }] },
          tuesday: { working: true, hours: [{ hour_from: 6, hour_to: 22 }] },
          wednesday: { working: true, hours: [{ hour_from: 6, hour_to: 22 }] },
          thursday: { working: true, hours: [{ hour_from: 6, hour_to: 22 }] },
          friday: { working: true, hours: [{ hour_from: 6, hour_to: 22 }] },
          saturday: { working: true, hours: [{ hour_from: 8, hour_to: 16 }] },
          sunday: { working: false, hours: [] }
        };
        break;
      case '24_7':
        this.state.workingHours = {
          monday: { working: true, hours: [{ hour_from: 0, hour_to: 24 }] },
          tuesday: { working: true, hours: [{ hour_from: 0, hour_to: 24 }] },
          wednesday: { working: true, hours: [{ hour_from: 0, hour_to: 24 }] },
          thursday: { working: true, hours: [{ hour_from: 0, hour_to: 24 }] },
          friday: { working: true, hours: [{ hour_from: 0, hour_to: 24 }] },
          saturday: { working: true, hours: [{ hour_from: 0, hour_to: 24 }] },
          sunday: { working: true, hours: [{ hour_from: 0, hour_to: 24 }] }
        };
        break;
    }
  }

  addWorkingHour(day) {
    const currentHours = this.state.workingHours[day].hours;
    if (currentHours.length < 3) {
      currentHours.push({ hour_from: 9, hour_to: 17 });
      this.state.workingHours[day] = { ...this.state.workingHours[day], hours: currentHours };
    }
  }

  removeWorkingHour(day, hourIndex) {
    if (this.state.workingHours[day].hours.length > 1) {
      const hours = [...this.state.workingHours[day].hours];
      hours.splice(hourIndex, 1);
      this.state.workingHours[day] = { ...this.state.workingHours[day], hours };
    }
  }

  updateWorkingHour(day, hourIndex, field, value) {
    const hours = [...this.state.workingHours[day].hours];
    hours[hourIndex] = { ...hours[hourIndex], [field]: value };
    this.state.workingHours[day] = { ...this.state.workingHours[day], hours };
  }

  setCapacityPlanning(planning) {
    this.state.capacityPlanning = { ...this.state.capacityPlanning, ...planning };
  }

  setCrossDomainLink(field, value) {
    this._crossDomainDependencies[field] = value;
  }

  _validateCurrentStep() {
    const { currentStep, workcenters, workingHours, capacityPlanning } = this.state;
    const errors = {};

    switch (currentStep) {
      case WORKCENTER_STEPS.WORKCENTER_BASICS:
        if (!workcenters || workcenters.length === 0) {
          errors.workcenters = 'At least one work center is required';
        }
        for (let i = 0; i < workcenters.length; i++) {
          if (!workcenters[i].name || workcenters[i].name.trim().length === 0) {
            errors[`workcenter_${i}`] = `Work Center ${i + 1} must have a name`;
          }
          if (!workcenters[i].code || workcenters[i].code.trim().length === 0) {
            errors[`workcenter_code_${i}`] = `Work Center ${i + 1} must have a code`;
          }
          if (workcenters[i].capacity_efficiency <= 0) {
            errors[`workcenter_eff_${i}`] = `Work Center ${i + 1} efficiency must be positive`;
          }
          if (workcenters[i].costs_hour < 0) {
            errors[`workcenter_cost_${i}`] = `Work Center ${i + 1} cost cannot be negative`;
          }
        }
        break;

      case WORKCENTER_STEPS.CAPACITY_PLANNING:
        if (capacityPlanning.defaultCapacity <= 0) {
          errors.defaultCapacity = 'Default capacity must be at least 1';
        }
        if (capacityPlanning.maxCapacity < capacityPlanning.defaultCapacity) {
          errors.maxCapacity = 'Maximum capacity must be >= default capacity';
        }
        if (capacityPlanning.timeStart >= capacityPlanning.timeStop) {
          errors.timeRange = 'End time must be after start time';
        }
        break;

      case WORKCENTER_STEPS.WORKING_HOURS:
        const workingDays = Object.entries(workingHours).filter(([_, data]) => data.working);
        if (workingDays.length === 0) {
          errors.workingHours = 'At least one working day is required';
        }
        for (const [day, data] of Object.entries(workingHours)) {
          if (data.working) {
            for (const hour of data.hours) {
              if (hour.hour_from >= hour.hour_to) {
                errors[`hours_${day}`] = `${day}: Start time must be before end time`;
              }
            }
          }
        }
        break;

      case WORKCENTER_STEPS.CROSS_DOMAIN_LINKS:
        if (this._crossDomainDependencies.requiresInventory) {
          if (!this._crossDomainDependencies.locationId) {
            errors.location = 'Inventory location is required for manufacturing';
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

    if (currentStep === WORKCENTER_STEPS.CROSS_DOMAIN_LINKS) {
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
      const { workcenters, workingHours, capacityPlanning } = this.state;

      const calendarId = await this._createWorkingCalendar(workingHours, capacityPlanning);

      const createdWorkcenterIds = await this._createWorkcenters(workcenters, calendarId);

      this._setState({
        currentStep: WORKCENTER_STEPS.COMPLETION,
        isLoading: false,
        createdWorkcenterIds,
        resourceCalendar: calendarId
      });

      return {
        success: true,
        createdWorkcenterIds,
        resourceCalendar: calendarId,
        config: this.exportConfig()
      };
    } catch (error) {
      this._setState({ isLoading: false, errors: { general: error.message } });
      return { success: false, error: error.message };
    }
  }

  async _createWorkingCalendar(workingHours, capacityPlanning) {
    const attendanceLines = [];
    const dayMap = {
      monday: 1, tuesday: 2, wednesday: 3, thursday: 4,
      friday: 5, saturday: 6, sunday: 7
    };

    for (const [day, data] of Object.entries(workingHours)) {
      if (data.working) {
        for (const hour of data.hours) {
          attendanceLines.push([
            0, 0, {
              dayofweek: day,
              hour_from: hour.hour_from * 60,
              hour_to: hour.hour_to * 60,
              day_period: 'morning'
            }
          ]);
          if (hour.hour_to - hour.hour_from >= 4) {
            attendanceLines.push([
              0, 0, {
                dayofweek: day,
                hour_from: (hour.hour_from + (hour.hour_to - hour.hour_from) / 2) * 60,
                hour_to: hour.hour_to * 60,
                day_period: 'afternoon'
              }
            ]);
          }
        }
      }
    }

    const calendarId = await this.client.create('resource.calendar', [{
      name: 'Manufacturing Hours',
      hours_per_day: (capacityPlanning.timeStop - capacityPlanning.timeStart) / 
        Object.values(workingHours).filter(d => d.working).length,
      attendance_ids: attendanceLines
    }]);

    return calendarId;
  }

  async _createWorkcenters(workcenters, calendarId) {
    const workcenterIds = [];

    for (const wc of workcenters) {
      const workcenterId = await this.client.create('mrp.workcenter', [{
        name: wc.name,
        code: wc.code,
        description: wc.description || '',
        capacity_efficiency: wc.capacity_efficiency,
        time_efficiency: wc.time_efficiency,
        costs_hour: wc.costs_hour,
        costs_hour_categorical: wc.costs_hour_categorical,
        capacity_cycle_count: wc.capacity_cycle_count,
        resource_calendar_id: calendarId,
        active: true
      }]);
      workcenterIds.push(workcenterId);
    }

    return workcenterIds;
  }

  getStepInfo(step) {
    const steps = {
      [WORKCENTER_STEPS.WORKCENTER_BASICS]: {
        title: 'Work Center Basics',
        description: 'Define work center name, code, and basic parameters'
      },
      [WORKCENTER_STEPS.CAPACITY_PLANNING]: {
        title: 'Capacity Planning',
        description: 'Set capacity limits and overtime options'
      },
      [WORKCENTER_STEPS.WORKING_HOURS]: {
        title: 'Working Hours',
        description: 'Define operating schedule'
      },
      [WORKCENTER_STEPS.CROSS_DOMAIN_LINKS]: {
        title: 'Cross-Domain Links',
        description: 'Connect to inventory and products'
      },
      [WORKCENTER_STEPS.COMPLETION]: {
        title: 'Complete',
        description: 'Work center setup is complete'
      }
    };
    return steps[step] || {};
  }

  getProgress() {
    const totalSteps = Object.values(WORKCENTER_STEPS).length;
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
      requiresInventory: true,
      locationId: null,
      requiresProduct: true,
      productCategoryIds: []
    };
  }

  exportConfig() {
    return {
      workcenters: this.state.workcenters,
      workingHours: this.state.workingHours,
      capacityPlanning: this.state.capacityPlanning,
      crossDomainDependencies: this._crossDomainDependencies,
      completedAt: this.state.currentStep === WORKCENTER_STEPS.COMPLETION
        ? new Date().toISOString()
        : null
    };
  }
}

export default WorkcenterWizard;
