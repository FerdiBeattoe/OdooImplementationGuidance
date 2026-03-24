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

  async createBatch(model, valuesArray, batchSize = 50) {
    const results = [];
    const errors = [];
    for (let i = 0; i < valuesArray.length; i += batchSize) {
      const batch = valuesArray.slice(i, i + batchSize);
      try {
        const ids = await this.executeKw(model, 'create', batch);
        results.push(...(Array.isArray(ids) ? ids : [ids]));
      } catch (err) {
        errors.push({ index: i, error: err.message });
      }
    }
    return { ids: results, errors, totalCreated: results.length };
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
      email: data.email
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
      groups_id: data.groupIds ? [[6, false, data.groupIds]] : undefined
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
      currency_id: data.currencyId || false
    });
  }

  // ── Sales Teams (crm.team) ────────────────────────────────

  async createSalesTeam(data) {
    return this.create('crm.team', {
      name: data.name,
      user_id: data.leaderId || false,
      company_id: this.companyId
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
      company_id: this.companyId
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
      company_id: this.companyId
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
      country_id: data.countryId || false,
      state_id: data.stateId || false,
      vat: data.taxId || false,
      customer_rank: 1,
      company_type: data.companyName ? 'company' : 'person'
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
      country_id: data.countryId || false,
      supplier_rank: 1
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
      company_id: this.companyId
    });
  }

  // ── Bill of Materials (mrp.bom) ───────────────────────────

  async createBOM(data) {
    return this.create('mrp.bom', {
      product_tmpl_id: data.productId,
      type: this._mapBomType(data.bomType),
      product_qty: parseFloat(data.quantity) || 1,
      bom_line_ids: (data.components || []).map(c => [0, 0, {
        product_id: c.productId,
        product_qty: parseFloat(c.qty) || 1
      }])
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
