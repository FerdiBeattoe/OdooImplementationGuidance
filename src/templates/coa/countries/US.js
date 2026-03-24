/**
 * US Chart of Accounts Template
 * Based on Odoo's US GAAP-compliant chart of accounts
 */

export const US = {
  code: 'us_gaap',
  country: 'US',
  name: 'United States - US GAAP',
  description: 'US GAAP-compliant chart of accounts with standard account types',
  currency: 'USD',
  accounts: [
    // Assets - Current Assets
    { code: '100000', name: 'Cash', type: 'bank', reconcile: true },
    { code: '101000', name: 'Checking Account', type: 'bank', reconcile: true },
    { code: '102000', name: 'Savings Account', type: 'bank', reconcile: true },
    { code: '110000', name: 'Accounts Receivable', type: 'receivable', reconcile: true },
    { code: '115000', name: 'Notes Receivable', type: 'receivable', reconcile: true },
    { code: '120000', name: 'Inventory', type: 'asset', reconcile: false },
    { code: '130000', name: 'Prepaid Expenses', type: 'asset', reconcile: false },
    { code: '140000', name: 'Employee Advances', type: 'asset', reconcile: false },
    { code: '150000', name: 'Deferred Tax Asset', type: 'asset', reconcile: false },
    // Assets - Fixed Assets
    { code: '160000', name: 'Land', type: 'asset', reconcile: false },
    { code: '161000', name: 'Buildings', type: 'asset', reconcile: false },
    { code: '162000', name: 'Equipment', type: 'asset', reconcile: false },
    { code: '163000', name: 'Furniture & Fixtures', type: 'asset', reconcile: false },
    { code: '164000', name: 'Vehicles', type: 'asset', reconcile: false },
    { code: '165000', name: 'Accumulated Depreciation', type: 'asset', reconcile: false },
    { code: '170000', name: 'Intangible Assets', type: 'asset', reconcile: false },
    { code: '171000', name: 'Goodwill', type: 'asset', reconcile: false },
    // Liabilities - Current
    { code: '200000', name: 'Accounts Payable', type: 'payable', reconcile: true },
    { code: '205000', name: 'Notes Payable', type: 'payable', reconcile: true },
    { code: '210000', name: 'Accrued Expenses', type: 'liability', reconcile: false },
    { code: '215000', name: 'Payroll Liabilities', type: 'liability', reconcile: false },
    { code: '220000', name: 'Sales Tax Payable', type: 'liability', reconcile: false },
    { code: '225000', name: 'Income Tax Payable', type: 'liability', reconcile: false },
    { code: '230000', name: 'Deferred Revenue', type: 'liability', reconcile: false },
    { code: '240000', name: 'Current Portion of Long-Term Debt', type: 'liability', reconcile: false },
    // Liabilities - Long-Term
    { code: '250000', name: 'Long-Term Debt', type: 'liability', reconcile: false },
    { code: '255000', name: 'Bonds Payable', type: 'liability', reconcile: false },
    { code: '260000', name: 'Deferred Tax Liability', type: 'liability', reconcile: false },
    // Equity
    { code: '300000', name: 'Common Stock', type: 'equity', reconcile: false },
    { code: '310000', name: 'Preferred Stock', type: 'equity', reconcile: false },
    { code: '320000', name: 'Additional Paid-In Capital', type: 'equity', reconcile: false },
    { code: '330000', name: 'Retained Earnings', type: 'equity', reconcile: false },
    { code: '340000', name: 'Treasury Stock', type: 'equity', reconcile: false },
    { code: '350000', name: 'Owner Equity', type: 'equity', reconcile: false },
    // Revenue
    { code: '400000', name: 'Sales Revenue', type: 'revenue', reconcile: false },
    { code: '410000', name: 'Service Revenue', type: 'revenue', reconcile: false },
    { code: '420000', name: 'Interest Income', type: 'revenue', reconcile: false },
    { code: '430000', name: 'Other Income', type: 'revenue', reconcile: false },
    { code: '440000', name: 'Sales Returns & Allowances', type: 'revenue', reconcile: false },
    { code: '450000', name: 'Sales Discounts', type: 'revenue', reconcile: false },
    // Expenses - Operating
    { code: '500000', name: 'Cost of Goods Sold', type: 'expense', reconcile: false },
    { code: '510000', name: 'Salaries & Wages', type: 'expense', reconcile: false },
    { code: '520000', name: 'Rent Expense', type: 'expense', reconcile: false },
    { code: '530000', name: 'Utilities Expense', type: 'expense', reconcile: false },
    { code: '540000', name: 'Insurance Expense', type: 'expense', reconcile: false },
    { code: '550000', name: 'Repairs & Maintenance', type: 'expense', reconcile: false },
    { code: '560000', name: 'Depreciation Expense', type: 'expense', reconcile: false },
    { code: '570000', name: 'Amortization Expense', type: 'expense', reconcile: false },
    { code: '580000', name: 'Advertising Expense', type: 'expense', reconcile: false },
    { code: '590000', name: 'Professional Fees', type: 'expense', reconcile: false },
    { code: '595000', name: 'Office Supplies Expense', type: 'expense', reconcile: false },
    { code: '600000', name: 'Travel & Entertainment', type: 'expense', reconcile: false },
    { code: '610000', name: 'Telephone & Internet', type: 'expense', reconcile: false },
    { code: '620000', name: 'Bank Service Charges', type: 'expense', reconcile: false },
    { code: '630000', name: 'Miscellaneous Expense', type: 'expense', reconcile: false },
    { code: '640000', name: 'Income Tax Expense', type: 'expense', reconcile: false },
    { code: '650000', name: 'Interest Expense', type: 'expense', reconcile: false }
  ],
  taxes: [
    { name: 'US Sales Tax 0%', amount: 0, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'US Sales Tax 5%', amount: 5, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'US Sales Tax 7%', amount: 7, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'US Sales Tax 10%', amount: 10, amount_type: 'percent', type_tax_use: 'sale' }
  ]
};

export default US;
