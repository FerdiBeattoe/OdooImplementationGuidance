/**
 * Canada Chart of Accounts Template
 * Based on Odoo's Canadian chart of accounts
 */

export const CA = {
  code: 'ca_basic',
  country: 'CA',
  name: 'Canada - Basic',
  description: 'Canadian basic chart of accounts with GST/HST support',
  currency: 'CAD',
  accounts: [
    // Assets - Current
    { code: '1000', name: 'Cash', type: 'bank', reconcile: true },
    { code: '1010', name: 'Bank Account', type: 'bank', reconcile: true },
    { code: '1020', name: 'Petty Cash', type: 'bank', reconcile: true },
    { code: '1100', name: 'Accounts Receivable', type: 'receivable', reconcile: true },
    { code: '1110', name: 'Other Receivables', type: 'receivable', reconcile: true },
    { code: '1120', name: 'Notes Receivable', type: 'receivable', reconcile: true },
    { code: '1200', name: 'Inventory', type: 'asset', reconcile: false },
    { code: '1300', name: 'Prepaid Expenses', type: 'asset', reconcile: false },
    { code: '1350', name: 'GST/HST Receivable', type: 'receivable', reconcile: false },
    // Assets - Fixed
    { code: '1500', name: 'Land', type: 'asset', reconcile: false },
    { code: '1510', name: 'Buildings', type: 'asset', reconcile: false },
    { code: '1520', name: 'Equipment', type: 'asset', reconcile: false },
    { code: '1530', name: 'Furniture', type: 'asset', reconcile: false },
    { code: '1540', name: 'Vehicles', type: 'asset', reconcile: false },
    { code: '1550', name: 'Accumulated Depreciation', type: 'asset', reconcile: false },
    // Liabilities - Current
    { code: '2000', name: 'Accounts Payable', type: 'payable', reconcile: true },
    { code: '2010', name: 'Other Payables', type: 'payable', reconcile: true },
    { code: '2020', name: 'Notes Payable', type: 'payable', reconcile: true },
    { code: '2100', name: 'Credit Card', type: 'liability', reconcile: false },
    { code: '2200', name: 'GST/HST Payable', type: 'liability', reconcile: false },
    { code: '2300', name: 'PST Payable', type: 'liability', reconcile: false },
    { code: '2400', name: 'Employee Deductions', type: 'liability', reconcile: false },
    { code: '2500', name: 'Sales Tax Payable', type: 'liability', reconcile: false },
    { code: '2600', name: 'Deferred Revenue', type: 'liability', reconcile: false },
    // Liabilities - Long-term
    { code: '2700', name: 'Loans Payable', type: 'liability', reconcile: false },
    { code: '2800', name: 'Mortgages', type: 'liability', reconcile: false },
    // Equity
    { code: '3000', name: 'Share Capital', type: 'equity', reconcile: false },
    { code: '3100', name: 'Retained Earnings', type: 'equity', reconcile: false },
    { code: '3200', name: 'Current Year Earnings', type: 'equity', reconcile: false },
    { code: '3500', name: 'Owner Equity', type: 'equity', reconcile: false },
    // Revenue
    { code: '4000', name: 'Sales', type: 'revenue', reconcile: false },
    { code: '4100', name: 'Service Revenue', type: 'revenue', reconcile: false },
    { code: '4200', name: 'Interest Income', type: 'revenue', reconcile: false },
    { code: '4300', name: 'Other Income', type: 'revenue', reconcile: false },
    // Cost of Sales
    { code: '5000', name: 'Cost of Goods Sold', type: 'expense', reconcile: false },
    { code: '5100', name: 'Direct Labour', type: 'expense', reconcile: false },
    // Expenses
    { code: '6000', name: 'Advertising', type: 'expense', reconcile: false },
    { code: '6100', name: 'Bank Charges', type: 'expense', reconcile: false },
    { code: '6200', name: 'Insurance', type: 'expense', reconcile: false },
    { code: '6300', name: 'Legal & Accounting', type: 'expense', reconcile: false },
    { code: '6400', name: 'Depreciation', type: 'expense', reconcile: false },
    { code: '6500', name: 'Utilities', type: 'expense', reconcile: false },
    { code: '6600', name: 'Entertainment', type: 'expense', reconcile: false },
    { code: '6700', name: 'Office Supplies', type: 'expense', reconcile: false },
    { code: '6800', name: 'Rent', type: 'expense', reconcile: false },
    { code: '6900', name: 'Repairs & Maintenance', type: 'expense', reconcile: false },
    { code: '7000', name: 'Salaries & Wages', type: 'expense', reconcile: false },
    { code: '7100', name: 'CPP/El Expenses', type: 'expense', reconcile: false },
    { code: '7200', name: 'Travel', type: 'expense', reconcile: false },
    { code: '7300', name: 'Telephone & Internet', type: 'expense', reconcile: false },
    { code: '7400', name: 'Professional Development', type: 'expense', reconcile: false },
    { code: '7500', name: 'Vehicle Expenses', type: 'expense', reconcile: false },
    { code: '7600', name: 'Interest Expense', type: 'expense', reconcile: false },
    { code: '7700', name: 'Income Tax', type: 'expense', reconcile: false }
  ],
  taxes: [
    { name: 'Canadian GST 0%', amount: 0, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Canadian GST 5%', amount: 5, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Canadian HST 13% (ON)', amount: 13, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Canadian HST 15% (NL)', amount: 15, amount_type: 'percent', type_tax_use: 'sale' }
  ]
};

export default CA;
