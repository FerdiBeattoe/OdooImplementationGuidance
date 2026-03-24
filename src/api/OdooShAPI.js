/**
 * Odoo.sh API Client
 * Handles Odoo.sh project provisioning and management
 */

export class OdooShAPI {
  constructor({ fetchImpl = fetch } = {}) {
    this.fetchImpl = fetchImpl;
    this.baseUrl = 'https://www.odoo.sh';
    this.apiVersion = 'v1';
  }

  /**
   * Set authentication token
   * @param {string} token - Odoo.sh API token
   */
  setAuthToken(token) {
    this.authToken = token;
  }

  /**
   * Create a new Odoo.sh project
   * @param {Object} params
   * @param {string} params.name - Project name
   * @param {string} params.edition - 'community' or 'enterprise'
   * @param {string} [params.version] - Odoo version (default: '19.0')
   * @param {string} [params.region] - Deployment region
   * @param {string} [params.repository_url] - Git repository URL
   * @returns {Promise<{id: string, name: string, url: string, status: string}>}
   */
  async createProject({ name, edition, version = '19.0', region, repository_url }) {
    if (!this.authToken) {
      throw new OdooShError('Authentication required', 'AUTH_REQUIRED');
    }

    const normalizedEdition = edition?.toLowerCase();
    if (!['community', 'enterprise'].includes(normalizedEdition)) {
      throw new OdooShError('Edition must be community or enterprise', 'INVALID_EDITION');
    }

    const response = await this.fetchImpl(`${this.baseUrl}/api/${this.apiVersion}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        name: this._sanitizeProjectName(name),
        edition: normalizedEdition,
        version,
        region: region || 'eu',
        repository_url: repository_url || null
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new OdooShError(
        errorData.message || `Project creation failed: ${response.status}`,
        'REQUEST_FAILED'
      );
    }

    const data = await response.json();
    
    return {
      id: data.id,
      name: data.name,
      url: data.url || `https://${data.name}.odo.sh`,
      status: data.status || 'creating',
      branch_url: data.branch_url || null
    };
  }

  /**
   * List user's Odoo.sh projects
   * @returns {Promise<Array<{id: string, name: string, url: string, edition: string, status: string}>>}
   */
  async listProjects() {
    if (!this.authToken) {
      throw new OdooShError('Authentication required', 'AUTH_REQUIRED');
    }

    const response = await this.fetchImpl(`${this.baseUrl}/api/${this.apiVersion}/projects`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new OdooShError('Failed to list projects', 'REQUEST_FAILED');
    }

    const data = await response.json();
    return data.projects || [];
  }

  /**
   * Get project details
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>}
   */
  async getProject(projectId) {
    if (!this.authToken) {
      throw new OdooShError('Authentication required', 'AUTH_REQUIRED');
    }

    const response = await this.fetchImpl(`${this.baseUrl}/api/${this.apiVersion}/projects/${projectId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new OdooShError('Failed to get project', 'REQUEST_FAILED');
    }

    return response.json();
  }

  /**
   * Create a branch in an Odoo.sh project
   * @param {Object} params
   * @param {string} params.project_id - Project ID
   * @param {string} params.name - Branch name
   * @param {string} [params.branch_type] - 'development', 'staging', 'production'
   * @param {string} [params.source_branch] - Source branch for new branch
   * @returns {Promise<{id: string, name: string, url: string, status: string}>}
   */
  async createBranch({ project_id, name, branch_type = 'development', source_branch }) {
    if (!this.authToken) {
      throw new OdooShError('Authentication required', 'AUTH_REQUIRED');
    }

    const response = await this.fetchImpl(
      `${this.baseUrl}/api/${this.apiVersion}/projects/${project_id}/branches`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: this._sanitizeBranchName(name),
          type: branch_type,
          source: source_branch || null
        })
      }
    );

    if (!response.ok) {
      throw new OdooShError(`Branch creation failed: ${response.status}`, 'REQUEST_FAILED');
    }

    const data = await response.json();
    
    return {
      id: data.id,
      name: data.name,
      url: data.url,
      status: data.status || 'creating'
    };
  }

  /**
   * List branches for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>}
   */
  async listBranches(projectId) {
    if (!this.authToken) {
      throw new OdooShError('Authentication required', 'AUTH_REQUIRED');
    }

    const response = await this.fetchImpl(
      `${this.baseUrl}/api/${this.apiVersion}/projects/${projectId}/branches`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new OdooShError('Failed to list branches', 'REQUEST_FAILED');
    }

    const data = await response.json();
    return data.branches || [];
  }

  /**
   * Delete a branch
   * @param {string} projectId - Project ID
   * @param {string} branchId - Branch ID
   */
  async deleteBranch(projectId, branchId) {
    if (!this.authToken) {
      throw new OdooShError('Authentication required', 'AUTH_REQUIRED');
    }

    const response = await this.fetchImpl(
      `${this.baseUrl}/api/${this.apiVersion}/projects/${projectId}/branches/${branchId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new OdooShError('Failed to delete branch', 'REQUEST_FAILED');
    }
  }

  /**
   * Get deployment status
   * @param {string} projectId - Project ID
   * @param {string} branchId - Branch ID
   * @returns {Promise<{status: string, url?: string, last_deployment?: Date}>}
   */
  async getDeploymentStatus(projectId, branchId) {
    if (!this.authToken) {
      throw new OdooShError('Authentication required', 'AUTH_REQUIRED');
    }

    const response = await this.fetchImpl(
      `${this.baseUrl}/api/${this.apiVersion}/projects/${projectId}/branches/${branchId}/deployment`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new OdooShError('Failed to get deployment status', 'REQUEST_FAILED');
    }

    return response.json();
  }

  /**
   * Trigger a new deployment
   * @param {string} projectId - Project ID
   * @param {string} branchId - Branch ID
   * @returns {Promise<{deployment_id: string, status: string}>}
   */
  async deployBranch(projectId, branchId) {
    if (!this.authToken) {
      throw new OdooShError('Authentication required', 'AUTH_REQUIRED');
    }

    const response = await this.fetchImpl(
      `${this.baseUrl}/api/${this.apiVersion}/projects/${projectId}/branches/${branchId}/deploy`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new OdooShError('Failed to trigger deployment', 'REQUEST_FAILED');
    }

    return response.json();
  }

  /**
   * Get available Odoo.sh regions
   * @returns {Promise<Array<{id: string, name: string, location: string}>>}
   */
  async getRegions() {
    const response = await this.fetchImpl(`${this.baseUrl}/api/${this.apiVersion}/regions`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new OdooShError('Failed to fetch regions', 'REQUEST_FAILED');
    }

    const data = await response.json();
    return data.regions || [];
  }

  /**
   * Get available Odoo versions
   * @returns {Promise<Array<string>>}
   */
  async getVersions() {
    const response = await this.fetchImpl(`${this.baseUrl}/api/${this.apiVersion}/versions`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new OdooShError('Failed to fetch versions', 'REQUEST_FAILED');
    }

    const data = await response.json();
    return data.versions || [];
  }

  /**
   * Sanitize project name for Odoo.sh
   * @private
   */
  _sanitizeProjectName(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  }

  /**
   * Sanitize branch name
   * @private
   */
  _sanitizeBranchName(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100);
  }
}

export class OdooShError extends Error {
  constructor(message, code = 'ODOO_SH_ERROR') {
    super(message);
    this.name = 'OdooShError';
    this.code = code;
  }
}

/**
 * Factory function to create OdooShAPI with environment configuration
 */
export function createOdooShAPI() {
  const api = new OdooShAPI();
  
  const token = process.env.ODOOSH_API_TOKEN;
  if (token) {
    api.setAuthToken(token);
  }
  
  return api;
}

export default OdooShAPI;
