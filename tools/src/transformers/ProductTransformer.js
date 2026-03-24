export class ProductTransformer {
  constructor(options = {}) {
    this.options = {
      defaultUomId: options.defaultUomId || 1,
      defaultCurrency: options.defaultCurrency || 'ZAR',
      defaultCurrencyId: options.defaultCurrencyId || 38,
      costPriceListId: options.costPriceListId || null,
      ...options
    };
    
    this.categoryCache = new Map();
    this.uomCache = new Map();
    this.productCache = new Map();
  }

  async prepareCaches(client) {
    const categories = await client.searchRead('product.category', [], ['id', 'name', 'complete_name']);
    categories.forEach(cat => {
      this.categoryCache.set(cat.name.toLowerCase(), cat.id);
      this.categoryCache.set(cat.complete_name?.toLowerCase(), cat.id);
    });

    const uoms = await client.searchRead('uom.uom', [], ['id', 'name', 'category_id']);
    uoms.forEach(uom => this.uomCache.set(uom.name.toLowerCase(), uom.id));
  }

  transform(row, options = {}) {
    const code = row.code || row.product_code || '';
    const name = row.description || row.name || '';
    const categoryName = row.category || row.class || '';
    const listPrice = this._parsePrice(row.sale_price || row.price || 0);
    const costPrice = this._parsePrice(row.cost_price || row.cost || 0);
    const uomName = row.unit_of_measure || row.uom || 'Units';

    if (!name) {
      return { valid: false, error: 'Product name is required', source: row };
    }

    const categoryId = this._resolveCategory(categoryName, options.categoryMap);
    const uomId = this._resolveUom(uomName);

    if (!categoryId) {
      return { 
        valid: false, 
        error: `Product category not found: ${categoryName}`, 
        source: row,
        suggestion: 'Check product category name or create it first'
      };
    }

    const transformed = {
      name: name.trim(),
      default_code: code?.trim() || null,
      categ_id: categoryId,
      list_price: listPrice,
      standard_price: costPrice,
      uom_id: uomId,
      uom_po_id: uomId,
      type: 'product',
      sale_ok: true,
      purchase_ok: true,
      tracking: 'none',
    };

    return {
      valid: true,
      data: this._cleanNulls(transformed),
      source: row,
      meta: {
        originalName: name,
        category: categoryName,
        warnings: this._generateWarnings(row, transformed)
      }
    };
  }

  transformSupplierInfo(row, productId, options = {}) {
    const vendorName = row.vendor || row.supplier || '';
    const vendorCode = row.vendor_code || row.supplier_code || '';
    const price = this._parsePrice(row.cost_price || row.price || 0);
    const minQty = parseFloat(row.min_qty || row.minimum || 0) || 0;
    const delay = parseInt(row.lead_time || row.delivery_days || 0, 10) || 0;

    if (!vendorName || price <= 0) {
      return { valid: false, error: 'Vendor name and price required', source: row };
    }

    const vendorId = options.vendorMap?.[vendorName.toLowerCase().trim()];
    if (!vendorId) {
      return { valid: false, error: `Vendor not found: ${vendorName}`, source: row };
    }

    return {
      valid: true,
      data: {
        product_tmpl_id: productId,
        name: vendorId,
        product_name: vendorCode || null,
        price: price,
        min_qty: minQty,
        delay: delay,
        currency_id: this.options.defaultCurrencyId
      },
      source: row
    };
  }

  _resolveCategory(categoryName, categoryMap = {}) {
    const normalized = categoryName?.toLowerCase().trim();
    
    if (categoryMap[normalized]) return categoryMap[normalized];
    if (this.categoryCache.has(normalized)) return this.categoryCache.get(normalized);
    
    const aliasMap = {
      'water': 'Water Treatment',
      'top': 'Top Products',
      'tools': 'Tools',
      'solve': 'Solvents',
      'pe': 'PE Equipment',
      'lamination': 'Lamination',
      'moulds': 'Moulds',
      'resin': 'Resin',
      'consumable': 'Consumables',
      'not_sure': 'Miscellaneous'
    };
    
    const aliased = aliasMap[normalized];
    if (aliased && this.categoryCache.has(aliased.toLowerCase())) {
      return this.categoryCache.get(aliased.toLowerCase());
    }
    
    return null;
  }

  _resolveUom(uomName) {
    const normalized = uomName?.toLowerCase().trim();
    
    if (this.uomCache.has(normalized)) {
      return this.uomCache.get(normalized);
    }
    
    const aliases = {
      'units': 1,
      'unit': 1,
      'kg': 2,
      'kgs': 2,
      'litre': 3,
      'litres': 3,
      'l': 3,
      'meter': 4,
      'meters': 4,
      'm': 4,
      'each': 1,
      'ea': 1
    };
    
    return aliases[normalized] || this.options.defaultUomId;
  }

  _parsePrice(value) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^\d.-]/g, '');
      return parseFloat(cleaned) || 0;
    }
    return 0;
  }

  _cleanNulls(obj) {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null && value !== undefined && value !== '') {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  _generateWarnings(row, transformed) {
    const warnings = [];
    
    if (!transformed.default_code) warnings.push('Missing product code');
    if (transformed.standard_price <= 0) warnings.push('Cost price not set');
    if (transformed.list_price <= 0) warnings.push('Sale price not set');
    
    return warnings;
  }

  transformBatch(rows, options = {}) {
    const results = {
      valid: [],
      invalid: [],
      byCategory: {},
      duplicates: []
    };

    const seenCodes = new Set();
    const seenNames = new Set();

    rows.forEach(row => {
      const result = this.transform(row, options);
      
      if (!result.valid) {
        results.invalid.push(result);
        return;
      }

      const code = result.data.default_code;
      const name = result.data.name;

      if ((code && seenCodes.has(code)) || seenNames.has(name.toLowerCase())) {
        results.duplicates.push({ ...result, reason: 'Duplicate code or name' });
        return;
      }

      if (code) seenCodes.add(code);
      seenNames.add(name.toLowerCase());

      results.valid.push(result);
      
      const category = result.meta?.category || 'Unclassified';
      results.byCategory[category] = (results.byCategory[category] || 0) + 1;
    });

    return results;
  }
}