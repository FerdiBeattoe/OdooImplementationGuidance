import XLSX from 'xlsx';
import { readFileSync, existsSync } from 'fs';

export class ParseError extends Error {
  constructor(message, sheet, row) {
    super(message);
    this.sheet = sheet;
    this.row = row;
  }
}

export class ExcelParser {
  constructor(options = {}) {
    this.options = {
      headerRow: options.headerRow ?? 0,
      skipEmpty: options.skipEmpty ?? true,
      trimValues: options.trimValues ?? true,
      ...options
    };
  }

  parse(filePath) {
    if (!existsSync(filePath)) {
      throw new ParseError(`File not found: ${filePath}`);
    }

    try {
      const buffer = readFileSync(filePath);
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      
      const result = {};
      
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          raw: false,
          defval: ''
        });

        if (data.length === 0) continue;

        const headers = data[this.options.headerRow];
        const rows = data.slice(this.options.headerRow + 1);

        result[sheetName] = rows
          .filter(row => !this.options.skipEmpty || row.some(cell => cell !== ''))
          .map((row, index) => this._rowToObject(headers, row, sheetName, index));
      }

      return result;
    } catch (error) {
      throw new ParseError(`Failed to parse ${filePath}: ${error.message}`);
    }
  }

  parseSingle(filePath, sheetName = null) {
    const data = this.parse(filePath);
    
    if (sheetName) {
      if (!data[sheetName]) {
        throw new ParseError(`Sheet "${sheetName}" not found in ${filePath}`);
      }
      return data[sheetName];
    }

    const keys = Object.keys(data);
    if (keys.length === 0) {
      throw new ParseError(`No sheets found in ${filePath}`);
    }
    return data[keys[0]];
  }

  _rowToObject(headers, row, sheetName, rowIndex) {
    const obj = {};
    
    headers.forEach((header, index) => {
      const key = this._sanitizeHeader(header);
      let value = row[index];
      
      if (this.options.trimValues && typeof value === 'string') {
        value = value.trim();
      }
      
      if (value === '') value = null;
      
      obj[key] = value;
    });

    obj._meta = { sheet: sheetName, row: rowIndex + 2 };
    return obj;
  }

  _sanitizeHeader(header) {
    return String(header)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  validateSchema(filePath, schema) {
    const data = this.parse(filePath);
    const errors = [];

    for (const [sheetName, rows] of Object.entries(data)) {
      const sheetSchema = schema[sheetName];
      if (!sheetSchema) continue;

      rows.forEach((row, index) => {
        sheetSchema.forEach(field => {
          if (field.required && !row[field.name]) {
            errors.push({
              sheet: sheetName,
              row: index + 2,
              field: field.name,
              error: `Required field missing`
            });
          }
        });
      });
    }

    return { valid: errors.length === 0, errors, data };
  }

  preview(filePath, limit = 5) {
    const data = this.parse(filePath);
    const preview = {};
    
    for (const [sheetName, rows] of Object.entries(data)) {
      preview[sheetName] = {
        total: rows.length,
        sample: rows.slice(0, limit),
        columns: rows.length > 0 ? Object.keys(rows[0]).filter(k => !k.startsWith('_')) : []
      };
    }
    
    return preview;
  }
}