/**
 * Inventory Wizard Tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { InventoryWizard, INVENTORY_STEPS, DEFAULT_LOCATION_TYPES, DEFAULT_ROUTES } from './InventoryWizard.js';

const mockClient = {
  searchRead: async (model, domain, fields, options) => {
    if (model === 'stock.warehouse') {
      return [{ id: 1, name: 'Existing WH', code: 'WH1', partner_id: 1, lot_stock_id: 10 }];
    }
    if (model === 'stock.location') {
      return [
        { id: 1, name: 'Stock', location_type: 'internal', usage: 'internal' },
        { id: 2, name: 'Customers', location_type: 'customer', usage: 'customer' }
      ];
    }
    if (model === 'stock.route') {
      return [{ id: 1, name: 'Buy', active: true }];
    }
    return [];
  },
  create: async (model, data) => Math.floor(Math.random() * 10000) + 100,
  write: async (model, ids, data) => true,
  executeKw: async (model, method, args, kwargs) => true
};

test('InventoryWizard initializes with correct initial state', () => {
  const wizard = new InventoryWizard(mockClient);
  
  assert.equal(wizard.state.currentStep, INVENTORY_STEPS.WAREHOUSE_SETUP);
  assert.equal(wizard.state.warehouses.length, 1);
  assert.equal(wizard.state.warehouses[0].name, 'Main Warehouse');
  assert.equal(wizard.state.warehouses[0].code, 'WH');
  assert.deepEqual(wizard.state.routes, DEFAULT_ROUTES);
});

test('InventoryWizard initialize fetches existing data', async () => {
  const wizard = new InventoryWizard(mockClient);
  
  const result = await wizard.initialize();
  
  assert.equal(result.success, true);
  assert.equal(wizard.state.existingWarehouses.length, 1);
  assert.equal(wizard.state.existingWarehouses[0].name, 'Existing WH');
  assert.equal(wizard.state.existingLocations.length, 2);
});

test('InventoryWizard addWarehouse adds new warehouse', () => {
  const wizard = new InventoryWizard(mockClient);
  
  wizard.addWarehouse();
  
  assert.equal(wizard.state.warehouses.length, 2);
  assert.equal(wizard.state.warehouses[1].name, 'Warehouse 2');
  assert.equal(wizard.state.warehouses[1].code, 'WH2');
});

test('InventoryWizard updateWarehouse updates field correctly', () => {
  const wizard = new InventoryWizard(mockClient);
  
  wizard.updateWarehouse(0, 'name', 'Updated Warehouse');
  
  assert.equal(wizard.state.warehouses[0].name, 'Updated Warehouse');
});

test('InventoryWizard updateWarehouse updates nested address field', () => {
  const wizard = new InventoryWizard(mockClient);
  
  wizard.updateWarehouse(0, 'address.city', 'Cape Town');
  
  assert.equal(wizard.state.warehouses[0].address.city, 'Cape Town');
});

test('InventoryWizard removeWarehouse removes warehouse', () => {
  const wizard = new InventoryWizard(mockClient);
  wizard.addWarehouse();
  assert.equal(wizard.state.warehouses.length, 2);
  
  wizard.removeWarehouse(1);
  
  assert.equal(wizard.state.warehouses.length, 1);
});

test('InventoryWizard removeWarehouse prevents removing last warehouse', () => {
  const wizard = new InventoryWizard(mockClient);
  
  wizard.removeWarehouse(0);
  
  assert.equal(wizard.state.warehouses.length, 1);
  assert.ok(wizard.state.errors.warehouses);
});

test('InventoryWizard addLocation adds location', () => {
  const wizard = new InventoryWizard(mockClient);
  
  const locationId = wizard.addLocation();
  
  assert.equal(wizard.state.locations.length, 1);
  assert.ok(locationId.startsWith('new_'));
});

test('InventoryWizard updateLocation updates location field', () => {
  const wizard = new InventoryWizard(mockClient);
  const locationId = wizard.addLocation();
  
  wizard.updateLocation(locationId, 'name', 'Zone A');
  
  assert.equal(wizard.state.locations[0].name, 'Zone A');
});

test('InventoryWizard removeLocation removes location and children', () => {
  const wizard = new InventoryWizard(mockClient);
  const parentId = wizard.addLocation();
  wizard.updateLocation(parentId, 'name', 'Parent');
  const childId = wizard.addLocation(parentId);
  wizard.updateLocation(childId, 'name', 'Child');
  
  wizard.removeLocation(parentId);
  
  assert.equal(wizard.state.locations.length, 0);
});

test('InventoryWizard addRoute adds new route', () => {
  const wizard = new InventoryWizard(mockClient);
  
  wizard.addRoute();
  
  assert.equal(wizard.state.routes.length, DEFAULT_ROUTES.length + 1);
});

test('InventoryWizard updateRoute updates route field', () => {
  const wizard = new InventoryWizard(mockClient);
  
  wizard.updateRoute(0, 'name', 'Updated Route');
  
  assert.equal(wizard.state.routes[0].name, 'Updated Route');
});

test('InventoryWizard setValuationMethod updates valuation', () => {
  const wizard = new InventoryWizard(mockClient);
  
  wizard.setValuationMethod({ method: 'real', cost_method: 'fifo' });
  
  assert.equal(wizard.state.valuationMethod.method, 'real');
  assert.equal(wizard.state.valuationMethod.cost_method, 'fifo');
});

test('InventoryWizard setReplenishment updates replenishment settings', () => {
  const wizard = new InventoryWizard(mockClient);
  
  wizard.setReplenishment({ enable_auto_replenish: true, warehouse_ids: [1] });
  
  assert.equal(wizard.state.replenishment.enable_auto_replenish, true);
  assert.deepEqual(wizard.state.replenishment.warehouse_ids, [1]);
});

test('InventoryWizard setCrossDomainLink adds warnings for dependencies', () => {
  const wizard = new InventoryWizard(mockClient);
  
  wizard.setCrossDomainLink('requiresSales', true);
  
  assert.ok(wizard.state.warnings.some(w => w.includes('sales')));
});

test('InventoryWizard nextStep validates warehouse name required', async () => {
  const wizard = new InventoryWizard(mockClient);
  wizard.updateWarehouse(0, 'name', '');
  
  const result = await wizard.nextStep();
  
  assert.equal(result.success, false);
  assert.ok(wizard.state.errors['warehouse_0']);
});

test('InventoryWizard nextStep validates warehouse code required', async () => {
  const wizard = new InventoryWizard(mockClient);
  wizard.updateWarehouse(0, 'code', '');
  
  const result = await wizard.nextStep();
  
  assert.equal(result.success, false);
  assert.ok(wizard.state.errors['warehouse_code_0']);
});

test('InventoryWizard nextStep validates warehouse code max length', async () => {
  const wizard = new InventoryWizard(mockClient);
  wizard.updateWarehouse(0, 'code', 'TOOLONG');
  
  const result = await wizard.nextStep();
  
  assert.equal(result.success, false);
  assert.ok(wizard.state.errors['warehouse_code_0']);
});

test('InventoryWizard nextStep advances with valid warehouse', async () => {
  const wizard = new InventoryWizard(mockClient);
  
  const result = await wizard.nextStep();
  
  assert.equal(result.success, true);
  assert.equal(wizard.state.currentStep, INVENTORY_STEPS.LOCATION_STRUCTURE);
});

test('InventoryWizard prevStep goes back correctly', () => {
  const wizard = new InventoryWizard(mockClient);
  wizard.state.currentStep = INVENTORY_STEPS.LOCATION_STRUCTURE;
  
  const result = wizard.prevStep();
  
  assert.equal(result.success, true);
  assert.equal(wizard.state.currentStep, INVENTORY_STEPS.WAREHOUSE_SETUP);
});

test('InventoryWizard prevStep fails at first step', () => {
  const wizard = new InventoryWizard(mockClient);
  
  const result = wizard.prevStep();
  
  assert.equal(result.success, false);
});

test('InventoryWizard getStepInfo returns correct info', () => {
  const wizard = new InventoryWizard(mockClient);
  
  const info = wizard.getStepInfo(INVENTORY_STEPS.WAREHOUSE_SETUP);
  assert.equal(info.title, 'Warehouse Setup');
});

test('InventoryWizard getProgress calculates correctly', () => {
  const wizard = new InventoryWizard(mockClient);
  
  wizard.state.currentStep = INVENTORY_STEPS.WAREHOUSE_SETUP;
  assert.equal(wizard.getProgress(), 0);
});

test('InventoryWizard getWarehouseCodeSuggestions returns codes', () => {
  const wizard = new InventoryWizard(mockClient);
  
  const codes = wizard.getWarehouseCodeSuggestions();
  
  assert.ok(codes.includes('WH'));
  assert.ok(codes.includes('MAIN'));
});

test('InventoryWizard reset restores initial state', () => {
  const wizard = new InventoryWizard(mockClient);
  wizard.addWarehouse();
  wizard.updateWarehouse(1, 'name', 'Test');
  
  wizard.reset();
  
  assert.equal(wizard.state.warehouses.length, 1);
  assert.equal(wizard.state.warehouses[0].name, 'Main Warehouse');
});

test('InventoryWizard exportConfig returns config object', () => {
  const wizard = new InventoryWizard(mockClient);
  
  const config = wizard.exportConfig();
  
  assert.ok(config.warehouses);
  assert.ok(config.routes);
  assert.ok(config.valuationMethod);
});
