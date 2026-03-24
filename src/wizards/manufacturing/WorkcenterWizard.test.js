/**
 * Workcenter Wizard Tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { WorkcenterWizard, WORKCENTER_STEPS, DEFAULT_WORKCENTER_DATA, DEFAULT_WORKING_HOURS } from './WorkcenterWizard.js';

const mockClient = {
  searchRead: async (model, domain, fields, options) => {
    if (model === 'mrp.workcenter') {
      return [{ id: 1, name: 'Assembly', code: 'WC01', capacity: 100, costs_hour: 50 }];
    }
    if (model === 'stock.location') {
      return [{ id: 1, name: 'Production', location_type: 'internal' }];
    }
    if (model === 'product.product') {
      return [{ id: 1, name: 'Raw Material' }];
    }
    return [];
  },
  create: async (model, data) => Math.floor(Math.random() * 10000) + 100,
  write: async (model, ids, data) => true
};

test('WorkcenterWizard initializes with correct initial state', () => {
  const wizard = new WorkcenterWizard(mockClient);
  
  assert.equal(wizard.state.currentStep, WORKCENTER_STEPS.WORKCENTER_BASICS);
  assert.equal(wizard.state.workcenters.length, 1);
  assert.equal(wizard.state.workcenters[0].name, '');
  assert.deepEqual(wizard.state.workingHours, DEFAULT_WORKING_HOURS);
});

test('WorkcenterWizard initialize fetches existing data', async () => {
  const wizard = new WorkcenterWizard(mockClient);
  
  const result = await wizard.initialize();
  
  assert.equal(result.success, true);
  assert.equal(wizard.state.existingWorkcenters.length, 1);
  assert.equal(wizard.state.existingLocations.length, 1);
});

test('WorkcenterWizard addWorkcenter adds new workcenter', () => {
  const wizard = new WorkcenterWizard(mockClient);
  
  wizard.addWorkcenter();
  
  assert.equal(wizard.state.workcenters.length, 2);
  assert.equal(wizard.state.workcenters[1].name, 'Work Center 2');
  assert.equal(wizard.state.workcenters[1].code, 'WC2');
});

test('WorkcenterWizard updateWorkcenter updates field', () => {
  const wizard = new WorkcenterWizard(mockClient);
  
  wizard.updateWorkcenter(0, 'name', 'CNC Machine');
  wizard.updateWorkcenter(0, 'costs_hour', 75);
  
  assert.equal(wizard.state.workcenters[0].name, 'CNC Machine');
  assert.equal(wizard.state.workcenters[0].costs_hour, 75);
});

test('WorkcenterWizard removeWorkcenter removes workcenter', () => {
  const wizard = new WorkcenterWizard(mockClient);
  wizard.addWorkcenter();
  
  wizard.removeWorkcenter(1);
  
  assert.equal(wizard.state.workcenters.length, 1);
});

test('WorkcenterWizard removeWorkcenter prevents removing last workcenter', () => {
  const wizard = new WorkcenterWizard(mockClient);
  
  wizard.removeWorkcenter(0);
  
  assert.equal(wizard.state.workcenters.length, 1);
  assert.ok(wizard.state.errors.workcenters);
});

test('WorkcenterWizard setWorkingHours updates day schedule', () => {
  const wizard = new WorkcenterWizard(mockClient);
  
  wizard.setWorkingHours('monday', { working: false });
  
  assert.equal(wizard.state.workingHours.monday.working, false);
});

test('WorkcenterWizard applyWorkingHoursTemplate applies standard template', () => {
  const wizard = new WorkcenterWizard(mockClient);
  
  wizard.applyWorkingHoursTemplate('standard');
  
  assert.equal(wizard.state.workingHours.monday.working, true);
  assert.equal(wizard.state.workingHours.saturday.working, false);
});

test('WorkcenterWizard applyWorkingHoursTemplate applies 24/7 template', () => {
  const wizard = new WorkcenterWizard(mockClient);
  
  wizard.applyWorkingHoursTemplate('24_7');
  
  assert.equal(wizard.state.workingHours.sunday.working, true);
  assert.equal(wizard.state.workingHours.monday.hours[0].hour_from, 0);
  assert.equal(wizard.state.workingHours.monday.hours[0].hour_to, 24);
});

test('WorkcenterWizard addWorkingHour adds hour slot', () => {
  const wizard = new WorkcenterWizard(mockClient);
  
  wizard.addWorkingHour('monday');
  
  assert.equal(wizard.state.workingHours.monday.hours.length, 2);
});

test('WorkcenterWizard addWorkingHour respects max 3 slots', () => {
  const wizard = new WorkcenterWizard(mockClient);
  wizard.addWorkingHour('monday');
  wizard.addWorkingHour('monday');
  wizard.addWorkingHour('monday');
  wizard.addWorkingHour('monday');
  
  assert.equal(wizard.state.workingHours.monday.hours.length, 3);
});

test('WorkcenterWizard removeWorkingHour removes hour slot', () => {
  const wizard = new WorkcenterWizard(mockClient);
  wizard.addWorkingHour('monday');
  const initialLength = wizard.state.workingHours.monday.hours.length;
  
  wizard.removeWorkingHour('monday', initialLength - 1);
  
  assert.equal(wizard.state.workingHours.monday.hours.length, initialLength - 1);
});

test('WorkcenterWizard updateWorkingHour updates hour slot', () => {
  const wizard = new WorkcenterWizard(mockClient);
  
  wizard.updateWorkingHour('monday', 0, 'hour_from', 9);
  
  assert.equal(wizard.state.workingHours.monday.hours[0].hour_from, 9);
});

test('WorkcenterWizard setCapacityPlanning updates capacity', () => {
  const wizard = new WorkcenterWizard(mockClient);
  
  wizard.setCapacityPlanning({ defaultCapacity: 2, maxCapacity: 5, overtimePossible: true });
  
  assert.equal(wizard.state.capacityPlanning.defaultCapacity, 2);
  assert.equal(wizard.state.capacityPlanning.maxCapacity, 5);
  assert.equal(wizard.state.capacityPlanning.overtimePossible, true);
});

test('WorkcenterWizard setCrossDomainLink updates dependencies', () => {
  const wizard = new WorkcenterWizard(mockClient);
  
  wizard.setCrossDomainLink('locationId', 1);
  
  assert.equal(wizard._crossDomainDependencies.locationId, 1);
});

test('WorkcenterWizard nextStep validates workcenter name required', async () => {
  const wizard = new WorkcenterWizard(mockClient);
  wizard.updateWorkcenter(0, 'name', '');
  
  const result = await wizard.nextStep();
  
  assert.equal(result.success, false);
  assert.ok(wizard.state.errors['workcenter_0']);
});

test('WorkcenterWizard nextStep validates positive efficiency', async () => {
  const wizard = new WorkcenterWizard(mockClient);
  wizard.updateWorkcenter(0, 'name', 'Valid');
  wizard.updateWorkcenter(0, 'code', 'WC01');
  wizard.updateWorkcenter(0, 'capacity_efficiency', 0);
  
  const result = await wizard.nextStep();
  
  assert.equal(result.success, false);
  assert.ok(wizard.state.errors['workcenter_eff_0']);
});

test('WorkcenterWizard nextStep validates non-negative cost', async () => {
  const wizard = new WorkcenterWizard(mockClient);
  wizard.updateWorkcenter(0, 'name', 'Valid');
  wizard.updateWorkcenter(0, 'code', 'WC01');
  wizard.updateWorkcenter(0, 'costs_hour', -10);
  
  const result = await wizard.nextStep();
  
  assert.equal(result.success, false);
  assert.ok(wizard.state.errors['workcenter_cost_0']);
});

test('WorkcenterWizard nextStep validates capacity constraints', async () => {
  const wizard = new WorkcenterWizard(mockClient);
  wizard.state.currentStep = WORKCENTER_STEPS.CAPACITY_PLANNING;
  wizard.setCapacityPlanning({ defaultCapacity: 5, maxCapacity: 3 });
  
  const result = await wizard.nextStep();
  
  assert.equal(result.success, false);
  assert.ok(wizard.state.errors.maxCapacity);
});

test('WorkcenterWizard nextStep validates time range', async () => {
  const wizard = new WorkcenterWizard(mockClient);
  wizard.state.currentStep = WORKCENTER_STEPS.CAPACITY_PLANNING;
  wizard.setCapacityPlanning({ defaultCapacity: 1, maxCapacity: 1, timeStart: 18, timeStop: 8 });
  
  const result = await wizard.nextStep();
  
  assert.equal(result.success, false);
  assert.ok(wizard.state.errors.timeRange);
});

test('WorkcenterWizard nextStep validates working hours', async () => {
  const wizard = new WorkcenterWizard(mockClient);
  wizard.state.currentStep = WORKCENTER_STEPS.WORKING_HOURS;
  wizard.setWorkingHours('monday', { working: false });
  wizard.setWorkingHours('tuesday', { working: false });
  wizard.setWorkingHours('wednesday', { working: false });
  wizard.setWorkingHours('thursday', { working: false });
  wizard.setWorkingHours('friday', { working: false });
  wizard.setWorkingHours('saturday', { working: false });
  wizard.setWorkingHours('sunday', { working: false });
  
  const result = await wizard.nextStep();
  
  assert.equal(result.success, false);
  assert.ok(wizard.state.errors.workingHours);
});

test('WorkcenterWizard nextStep validates hour ranges', async () => {
  const wizard = new WorkcenterWizard(mockClient);
  wizard.state.currentStep = WORKCENTER_STEPS.WORKING_HOURS;
  wizard.updateWorkingHour('monday', 0, 'hour_to', 7);
  
  const result = await wizard.nextStep();
  
  assert.equal(result.success, false);
  assert.ok(wizard.state.errors['hours_monday']);
});

test('WorkcenterWizard nextStep advances with valid data', async () => {
  const wizard = new WorkcenterWizard(mockClient);
  wizard.updateWorkcenter(0, 'name', 'Valid WC');
  wizard.updateWorkcenter(0, 'code', 'WC01');
  
  const result = await wizard.nextStep();
  
  assert.equal(result.success, true);
  assert.equal(wizard.state.currentStep, WORKCENTER_STEPS.CAPACITY_PLANNING);
});

test('WorkcenterWizard prevStep goes back correctly', () => {
  const wizard = new WorkcenterWizard(mockClient);
  wizard.state.currentStep = WORKCENTER_STEPS.CAPACITY_PLANNING;
  
  const result = wizard.prevStep();
  
  assert.equal(result.success, true);
  assert.equal(wizard.state.currentStep, WORKCENTER_STEPS.WORKCENTER_BASICS);
});

test('WorkcenterWizard getStepInfo returns correct info', () => {
  const wizard = new WorkcenterWizard(mockClient);
  
  const info = wizard.getStepInfo(WORKCENTER_STEPS.WORKCENTER_BASICS);
  assert.equal(info.title, 'Work Center Basics');
});

test('WorkcenterWizard getProgress calculates correctly', () => {
  const wizard = new WorkcenterWizard(mockClient);
  
  wizard.state.currentStep = WORKCENTER_STEPS.COMPLETION;
  const progress = wizard.getProgress();
  
  assert.equal(progress, 100);
});

test('WorkcenterWizard reset restores initial state', () => {
  const wizard = new WorkcenterWizard(mockClient);
  wizard.addWorkcenter();
  wizard.setCapacityPlanning({ defaultCapacity: 5 });
  
  wizard.reset();
  
  assert.equal(wizard.state.workcenters.length, 1);
  assert.equal(wizard.state.capacityPlanning.defaultCapacity, 1);
});

test('WorkcenterWizard exportConfig returns config object', () => {
  const wizard = new WorkcenterWizard(mockClient);
  wizard.updateWorkcenter(0, 'name', 'Test WC');
  
  const config = wizard.exportConfig();
  
  assert.ok(config.workcenters);
  assert.ok(config.workingHours);
  assert.ok(config.capacityPlanning);
});
