import test from 'node:test';
import assert from 'node:assert/strict';
import { CustomerTransformer } from '../src/transformers/CustomerTransformer.js';

test('CustomerTransformer validates required fields', () => {
  const transformer = new CustomerTransformer();
  
  const result = transformer.transform({
    account_code: 'C001',
    customer: ''
  });
  
  assert.equal(result.valid, false);
  assert.equal(result.error, 'Customer name is required');
});

test('CustomerTransformer transforms valid data', () => {
  const transformer = new CustomerTransformer();
  
  const result = transformer.transform({
    account_code: 'C001',
    customer: 'Acme Corp',
    industry: 'Trade',
    terms: '30'
  });
  
  assert.equal(result.valid, true);
  assert.equal(result.data.name, 'Acme Corp');
  assert.equal(result.data.ref, 'C001');
  assert.equal(result.data.is_company, true);
  assert.equal(result.data.customer_rank, 1);
});

test('CustomerTransformer.transformBatch categorizes records', () => {
  const transformer = new CustomerTransformer();
  
  const rows = [
    { account_code: 'C001', customer: 'Acme', industry: 'Trade' },
    { account_code: 'C002', customer: 'Beta', industry: 'Retail' },
    { account_code: 'C003', customer: '' },
  ];
  
  const result = transformer.transformBatch(rows);
  
  assert.equal(result.valid.length, 2);
  assert.equal(result.invalid.length, 1);
  assert.equal(result.byIndustry['Trade'], 1);
  assert.equal(result.byIndustry['Retail'], 1);
});