/**
 * Master Data Setup Wizard
 * Guided setup for product categories, units of measure, and shared reference data
 */

import { OdooClient } from '../../api/OdooClient.js';

export const MASTER_DATA_STEPS = {
  CATEGORIES: 1,
  UNITS_OF_MEASURE: 2,
  PRODUCT_TEMPLATES: 3,
  ANALYTIC_ACCOUNTS: 4,
  VENDORS: 5,
  COMPLETION: 6
};

export class MasterDataSetupWizard {
  constructor(client) {
    this.client = client;
    this.state = this._getInitialState();
  }

  _getInitialState() {
    return {
      currentStep: MASTER_DATA_STEPS.CATEGORIES,
      categories: [],
      newCategory: {
        name: '',
        parent_id: null,
        property_account_income_categ_id: null,
        property_account_expense_categ_id: null
      },
      uomCategories: [],
      uoms: [],
      newUom: {
        name: '',
        category_id: null,
        factor: 1,
        rounding: 0.01,
        uom_type: 'reference',
        active: true
      },
      productTemplates: [],
      newProduct: {
        name: '',
        type: 'product',
        categ_id: null,
        uom_id: null,
        uom_po_id: null,
        list_price: 0,
        standard_price: 0,
        default_code: '',
        barcode: ''
      },
      analyticAccounts: [],
      newAnalyticAccount: {
        name: '',
        code: '',
        partner_id: null,
        active: true
      },
      vendors: [],
      newVendor: {
        name: '',
        email: '',
        phone: '',
        supplier_rank: 1,
        is_company: true
      },
      availableCategories: [],
      availableUomCategories: [],
      availableUoms: [],
      availableAccounts: [],
      errors: {},
      isLoading: false
    };
  }

  async initialize() {
    this._setState({ isLoading: true });
    
    try {
      const [categories, uomCategories, uoms, accounts, partners] = await Promise.all([
        this.client.searchRead('product.category', [], ['id', 'name', 'parent_path', 'property_account_income_categ_id', 'property_account_expense_categ_id']),
        this.client.searchRead('uom.uom', [], ['id', 'name', 'relative_uom_id', 'relative_factor']),
        this.client.searchRead('uom.uom', [], ['id', 'name', 'category_id', 'factor', 'rounding', 'uom_type']),
        this.client.searchRead('account.analytic.account', [], ['id', 'name', 'code', 'partner_id', 'active']),
        this.client.searchRead('res.partner', [['supplier_rank', '>', 0]], ['id', 'name', 'email', 'phone', 'supplier_rank'])
      ]);

      this._setState({
        categories,
        availableCategories: categories,
        uomCategories,
        availableUomCategories: uomCategories,
        uoms,
        availableUoms: uoms,
        analyticAccounts: accounts,
        availableAccounts: accounts,
        vendors: partners,
        isLoading: false
      });

      return { success: true };
    } catch (error) {
      this._setState({ isLoading: false, errors: { general: error.message } });
      return { success: false, error: error.message };
    }
  }

  _setState(updates) {
    this.state = { ...this.state, ...updates };
  }

  _clearErrors() {
    this.state.errors = {};
  }

  setCategoryField(field, value) {
    this.state.newCategory = { ...this.state.newCategory, [field]: value };
  }

  async createCategory() {
    this._clearErrors();
    const { newCategory } = this.state;

    if (!newCategory.name) {
      this.state.errors.name = 'Category name is required';
      return { success: false };
    }

    this._setState({ isLoading: true });

    try {
      const values = { name: newCategory.name };
      
      if (newCategory.parent_id) {
        values.parent_id = newCategory.parent_id;
      }

      const categoryId = await this.client.create('product.category', values);

      this.state.categories.push({
        id: categoryId,
        name: newCategory.name,
        parent_path: newCategory.parent_id 
          ? `${this.state.categories.find(c => c.id === newCategory.parent_id)?.parent_path}/${categoryId}`
          : `${categoryId}`
      });

      this.state.newCategory = this._getInitialState().newCategory;
      
      this._setState({ isLoading: false });
      return { success: true, categoryId };

    } catch (error) {
      this._setState({ isLoading: false, errors: { general: error.message } });
      return { success: false, error: error.message };
    }
  }

  async createCategoriesBatch(categoriesToCreate) {
    this._setState({ isLoading: true });
    const results = [];

    try {
      for (const cat of categoriesToCreate) {
        try {
          const values = { name: cat.name };
          if (cat.parent_name) {
            const parent = this.state.categories.find(c => c.name === cat.parent_name);
            if (parent) values.parent_id = parent.id;
          }

          const categoryId = await this.client.create('product.category', values);
          results.push({ name: cat.name, success: true, id: categoryId });
        } catch (err) {
          results.push({ name: cat.name, success: false, error: err.message });
        }
      }

      await this.initialize();
      this._setState({ isLoading: false });
      return { success: true, results };

    } catch (error) {
      this._setState({ isLoading: false, errors: { general: error.message } });
      return { success: false, error: error.message };
    }
  }

  setUomField(field, value) {
    this.state.newUom = { ...this.state.newUom, [field]: value };
  }

  async createUom() {
    this._clearErrors();
    const { newUom } = this.state;

    if (!newUom.name) {
      this.state.errors.name = 'Unit name is required';
      return { success: false };
    }
    if (!newUom.category_id) {
      this.state.errors.category_id = 'Category is required';
      return { success: false };
    }

    this._setState({ isLoading: true });

    try {
      const uomId = await this.client.create('uom.uom', {
        name: newUom.name,
        category_id: newUom.category_id,
        factor: newUom.factor,
        rounding: newUom.rounding,
        uom_type: newUom.uom_type,
        active: newUom.active
      });

      this.state.uoms.push({
        id: uomId,
        name: newUom.name,
        category_id: newUom.category_id
      });

      this.state.newUom = this._getInitialState().newUom;
      
      this._setState({ isLoading: false });
      return { success: true, uomId };

    } catch (error) {
      this._setState({ isLoading: false, errors: { general: error.message } });
      return { success: false, error: error.message };
    }
  }

  async createUomCategory() {
    this._clearErrors();
    const categoryName = this.state.newUom.category_name;
    
    if (!categoryName) {
      return { success: false, error: 'Category name required' };
    }

    this._setState({ isLoading: true });

    try {
      // uom.uom is the Odoo 19 canonical unit-of-measure model (legacy
      // uom.category was restructured out of base; uom.uom now carries
      // relative_factor / relative_uom_id directly). A freshly-created
      // unit defaults to relative_factor=1.0 (reference unit for its tree).
      const categoryId = await this.client.create('uom.uom', {
        name: categoryName,
        relative_factor: 1.0
      });

      this.state.uomCategories.push({
        id: categoryId,
        name: categoryName
      });
      this.state.availableUomCategories.push({
        id: categoryId,
        name: categoryName
      });
      
      this._setState({ isLoading: false });
      return { success: true, categoryId };

    } catch (error) {
      this._setState({ isLoading: false, errors: { general: error.message } });
      return { success: false, error: error.message };
    }
  }

  setProductField(field, value) {
    this.state.newProduct = { ...this.state.newProduct, [field]: value };
  }

  async createProduct() {
    this._clearErrors();
    const { newProduct } = this.state;

    if (!newProduct.name) {
      this.state.errors.name = 'Product name is required';
      return { success: false };
    }
    if (!newProduct.categ_id) {
      this.state.errors.categ_id = 'Category is required';
      return { success: false };
    }

    this._setState({ isLoading: true });

    try {
      const productId = await this.client.create('product.template', {
        name: newProduct.name,
        type: newProduct.type,
        categ_id: newProduct.categ_id,
        uom_id: newProduct.uom_id || 1,
        uom_po_id: newProduct.uom_po_id || newProduct.uom_id || 1,
        list_price: newProduct.list_price,
        standard_price: newProduct.standard_price,
        default_code: newProduct.default_code,
        barcode: newProduct.barcode
      });

      this.state.productTemplates.push({
        id: productId,
        name: newProduct.name,
        type: newProduct.type
      });

      this.state.newProduct = this._getInitialState().newProduct;
      
      this._setState({ isLoading: false });
      return { success: true, productId };

    } catch (error) {
      this._setState({ isLoading: false, errors: { general: error.message } });
      return { success: false, error: error.message };
    }
  }

  async createProductsBatch(productsToCreate) {
    this._setState({ isLoading: true });
    const results = [];

    try {
      for (const product of productsToCreate) {
        try {
          let categId = product.categ_id;
          if (product.categ_name && !categId) {
            const cat = this.state.categories.find(c => c.name === product.categ_name);
            categId = cat?.id;
          }

          const values = {
            name: product.name,
            type: product.type || 'product',
            categ_id: categId || 1,
            list_price: product.list_price || 0,
            standard_price: product.standard_price || 0
          };

          if (product.default_code) values.default_code = product.default_code;
          if (product.barcode) values.barcode = product.barcode;

          const productId = await this.client.create('product.template', values);
          results.push({ name: product.name, success: true, id: productId });
        } catch (err) {
          results.push({ name: product.name, success: false, error: err.message });
        }
      }

      await this.initialize();
      this._setState({ isLoading: false });
      return { success: true, results };

    } catch (error) {
      this._setState({ isLoading: false, errors: { general: error.message } });
      return { success: false, error: error.message };
    }
  }

  setAnalyticAccountField(field, value) {
    this.state.newAnalyticAccount = { ...this.state.newAnalyticAccount, [field]: value };
  }

  async createAnalyticAccount() {
    this._clearErrors();
    const { newAnalyticAccount } = this.state;

    if (!newAnalyticAccount.name) {
      this.state.errors.name = 'Account name is required';
      return { success: false };
    }

    this._setState({ isLoading: true });

    try {
      const values = {
        name: newAnalyticAccount.name,
        code: newAnalyticAccount.code || '',
        active: newAnalyticAccount.active
      };

      if (newAnalyticAccount.partner_id) {
        values.partner_id = newAnalyticAccount.partner_id;
      }

      const accountId = await this.client.create('account.analytic.account', values);

      this.state.analyticAccounts.push({
        id: accountId,
        name: newAnalyticAccount.name,
        code: newAnalyticAccount.code
      });

      this.state.newAnalyticAccount = this._getInitialState().newAnalyticAccount;
      
      this._setState({ isLoading: false });
      return { success: true, accountId };

    } catch (error) {
      this._setState({ isLoading: false, errors: { general: error.message } });
      return { success: false, error: error.message };
    }
  }

  setVendorField(field, value) {
    this.state.newVendor = { ...this.state.newVendor, [field]: value };
  }

  async createVendor() {
    this._clearErrors();
    const { newVendor } = this.state;

    if (!newVendor.name) {
      this.state.errors.name = 'Vendor name is required';
      return { success: false };
    }

    this._setState({ isLoading: true });

    try {
      const values = {
        name: newVendor.name,
        email: newVendor.email || '',
        phone: newVendor.phone || '',
        supplier_rank: newVendor.supplier_rank || 1,
        is_company: newVendor.is_company
      };

      const vendorId = await this.client.create('res.partner', values);

      this.state.vendors.push({
        id: vendorId,
        name: newVendor.name,
        email: newVendor.email,
        supplier_rank: newVendor.supplier_rank
      });

      this.state.newVendor = this._getInitialState().newVendor;
      
      this._setState({ isLoading: false });
      return { success: true, vendorId };

    } catch (error) {
      this._setState({ isLoading: false, errors: { general: error.message } });
      return { success: false, error: error.message };
    }
  }

  async nextStep() {
    this._clearErrors();
    const { currentStep } = this.state;

    if (currentStep === MASTER_DATA_STEPS.VENDORS) {
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
      this._setState({
        currentStep: MASTER_DATA_STEPS.COMPLETION,
        isLoading: false
      });

      return { 
        success: true,
        config: this.exportConfig()
      };
    } catch (error) {
      this._setState({ isLoading: false, errors: { general: error.message } });
      return { success: false, error: error.message };
    }
  }

  getStepInfo(step) {
    const steps = {
      [MASTER_DATA_STEPS.CATEGORIES]: {
        title: 'Product Categories',
        description: 'Create and manage product category hierarchy'
      },
      [MASTER_DATA_STEPS.UNITS_OF_MEASURE]: {
        title: 'Units of Measure',
        description: 'Configure measurement units and conversions'
      },
      [MASTER_DATA_STEPS.PRODUCT_TEMPLATES]: {
        title: 'Product Templates',
        description: 'Create basic product templates'
      },
      [MASTER_DATA_STEPS.ANALYTIC_ACCOUNTS]: {
        title: 'Analytic Accounts',
        description: 'Set up cost and project tracking accounts'
      },
      [MASTER_DATA_STEPS.VENDORS]: {
        title: 'Vendors',
        description: 'Manage supplier records'
      },
      [MASTER_DATA_STEPS.COMPLETION]: {
        title: 'Complete',
        description: 'Master data setup is complete'
      }
    };
    return steps[step] || {};
  }

  getProgress() {
    const totalSteps = Object.values(MASTER_DATA_STEPS).length;
    return Math.round(((this.state.currentStep - 1) / (totalSteps - 1)) * 100);
  }

  reset() {
    this.state = this._getInitialState();
  }

  exportConfig() {
    return {
      categoriesCount: this.state.categories.length,
      uomCategoriesCount: this.state.uomCategories.length,
      uomsCount: this.state.uoms.length,
      productsCount: this.state.productTemplates.length,
      analyticAccountsCount: this.state.analyticAccounts.length,
      vendorsCount: this.state.vendors.length,
      completedAt: new Date().toISOString()
    };
  }
}

export default MasterDataSetupWizard;
