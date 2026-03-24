/**
 * Australia Chart of Accounts Template
 * Based on Odoo's Australian chart of accounts
 */

export const AU = {
  code: 'au_basic',
  country: 'AU',
  name: 'Australia - Basic',
  description: 'Australian basic chart of accounts with GST support',
  currency: 'AUD',
  accounts: [
    // Assets
    { code: '1000', name: 'Cash at Bank', type: 'bank', reconcile: true },
    { code: '1010', name: 'Cash on Hand', type: 'bank', reconcile: true },
    { code: '1100', name: 'Accounts Receivable', type: 'receivable', reconcile: true },
    { code: '1110', name: 'Other Receivables', type: 'receivable', reconcile: true },
    { code: '1200', name: 'Inventory', type: 'asset', reconcile: false },
    { code: '1300', name: 'Prepayments', type: 'asset', reconcile: false },
    { code: '1400', name: 'Land', type: 'asset', reconcile: false },
    { code: '1410', name: 'Buildings', type: 'asset', reconcile: false },
    { code: '1420', name: 'Plant & Equipment', type: 'asset', reconcile: false },
    { code: '1430', name: 'Motor Vehicles', type: 'asset', reconcile: false },
    { code: '1440', name: 'Furniture & Fixtures', type: 'asset', reconcile: false },
    { code: '1500', name: 'Accumulated Depreciation', type: 'asset', reconcile: false },
    // GST
    { code: '1600', name: 'GST Receivable', type: 'receivable', reconcile: false },
    { code: '1610', name: 'GST Payable', type: 'liability', reconcile: false },
    // Liabilities
    { code: '2000', name: 'Accounts Payable', type: 'payable', reconcile: true },
    { code: '2010', name: 'Other Payables', type: 'payable', reconcile: true },
    { code: '2100', name: 'Credit Cards', type: 'liability', reconcile: false },
    { code: '2200', name: 'PAYG Withholding', type: 'liability', reconcile: false },
    { code: '2210', name: 'Superannuation Payable', type: 'liability', reconcile: false },
    { code: '2300', name: 'Employee Entitlements', type: 'liability', reconcile: false },
    { code: '2400', name: 'Provision for Tax', type: 'liability', reconcile: false },
    { code: '2500', name: 'Deferred Revenue', type: 'liability', reconcile: false },
    { code: '2600', name: 'Loans', type: 'liability', reconcile: false },
    // Equity
    { code: '3000', name: 'Share Capital', type: 'equity', reconcile: false },
    { code: '3100', name: 'Retained Earnings', type: 'equity', reconcile: false },
    { code: '3200', name: 'Current Year Earnings', type: 'equity', reconcile: false },
    // Revenue
    { code: '4000', name: 'Sales Revenue', type: 'revenue', reconcile: false },
    { code: '4100', name: 'Service Revenue', type: 'revenue', reconcile: false },
    { code: '4200', name: 'Interest Income', type: 'revenue', reconcile: false },
    { code: '4300', name: 'Other Income', type: 'revenue', reconcile: false },
    // Cost of Sales
    { code: '5000', name: 'Cost of Sales', type: 'expense', reconcile: false },
    { code: '5100', name: 'Direct Labour', type: 'expense', reconcile: false },
    // Expenses
    { code: '6000', name: 'Advertising', type: 'expense', reconcile: false },
    { code: '6100', name: 'Bank Charges', type: 'expense', reconcile: false },
    { code: '6200', name: 'Cleaning', type: 'expense', reconcile: false },
    { code: '6300', name: 'Consulting Fees', type: 'expense', reconcile: false },
    { code: '6400', name: 'Depreciation', type: 'expense', reconcile: false },
    { code: '6500', name: 'Electricity & Gas', type: 'expense', reconcile: false },
    { code: '6600', name: 'Entertainment', type: 'expense', reconcile: false },
    { code: '6700', name: 'Insurance', type: 'expense', reconcile: false },
    { code: '6800', name: 'Interest Paid', type: 'expense', reconcile: false },
    { code: '6900', name: 'Internet & Telecommunications', type: 'expense', reconcile: false },
    { code: '7000', name: 'Legal Fees', type: 'expense', reconcile: false },
    { code: '7100', name: 'Motor Vehicle Expenses', type: 'expense', reconcile: false },
    { code: '7200', name: 'Office Supplies', type: 'expense', reconcile: false },
    { code: '7300', name: 'Postage & Courier', type: 'expense', reconcile: false },
    { code: '7400', name: 'Printing & Stationery', type: 'expense', reconcile: false },
    { code: '7500', name: 'Rent', type: 'expense', reconcile: false },
    { code: '7600', name: 'Repairs & Maintenance', type: 'expense', reconcile: false },
    { code: '7700', name: 'Salaries & Wages', type: 'expense', reconcile: false },
    { code: '7800', name: 'Staff Training', type: 'expense', reconcile: false },
    { code: '7900', name: 'Subscriptions', type: 'expense', reconcile: false },
    { code: '8000', name: 'Superannuation', type: 'expense', reconcile: false },
    { code: '8100', name: 'Travel', type: 'expense', reconcile: false },
    { code: '8200', name: 'Utilities', type: 'expense', reconcile: false },
    { code: '8300', name: 'Fringe Benefits Tax', type: 'expense', reconcile: false },
    { code: '8400', name: 'Income Tax Expense', type: 'expense', reconcile: false }
  ],
  taxes: [
    { name: 'Australian GST 0%', amount: 0, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Australian GST 10%', amount: 10, amount_type: 'percent', type_tax_use: 'sale' }
  ]
};

export default AU;
