/**
 * South Africa Chart of Accounts Template
 * Based on Odoo's South African chart of accounts
 */

export const ZA = {
  code: 'za_basic',
  country: 'ZA',
  name: 'South Africa - Basic',
  description: 'South African basic chart of accounts with VAT support',
  currency: 'ZAR',
  accounts: [
    // Assets - Current
    { code: '1000', name: 'Cash at Bank', type: 'bank', reconcile: true },
    { code: '1010', name: 'Cash on Hand', type: 'bank', reconcile: true },
    { code: '1020', name: 'Petty Cash', type: 'bank', reconcile: true },
    { code: '1100', name: 'Accounts Receivable', type: 'receivable', reconcile: true },
    { code: '1110', name: 'Other Receivables', type: 'receivable', reconcile: true },
    { code: '1120', name: 'Staff Loans', type: 'receivable', reconcile: true },
    { code: '1200', name: 'VAT Input', type: 'receivable', reconcile: false },
    { code: '1300', name: 'Inventory', type: 'asset', reconcile: false },
    { code: '1400', name: 'Prepaid Expenses', type: 'asset', reconcile: false },
    // Assets - Fixed
    { code: '1500', name: 'Land', type: 'asset', reconcile: false },
    { code: '1510', name: 'Buildings', type: 'asset', reconcile: false },
    { code: '1520', name: 'Plant & Machinery', type: 'asset', reconcile: false },
    { code: '1530', name: 'Motor Vehicles', type: 'asset', reconcile: false },
    { code: '1540', name: 'Furniture & Fittings', type: 'asset', reconcile: false },
    { code: '1550', name: 'Computer Equipment', type: 'asset', reconcile: false },
    { code: '1600', name: 'Accumulated Depreciation', type: 'asset', reconcile: false },
    // Liabilities - Current
    { code: '2000', name: 'Accounts Payable', type: 'payable', reconcile: true },
    { code: '2010', name: 'Other Payables', type: 'payable', reconcile: true },
    { code: '2100', name: 'VAT Output', type: 'liability', reconcile: false },
    { code: '2200', name: 'PAYE Payable', type: 'liability', reconcile: false },
    { code: '2210', name: 'UIF Payable', type: 'liability', reconcile: false },
    { code: '2220', name: 'SDL Payable', type: 'liability', reconcile: false },
    { code: '2300', name: 'Employee Benefits Payable', type: 'liability', reconcile: false },
    { code: '2400', name: 'SARS Income Tax', type: 'liability', reconcile: false },
    { code: '2500', name: 'Deferred Revenue', type: 'liability', reconcile: false },
    // Liabilities - Long-term
    { code: '3000', name: 'Share Capital', type: 'equity', reconcile: false },
    { code: '3010', name: 'Share Premium', type: 'equity', reconcile: false },
    { code: '3020', name: 'Retained Income', type: 'equity', reconcile: false },
    { code: '3100', name: 'Long-term Loans', type: 'liability', reconcile: false },
    { code: '3200', name: 'Mortgage Bonds', type: 'liability', reconcile: false },
    // Equity
    { code: '4000', name: 'Ordinary Share Capital', type: 'equity', reconcile: false },
    { code: '4100', name: 'Preference Share Capital', type: 'equity', reconcile: false },
    { code: '4200', name: 'Accumulated Profit/Loss', type: 'equity', reconcile: false },
    { code: '4300', name: 'Current Year Profit/Loss', type: 'equity', reconcile: false },
    // Revenue
    { code: '5000', name: 'Sales', type: 'revenue', reconcile: false },
    { code: '5100', name: 'Sales of Goods', type: 'revenue', reconcile: false },
    { code: '5200', name: 'Services Rendered', type: 'revenue', reconcile: false },
    { code: '5300', name: 'Interest Received', type: 'revenue', reconcile: false },
    { code: '5400', name: 'Dividends Received', type: 'revenue', reconcile: false },
    { code: '5500', name: 'Other Income', type: 'revenue', reconcile: false },
    // Cost of Sales
    { code: '6000', name: 'Cost of Sales', type: 'expense', reconcile: false },
    { code: '6100', name: 'Purchases', type: 'expense', reconcile: false },
    { code: '6200', name: 'Direct Labour', type: 'expense', reconcile: false },
    // Expenses
    { code: '7000', name: 'Salaries & Wages', type: 'expense', reconcile: false },
    { code: '7010', name: 'UIF Contribution', type: 'expense', reconcile: false },
    { code: '7020', name: 'SDL Contribution', type: 'expense', reconcile: false },
    { code: '7100', name: 'Rent', type: 'expense', reconcile: false },
    { code: '7200', name: 'Electricity & Water', type: 'expense', reconcile: false },
    { code: '7300', name: 'Repairs & Maintenance', type: 'expense', reconcile: false },
    { code: '7400', name: 'Insurance', type: 'expense', reconcile: false },
    { code: '7500', name: 'Telephone & Internet', type: 'expense', reconcile: false },
    { code: '7600', name: 'Stationery & Printing', type: 'expense', reconcile: false },
    { code: '7700', name: 'Advertising', type: 'expense', reconcile: false },
    { code: '7800', name: 'Bank Charges', type: 'expense', reconcile: false },
    { code: '7900', name: 'Subscriptions', type: 'expense', reconcile: false },
    { code: '8000', name: 'Motor Vehicle Expenses', type: 'expense', reconcile: false },
    { code: '8100', name: 'Travel & Accommodation', type: 'expense', reconcile: false },
    { code: '8200', name: 'Entertainment', type: 'expense', reconcile: false },
    { code: '8300', name: 'Professional Fees', type: 'expense', reconcile: false },
    { code: '8400', name: 'Audit Fees', type: 'expense', reconcile: false },
    { code: '8500', name: 'Depreciation', type: 'expense', reconcile: false },
    { code: '8600', name: 'Interest Paid', type: 'expense', reconcile: false },
    { code: '8700', name: 'Donations', type: 'expense', reconcile: false },
    { code: '8800', name: 'Fines & Penalties', type: 'expense', reconcile: false },
    { code: '8900', name: 'Income Tax Expense', type: 'expense', reconcile: false }
  ],
  taxes: [
    { name: 'South African VAT 0%', amount: 0, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'South African VAT 5% (Zero-rated)', amount: 5, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'South African VAT 15% (Standard)', amount: 15, amount_type: 'percent', type_tax_use: 'sale' }
  ]
};

export default ZA;
