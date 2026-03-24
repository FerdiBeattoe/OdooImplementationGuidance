import test from 'node:test';
import assert from 'node:assert/strict';
import { OdooClient, OdooError } from '../src/api/OdooClient.js';

test('OdooClient throws error on missing config', () => {
  assert.throws(() => {
    new OdooClient({});
  });
});

test('OdooClient initializes with valid config', () => {
  const client = new OdooClient({
    baseUrl: 'https://test.odoo.com',
    database: 'test',
    username: 'admin',
    password: 'admin'
  });
  
  assert.equal(client.baseUrl, 'https://test.odoo.com');
  assert.equal(client.database, 'test');
});

test('OdooError includes code and context', () => {
  const error = new OdooError('Auth failed', 'AUTH_FAILED', { uid: 0 });
  assert.equal(error.message, 'Auth failed');
  assert.equal(error.code, 'AUTH_FAILED');
  assert.equal(error.context.uid, 0);
});