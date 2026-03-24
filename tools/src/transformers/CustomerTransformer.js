export class CustomerTransformer {
  constructor(options = {}) {
    this.options = {
      defaultCountry: options.defaultCountry || 'South Africa',
      defaultCurrency: options.defaultCurrency || 'ZAR',
      categoryMap: options.categoryMap || {},
      ...options
    };
    
    this.categoryCache = new Map();
    this.countryCache = new Map();
  }

  async prepareCaches(client) {
    const categories = await client.searchRead('res.partner.category', [], ['id', 'name']);
    categories.forEach(cat => this.categoryCache.set(cat.name.toLowerCase(), cat.id));

    const countries = await client.searchRead('res.country', [], ['id', 'name', 'code']);
    countries.forEach(c => {
      this.countryCache.set(c.name.toLowerCase(), c.id);
      this.countryCache.set(c.code?.toLowerCase(), c.id);
    });
  }

  transform(row, options = {}) {
    const accountCode = row.account_code || row.account || '';
    const customerName = row.customer || row.name || '';
    const industry = row.industry || row.classification || '';
    const repCode = row.representative || row.rep || '';
    const terms = row.terms || row.payment_terms || '';
    const priceList = row.default_price_list || row.pricelist || '';

    if (!customerName) {
      return { valid: false, error: 'Customer name is required', source: row };
    }

    const transformed = {
      name: customerName.trim(),
      ref: accountCode?.trim() || null,
      customer_rank: 1,
      is_company: true,
      industry_id: this._resolveIndustry(industry),
      user_id: this._resolveRep(repCode, options.repMap),
      property_payment_term_id: this._resolvePaymentTerms(terms, options.termsMap),
      property_product_pricelist: this._resolvePricelist(priceList, options.pricelistMap),
      category_id: this._resolveCategories(industry),
    };

    return {
      valid: true,
      data: this._cleanNulls(transformed),
      source: row,
      meta: {
        originalName: customerName,
        industry: industry,
        warnings: this._generateWarnings(row, transformed)
      }
    };
  }

  _resolveIndustry(industryName) {
    const normalized = industryName?.toLowerCase().trim();
    const mapping = {
      'trade': 'Trade Customer',
      'retail': 'Retail Customer',
      'pool': 'Pool Industry',
      'manufacturing': 'Manufacturing',
      'industrial': 'Industrial Customer'
    };
    
    return mapping[normalized] || industryName;
  }

  _resolveRep(repCode, repMap = {}) {
    return repMap[repCode] || null;
  }

  _resolvePaymentTerms(terms, termsMap = {}) {
    const normalized = terms?.toString().toLowerCase().trim();
    
    const defaultMap = {
      '30': 2,  // 30 days
      '60': 3,  // 60 days
      '90': 4,  // 90 days
      'immediate': 1,
      'cash': 1
    };
    
    return termsMap[normalized] || defaultMap[normalized] || null;
  }

  _resolvePricelist(pricelistName, pricelistMap = {}) {
    return pricelistMap[pricelistName] || null;
  }

  _resolveCategories(industry) {
    const categories = [];
    const normalized = industry?.toLowerCase().trim();
    
    if (this.categoryCache.has(normalized)) {
      categories.push(this.categoryCache.get(normalized));
    }
    
    return categories.length > 0 ? [[6, 0, categories]] : null;
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
    
    if (!transformed.ref) warnings.push('Missing account code');
    if (!transformed.user_id) warnings.push('Representative not resolved');
    if (!transformed.property_payment_term_id) warnings.push('Payment terms not resolved');
    
    return warnings;
  }

  transformBatch(rows, options = {}) {
    const results = {
      valid: [],
      invalid: [],
      byIndustry: {}
    };

    rows.forEach(row => {
      const result = this.transform(row, options);
      
      if (result.valid) {
        results.valid.push(result);
        const industry = result.meta?.industry || 'Unclassified';
        results.byIndustry[industry] = (results.byIndustry[industry] || 0) + 1;
      } else {
        results.invalid.push(result);
      }
    });

    return results;
  }
}