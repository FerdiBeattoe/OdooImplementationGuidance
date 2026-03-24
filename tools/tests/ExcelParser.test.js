import test from 'node:test';
import assert from 'node:assert/strict';
import { ExcelParser, ParseError } from '../src/parsers/ExcelParser.js';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

test('ExcelParser throws on missing file', () => {
  const parser = new ExcelParser();
  assert.throws(() => {
    parser.parse('/nonexistent/file.xlsx');
  }, ParseError);
});

test('ExcelParser.sanitizeHeader normalizes headers', () => {
  const parser = new ExcelParser();
  
  assert.equal(parser._sanitizeHeader('Customer Name'), 'customer_name');
  assert.equal(parser._sanitizeHeader('Account Code'), 'account_code');
  assert.equal(parser._sanitizeHeader('  Spaces  '), 'spaces');
});

test('ExcelParser.rowToObject creates object from headers', () => {
  const parser = new ExcelParser();
  const headers = ['name', 'code', 'price'];
  const row = ['Widget', 'W001', '10.50'];
  
  const obj = parser._rowToObject(headers, row, 'Sheet1', 0);
  
  assert.equal(obj.name, 'Widget');
  assert.equal(obj.code, 'W001');
  assert.equal(obj.price, '10.50');
  assert.equal(obj._meta.sheet, 'Sheet1');
});