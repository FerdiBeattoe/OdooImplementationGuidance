/**
 * Inventory Wizard - Warehouses, Locations, Routes, and Stock Configuration
 * Phase 5: Core Operations Wizards
 */

import { OdooClient } from '../../api/OdooClient.js';

export const INVENTORY_STEPS = {
  WAREHOUSE_SETUP: 1,
  LOCATION_STRUCTURE: 2,
  ROUTES_DEFINITION: 3,
  VALUATION_METHOD: 4,
  REPLENISHMENT: 5,
  CROSS_DOMAIN_LINKS: 6,
  COMPLETION: 7
};

export const DEFAULT_LOCATION_TYPES = {
  internal: 'Internal Location',
  view: 'View',
  customer: 'Partner Location/Customer',
  supplier: 'Partner Location/Supplier',
  inventory: 'Inventory',
  production: 'Production',
  transit: 'Transit Location'
};

export const DEFAULT_ROUTES = [
  { name: 'Buy', applicable_on: 'all', active: true },
  { name: 'Manufacture', applicable_on: 'all', active: true },
  { name: 'Make To Order', applicable_on: 'all', active: true },
  { name: 'Drop Shipping', applicable_on: 'all', active: true }
];

export class InventoryWizard {
  constructor(client) {
    this.client = client;
    this.state = this._getInitialState();
    this._crossDomainDependencies = {
      requiresSales: true,
      salesTeamIds: [],
      requiresPurchase: true,
      vendorIds: [],
      requiresManufacturing: false,
      workcenterIds: []
    };
  }

  _getInitialState() {
    return {
      currentStep: INVENTORY_STEPS.WAREHOUSE_SETUP,
      warehouses: [
        {
          name: 'Main Warehouse',
          code: 'WH',
          address: {
            street: '',
            city: '',
            country_id: null
          },
          view_location_id: null,
          lot_stock_id: null,
          wh_input_stock_loc_id: null,
          wh_output_stock_loc_id: null,
          wh_pack_stock_loc_id: null,
          reception_steps: 'one_step',
          delivery_steps: 'one_step',
          active: true
        }
      ],
      locations: [],
      routes: [...DEFAULT_ROUTES],
      routeRules: [],
      valuationMethod: {
        method: 'average',
        cost_method: 'average'
      },
      replenishment: {
        enable_auto_replenish: false,
        enable_orderpoint_trigger: true,
        warehouse_ids: []
      },
      existingWarehouses: [],
      existingLocations: [],
      existingRoutes: [],
      errors: {},
      warnings: [],
      isLoading: false
    };
  }

  async initialize() {
    this._setState({ isLoading: true });

    try {
      const [warehouses, locations, routes] = await Promise.all([
        this._fetchWarehouses(),
        this._fetchLocations(),
        this._fetchRoutes()
      ]);

      this._setState({
        existingWarehouses: warehouses,
        existingLocations: locations,
        existingRoutes: routes,
        isLoading: false
      });

      return { success: true };
    } catch (error) {
      this._setState({ isLoading: false, errors: { general: error.message } });
      return { success: false, error: error.message };
    }
  }

  async _fetchWarehouses() {
    return this.client.searchRead(
      'stock.warehouse',
      [],
      ['id', 'name', 'code', 'partner_id', 'lot_stock_id', 'view_location_id'],
      { limit: 100 }
    );
  }

  async _fetchLocations() {
    return this.client.searchRead(
      'stock.location',
      [],
      ['id', 'name', 'location_type', 'parent_id', 'child_ids', 'usage'],
      { limit: 500 }
    );
  }

  async _fetchRoutes() {
    return this.client.searchRead(
      'stock.route',
      [],
      ['id', 'name', 'active', 'applicable_on', 'warehouse_ids', 'rule_ids'],
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

  addWarehouse() {
    this.state.warehouses.push({
      name: `Warehouse ${this.state.warehouses.length + 1}`,
      code: `WH${this.state.warehouses.length + 1}`,
      address: { street: '', city: '', country_id: null },
      view_location_id: null,
      lot_stock_id: null,
      wh_input_stock_loc_id: null,
      wh_output_stock_loc_id: null,
      wh_pack_stock_loc_id: null,
      reception_steps: 'one_step',
      delivery_steps: 'one_step',
      active: true
    });
  }

  updateWarehouse(index, field, value) {
    const warehouses = [...this.state.warehouses];
    if (field.startsWith('address.')) {
      const addrField = field.replace('address.', '');
      warehouses[index].address = { ...warehouses[index].address, [addrField]: value };
    } else {
      warehouses[index] = { ...warehouses[index], [field]: value };
    }
    this.state.warehouses = warehouses;
  }

  removeWarehouse(index) {
    if (this.state.warehouses.length > 1) {
      const warehouses = [...this.state.warehouses];
      warehouses.splice(index, 1);
      this.state.warehouses = warehouses;
    } else {
      this.state.errors.warehouses = 'At least one warehouse is required';
    }
  }

  addLocation(parentId = null) {
    const newLocation = {
      id: `new_${Date.now()}`,
      name: '',
      location_type: 'internal',
      parent_id: parentId,
      usage: 'internal',
      barcode: '',
      active: true,
      child_ids: []
    };
    this.state.locations.push(newLocation);
    return newLocation.id;
  }

  updateLocation(locationId, field, value) {
    const index = this.state.locations.findIndex(l => l.id === locationId);
    if (index !== -1) {
      this.state.locations[index] = { ...this.state.locations[index], [field]: value };
    }
  }

  removeLocation(locationId) {
    const index = this.state.locations.findIndex(l => l.id === locationId);
    if (index !== -1) {
      const location = this.state.locations[index];
      const childIds = this.state.locations
        .filter(l => l.parent_id === locationId)
        .map(l => l.id);
      this.state.locations = this.state.locations.filter(
        l => l.id !== locationId && !childIds.includes(l.id)
      );
    }
  }

  addRoute() {
    this.state.routes.push({
      name: `Route ${this.state.routes.length + 1}`,
      applicable_on: 'all',
      active: true
    });
  }

  updateRoute(index, field, value) {
    const routes = [...this.state.routes];
    routes[index] = { ...routes[index], [field]: value };
    this.state.routes = routes;
  }

  removeRoute(index) {
    if (this.state.routes.length > 1) {
      const routes = [...this.state.routes];
      routes.splice(index, 1);
      this.state.routes = routes;
    }
  }

  addRouteRule(routeIndex, rule) {
    const rules = [...this.state.routeRules];
    rules.push({
      id: Date.now(),
      route_id: routeIndex,
      name: '',
      action: 'pull',
      location_src_id: null,
      location_dest_id: null,
      procure_method: 'make_to_order',
      active: true,
      ...rule
    });
    this.state.routeRules = rules;
  }

  updateRouteRule(ruleId, field, value) {
    const index = this.state.routeRules.findIndex(r => r.id === ruleId);
    if (index !== -1) {
      this.state.routeRules[index] = { ...this.state.routeRules[index], [field]: value };
    }
  }

  removeRouteRule(ruleId) {
    this.state.routeRules = this.state.routeRules.filter(r => r.id !== ruleId);
  }

  setValuationMethod(method) {
    this.state.valuationMethod = { ...this.state.valuationMethod, ...method };
  }

  setReplenishment(settings) {
    this.state.replenishment = { ...this.state.replenishment, ...settings };
  }

  setCrossDomainLink(field, value) {
    this._crossDomainDependencies[field] = value;

    if (field === 'requiresSales' && value) {
      this._addWarning('Inventory will push stock to sales teams on delivery');
    }
    if (field === 'requiresPurchase' && value) {
      this._addWarning('Purchase receipts will replenish inventory');
    }
    if (field === 'requiresManufacturing' && value) {
      this._addWarning('Manufacturing will consume inventory components');
    }
  }

  _validateCurrentStep() {
    const { currentStep, warehouses, locations, routes, valuationMethod, replenishment } = this.state;
    const errors = {};

    switch (currentStep) {
      case INVENTORY_STEPS.WAREHOUSE_SETUP:
        if (!warehouses || warehouses.length === 0) {
          errors.warehouses = 'At least one warehouse is required';
        }
        for (let i = 0; i < warehouses.length; i++) {
          if (!warehouses[i].name || warehouses[i].name.trim().length === 0) {
            errors[`warehouse_${i}`] = `Warehouse ${i + 1} must have a name`;
          }
          if (!warehouses[i].code || warehouses[i].code.trim().length === 0) {
            errors[`warehouse_code_${i}`] = `Warehouse ${i + 1} must have a code`;
          }
          if (warehouses[i].code && warehouses[i].code.length > 5) {
            errors[`warehouse_code_${i}`] = `Warehouse code cannot exceed 5 characters`;
          }
        }
        break;

      case INVENTORY_STEPS.LOCATION_STRUCTURE:
        const invalidLocations = locations.filter(l => !l.name || l.name.trim().length === 0);
        if (invalidLocations.length > 0) {
          errors.locations = 'All locations must have names';
        }
        break;

      case INVENTORY_STEPS.ROUTES_DEFINITION:
        if (routes && routes.length > 0) {
          for (let i = 0; i < routes.length; i++) {
            if (!routes[i].name || routes[i].name.trim().length === 0) {
              errors[`route_${i}`] = `Route ${i + 1} must have a name`;
            }
          }
        }
        break;

      case INVENTORY_STEPS.VALUATION_METHOD:
        if (!['standard', 'average', 'real'].includes(valuationMethod.method)) {
          errors.valuation = 'Invalid valuation method';
        }
        break;

      case INVENTORY_STEPS.REPLENISHMENT:
        if (replenishment.enable_auto_replenish && 
            replenishment.warehouse_ids.length === 0) {
          errors.warehouse_ids = 'Select warehouses for auto-replenishment';
        }
        break;

      case INVENTORY_STEPS.CROSS_DOMAIN_LINKS:
        if (this._crossDomainDependencies.requiresManufacturing) {
          if (this._crossDomainDependencies.workcenterIds.length === 0) {
            this._addWarning('Manufacturing setup may require work center configuration');
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

    if (currentStep === INVENTORY_STEPS.CROSS_DOMAIN_LINKS) {
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
      const { warehouses, locations, routes, routeRules, valuationMethod, replenishment } = this.state;

      const createdLocationIds = await this._createLocations(locations);

      const createdWarehouseIds = await this._createWarehouses(warehouses);

      const createdRouteIds = await this._createRoutes(routes, createdWarehouseIds);

      await this._setValuationMethod(valuationMethod);

      if (replenishment.enable_auto_replenish) {
        await this._configureReplenishment(replenishment);
      }

      this._setState({
        currentStep: INVENTORY_STEPS.COMPLETION,
        isLoading: false,
        createdLocationIds,
        createdWarehouseIds,
        createdRouteIds
      });

      return {
        success: true,
        createdLocationIds,
        createdWarehouseIds,
        createdRouteIds,
        config: this.exportConfig()
      };
    } catch (error) {
      this._setState({ isLoading: false, errors: { general: error.message } });
      return { success: false, error: error.message };
    }
  }

  async _createLocations(locations) {
    const locationIds = [];
    const idMapping = {};

    for (const location of locations) {
      const locationId = await this.client.create('stock.location', [{
        name: location.name,
        usage: location.usage || 'internal',
        location_type: location.location_type || 'internal',
        barcode: location.barcode || '',
        active: location.active,
        parent_id: location.parent_id ? idMapping[location.parent_id] || false : false
      }]);
      locationIds.push(locationId);
      idMapping[location.id] = locationId;
    }

    return locationIds;
  }

  async _createWarehouses(warehouses) {
    const warehouseIds = [];

    for (const warehouse of warehouses) {
      const warehouseId = await this.client.create('stock.warehouse', [{
        name: warehouse.name,
        code: warehouse.code,
        reception_steps: warehouse.reception_steps || 'one_step',
        delivery_steps: warehouse.delivery_steps || 'one_step',
        active: warehouse.active
      }]);
      warehouseIds.push(warehouseId);
    }

    return warehouseIds;
  }

  async _createRoutes(routes, warehouseIds) {
    const routeIds = [];

    for (const route of routes) {
      if (route.active) {
        const routeId = await this.client.create('stock.route', [{
          name: route.name,
          applicable_on: route.applicable_on || 'all',
          active: true,
          warehouse_ids: warehouseIds.length > 0 ? [[6, 0, warehouseIds]] : [[6, 0, []]]
        }]);
        routeIds.push(routeId);
      }
    }

    return routeIds;
  }

  async _setValuationMethod(valuation) {
    const productCategories = await this.client.searchRead(
      'product.category',
      [],
      ['id', 'property_cost_method', 'property_valuation']
    );

    for (const category of productCategories) {
      await this.client.write('product.category', [category.id], {
        property_cost_method: valuation.cost_method || 'average',
        property_valuation: 'real_time'
      });
    }
  }

  async _configureReplenishment(replenishment) {
    await this.client.executeKw('stock.warehouse.orderpoint', 'write', [[], {
      trigger: replenishment.enable_orderpoint_trigger ? 'auto' : 'manual'
    }]);
  }

  getStepInfo(step) {
    const steps = {
      [INVENTORY_STEPS.WAREHOUSE_SETUP]: {
        title: 'Warehouse Setup',
        description: 'Create and configure warehouses'
      },
      [INVENTORY_STEPS.LOCATION_STRUCTURE]: {
        title: 'Location Structure',
        description: 'Define storage locations within warehouses'
      },
      [INVENTORY_STEPS.ROUTES_DEFINITION]: {
        title: 'Routes Definition',
        description: 'Set up stock flow routes'
      },
      [INVENTORY_STEPS.VALUATION_METHOD]: {
        title: 'Valuation Method',
        description: 'Choose inventory valuation method'
      },
      [INVENTORY_STEPS.REPLENISHMENT]: {
        title: 'Replenishment',
        description: 'Configure automatic replenishment rules'
      },
      [INVENTORY_STEPS.CROSS_DOMAIN_LINKS]: {
        title: 'Cross-Domain Links',
        description: 'Connect inventory to sales and purchase'
      },
      [INVENTORY_STEPS.COMPLETION]: {
        title: 'Complete',
        description: 'Inventory setup is complete'
      }
    };
    return steps[step] || {};
  }

  getProgress() {
    const totalSteps = Object.values(INVENTORY_STEPS).length;
    return Math.round(((this.state.currentStep - 1) / (totalSteps - 1)) * 100);
  }

  getCrossDomainDependencies() {
    return this._crossDomainDependencies;
  }

  getWarnings() {
    return this.state.warnings;
  }

  getWarehouseCodeSuggestions() {
    return ['WH', 'MAIN', 'STORE', 'DEPOT', 'DC'];
  }

  reset() {
    this.state = this._getInitialState();
    this._crossDomainDependencies = {
      requiresSales: true,
      salesTeamIds: [],
      requiresPurchase: true,
      vendorIds: [],
      requiresManufacturing: false,
      workcenterIds: []
    };
  }

  exportConfig() {
    return {
      warehouses: this.state.warehouses.filter(w => w.active),
      locations: this.state.locations.filter(l => l.active),
      routes: this.state.routes.filter(r => r.active),
      routeRules: this.state.routeRules,
      valuationMethod: this.state.valuationMethod,
      replenishment: this.state.replenishment,
      crossDomainDependencies: this._crossDomainDependencies,
      completedAt: this.state.currentStep === INVENTORY_STEPS.COMPLETION
        ? new Date().toISOString()
        : null
    };
  }
}

export default InventoryWizard;
