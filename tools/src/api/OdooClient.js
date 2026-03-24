export class OdooError extends Error {
  constructor(message, code = '', context = {}) {
    super(message);
    this.code = code;
    this.context = context;
  }
}

export class OdooClient {
  constructor({ baseUrl, database, username, password, fetchImpl = fetch }) {
    if (!baseUrl || !database || !username || !password) {
      throw new Error('Missing required config: baseUrl, database, username, and password are required');
    }
    
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.database = database;
    this.username = username;
    this.password = password;
    this.fetchImpl = fetchImpl;
    this.sessionId = '';
    this.uid = 0;
    this.context = { lang: 'en_US', tz: 'Africa/Johannesburg' };
  }

  async connect() {
    try {
      await this.authenticate();
      const version = await this.getVersionInfo();
      return {
        connected: true,
        uid: this.uid,
        version: version.server_version,
        edition: version.server_version_info?.at(-1) || 'unknown'
      };
    } catch (error) {
      throw new OdooError(`Connection failed: ${error.message}`, 'AUTH_FAILED');
    }
  }

  async authenticate() {
    const response = await this._post('/web/session/authenticate', {
      db: this.database,
      login: this.username,
      password: this.password
    });

    if (!response.uid) {
      throw new OdooError('Authentication failed - invalid credentials', 'AUTH_FAILED');
    }

    this.uid = response.uid;
    this.context = { ...this.context, ...response.user_context };
  }

  async getVersionInfo() {
    return this._post('/web/webclient/version_info', {});
  }

  async searchRead(model, domain = [], fields = [], options = {}) {
    return this.executeKw(model, 'search_read', [domain], {
      fields,
      limit: options.limit ?? 100,
      offset: options.offset ?? 0,
      order: options.order || 'id',
      context: this.context
    });
  }

  async search(model, domain = [], options = {}) {
    return this.executeKw(model, 'search', [domain], {
      limit: options.limit,
      offset: options.offset,
      order: options.order,
      context: this.context
    });
  }

  async read(model, ids, fields = []) {
    return this.executeKw(model, 'read', [ids], { fields, context: this.context });
  }

  async create(model, values) {
    return this.executeKw(model, 'create', [values], { context: this.context });
  }

  async createBatch(model, valuesArray, batchSize = 100) {
    const results = [];
    const errors = [];
    
    for (let i = 0; i < valuesArray.length; i += batchSize) {
      const batch = valuesArray.slice(i, i + batchSize);
      
      try {
        const ids = await this.executeKw(model, 'create', batch, { context: this.context });
        results.push(...(Array.isArray(ids) ? ids : [ids]));
      } catch (error) {
        errors.push({ batchIndex: i, error: error.message, records: batch });
        if (options?.continueOnError) { // continue } else throw error;
      }
    }
    
    return { ids: results, errors, totalCreated: results.length };
  }

  async write(model, ids, values) {
    return this.executeKw(model, 'write', [ids, values], { context: this.context });
  }

  async unlink(model, ids) {
    return this.executeKw(model, 'unlink', [ids], { context: this.context });
  }

  async fieldsGet(model, attributes = ['string', 'type', 'required', 'selection', 'relation']) {
    return this.executeKw(model, 'fields_get', [], { attributes, context: this.context });
  }

  async executeKw(model, method, args = [], kwargs = {}) {
    return this._post('/web/dataset/call_kw', {
      model,
      method,
      args,
      kwargs
    });
  }

  async _post(endpoint, params) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await this.fetchImpl(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.sessionId ? { 'Cookie': `session_id=${this.sessionId}` } : {})
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        id: Math.floor(Math.random() * 1000000),
        params
      })
    });

    if (!response.ok) {
      throw new OdooError(`HTTP ${response.status}: ${response.statusText}`, 'HTTP_ERROR');
    }

    const body = await response.json();
    
    if (body.error) {
      const errorData = body.error.data || {};
      throw new OdooError(
        errorData.message || body.error.message || 'Odoo error',
        errorData.name || 'ODOO_ERROR',
        errorData
      );
    }

    const sessionCookie = response.headers.get('set-cookie');
    if (sessionCookie && !this.sessionId) {
      const match = sessionCookie.match(/session_id=([^;]+)/);
      if (match) this.sessionId = match[1];
    }

    return body.result;
  }

  async testConnection() {
    try {
      await this.connect();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}