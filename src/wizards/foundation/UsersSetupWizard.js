/**
 * Users & Roles Setup Wizard
 * Guided setup for user management, access rights, and security groups
 */

import { OdooClient } from '../../api/OdooClient.js';

export const USERS_STEPS = {
  USER_LIST: 1,
  CREATE_USERS: 2,
  ROLES_GROUPS: 3,
  ACCESS_RIGHTS: 4,
  APPROVAL_WORKFLOWS: 5,
  COMPLETION: 6
};

export const DEFAULT_ROLES = {
  ADMIN: {
    name: 'Administrator',
    description: 'Full system access',
    groups: ['base.group_system', 'base.group_erp_manager']
  },
  SALES_MANAGER: {
    name: 'Sales Manager',
    description: 'Sales team management and reporting',
    groups: ['sales_team.group_sale_manager', 'base.group_user']
  },
  SALES_USER: {
    name: 'Sales User',
    description: 'Sales representative access',
    groups: ['sales_team.group_sale_salesman', 'base.group_user']
  },
  PURCHASE_MANAGER: {
    name: 'Purchase Manager',
    description: 'Purchase management and vendor relations',
    groups: ['purchase.group_purchase_manager', 'base.group_user']
  },
  PURCHASE_USER: {
    name: 'Purchase User',
    description: 'Purchase representative access',
    groups: ['purchase.group_purchase_user', 'base.group_user']
  },
  INVENTORY_MANAGER: {
    name: 'Inventory Manager',
    description: 'Warehouse and inventory management',
    groups: ['stock.group_stock_manager', 'base.group_user']
  },
  INVENTORY_USER: {
    name: 'Inventory User',
    description: 'Warehouse operations access',
    groups: ['stock.group_stock_user', 'base.group_user']
  },
  ACCOUNTANT: {
    name: 'Accountant',
    description: 'Financial management and reporting',
    groups: ['account.group_account_manager', 'base.group_user']
  },
  ACCOUNTANT_USER: {
    name: 'Accounting User',
    description: 'Basic accounting access',
    groups: ['account.group_account_invoice', 'base.group_user']
  },
  EMPLOYEE: {
    name: 'Employee',
    description: 'Basic employee access',
    groups: ['base.group_user']
  }
};

export class UsersSetupWizard {
  constructor(client) {
    this.client = client;
    this.state = this._getInitialState();
  }

  _getInitialState() {
    return {
      currentStep: USERS_STEPS.USER_LIST,
      users: [],
      newUser: {
        name: '',
        login: '',
        email: '',
        password: '',
        groups_id: [],
        company_ids: [[6, 0, []]]
      },
      roles: { ...DEFAULT_ROLES },
      selectedRole: null,
      customRoles: [],
      accessRights: [],
      approvalWorkflows: [],
      availableGroups: [],
      errors: {},
      isLoading: false
    };
  }

  async initialize() {
    this._setState({ isLoading: true });
    
    try {
      const users = await this.client.searchRead(
        'res.users', 
        [],
        ['id', 'name', 'login', 'email', 'groups_id', 'company_ids', 'active', 'share'],
        { limit: 100 }
      );

      const groups = await this.client.searchRead(
        'res.groups',
        [],
        ['id', 'name', 'category_id', 'users'],
        { limit: 200 }
      );

      const filteredGroups = groups.filter(g => 
        g.category_id && g.name !== 'Internal User' && g.name !== 'Portal'
      );

      this._setState({
        users: users.filter(u => !u.share),
        availableGroups: filteredGroups,
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

  setNewUserField(field, value) {
    this.state.newUser = { ...this.state.newUser, [field]: value };
  }

  toggleUserGroup(groupId) {
    const groups = this.state.newUser.groups_id;
    const index = groups.indexOf(groupId);
    
    if (index === -1) {
      groups.push(groupId);
    } else {
      groups.splice(index, 1);
    }
    
    this.state.newUser.groups_id = [...groups];
  }

  async createUser() {
    this._clearErrors();
    const { newUser } = this.state;

    if (!newUser.name) {
      this.state.errors.name = 'Name is required';
      return { success: false };
    }
    if (!newUser.login || !this._isValidLogin(newUser.login)) {
      this.state.errors.login = 'Valid login (email) is required';
      return { success: false };
    }
    if (!newUser.password || newUser.password.length < 8) {
      this.state.errors.password = 'Password must be at least 8 characters';
      return { success: false };
    }

    this._setState({ isLoading: true });

    try {
      const userId = await this.client.executeKw('res.users', 'create', [{
        name: newUser.name,
        login: newUser.login,
        email: newUser.email || newUser.login,
        password: newUser.password,
        groups_id: [[6, 0, newUser.groups_id]],
        company_ids: newUser.company_ids
      }]);

      const newUserRecord = await this.client.searchRead(
        'res.users',
        [['id', '=', userId]],
        ['id', 'name', 'login', 'email', 'groups_id']
      );

      this.state.users.push(newUserRecord[0]);
      this.state.newUser = this._getInitialState().newUser;
      
      this._setState({ isLoading: false });
      return { success: true, userId };

    } catch (error) {
      this._setState({ isLoading: false, errors: { general: error.message } });
      return { success: false, error: error.message };
    }
  }

  async createUsersBatch(usersToCreate) {
    this._setState({ isLoading: true });
    const results = [];

    try {
      for (const userData of usersToCreate) {
        try {
          const userId = await this.client.executeKw('res.users', 'create', [{
            name: userData.name,
            login: userData.login,
            email: userData.email || userData.login,
            password: userData.password,
            groups_id: [[6, 0, userData.groups_id || []]],
            company_ids: userData.company_ids || [[6, 0, [1]]]
          }]);
          results.push({ login: userData.login, success: true, userId });
        } catch (err) {
          results.push({ login: userData.login, success: false, error: err.message });
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

  async assignRoleToUser(userId, roleKey) {
    const role = this.state.roles[roleKey] || this.state.customRoles.find(r => r.key === roleKey);
    
    if (!role) {
      return { success: false, error: 'Role not found' };
    }

    this._setState({ isLoading: true });

    try {
      const groupIds = role.groups.map(g => typeof g === 'object' ? g.id : g);
      
      await this.client.write('res.users', [userId], {
        groups_id: [[6, 0, groupIds]]
      });

      await this.initialize();
      
      this._setState({ isLoading: false });
      return { success: true };

    } catch (error) {
      this._setState({ isLoading: false, errors: { general: error.message } });
      return { success: false, error: error.message };
    }
  }

  async toggleUserActive(userId, active) {
    try {
      await this.client.write('res.users', [userId], { active });
      
      const userIndex = this.state.users.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        this.state.users[userIndex].active = active;
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  createCustomRole(roleData) {
    const key = roleData.name.toLowerCase().replace(/\s+/g, '_');
    
    this.state.customRoles.push({
      key,
      name: roleData.name,
      description: roleData.description || '',
      groups: roleData.groups || [],
      isSystem: false
    });
  }

  deleteCustomRole(roleKey) {
    const index = this.state.customRoles.findIndex(r => r.key === roleKey);
    if (index !== -1) {
      this.state.customRoles.splice(index, 1);
    }
  }

  selectRole(roleKey) {
    const predefinedRole = this.state.roles[roleKey];
    const customRole = this.state.customRoles.find(r => r.key === roleKey);
    this.state.selectedRole = predefinedRole || customRole || null;
  }

  async nextStep() {
    this._clearErrors();
    const { currentStep } = this.state;

    if (currentStep === USERS_STEPS.APPROVAL_WORKFLOWS) {
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

  _isValidLogin(login) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(login);
  }

  async _executeSetup() {
    this._setState({ isLoading: true });
    
    try {
      this._setState({
        currentStep: USERS_STEPS.COMPLETION,
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
      [USERS_STEPS.USER_LIST]: {
        title: 'Existing Users',
        description: 'Review and manage current system users'
      },
      [USERS_STEPS.CREATE_USERS]: {
        title: 'Create Users',
        description: 'Add new users to the system'
      },
      [USERS_STEPS.ROLES_GROUPS]: {
        title: 'Roles & Groups',
        description: 'Define access roles and group assignments'
      },
      [USERS_STEPS.ACCESS_RIGHTS]: {
        title: 'Access Rights',
        description: 'Configure detailed access permissions'
      },
      [USERS_STEPS.APPROVAL_WORKFLOWS]: {
        title: 'Approval Workflows',
        description: 'Set up multi-level approvals'
      },
      [USERS_STEPS.COMPLETION]: {
        title: 'Complete',
        description: 'User setup is complete'
      }
    };
    return steps[step] || {};
  }

  getProgress() {
    const totalSteps = Object.values(USERS_STEPS).length;
    return Math.round(((this.state.currentStep - 1) / (totalSteps - 1)) * 100);
  }

  reset() {
    this.state = this._getInitialState();
  }

  exportConfig() {
    return {
      userCount: this.state.users.length,
      customRoles: this.state.customRoles.map(r => ({ name: r.name, groups: r.groups })),
      completedAt: new Date().toISOString()
    };
  }
}

export default UsersSetupWizard;
