/**
 * New Zealand Chart of Accounts Template
 * Based on Odoo's New Zealand chart of accounts
 */

export const NZ = {
  code: 'nz_basic',
  country: 'NZ',
  name: 'New Zealand - Basic',
  description: 'New Zealand basic chart of accounts with GST support',
  currency: 'NZD',
  accounts: [
    // Assets
    { code: '1000', name: 'Cheque Account', type: 'bank', reconcile: true },
    { code: '1010', name: 'Savings Account', type: 'bank', reconcile: true },
    { code: '1020', name: 'Cash on Hand', type: 'bank', reconcile: true },
    { code: '1100', name: 'Accounts Receivable', type: 'receivable', reconcile: true },
    { code: '1110', name: 'Other Receivables', type: 'receivable', reconcile: true },
    { code: '1120', name: 'Director Advances', type: 'receivable', reconcile: true },
    { code: '1200', name: 'Inventory', type: 'asset', reconcile: false },
    { code: '1300', name: 'Prepayments', type: 'asset', reconcile: false },
    { code: '1400', name: 'Land', type: 'asset', reconcile: false },
    { code: '1410', name: 'Buildings', type: 'asset', reconcile: false },
    { code: '1420', name: 'Plant & Equipment', type: 'asset', reconcile: false },
    { code: '1430', name: 'Motor Vehicles', type: 'asset', reconcile: false },
    { code: '1500', name: 'Accumulated Depreciation', type: 'asset', reconcile: false },
    // GST
    { code: '1600', name: 'GST Receivable', type: 'receivable', reconcile: false },
    { code: '1610', name: 'GST Payable', type: 'liability', reconcile: false },
    // Liabilities
    { code: '2000', name: 'Accounts Payable', type: 'payable', reconcile: true },
    { code: '2010', name: 'Other Payables', type: 'payable', reconcile: true },
    { code: '2100', name: 'Credit Card', type: 'liability', reconcile: false },
    { code: '2200', name: 'PAYE Payable', type: 'liability', reconcile: false },
    { code: '2210', name: 'KiwiSaver Payable', type: 'liability', reconcile: false },
    { code: '2300', name: 'Employee Entitlements', type: 'liability', reconcile: false },
    { code: '2400', name: 'Provision for Tax', type: 'liability', reconcile: false },
    { code: '2500', name: 'Deferred Revenue', type: 'liability', reconcile: false },
    { code: '2600', name: 'Loans', type: 'liability', reconcile: false },
    // Equity
    { code: '3000', name: 'Share Capital', type: 'equity', reconcile: false },
    { code: '3100', name: 'Retained Earnings', type: 'equity', reconcile: false },
    { code: '3200', name: 'Current Year Earnings', type: 'equity', reconcile: false },
    // Revenue
    { code: '4000', name: 'Sales', type: 'revenue', reconcile: false },
    { code: '4100', name: 'Services', type: 'revenue', reconcile: false },
    { code: '4200', name: 'Interest Received', type: 'revenue', reconcile: false },
    { code: '4300', name: 'Other Income', type: 'revenue', reconcile: false },
    // Cost of Sales
    { code: '5000', name: 'Cost of Sales', type: 'expense', reconcile: false },
    // Expenses
    { code: '6000', name: 'Advertising', type: 'expense', reconcile: false },
    { code: '6100', name: 'Bank Fees', type: 'expense', reconcile: false },
    { code: '6200', name: 'Cleaning', type: 'expense', reconcile: false },
    { code: '6300', name: 'Consulting', type: 'expense', reconcile: false },
    { code: '6400', name: 'Depreciation', type: 'expense', reconcile: false },
    { code: '6500', name: 'Electricity', type: 'expense', reconcile: false },
    { code: '6600', name: 'Entertainment', type: 'expense', reconcile: false },
    { code: '6700', name: 'Insurance', type: 'expense', reconcile: false },
    { code: '6800', name: 'Interest Paid', type: 'expense', reconcile: false },
    { code: '6900', name: 'Telecommunications', type: 'expense', reconcile: false },
    { code: '7000', name: 'Legal', type: 'expense', reconcile: false },
    { code: '7100', name: 'Motor Vehicle', type: 'expense', reconcile: false },
    { code: '7200', name: 'Office Supplies', type: 'expense', reconcile: false },
    { code: '7300', name: 'Postage', type: 'expense', reconcile: false },
    { code: '7400', name: 'Printing', type: 'expense', reconcile: false },
    { code: '7500', name: 'Rent', type: 'expense', reconcile: false },
    { code: '7600', name: 'Repairs', type: 'expense', reconcile: false },
    { code: '7700', name: 'Wages', type: 'expense', reconcile: false },
    { code: '7800', name: 'Training', type: 'expense', reconcile: false },
    { code: '7900', name: 'Subscriptions', type: 'expense', reconcile: false },
    { code: '8000', name: 'KiwiSaver', type: 'expense', reconcile: false },
    { code: '8100', name: 'Travel', type: 'expense', reconcile: false },
    { code: '8200', name: 'Utilities', type: 'expense', reconcile: false },
    { code: '8300', name: 'Income Tax', type: 'expense', reconcile: false }
  ],
  taxes: [
    { name: 'NZ GST 0%', amount: 0, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'NZ GST 15%', amount: 15, amount_type: 'percent', type_tax_use: 'sale' }
  ]
};

export default NZ;
