/**
 * BOM Builder - Bill of Materials Structure Builder UI
 * Phase 6: Manufacturing & Advanced Operations
 */

import { OdooClient } from '../../api/OdooClient.js';

export const BOM_STEPS = {
  PRODUCT_SELECTION: 1,
  BOM_STRUCTURE: 2,
  COMPONENT_LINES: 3,
  OPERATIONS: 4,
  BYPRODUCTS: 5,
  CROSS_DOMAIN_LINKS: 6,
  COMPLETION: 7
};

export const DEFAULT_BOM_TYPES = [
  { code: 'normal', name: 'Manufacture this product' },
  { code: 'phantom', name: 'Kit' },
  { code: 'subcontract', name: 'Subcontract' }
];

export const DEFAULT_BOM_LINE_TYPES = [
  { type: 'component', name: 'Component' },
  { type: 'semi_finished', name: 'Semi-Finished' },
  { type: 'consumable', name: 'Consumable' }
];

export class BomBuilder {
  constructor(client) {
    this.client = client;
    this.state = this._getInitialState();
    this._crossDomainDependencies = {
      requiresWorkcenter: true,
      workcenterIds: [],
      requiresInventory: true,
      locationId: null,
      routingId: null
    };
  }

  _getInitialState() {
    return {
      currentStep: BOM_STEPS.PRODUCT_SELECTION,
      bomHeader: {
        product_id: null,
        product_tmpl_id: null,
        product_qty: 1,
        product_uom_id: null,
        code: '',
        type: 'normal',
        active: true
      },
      bomLines: [],
      operations: [],
      byProducts: [],
      existingProducts: [],
      existingWorkcenters: [],
      existingBoms: [],
      bomLineType: 'component',
      errors: {},
      warnings: [],
      isLoading: false
    };
  }

  async initialize() {
    this._setState({ isLoading: true });

    try {
      const [products, workcenters, boms] = await Promise.all([
        this._fetchProducts(),
        this._fetchWorkcenters(),
        this._fetchBoms()
      ]);

      this._setState({
        existingProducts: products,
        existingWorkcenters: workcenters,
        existingBoms: boms,
        isLoading: false
      });

      return { success: true };
    } catch (error) {
      this._setState({ isLoading: false, errors: { general: error.message } });
      return { success: false, error: error.message };
    }
  }

  async _fetchProducts() {
    return this.client.searchRead(
      'product.product',
      [['type', 'in', ['product', 'consu']]],
      ['id', 'name', 'default_code', 'type', 'uom_id', 'categ_id'],
      { limit: 500 }
    );
  }

  async _fetchWorkcenters() {
    return this.client.searchRead(
      'mrp.workcenter',
      [['active', '=', true]],
      ['id', 'name', 'code', 'capacity'],
      { limit: 200 }
    );
  }

  async _fetchBoms() {
    return this.client.searchRead(
      'mrp.bom',
      [],
      ['id', 'product_id', 'product_tmpl_id', 'code', 'active', 'type'],
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

  setBomHeader(field, value) {
    this.state.bomHeader = { ...this.state.bomHeader, [field]: value };
  }

  setBomLineType(type) {
    this.state.bomLineType = type;
  }

  addBomLine(line) {
    const newLine = {
      id: `new_${Date.now()}`,
      product_id: null,
      product_tmpl_id: null,
      product_qty: 1,
      product_uom_id: null,
      line_type: this.state.bomLineType,
      bom_id: null,
      routing_id: null,
      sequence: this.state.bomLines.length + 1,
      active: true,
      is_new: true,
      ...line
    };
    this.state.bomLines.push(newLine);
    return newLine.id;
  }

  updateBomLine(lineId, field, value) {
    const index = this.state.bomLines.findIndex(l => l.id === lineId);
    if (index !== -1) {
      this.state.bomLines[index] = { ...this.state.bomLines[index], [field]: value };
    }
  }

  removeBomLine(lineId) {
    this.state.bomLines = this.state.bomLines.filter(l => l.id !== lineId);
  }

  duplicateBomLine(lineId) {
    const line = this.state.bomLines.find(l => l.id === lineId);
    if (line) {
      const newLine = {
        ...line,
        id: `new_${Date.now()}`,
        sequence: this.state.bomLines.length + 1
      };
      this.state.bomLines.push(newLine);
    }
  }

  addOperation(operation) {
    const newOp = {
      id: `new_${Date.now()}`,
      name: '',
      workcenter_id: null,
      workcenter_ids: [],
      sequence: this.state.operations.length + 1,
      time_cycle_manual: 60,
      time_cycle: 60,
      cycle_nbr: 1,
      hour_nbr: 0,
      workorder_count: 0,
      active: true,
      ...operation
    };
    this.state.operations.push(newOp);
    return newOp.id;
  }

  updateOperation(opId, field, value) {
    const index = this.state.operations.findIndex(o => o.id === opId);
    if (index !== -1) {
      this.state.operations[index] = { ...this.state.operations[index], [field]: value };
    }
  }

  removeOperation(opId) {
    this.state.operations = this.state.operations.filter(o => o.id !== opId);
  }

  addByProduct(byProduct) {
    const newByProduct = {
      id: `new_${Date.now()}`,
      product_id: null,
      product_qty: 1,
      product_uom_id: null,
      cost_share: 0,
      active: true,
      ...byProduct
    };
    this.state.byProducts.push(newByProduct);
    return newByProduct.id;
  }

  updateByProduct(byProductId, field, value) {
    const index = this.state.byProducts.findIndex(b => b.id === byProductId);
    if (index !== -1) {
      this.state.byProducts[index] = { ...this.state.byProducts[index], [field]: value };
    }
  }

  removeByProduct(byProductId) {
    this.state.byProducts = this.state.byProducts.filter(b => b.id !== byProductId);
  }

  setCrossDomainLink(field, value) {
    this._crossDomainDependencies[field] = value;

    if (field === 'requiresWorkcenter' && value) {
      this._addWarning('Operations will be assigned to selected work centers');
    }
    if (field === 'routingId' && value) {
      this._addWarning('Routing will link operations together');
    }
  }

  _validateCurrentStep() {
    const { currentStep, bomHeader, bomLines, operations, byProducts } = this.state;
    const errors = {};

    switch (currentStep) {
      case BOM_STEPS.PRODUCT_SELECTION:
        if (!bomHeader.product_id) {
          errors.product_id = 'Product selection is required';
        }
        if (bomHeader.product_qty <= 0) {
          errors.product_qty = 'Quantity must be greater than 0';
        }
        if (!bomHeader.product_uom_id) {
          errors.product_uom_id = 'Unit of measure is required';
        }
        break;

      case BOM_STEPS.BOM_STRUCTURE:
        if (bomHeader.type === 'subcontract' && !bomHeader.subcontractor_id) {
          errors.subcontractor = 'Subcontractor is required for subcontract BOMs';
        }
        break;

      case BOM_STEPS.COMPONENT_LINES:
        if (bomLines.length === 0) {
          errors.bomLines = 'At least one component is required';
        }
        for (let i = 0; i < bomLines.length; i++) {
          if (!bomLines[i].product_id) {
            errors[`line_${i}`] = `Line ${i + 1} must have a product selected`;
          }
          if (bomLines[i].product_qty <= 0) {
            errors[`line_qty_${i}`] = `Line ${i + 1} quantity must be positive`;
          }
        }
        break;

      case BOM_STEPS.OPERATIONS:
        for (let i = 0; i < operations.length; i++) {
          if (!operations[i].name || operations[i].name.trim().length === 0) {
            errors[`op_${i}`] = `Operation ${i + 1} must have a name`;
          }
          if (!operations[i].workcenter_id) {
            errors[`op_wc_${i}`] = `Operation ${i + 1} must have a work center`;
          }
          if (operations[i].time_cycle_manual <= 0) {
            errors[`op_time_${i}`] = `Operation ${i + 1} time must be positive`;
          }
        }
        break;

      case BOM_STEPS.BYPRODUCTS:
        for (let i = 0; i < byProducts.length; i++) {
          if (!byProducts[i].product_id) {
            errors[`byproduct_${i}`] = `By-product ${i + 1} must have a product`;
          }
          if (byProducts[i].product_qty <= 0) {
            errors[`byproduct_qty_${i}`] = `By-product ${i + 1} quantity must be positive`;
          }
          if (byProducts[i].cost_share < 0 || byProducts[i].cost_share > 100) {
            errors[`byproduct_cost_${i}`] = `By-product ${i + 1} cost share must be 0-100`;
          }
        }
        break;

      case BOM_STEPS.CROSS_DOMAIN_LINKS:
        if (this._crossDomainDependencies.requiresWorkcenter) {
          if (this.state.operations.length > 0 && 
              this._crossDomainDependencies.workcenterIds.length === 0) {
            errors.workcenters = 'At least one work center is required for operations';
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

    if (currentStep === BOM_STEPS.CROSS_DOMAIN_LINKS) {
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
      const { bomHeader, bomLines, operations, byProducts } = this.state;

      const bomId = await this._createBom(bomHeader, bomLines, operations, byProducts);

      this._setState({
        currentStep: BOM_STEPS.COMPLETION,
        isLoading: false,
        bomId
      });

      return {
        success: true,
        bomId,
        config: this.exportConfig()
      };
    } catch (error) {
      this._setState({ isLoading: false, errors: { general: error.message } });
      return { success: false, error: error.message };
    }
  }

  async _createBom(header, lines, operations, byProducts) {
    const bomLineData = lines.filter(l => l.product_id).map(line => [
      0, 0, {
        product_id: line.product_id,
        product_qty: line.product_qty,
        product_uom_id: line.product_uom_id || 1,
        bom_id: line.bom_id || false,
        line_type: line.line_type || 'component',
        sequence: line.sequence
      }
    ]);

    const operationData = operations.filter(o => o.name).map(op => [
      0, 0, {
        name: op.name,
        workcenter_id: op.workcenter_id,
        sequence: op.sequence,
        time_cycle_manual: op.time_cycle_manual,
        cycle_nbr: op.cycle_nbr
      }
    ]);

    const byProductData = byProducts.filter(b => b.product_id).map(bp => [
      0, 0, {
        product_id: bp.product_id,
        product_qty: bp.product_qty,
        product_uom_id: bp.product_uom_id || 1,
        cost_share: bp.cost_share
      }
    ]);

    const bomId = await this.client.create('mrp.bom', [{
      product_id: header.product_id,
      product_qty: header.product_qty,
      product_uom_id: header.product_uom_id || 1,
      code: header.code,
      type: header.type || 'normal',
      active: header.active,
      bom_line_ids: bomLineData,
      operation_ids: operationData,
      byproduct_ids: byProductData
    }]);

    return bomId;
  }

  calculateTotalMaterialCost() {
    let total = 0;
    for (const line of this.state.bomLines) {
      if (line.product_id && line.product_qty) {
        total += line.product_qty;
      }
    }
    return total;
  }

  calculateTotalOperationTime() {
    let total = 0;
    for (const op of this.state.operations) {
      if (op.time_cycle_manual) {
        total += op.time_cycle_manual * (op.cycle_nbr || 1);
      }
    }
    return total;
  }

  getStepInfo(step) {
    const steps = {
      [BOM_STEPS.PRODUCT_SELECTION]: {
        title: 'Product Selection',
        description: 'Select the product to manufacture'
      },
      [BOM_STEPS.BOM_STRUCTURE]: {
        title: 'BOM Structure',
        description: 'Define bill of materials type and structure'
      },
      [BOM_STEPS.COMPONENT_LINES]: {
        title: 'Component Lines',
        description: 'Add components and raw materials'
      },
      [BOM_STEPS.OPERATIONS]: {
        title: 'Operations',
        description: 'Define manufacturing operations and work centers'
      },
      [BOM_STEPS.BYPRODUCTS]: {
        title: 'By-Products',
        description: 'Configure any co-products or by-products'
      },
      [BOM_STEPS.CROSS_DOMAIN_LINKS]: {
        title: 'Cross-Domain Links',
        description: 'Connect to work centers and inventory'
      },
      [BOM_STEPS.COMPLETION]: {
        title: 'Complete',
        description: 'BOM setup is complete'
      }
    };
    return steps[step] || {};
  }

  getProgress() {
    const totalSteps = Object.values(BOM_STEPS).length;
    return Math.round(((this.state.currentStep - 1) / (totalSteps - 1)) * 100);
  }

  getBomSummary() {
    return {
      productCount: this.state.bomLines.length,
      operationCount: this.state.operations.length,
      byProductCount: this.state.byProducts.length,
      totalMaterialQty: this.calculateTotalMaterialCost(),
      totalOperationTime: this.calculateTotalOperationTime()
    };
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
      requiresWorkcenter: true,
      workcenterIds: [],
      requiresInventory: true,
      locationId: null,
      routingId: null
    };
  }

  exportConfig() {
    return {
      bomHeader: this.state.bomHeader,
      bomLines: this.state.bomLines.filter(l => l.product_id),
      operations: this.state.operations.filter(o => o.name),
      byProducts: this.state.byProducts.filter(b => b.product_id),
      crossDomainDependencies: this._crossDomainDependencies,
      summary: this.getBomSummary(),
      completedAt: this.state.currentStep === BOM_STEPS.COMPLETION
        ? new Date().toISOString()
        : null
    };
  }
}

export default BomBuilder;
