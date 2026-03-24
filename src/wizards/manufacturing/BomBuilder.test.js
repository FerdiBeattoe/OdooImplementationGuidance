/**
 * BOM Builder Tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { BomBuilder, BOM_STEPS, DEFAULT_BOM_TYPES, DEFAULT_BOM_LINE_TYPES } from './BomBuilder.js';

const mockClient = {
  searchRead: async (model, domain, fields, options) => {
    if (model === 'product.product') {
      return [
        { id: 1, name: 'Product A', default_code: 'PA-001', type: 'product' },
        { id: 2, name: 'Component X', default_code: 'CX-001', type: 'product' }
      ];
    }
    if (model === 'mrp.workcenter') {
      return [{ id: 1, name: 'Assembly Line', code: 'AL-01', capacity: 100 }];
    }
    if (model === 'mrp.bom') {
      return [{ id: 1, product_id: 1, code: 'BOM-001' }];
    }
    return [];
  },
  create: async (model, data) => Math.floor(Math.random() * 10000) + 100,
  write: async (model, ids, data) => true
};

test('BomBuilder initializes with correct initial state', () => {
  const wizard = new BomBuilder(mockClient);
  
  assert.equal(wizard.state.currentStep, BOM_STEPS.PRODUCT_SELECTION);
  assert.equal(wizard.state.bomHeader.product_qty, 1);
  assert.equal(wizard.state.bomHeader.type, 'normal');
});

test('BomBuilder initialize fetches existing data', async () => {
  const wizard = new BomBuilder(mockClient);
  
  const result = await wizard.initialize();
  
  assert.equal(result.success, true);
  assert.equal(wizard.state.existingProducts.length, 2);
  assert.equal(wizard.state.existingWorkcenters.length, 1);
  assert.equal(wizard.state.existingBoms.length, 1);
});

test('BomBuilder setBomHeader updates header fields', () => {
  const wizard = new BomBuilder(mockClient);
  
  wizard.setBomHeader('product_id', 1);
  wizard.setBomHeader('code', 'BOM-NEW');
  
  assert.equal(wizard.state.bomHeader.product_id, 1);
  assert.equal(wizard.state.bomHeader.code, 'BOM-NEW');
});

test('BomBuilder setBomLineType updates line type', () => {
  const wizard = new BomBuilder(mockClient);
  
  wizard.setBomLineType('semi_finished');
  
  assert.equal(wizard.state.bomLineType, 'semi_finished');
});

test('BomBuilder addBomLine adds new line', () => {
  const wizard = new BomBuilder(mockClient);
  
  const lineId = wizard.addBomLine({ product_id: 2, product_qty: 5 });
  
  assert.equal(wizard.state.bomLines.length, 1);
  assert.ok(lineId.startsWith('new_'));
});

test('BomBuilder updateBomLine updates line field', () => {
  const wizard = new BomBuilder(mockClient);
  const lineId = wizard.addBomLine({ product_id: 2 });
  
  wizard.updateBomLine(lineId, 'product_qty', 10);
  
  assert.equal(wizard.state.bomLines[0].product_qty, 10);
});

test('BomBuilder removeBomLine removes line', () => {
  const wizard = new BomBuilder(mockClient);
  const lineId = wizard.addBomLine({ product_id: 2 });
  
  wizard.removeBomLine(lineId);
  
  assert.equal(wizard.state.bomLines.length, 0);
});

test('BomBuilder duplicateBomLine copies line', () => {
  const wizard = new BomBuilder(mockClient);
  const lineId = wizard.addBomLine({ product_id: 2, product_qty: 5 });
  
  wizard.duplicateBomLine(lineId);
  
  assert.equal(wizard.state.bomLines.length, 2);
  assert.equal(wizard.state.bomLines[1].product_qty, 5);
});

test('BomBuilder addOperation adds new operation', () => {
  const wizard = new BomBuilder(mockClient);
  
  const opId = wizard.addOperation({ name: 'Cut', workcenter_id: 1 });
  
  assert.equal(wizard.state.operations.length, 1);
  assert.equal(wizard.state.operations[0].name, 'Cut');
});

test('BomBuilder updateOperation updates operation field', () => {
  const wizard = new BomBuilder(mockClient);
  const opId = wizard.addOperation({ name: 'Cut' });
  
  wizard.updateOperation(opId, 'time_cycle_manual', 30);
  
  assert.equal(wizard.state.operations[0].time_cycle_manual, 30);
});

test('BomBuilder removeOperation removes operation', () => {
  const wizard = new BomBuilder(mockClient);
  const opId = wizard.addOperation({ name: 'Cut' });
  
  wizard.removeOperation(opId);
  
  assert.equal(wizard.state.operations.length, 0);
});

test('BomBuilder addByProduct adds by-product', () => {
  const wizard = new BomBuilder(mockClient);
  
  const bpId = wizard.addByProduct({ product_id: 3, product_qty: 1, cost_share: 20 });
  
  assert.equal(wizard.state.byProducts.length, 1);
});

test('BomBuilder updateByProduct updates by-product field', () => {
  const wizard = new BomBuilder(mockClient);
  const bpId = wizard.addByProduct({ product_id: 3 });
  
  wizard.updateByProduct(bpId, 'cost_share', 25);
  
  assert.equal(wizard.state.byProducts[0].cost_share, 25);
});

test('BomBuilder removeByProduct removes by-product', () => {
  const wizard = new BomBuilder(mockClient);
  const bpId = wizard.addByProduct({ product_id: 3 });
  
  wizard.removeByProduct(bpId);
  
  assert.equal(wizard.state.byProducts.length, 0);
});

test('BomBuilder nextStep validates product selection required', async () => {
  const wizard = new BomBuilder(mockClient);
  wizard.setBomHeader('product_id', null);
  
  const result = await wizard.nextStep();
  
  assert.equal(result.success, false);
  assert.ok(wizard.state.errors.product_id);
});

test('BomBuilder nextStep validates positive quantity', async () => {
  const wizard = new BomBuilder(mockClient);
  wizard.setBomHeader('product_id', 1);
  wizard.setBomHeader('product_qty', 0);
  
  const result = await wizard.nextStep();
  
  assert.equal(result.success, false);
  assert.ok(wizard.state.errors.product_qty);
});

test('BomBuilder nextStep validates component lines', async () => {
  const wizard = new BomBuilder(mockClient);
  wizard.state.currentStep = BOM_STEPS.COMPONENT_LINES;
  
  const result = await wizard.nextStep();
  
  assert.equal(result.success, false);
  assert.ok(wizard.state.errors.bomLines);
});

test('BomBuilder calculateTotalMaterialCost sums quantities', () => {
  const wizard = new BomBuilder(mockClient);
  wizard.addBomLine({ product_id: 2, product_qty: 5 });
  wizard.addBomLine({ product_id: 3, product_qty: 3 });
  
  const total = wizard.calculateTotalMaterialCost();
  
  assert.equal(total, 8);
});

test('BomBuilder calculateTotalOperationTime sums operation times', () => {
  const wizard = new BomBuilder(mockClient);
  wizard.addOperation({ name: 'Cut', time_cycle_manual: 30, cycle_nbr: 2 });
  wizard.addOperation({ name: 'Assembly', time_cycle_manual: 60 });
  
  const total = wizard.calculateTotalOperationTime();
  
  assert.equal(total, 120);
});

test('BomBuilder getBomSummary returns correct counts', () => {
  const wizard = new BomBuilder(mockClient);
  wizard.addBomLine({ product_id: 2 });
  wizard.addBomLine({ product_id: 3 });
  wizard.addOperation({ name: 'Cut' });
  wizard.addByProduct({ product_id: 4 });
  
  const summary = wizard.getBomSummary();
  
  assert.equal(summary.productCount, 2);
  assert.equal(summary.operationCount, 1);
  assert.equal(summary.byProductCount, 1);
});

test('BomBuilder nextStep advances with valid data', async () => {
  const wizard = new BomBuilder(mockClient);
  wizard.setBomHeader('product_id', 1);
  wizard.setBomHeader('product_qty', 1);
  wizard.setBomHeader('product_uom_id', 1);
  
  const result = await wizard.nextStep();
  
  assert.equal(result.success, true);
});

test('BomBuilder prevStep goes back correctly', () => {
  const wizard = new BomBuilder(mockClient);
  wizard.state.currentStep = BOM_STEPS.BOM_STRUCTURE;
  
  const result = wizard.prevStep();
  
  assert.equal(result.success, true);
  assert.equal(wizard.state.currentStep, BOM_STEPS.PRODUCT_SELECTION);
});

test('BomBuilder getStepInfo returns correct info', () => {
  const wizard = new BomBuilder(mockClient);
  
  const info = wizard.getStepInfo(BOM_STEPS.PRODUCT_SELECTION);
  assert.equal(info.title, 'Product Selection');
});

test('BomBuilder getProgress calculates correctly', () => {
  const wizard = new BomBuilder(mockClient);
  
  wizard.state.currentStep = BOM_STEPS.COMPLETION;
  const progress = wizard.getProgress();
  
  assert.equal(progress, 100);
});

test('BomBuilder reset restores initial state', () => {
  const wizard = new BomBuilder(mockClient);
  wizard.addBomLine({ product_id: 2 });
  wizard.addOperation({ name: 'Cut' });
  
  wizard.reset();
  
  assert.equal(wizard.state.bomLines.length, 0);
  assert.equal(wizard.state.operations.length, 0);
  assert.equal(wizard.state.currentStep, BOM_STEPS.PRODUCT_SELECTION);
});

test('BomBuilder exportConfig returns config object', () => {
  const wizard = new BomBuilder(mockClient);
  wizard.setBomHeader('product_id', 1);
  wizard.addBomLine({ product_id: 2 });
  
  const config = wizard.exportConfig();
  
  assert.ok(config.bomHeader);
  assert.ok(config.bomLines);
  assert.ok(config.summary);
});
