/**
 * Odoo Online API Client
 * Handles trial database creation via Odoo.com's online signup flow
 */

export class OdooOnlineAPI {
  constructor({ fetchImpl = fetch } = {}) {
    this.fetchImpl = fetchImpl;
    this.baseUrl = 'https://www.odoo.com';
    this.trialEndpoint = '/web/signup';
  }

  /**
   * Create a trial database on Odoo Online
   * @param {Object} params
   * @param {string} params.email - User email address
   * @param {string} params.password - Desired password
   * @param {string} params.database - Desired database name
   * @param {string} params.company_name - Company name
   * @param {string} [params.country_code] - ISO country code (e.g., 'US', 'ZA')
   * @param {string} [params.phone] - Phone number
   * @param {number} [params.plan_id] - Plan ID for the trial
   * @returns {Promise<{success: boolean, database: string, credentials: {login: string, password: string}}>}
   */
  async createTrial({ email, password, database, company_name, country_code, phone, plan_id }) {
    const normalizedDb = this._normalizeDatabaseName(database);
    
    if (!this._validateEmail(email)) {
      throw new OdooOnlineError('Invalid email address', 'INVALID_EMAIL');
    }
    
    if (!this._validatePassword(password)) {
      throw new OdooOnlineError('Password must be at least 8 characters', 'INVALID_PASSWORD');
    }
    
    if (!this._validateDatabaseName(normalizedDb)) {
      throw new OdooOnlineError('Invalid database name (alphanumeric and underscores only)', 'INVALID_DATABASE');
    }

    const response = await this.fetchImpl(`${this.baseUrl}${this.trialEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        params: {
          email,
          password,
          dbname: normalizedDb,
          company_name: company_name || email.split('@')[0],
          country_code: country_code || '',
          phone: phone || '',
          plan_id: plan_id || 'trial'
        }
      })
    });

    if (!response.ok) {
      throw new OdooOnlineError(
        `Trial creation failed: ${response.status}`,
        'REQUEST_FAILED'
      );
    }

    const data = await response.json();

    if (data.error) {
      throw new OdooOnlineError(
        data.error.data?.message || data.error.message || 'Trial creation failed',
        'API_ERROR'
      );
    }

    return {
      success: true,
      database: normalizedDb,
      credentials: {
        login: email,
        password: password
      },
      instance_url: `https://${normalizedDb}.odoo.com`
    };
  }

  /**
   * Get available trial plans
   * @returns {Promise<Array<{id: number, name: string, trial_days: number}>>}
   */
  async getTrialPlans() {
    const response = await this.fetchImpl(`${this.baseUrl}/web/api/trial-plans`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new OdooOnlineError('Failed to fetch trial plans', 'REQUEST_FAILED');
    }

    const data = await response.json();
    return data.result || [];
  }

  /**
   * Check if a database name is available
   * @param {string} database - Database name to check
   * @returns {Promise<{available: boolean, suggestion?: string}>}
   */
  async checkDatabaseAvailability(database) {
    const normalizedDb = this._normalizeDatabaseName(database);

    const response = await this.fetchImpl(`${this.baseUrl}/web/api/db/available`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        params: { dbname: normalizedDb }
      })
    });

    const data = await response.json();
    
    return {
      available: data.result?.available ?? false,
      suggestion: data.result?.suggestion || null
    };
  }

  /**
   * Request email verification for trial
   * @param {string} email - Email to verify
   * @returns {Promise<{verification_sent: boolean}>}
   */
  async requestEmailVerification(email) {
    const response = await this.fetchImpl(`${this.baseUrl}/web/signup/send-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        params: { email }
      })
    });

    const data = await response.json();
    return {
      verification_sent: !data.error
    };
  }

  /**
   * Verify email token
   * @param {string} token - Verification token
   * @returns {Promise<{verified: boolean}>}
   */
  async verifyEmailToken(token) {
    const response = await this.fetchImpl(`${this.baseUrl}/web/signup/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        params: { token }
      })
    });

    const data = await response.json();
    return {
      verified: data.result?.verified ?? false
    };
  }

  /**
   * Get country list for localization
   * @returns {Promise<Array<{code: string, name: string}>>}
   */
  async getCountries() {
    const response = await this.fetchImpl(`${this.baseUrl}/web/api/countries`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    const data = await response.json();
    return data.result || [];
  }

  /**
   * Normalize database name to Odoo requirements
   * @private
   */
  _normalizeDatabaseName(db) {
    return db
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 50);
  }

  /**
   * Validate email format
   * @private
   */
  _validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  /**
   * Validate password strength
   * @private
   */
  _validatePassword(password) {
    return typeof password === 'string' && password.length >= 8;
  }

  /**
   * Validate database name format
   * @private
   */
  _validateDatabaseName(db) {
    return /^[a-z][a-z0-9_]{2,49}$/.test(db);
  }
}

export class OdooOnlineError extends Error {
  constructor(message, code = 'ODOO_ONLINE_ERROR') {
    super(message);
    this.name = 'OdooOnlineError';
    this.code = code;
  }
}

/**
 * Factory function to create OdooOnlineAPI with environment configuration
 */
export function createOdooOnlineAPI() {
  return new OdooOnlineAPI({
    fetchImpl: fetch
  });
}

export default OdooOnlineAPI;
