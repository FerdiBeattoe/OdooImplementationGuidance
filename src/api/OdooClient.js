/**
 * OdooClient - Client for Odoo RPC communication
 * Used by wizards for Odoo database operations
 */

// Mock implementation for testing without real Odoo connection
export class OdooClient {
  constructor({ baseUrl, database, username, password, fetchImpl }) {
    this.baseUrl = baseUrl;
    this.database = database;
    this.username = username;
    this.password = password;
    this.fetchImpl = fetchImpl;
    this.sessionId = '';
    this.uid = 0;
    this.context = { lang: 'en_US', tz: 'Africa/Johannesburg' };
    this.companyId = 1;
    this.partnerId = 1;
  }

  async connect() {
    return { connected: true, uid: 1, version: '19.0', edition: 'enterprise' };
  }

  async authenticate() {
    this.uid = 1;
    return true;
  }

  async searchRead(model, domain = [], fields = [], options = {}) {
    return [];
  }

  async create(model, values) {
    return Math.floor(Math.random() * 10000);
  }

  async write(model, ids, values) {
    return true;
  }
}

export class OdooError extends Error {
  constructor(message, code = '', context = {}) {
    super(message);
    this.code = code;
    this.context = context;
  }
}
