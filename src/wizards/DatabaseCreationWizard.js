/**
 * Database Creation Wizard
 * Step-by-step UI for creating new Odoo databases across all deployment types
 */

import { OdooOnlineAPI } from '../api/OdooOnlineAPI.js';
import { OdooShAPI } from '../api/OdooShAPI.js';

export const DEPLOYMENT_TYPES = {
  ONLINE: 'online',
  ODOOSH: 'odoo_sh',
  ON_PREMISE: 'on_premise'
};

export const WIZARD_STEPS = {
  DEPLOYMENT_SELECTION: 1,
  CREDENTIALS: 2,
  DATABASE_CONFIG: 3,
  VERIFICATION: 4,
  COMPLETION: 5
};

export class DatabaseCreationWizard {
  constructor(options = {}) {
    this.fetchImpl = options.fetchImpl || fetch;
    this.storageKey = options.storageKey || 'odoo_db_creation_wizard';
    
    this.onlineAPI = new OdooOnlineAPI({ fetchImpl: this.fetchImpl });
    this.shAPI = new OdooShAPI({ fetchImpl: this.fetchImpl });
    
    this.state = this._loadState() || this._getInitialState();
  }

  /**
   * Get initial wizard state
   */
  _getInitialState() {
    return {
      currentStep: WIZARD_STEPS.DEPLOYMENT_SELECTION,
      deploymentType: null,
      credentials: {
        email: '',
        password: '',
        confirmPassword: ''
      },
      database: {
        name: '',
        companyName: '',
        countryCode: '',
        phone: ''
      },
      odooSh: {
        projectName: '',
        edition: 'community',
        version: '19.0',
        region: 'eu',
        repositoryUrl: ''
      },
      onPremise: {
        baseUrl: '',
        alreadyHasDatabase: false
      },
      plan: {
        id: 'trial',
        name: 'Trial'
      },
      verification: {
        emailVerified: false,
        token: ''
      },
      errors: {},
      isLoading: false,
      createdDatabase: null
    };
  }

  /**
   * Load persisted state
   */
  _loadState() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load wizard state:', e);
    }
    return null;
  }

  /**
   * Persist state
   */
  _saveState() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to save wizard state:', e);
    }
  }

  /**
   * Update state and persist
   */
  _setState(updates) {
    this.state = { ...this.state, ...updates };
    this._saveState();
    this._emitChange();
  }

  /**
   * Clear all errors
   */
  _clearErrors() {
    this._setState({ errors: {} });
  }

  /**
   * Set error for a field
   */
  _setError(field, message) {
    this._setState({
      errors: { ...this.state.errors, [field]: message }
    });
  }

  /**
   * Emit state change event
   */
  _emitChange() {
    if (typeof this.onChange === 'function') {
      this.onChange(this.state);
    }
  }

  // ==================== Step Navigation ====================

  /**
   * Go to next step
   */
  async nextStep() {
    this._clearErrors();
    const validation = await this._validateCurrentStep();
    
    if (!validation.valid) {
      Object.entries(validation.errors).forEach(([field, message]) => {
        this._setError(field, message);
      });
      return { success: false, errors: validation.errors };
    }

    const { currentStep } = this.state;
    
    if (currentStep === WIZARD_STEPS.VERIFICATION) {
      await this._executeCreation();
      return;
    }

    this._setState({ currentStep: currentStep + 1 });
    return { success: true };
  }

  /**
   * Go to previous step
   */
  prevStep() {
    const { currentStep } = this.state;
    if (currentStep > 1) {
      this._setState({ currentStep: currentStep - 1, errors: {} });
      return { success: true };
    }
    return { success: false };
  }

  /**
   * Jump to specific step
   */
  goToStep(step) {
    if (step >= 1 && step <= Object.values(WIZARD_STEPS).length) {
      this._setState({ currentStep: step, errors: {} });
    }
  }

  // ==================== Field Updates ====================

  /**
   * Update deployment type
   */
  setDeploymentType(type) {
    this._clearErrors();
    this._setState({ 
      deploymentType: type,
      currentStep: WIZARD_STEPS.CREDENTIALS
    });
  }

  /**
   * Update credentials
   */
  setCredentials(credentials) {
    this._setState({
      credentials: { ...this.state.credentials, ...credentials }
    });
  }

  /**
   * Update database config
   */
  setDatabaseConfig(config) {
    this._setState({
      database: { ...this.state.database, ...config }
    });
  }

  /**
   * Update Odoo.sh specific config
   */
  setShConfig(config) {
    this._setState({
      odooSh: { ...this.state.odooSh, ...config }
    });
  }

  /**
   * Update on-premise config
   */
  setOnPremiseConfig(config) {
    this._setState({
      onPremise: { ...this.state.onPremise, ...config }
    });
  }

  /**
   * Update plan selection
   */
  setPlan(plan) {
    this._setState({ plan });
  }

  /**
   * Update verification token
   */
  setVerificationToken(token) {
    this._setState({
      verification: { ...this.state.verification, token }
    });
  }

  // ==================== Step Validation ====================

  /**
   * Validate current step
   */
  async _validateCurrentStep() {
    const { currentStep, deploymentType, credentials, database, odooSh, onPremise } = this.state;
    
    const errors = {};

    switch (currentStep) {
      case WIZARD_STEPS.CREDENTIALS:
        if (!credentials.email || !this._isValidEmail(credentials.email)) {
          errors.email = 'Valid email is required';
        }
        if (!credentials.password || credentials.password.length < 8) {
          errors.password = 'Password must be at least 8 characters';
        }
        if (credentials.password !== credentials.confirmPassword) {
          errors.confirmPassword = 'Passwords do not match';
        }
        break;

      case WIZARD_STEPS.DATABASE_CONFIG:
        if (deploymentType === DEPLOYMENT_TYPES.ONLINE) {
          if (!database.name || !this._isValidDbName(database.name)) {
            errors.databaseName = 'Invalid database name (alphanumeric and underscores, 3-50 chars)';
          }
          if (!database.companyName) {
            errors.companyName = 'Company name is required';
          }
        } else if (deploymentType === DEPLOYMENT_TYPES.ODOOSH) {
          if (!odooSh.projectName) {
            errors.projectName = 'Project name is required';
          }
        } else if (deploymentType === DEPLOYMENT_TYPES.ON_PREMISE) {
          if (!onPremise.baseUrl) {
            errors.baseUrl = 'Odoo server URL is required';
          } else if (!this._isValidUrl(onPremise.baseUrl)) {
            errors.baseUrl = 'Invalid URL format';
          }
        }
        break;

      case WIZARD_STEPS.VERIFICATION:
        if (!this.state.verification.token) {
          errors.token = 'Verification token is required';
        }
        break;
    }

    return { valid: Object.keys(errors).length === 0, errors };
  }

  /**
   * Validate email format
   */
  _isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Validate database name
   */
  _isValidDbName(name) {
    return /^[a-z][a-z0-9_]{2,49}$/.test(name);
  }

  /**
   * Validate URL format
   */
  _isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // ==================== API Operations ====================

  /**
   * Check database name availability (Online)
   */
  async checkDatabaseAvailability(name) {
    try {
      const result = await this.onlineAPI.checkDatabaseAvailability(name);
      return result;
    } catch (error) {
      return { available: false, error: error.message };
    }
  }

  /**
   * Get available trial plans
   */
  async getTrialPlans() {
    try {
      return await this.onlineAPI.getTrialPlans();
    } catch (error) {
      console.error('Failed to fetch trial plans:', error);
      return [];
    }
  }

  /**
   * Get available Odoo.sh regions
   */
  async getShRegions() {
    try {
      return await this.shAPI.getRegions();
    } catch (error) {
      console.error('Failed to fetch regions:', error);
      return [];
    }
  }

  /**
   * Get available Odoo.sh versions
   */
  async getShVersions() {
    try {
      return await this.shAPI.getVersions();
    } catch (error) {
      console.error('Failed to fetch versions:', error);
      return ['19.0', '18.0', '17.0'];
    }
  }

  /**
   * Request email verification
   */
  async requestEmailVerification() {
    const { credentials } = this.state;
    try {
      this._setState({ isLoading: true });
      const result = await this.onlineAPI.requestEmailVerification(credentials.email);
      return result;
    } catch (error) {
      return { verification_sent: false, error: error.message };
    } finally {
      this._setState({ isLoading: false });
    }
  }

  /**
   * Verify email token
   */
  async verifyEmail(token) {
    try {
      this._setState({ isLoading: true });
      const result = await this.onlineAPI.verifyEmailToken(token);
      if (result.verified) {
        this._setState({
          verification: { emailVerified: true, token }
        });
      }
      return result;
    } finally {
      this._setState({ isLoading: false });
    }
  }

  /**
   * Execute the actual database creation
   */
  async _executeCreation() {
    const { deploymentType, credentials, database, odooSh, onPremise, plan } = this.state;
    
    this._setState({ isLoading: true });
    
    try {
      let result;

      switch (deploymentType) {
        case DEPLOYMENT_TYPES.ONLINE:
          result = await this.onlineAPI.createTrial({
            email: credentials.email,
            password: credentials.password,
            database: database.name,
            company_name: database.companyName,
            country_code: database.countryCode,
            phone: database.phone,
            plan_id: plan.id
          });
          break;

        case DEPLOYMENT_TYPES.ODOOSH:
          result = await this.shAPI.createProject({
            name: odooSh.projectName,
            edition: odooSh.edition,
            version: odooSh.version,
            region: odooSh.region,
            repository_url: odooSh.repositoryUrl
          });
          break;

        case DEPLOYMENT_TYPES.ON_PREMISE:
          result = {
            success: true,
            message: 'Connection recorded. Proceed to connect.',
            baseUrl: onPremise.baseUrl
          };
          break;
      }

      this._setState({
        currentStep: WIZARD_STEPS.COMPLETION,
        isLoading: false,
        createdDatabase: result
      });

      return { success: true, result };

    } catch (error) {
      this._setState({ 
        isLoading: false,
        errors: { general: error.message }
      });
      return { success: false, error: error.message };
    }
  }

  // ==================== UI Helpers ====================

  /**
   * Get step info for UI rendering
   */
  getStepInfo(step) {
    const steps = {
      [WIZARD_STEPS.DEPLOYMENT_SELECTION]: {
        title: 'Choose Deployment',
        description: 'Select how you want to host your Odoo database',
        icon: 'server'
      },
      [WIZARD_STEPS.CREDENTIALS]: {
        title: 'Account Setup',
        description: 'Create your Odoo account credentials',
        icon: 'user'
      },
      [WIZARD_STEPS.DATABASE_CONFIG]: {
        title: 'Database Configuration',
        description: 'Configure your new database',
        icon: 'database'
      },
      [WIZARD_STEPS.VERIFICATION]: {
        title: 'Email Verification',
        description: 'Verify your email address',
        icon: 'mail'
      },
      [WIZARD_STEPS.COMPLETION]: {
        title: 'Setup Complete',
        description: 'Your database is ready',
        icon: 'check'
      }
    };
    return steps[step] || {};
  }

  /**
   * Get progress percentage
   */
  getProgress() {
    const { currentStep } = this.state;
    const totalSteps = Object.values(WIZARD_STEPS).length;
    return Math.round(((currentStep - 1) / (totalSteps - 1)) * 100);
  }

  /**
   * Check if step is complete
   */
  isStepComplete(step) {
    const { currentStep } = this.state;
    return currentStep > step;
  }

  /**
   * Reset wizard to beginning
   */
  reset() {
    localStorage.removeItem(this.storageKey);
    this.state = this._getInitialState();
    this._emitChange();
  }

  /**
   * Export final credentials for storage
   */
  exportCredentials() {
    const { deploymentType, credentials, database, createdDatabase } = this.state;
    
    return {
      deploymentType,
      login: credentials.email,
      database: deploymentType === DEPLOYMENT_TYPES.ONLINE ? database.name : null,
      instanceUrl: createdDatabase?.instance_url || createdDatabase?.url || null,
      createdAt: new Date().toISOString()
    };
  }
}

/**
 * Factory function to create wizard with defaults
 */
export function createDatabaseWizard(options = {}) {
  return new DatabaseCreationWizard(options);
}

export default DatabaseCreationWizard;
