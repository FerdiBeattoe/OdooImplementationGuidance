/**
 * Tests for OdooOnlineAPI
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { OdooOnlineAPI, OdooOnlineError, createOdooOnlineAPI } from './OdooOnlineAPI.js';

function createMockFetch(responses = {}) {
  return async (url, options = {}) => {
    const key = `${options.method || 'GET'}:${url}`;
    if (responses[key]) {
      return responses[key];
    }
    if (responses[url]) {
      return responses[url];
    }
    throw new Error(`Mock not defined for: ${options.method || 'GET'} ${url}`);
  };
}

function createSuccessResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

test('OdooOnlineAPI creates instance with default fetch', () => {
  const api = new OdooOnlineAPI();
  assert.equal(api.baseUrl, 'https://www.odoo.com');
  assert.equal(api.fetchImpl, fetch);
});

test('OdooOnlineAPI creates instance with custom fetch', () => {
  const customFetch = async () => {};
  const api = new OdooOnlineAPI({ fetchImpl: customFetch });
  assert.equal(api.fetchImpl, customFetch);
});

test('createTrial creates trial successfully with valid params', async () => {
  const api = new OdooOnlineAPI({
    fetchImpl: createMockFetch({
      'POST:https://www.odoo.com/web/signup': createSuccessResponse({
        result: { dbname: 'test_db', uid: 1 }
      })
    })
  });

  const result = await api.createTrial({
    email: 'test@example.com',
    password: 'password123',
    database: 'test_db',
    company_name: 'Test Company'
  });

  assert.equal(result.success, true);
  assert.equal(result.database, 'test_db');
  assert.equal(result.credentials.login, 'test@example.com');
  assert.equal(result.instance_url, 'https://test_db.odoo.com');
});

test('createTrial normalizes database name to lowercase', async () => {
  const api = new OdooOnlineAPI({
    fetchImpl: createMockFetch({
      'POST:https://www.odoo.com/web/signup': createSuccessResponse({
        result: { dbname: 'test_database', uid: 1 }
      })
    })
  });

  const result = await api.createTrial({
    email: 'test@example.com',
    password: 'password123',
    database: 'TEST_DATABASE',
    company_name: 'Test Company'
  });

  assert.equal(result.database, 'test_database');
});

test('createTrial throws error for invalid email', async () => {
  const api = new OdooOnlineAPI();

  await assert.rejects(async () => {
    await api.createTrial({
      email: 'invalid-email',
      password: 'password123',
      database: 'test_db',
      company_name: 'Test Company'
    });
  }, /Invalid email address/);
});

test('createTrial throws error for password less than 8 characters', async () => {
  const api = new OdooOnlineAPI();

  await assert.rejects(async () => {
    await api.createTrial({
      email: 'test@example.com',
      password: 'short',
      database: 'test_db',
      company_name: 'Test Company'
    });
  }, /Password must be at least 8 characters/);
});

test('createTrial throws error for invalid database name format', async () => {
  const api = new OdooOnlineAPI();

  await assert.rejects(async () => {
    await api.createTrial({
      email: 'test@example.com',
      password: 'password123',
      database: '123invalid',
      company_name: 'Test Company'
    });
  }, /Invalid database name/);
});

test('createTrial throws error when API returns error', async () => {
  const api = new OdooOnlineAPI({
    fetchImpl: createMockFetch({
      'POST:https://www.odoo.com/web/signup': createSuccessResponse({
        error: { data: { message: 'Database already exists' } }
      })
    })
  });

  await assert.rejects(async () => {
    await api.createTrial({
      email: 'test@example.com',
      password: 'password123',
      database: 'existing_db',
      company_name: 'Test Company'
    });
  }, /Database already exists/);
});

test('createTrial throws error on HTTP failure', async () => {
  const api = new OdooOnlineAPI({
    fetchImpl: createMockFetch({
      'POST:https://www.odoo.com/web/signup': new Response(null, { status: 500 })
    })
  });

  await assert.rejects(async () => {
    await api.createTrial({
      email: 'test@example.com',
      password: 'password123',
      database: 'test_db',
      company_name: 'Test Company'
    });
  }, /Trial creation failed/);
});

test('checkDatabaseAvailability returns available true when database is available', async () => {
  const api = new OdooOnlineAPI({
    fetchImpl: createMockFetch({
      'POST:https://www.odoo.com/web/api/db/available': createSuccessResponse({
        result: { available: true }
      })
    })
  });

  const result = await api.checkDatabaseAvailability('newdb');

  assert.equal(result.available, true);
  assert.equal(result.suggestion, null);
});

test('checkDatabaseAvailability returns available false with suggestion when taken', async () => {
  const api = new OdooOnlineAPI({
    fetchImpl: createMockFetch({
      'POST:https://www.odoo.com/web/api/db/available': createSuccessResponse({
        result: { available: false, suggestion: 'newdb123' }
      })
    })
  });

  const result = await api.checkDatabaseAvailability('newdb');

  assert.equal(result.available, false);
  assert.equal(result.suggestion, 'newdb123');
});

test('getTrialPlans returns list of trial plans', async () => {
  const plans = [
    { id: 1, name: 'Starter', trial_days: 14 },
    { id: 2, name: 'Professional', trial_days: 30 }
  ];

  const api = new OdooOnlineAPI({
    fetchImpl: createMockFetch({
      'GET:https://www.odoo.com/web/api/trial-plans': createSuccessResponse({
        result: plans
      })
    })
  });

  const result = await api.getTrialPlans();

  assert.deepStrictEqual(result, plans);
});

test('getTrialPlans throws error on HTTP failure', async () => {
  const api = new OdooOnlineAPI({
    fetchImpl: createMockFetch({
      'GET:https://www.odoo.com/web/api/trial-plans': new Response(null, { status: 500 })
    })
  });

  await assert.rejects(async () => {
    await api.getTrialPlans();
  }, /Failed to fetch trial plans/);
});

test('requestEmailVerification sends verification email successfully', async () => {
  const api = new OdooOnlineAPI({
    fetchImpl: createMockFetch({
      'POST:https://www.odoo.com/web/signup/send-verification': createSuccessResponse({
        result: { sent: true }
      })
    })
  });

  const result = await api.requestEmailVerification('test@example.com');

  assert.equal(result.verification_sent, true);
});

test('verifyEmailToken returns verified true for valid token', async () => {
  const api = new OdooOnlineAPI({
    fetchImpl: createMockFetch({
      'POST:https://www.odoo.com/web/signup/verify-email': createSuccessResponse({
        result: { verified: true }
      })
    })
  });

  const result = await api.verifyEmailToken('valid-token-123');

  assert.equal(result.verified, true);
});

test('verifyEmailToken returns verified false for invalid token', async () => {
  const api = new OdooOnlineAPI({
    fetchImpl: createMockFetch({
      'POST:https://www.odoo.com/web/signup/verify-email': createSuccessResponse({
        result: { verified: false }
      })
    })
  });

  const result = await api.verifyEmailToken('invalid-token');

  assert.equal(result.verified, false);
});

test('getCountries returns list of countries', async () => {
  const countries = [
    { code: 'US', name: 'United States' },
    { code: 'ZA', name: 'South Africa' }
  ];

  const api = new OdooOnlineAPI({
    fetchImpl: createMockFetch({
      'GET:https://www.odoo.com/web/api/countries': createSuccessResponse({
        result: countries
      })
    })
  });

  const result = await api.getCountries();

  assert.deepStrictEqual(result, countries);
});

test('_normalizeDatabaseName converts to lowercase', () => {
  const api = new OdooOnlineAPI();
  assert.equal(api._normalizeDatabaseName('TEST_DB'), 'test_db');
});

test('_normalizeDatabaseName replaces invalid characters with underscores', () => {
  const api = new OdooOnlineAPI();
  assert.equal(api._normalizeDatabaseName('test-db'), 'test_db');
});

test('_normalizeDatabaseName removes leading and trailing underscores', () => {
  const api = new OdooOnlineAPI();
  assert.equal(api._normalizeDatabaseName('_test_db_'), 'test_db');
});

test('_normalizeDatabaseName limits to 50 characters', () => {
  const api = new OdooOnlineAPI();
  const longName = 'a'.repeat(60);
  assert.equal(api._normalizeDatabaseName(longName).length, 50);
});

test('_validateEmail validates correct email formats', () => {
  const api = new OdooOnlineAPI();
  assert.equal(api._validateEmail('test@example.com'), true);
  assert.equal(api._validateEmail('user.name@domain.co.uk'), true);
});

test('_validateEmail rejects invalid email formats', () => {
  const api = new OdooOnlineAPI();
  assert.equal(api._validateEmail('invalid'), false);
  assert.equal(api._validateEmail('invalid@'), false);
  assert.equal(api._validateEmail('@domain.com'), false);
});

test('_validatePassword accepts passwords 8+ characters', () => {
  const api = new OdooOnlineAPI();
  assert.equal(api._validatePassword('password123'), true);
  assert.equal(api._validatePassword('12345678'), true);
});

test('_validatePassword rejects passwords less than 8 characters', () => {
  const api = new OdooOnlineAPI();
  assert.equal(api._validatePassword('short'), false);
  assert.equal(api._validatePassword('1234567'), false);
});

test('_validateDatabaseName accepts valid database names', () => {
  const api = new OdooOnlineAPI();
  assert.equal(api._validateDatabaseName('test_db'), true);
  assert.equal(api._validateDatabaseName('mydb123'), true);
});

test('_validateDatabaseName rejects invalid database names', () => {
  const api = new OdooOnlineAPI();
  assert.equal(api._validateDatabaseName('123invalid'), false);
  assert.equal(api._validateDatabaseName('_test'), false);
  assert.equal(api._validateDatabaseName('test-db'), false);
});

test('createOdooOnlineAPI factory creates API instance', () => {
  const api = createOdooOnlineAPI();
  assert.ok(api instanceof OdooOnlineAPI);
});

test('OdooOnlineError creates error with code', () => {
  const error = new OdooOnlineError('Test message', 'TEST_CODE');
  assert.equal(error.message, 'Test message');
  assert.equal(error.code, 'TEST_CODE');
  assert.equal(error.name, 'OdooOnlineError');
});

test('OdooOnlineError defaults to generic code', () => {
  const error = new OdooOnlineError('Test message');
  assert.equal(error.code, 'ODOO_ONLINE_ERROR');
});
