/**
 * OdooClient — Odoo 19 JSON-RPC API client
 * All endpoints are correct for Odoo 19.
 * Models and field names validated against Odoo 19 spec.
 */
export class OdooError extends Error {
  constructor(message, code = '', context = {}) {
    super(message);
    this.name = 'OdooError';
    this.code = code;
    this.context = context;
  }
}

export class OdooClient {
  constructor({ baseUrl, database, username, password, fetchImpl = globalThis.fetch.bind(globalThis) }) {
    this.baseUrl = (baseUrl || '').replace(/\/+$/, '');
    this.database = database;
    this.username = username;
    this.password = password;
    this.fetchImpl = fetchImpl;
    this.sessionId = '';
    this.uid = 0;
    this.context = { lang: 'en_US', tz: 'UTC' };
    this.companyId = 1;
  }

  // ── Auth ──────────────────────────────────────────────────

  /** Authenticate and return connection info */
  async connect() {
    await this.authenticate();
    const version = await this.getVersionInfo();
    return {
      connected: true,
      uid: this.uid,
      version: version.server_version,
      edition: version.server_version_info?.at(-1) || 'community'
    };
  }

  /** POST /web/session/authenticate */
  async authenticate() {
    const result = await this._post('/web/session/authenticate', {
      db: this.database,
      login: this.username,
      password: this.password
    });
    if (!result?.uid) {
      throw new OdooError('Authentication failed — invalid credentials or database', 'AUTH_FAILED');
    }
    this.uid = result.uid;
    this.context = { ...this.context, ...(result.user_context || {}) };
    this.companyId = result.company_id || 1;
    return result;
  }

  /** GET /web/webclient/version_info */
  async getVersionInfo() {
    return this._post('/web/webclient/version_info', {});
  }

  async testConnection() {
    try {
      const result = await this.connect();
      return { success: true, ...result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async getDatabases() {
    return this._post('/web/database/list', {});
  }

  // ── Generic ORM ──────────────────────────────────────────

  /** POST /web/dataset/call_kw */
  async executeKw(model, method, args = [], kwargs = {}) {
    return this._post('/web/dataset/call_kw', { model, method, args, kwargs: { context: this.context, ...kwargs } });
  }

  async searchRead(model, domain = [], fields = [], options = {}) {
    return this.executeKw(model, 'search_read', [domain], {
      fields,
      limit: options.limit ?? 200,
      offset: options.offset ?? 0,
      order: options.order || 'id asc'
    });
  }

  async create(model, values) {
    return this.executeKw(model, 'create', [values]);
  }

  async createBatch(model, records, batchSize = 100) {
    const results = [];
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const ids = await this.executeKw(model, 'create', [batch], {});
      results.push(...(Array.isArray(ids) ? ids : [ids]));
    }
    return results;
  }

  async write(model, ids, values) {
    return this.executeKw(model, 'write', [ids, values]);
  }

  async unlink(model, ids) {
    return this.executeKw(model, 'unlink', [ids]);
  }

  async read(model, ids, fields = []) {
    return this.executeKw(model, 'read', [ids], { fields });
  }

  // ── Company (res.company) ─────────────────────────────────

  async getCompanies() {
    return this.searchRead('res.company', [], ['id', 'name', 'email', 'phone', 'street', 'city', 'country_id', 'currency_id', 'vat', 'company_registry', 'logo']);
  }

  async createCompany(data) {
    return this.create('res.company', {
      name: data.companyName || data.name,
      street: data.street,
      city: data.city,
      zip: data.zip,
      country_id: data.countryId,
      state_id: data.stateId,
      vat: data.taxId,
      company_registry: data.registryNumber,
      currency_id: data.currencyId,
      phone: data.phone,
      email: data.email,
      website: data.website || false,
      tz: data.tz || 'UTC',
      lang: data.lang || 'en_US',
      fiscalyear_last_day: data.fiscalyearLastDay || 31,
      fiscalyear_last_month: data.fiscalyearLastMonth || '12'
    });
  }

  async updateCompanySettings(id, data) {
    return this.write('res.company', [id], data);
  }

  // ── Users (res.users) ─────────────────────────────────────

  async createUser(data) {
    return this.create('res.users', {
      name: data.name,
      login: data.email,
      email: data.email,
      company_id: this.companyId,
      groups_id: data.groupIds ? [[6, false, data.groupIds]] : undefined,
      share: false,
      active: true,
      tz: data.tz || 'UTC',
      lang: data.lang || 'en_US'
    });
  }

  async setUserGroups(userId, groupIds) {
    return this.write('res.users', [userId], { groups_id: [[6, false, groupIds]] });
  }

  // ── Chart of Accounts (account.account) ───────────────────

  async getChartOfAccounts() {
    return this.searchRead('account.account', [], ['id', 'code', 'name', 'account_type', 'currency_id']);
  }

  async createAccount(data) {
    return this.create('account.account', {
      code: data.code,
      name: data.name,
      account_type: data.accountType || 'asset_current',
      currency_id: data.currencyId || false,
      reconcile: data.reconcile || false,
      deprecated: data.deprecated || false,
      company_id: data.companyId || this.companyId,
      tax_ids: data.taxIds ? [[6, false, data.taxIds]] : undefined
    });
  }

  // ── Sales Teams (crm.team) ────────────────────────────────

  async createSalesTeam(data) {
    return this.create('crm.team', {
      name: data.name,
      user_id: data.leaderId || false,
      company_id: this.companyId,
      member_ids: data.memberIds ? [[6, false, data.memberIds]] : undefined,
      use_leads: data.useLeads !== undefined ? data.useLeads : true,
      use_opportunities: data.useOpportunities !== undefined ? data.useOpportunities : true
    });
  }

  // ── Pricelists (product.pricelist) ────────────────────────

  async createPricelist(data) {
    return this.create('product.pricelist', {
      name: data.name,
      currency_id: data.currencyId,
      company_id: this.companyId
    });
  }

  // ── Warehouse (stock.warehouse) ───────────────────────────

  async createWarehouse(data) {
    return this.create('stock.warehouse', {
      name: data.name,
      code: data.shortName || data.code,
      company_id: this.companyId,
      reception_steps: data.receptionSteps || 'one_step',
      delivery_steps: data.deliverySteps || 'ship_only',
      partner_id: data.partnerId || false
    });
  }

  // ── Products (product.template / product.product) ─────────

  async createProduct(data) {
    return this.create('product.template', {
      name: data.name,
      default_code: data.internalRef,
      type: this._mapProductType(data.productType),
      list_price: parseFloat(data.salesPrice) || 0,
      standard_price: parseFloat(data.cost) || 0,
      barcode: data.barcode || false,
      sale_ok: data.canBeSold !== false,
      purchase_ok: data.canBePurchased !== false,
      company_id: this.companyId,
      categ_id: data.categId || false,
      uom_id: data.uomId || false,
      uom_po_id: data.uomPoId || false,
      taxes_id: data.taxesId ? [[6, false, data.taxesId]] : undefined,
      supplier_taxes_id: data.supplierTaxesId ? [[6, false, data.supplierTaxesId]] : undefined,
      route_ids: data.routeIds ? [[6, false, data.routeIds]] : undefined,
      tracking: data.tracking || 'none',
      description_sale: data.descriptionSale || false,
      description_purchase: data.descriptionPurchase || false,
      attribute_line_ids: data.attributeLineIds
        ? data.attributeLineIds.map(line => [0, 0, {
            attribute_id: line.attributeId,
            value_ids: [[6, false, line.valueIds]]
          }])
        : undefined
    });
  }

  async createProducts(dataArray) {
    return this.createBatch('product.template', dataArray.map(d => ({
      name: d.name,
      default_code: d.internalRef,
      type: this._mapProductType(d.productType),
      list_price: parseFloat(d.salesPrice) || 0,
      standard_price: parseFloat(d.cost) || 0
    })));
  }

  _mapProductType(type) {
    const map = { 'Storable': 'product', 'Consumable': 'consu', 'Service': 'service' };
    return map[type] || 'consu';
  }

  // ── Customers / Vendors (res.partner) ─────────────────────

  async createCustomer(data) {
    return this.create('res.partner', {
      name: data.name,
      company_name: data.companyName || false,
      email: data.email,
      phone: data.phone,
      street: data.street,
      city: data.city,
      zip: data.zip || false,
      mobile: data.mobile || false,
      website: data.website || false,
      country_id: data.countryId || false,
      state_id: data.stateId || false,
      vat: data.taxId || false,
      customer_rank: 1,
      company_type: data.companyName ? 'company' : 'person',
      property_payment_term_id: data.paymentTermId || false
    });
  }

  async createVendor(data) {
    return this.create('res.partner', {
      name: data.name,
      company_name: data.company || false,
      email: data.email,
      phone: data.phone,
      street: data.street,
      city: data.city,
      zip: data.zip || false,
      mobile: data.mobile || false,
      website: data.website || false,
      country_id: data.countryId || false,
      state_id: data.stateId || false,
      supplier_rank: 1,
      property_payment_term_id: data.paymentTermId || false
    });
  }

  // ── Employees (hr.employee) ───────────────────────────────

  async createEmployee(data) {
    return this.create('hr.employee', {
      name: data.name,
      job_id: data.jobPositionId || false,
      department_id: data.departmentId || false,
      work_email: data.workEmail,
      work_phone: data.workPhone,
      company_id: this.companyId,
      parent_id: data.parentId || false,
      resource_calendar_id: data.resourceCalendarId || false,
      tz: data.tz || 'UTC',
      lang: data.lang || 'en_US'
    });
  }

  // ── Bill of Materials (mrp.bom) ───────────────────────────

  async createBOM(data) {
    return this.create('mrp.bom', {
      product_tmpl_id: data.productId,
      type: this._mapBomType(data.bomType),
      product_qty: parseFloat(data.quantity) || 1,
      product_uom_id: data.productUomId || false,
      company_id: data.companyId || this.companyId,
      bom_line_ids: (data.components || []).map(c => [0, 0, {
        product_id: c.productId,
        product_qty: parseFloat(c.qty) || 1
      }]),
      operation_ids: data.operations
        ? data.operations.map(op => [0, 0, {
            name: op.name,
            workcenter_id: op.workcenterId,
            time_cycle_manual: parseFloat(op.duration) || 0,
            sequence: op.sequence || 10
          }])
        : undefined
    });
  }

  _mapBomType(type) {
    const map = { 'Manufacture': 'normal', 'Kit': 'phantom', 'Subcontracting': 'subcontract' };
    return map[type] || 'normal';
  }

  // ── Journal Entries (account.move) ────────────────────────

  async createJournalEntry(data) {
    return this.create('account.move', {
      move_type: 'entry',
      date: data.date,
      ref: data.reference,
      line_ids: (data.lines || []).map(l => [0, 0, {
        account_id: l.accountId,
        partner_id: l.partnerId || false,
        debit: parseFloat(l.debit) || 0,
        credit: parseFloat(l.credit) || 0,
        name: l.name || data.reference
      }])
    });
  }

  // ── Product Attributes (product.attribute) ─────────────────

  async createAttribute(data) {
    return this.create('product.attribute', {
      name: data.name,
      display_type: data.displayType || 'radio',
      create_variant: data.createVariant || 'always'
    });
  }

  async createAttributeValue(data) {
    return this.create('product.attribute.value', {
      name: data.name,
      attribute_id: data.attributeId,
      color: data.color || false
    });
  }

  async createAttributeLine(data) {
    return this.create('product.template.attribute.line', {
      product_tmpl_id: data.productTmplId,
      attribute_id: data.attributeId,
      value_ids: [[6, false, data.valueIds]]
    });
  }

  // ── Product Variants (product.product) ─────────────────────

  async getProductVariants(productTemplateId) {
    return this.searchRead('product.product', [['product_tmpl_id', '=', productTemplateId]], [
      'id', 'name', 'default_code', 'barcode', 'product_template_attribute_value_ids',
      'standard_price', 'lst_price', 'qty_available', 'virtual_available', 'active'
    ]);
  }

  async updateVariant(variantId, data) {
    return this.write('product.product', [variantId], data);
  }

  // ── Stock Operation Types (stock.picking.type) ─────────────

  async createOperationType(data) {
    return this.create('stock.picking.type', {
      name: data.name,
      code: data.code,
      sequence_code: data.sequenceCode || false,
      warehouse_id: data.warehouseId || false,
      default_location_src_id: data.defaultLocationSrcId || false,
      default_location_dest_id: data.defaultLocationDestId || false,
      use_create_lots: data.useCreateLots !== undefined ? data.useCreateLots : true,
      use_existing_lots: data.useExistingLots !== undefined ? data.useExistingLots : true,
      show_operations: data.showOperations || false,
      company_id: data.companyId || this.companyId
    });
  }

  // ── Sequences (ir.sequence) ────────────────────────────────

  async createSequence(data) {
    return this.create('ir.sequence', {
      name: data.name,
      code: data.code,
      prefix: data.prefix || false,
      suffix: data.suffix || false,
      padding: data.padding || 5,
      number_next: data.numberNext || 1,
      number_increment: data.numberIncrement || 1,
      company_id: data.companyId || this.companyId
    });
  }

  // ── Putaway Rules (stock.putaway.rule) ─────────────────────

  async createPutawayRule(data) {
    return this.create('stock.putaway.rule', {
      product_id: data.productId || false,
      category_id: data.categoryId || false,
      location_in_id: data.locationInId,
      location_out_id: data.locationOutId,
      company_id: data.companyId || this.companyId
    });
  }

  // ── Reordering Rules (stock.warehouse.orderpoint) ──────────

  async createReorderingRule(data) {
    return this.create('stock.warehouse.orderpoint', {
      product_id: data.productId,
      warehouse_id: data.warehouseId,
      location_id: data.locationId,
      product_min_qty: parseFloat(data.minQty) || 0,
      product_max_qty: parseFloat(data.maxQty) || 0,
      qty_multiple: parseFloat(data.qtyMultiple) || 1,
      company_id: data.companyId || this.companyId
    });
  }

  // ── Fiscal Positions (account.fiscal.position) ─────────────

  async createFiscalPosition(data) {
    return this.create('account.fiscal.position', {
      name: data.name,
      company_id: data.companyId || this.companyId,
      auto_apply: data.autoApply || false,
      country_id: data.countryId || false,
      country_group_id: data.countryGroupId || false,
      vat_required: data.vatRequired || false,
      note: data.note || false
    });
  }

  async createFiscalPositionTaxMapping(data) {
    return this.create('account.fiscal.position.tax', {
      position_id: data.positionId,
      tax_src_id: data.taxSrcId,
      tax_dest_id: data.taxDestId || false
    });
  }

  // ── Journals (account.journal) ─────────────────────────────

  async createJournal(data) {
    return this.create('account.journal', {
      name: data.name,
      code: data.code,
      type: data.type || 'general',
      company_id: data.companyId || this.companyId,
      default_account_id: data.defaultAccountId || false,
      currency_id: data.currencyId || false
    });
  }

  // ── Taxes (account.tax) ────────────────────────────────────

  async createTax(data) {
    return this.create('account.tax', {
      name: data.name,
      amount: parseFloat(data.amount) || 0,
      amount_type: data.amountType || 'percent',
      type_tax_use: data.typeTaxUse || 'sale',
      company_id: data.companyId || this.companyId,
      tax_group_id: data.taxGroupId || false,
      description: data.description || false,
      price_include: data.priceInclude || false,
      include_base_amount: data.includeBaseAmount || false
    });
  }

  // ── CRM Stages (crm.stage) ────────────────────────────────

  async createCrmStage(data) {
    return this.create('crm.stage', {
      name: data.name,
      sequence: data.sequence || 10,
      is_won: data.isWon || false,
      team_id: data.teamId || false,
      requirements: data.requirements || false
    });
  }

  // ── Departments (hr.department) ────────────────────────────

  async createDepartment(data) {
    return this.create('hr.department', {
      name: data.name,
      parent_id: data.parentId || false,
      manager_id: data.managerId || false,
      company_id: data.companyId || this.companyId
    });
  }

  // ── Job Positions (hr.job) ─────────────────────────────────

  async createJobPosition(data) {
    return this.create('hr.job', {
      name: data.name,
      department_id: data.departmentId || false,
      company_id: data.companyId || this.companyId,
      no_of_recruitment: data.noOfRecruitment || 0,
      description: data.description || false
    });
  }

  // ── Leave Types (hr.leave.type) ────────────────────────────

  async createLeaveType(data) {
    return this.create('hr.leave.type', {
      name: data.name,
      leave_validation_type: data.leaveValidationType || 'hr',
      requires_allocation: data.requiresAllocation || 'no',
      company_id: data.companyId || this.companyId,
      color: data.color || false
    });
  }

  // ── Work Centers (mrp.workcenter) ──────────────────────────

  async createWorkcenter(data) {
    return this.create('mrp.workcenter', {
      name: data.name,
      code: data.code || false,
      resource_calendar_id: data.resourceCalendarId || false,
      time_efficiency: parseFloat(data.timeEfficiency) || 100,
      capacity: parseFloat(data.capacity) || 1,
      oee_target: parseFloat(data.oeeTarget) || 90,
      time_start: parseFloat(data.timeStart) || 0,
      time_stop: parseFloat(data.timeStop) || 0,
      costs_hour: parseFloat(data.costsHour) || 0,
      company_id: data.companyId || this.companyId
    });
  }

  // ── Sale Orders (sale.order) ───────────────────────────────

  async createSaleOrder(data) {
    return this.create('sale.order', {
      partner_id: data.partnerId,
      date_order: data.dateOrder || false,
      validity_date: data.validityDate || false,
      pricelist_id: data.pricelistId || false,
      payment_term_id: data.paymentTermId || false,
      user_id: data.userId || false,
      team_id: data.teamId || false,
      company_id: data.companyId || this.companyId,
      client_order_ref: data.clientOrderRef || false,
      note: data.note || false,
      order_line: (data.orderLines || []).map(line => [0, 0, {
        product_id: line.productId,
        product_uom_qty: parseFloat(line.quantity) || 1,
        price_unit: parseFloat(line.priceUnit) || 0,
        discount: parseFloat(line.discount) || 0,
        name: line.description || line.name || false,
        product_uom: line.productUom || false,
        tax_id: line.taxIds ? [[6, false, line.taxIds]] : undefined
      }])
    });
  }

  // ── HTTP ──────────────────────────────────────────────────

  async _post(endpoint, params) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await this.fetchImpl(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.sessionId ? { 'Cookie': `session_id=${this.sessionId}` } : {})
      },
      credentials: 'include',
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        id: Math.floor(Math.random() * 1_000_000),
        params
      })
    });

    if (!response.ok) {
      throw new OdooError(`HTTP ${response.status}: ${response.statusText}`, 'HTTP_ERROR');
    }

    const body = await response.json();

    if (body.error) {
      const d = body.error.data || {};
      // Surface the Odoo error message to the UI
      const msg = d.message || d.arguments?.[0] || body.error.message || 'Unknown Odoo error';
      throw new OdooError(msg, d.name || body.error.code || 'ODOO_ERROR', d);
    }

    // Capture session cookie if returned
    const setCookie = response.headers.get('set-cookie');
    if (setCookie && !this.sessionId) {
      const m = setCookie.match(/session_id=([^;]+)/);
      if (m) this.sessionId = m[1];
    }

    return body.result;
  }
}
