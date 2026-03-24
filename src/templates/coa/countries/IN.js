/**
 * India Chart of Accounts Template
 * Based on Odoo's Indian chart of accounts
 */

export const IN = {
  code: 'in_basic',
  country: 'IN',
  name: 'India - Basic',
  description: 'Indian basic chart of accounts with GST support',
  currency: 'INR',
  accounts: [
    // Current Assets
    { code: '1000', name: 'Cash in Hand', type: 'bank', reconcile: true },
    { code: '1010', name: 'Cash at Bank', type: 'bank', reconcile: true },
    { code: '1020', name: 'Petty Cash', type: 'bank', reconcile: true },
    { code: '1100', name: 'Sundry Debtors', type: 'receivable', reconcile: true },
    { code: '1110', name: 'Bills Receivable', type: 'receivable', reconcile: true },
    { code: '1120', name: 'Loans and Advances', type: 'receivable', reconcile: true },
    { code: '1200', name: 'CGST Input', type: 'receivable', reconcile: false },
    { code: '1210', name: 'SGST Input', type: 'receivable', reconcile: false },
    { code: '1220', name: 'IGST Input', type: 'receivable', reconcile: false },
    { code: '1230', name: 'UTGST Input', type: 'receivable', reconcile: false },
    { code: '1300', name: 'Inventory', type: 'asset', reconcile: false },
    { code: '1400', name: 'Raw Materials', type: 'asset', reconcile: false },
    { code: '1410', name: 'Work in Progress', type: 'asset', reconcile: false },
    { code: '1420', name: 'Finished Goods', type: 'asset', reconcile: false },
    { code: '1500', name: 'Prepaid Expenses', type: 'asset', reconcile: false },
    { code: '1600', name: 'TDS Receivable', type: 'receivable', reconcile: false },
    // Fixed Assets
    { code: '1700', name: 'Land', type: 'asset', reconcile: false },
    { code: '1710', name: 'Buildings', type: 'asset', reconcile: false },
    { code: '1720', name: 'Plant & Machinery', type: 'asset', reconcile: false },
    { code: '1730', name: 'Furniture & Fixtures', type: 'asset', reconcile: false },
    { code: '1740', name: 'Office Equipment', type: 'asset', reconcile: false },
    { code: '1750', name: 'Motor Vehicles', type: 'asset', reconcile: false },
    { code: '1760', name: 'Computers', type: 'asset', reconcile: false },
    { code: '1800', name: 'Accumulated Depreciation', type: 'asset', reconcile: false },
    // Current Liabilities
    { code: '2000', name: 'Sundry Creditors', type: 'payable', reconcile: true },
    { code: '2010', name: 'Bills Payable', type: 'payable', reconcile: true },
    { code: '2020', name: 'Advances from Customers', type: 'payable', reconcile: false },
    { code: '2100', name: 'CGST Payable', type: 'liability', reconcile: false },
    { code: '2110', name: 'SGST Payable', type: 'liability', reconcile: false },
    { code: '2120', name: 'IGST Payable', type: 'liability', reconcile: false },
    { code: '2130', name: 'UTGST Payable', type: 'liability', reconcile: false },
    { code: '2200', name: 'TDS Payable', type: 'liability', reconcile: false },
    { code: '2300', name: 'GST TDS Payable', type: 'liability', reconcile: false },
    { code: '2400', name: 'Salary Payable', type: 'liability', reconcile: false },
    { code: '2500', name: 'Provident Fund Payable', type: 'liability', reconcile: false },
    { code: '2600', name: 'ESI Payable', type: 'liability', reconcile: false },
    { code: '2700', name: 'Professional Tax Payable', type: 'liability', reconcile: false },
    { code: '2800', name: 'Labour Welfare Fund', type: 'liability', reconcile: false },
    // Long-term Liabilities
    { code: '3000', name: 'Secured Loans', type: 'liability', reconcile: false },
    { code: '3010', name: 'Unsecured Loans', type: 'liability', reconcile: false },
    { code: '3100', name: 'Debentures', type: 'liability', reconcile: false },
    // Equity
    { code: '4000', name: 'Share Capital', type: 'equity', reconcile: false },
    { code: '4100', name: 'Reserves & Surplus', type: 'equity', reconcile: false },
    { code: '4200', name: 'Securities Premium', type: 'equity', reconcile: false },
    { code: '4300', name: 'Capital Reserve', type: 'equity', reconcile: false },
    { code: '4400', name: 'P&L Surplus', type: 'equity', reconcile: false },
    // Revenue
    { code: '5000', name: 'Sales', type: 'revenue', reconcile: false },
    { code: '5010', name: 'Sales of Goods', type: 'revenue', reconcile: false },
    { code: '5020', name: 'Services Income', type: 'revenue', reconcile: false },
    { code: '5100', name: 'Export Sales', type: 'revenue', reconcile: false },
    { code: '5200', name: 'Other Income', type: 'revenue', reconcile: false },
    { code: '5300', name: 'Interest Income', type: 'revenue', reconcile: false },
    // Cost of Sales
    { code: '6000', name: 'Cost of Goods Sold', type: 'expense', reconcile: false },
    { code: '6100', name: 'Purchases', type: 'expense', reconcile: false },
    { code: '6200', name: 'Direct Labour', type: 'expense', reconcile: false },
    // Expenses
    { code: '7000', name: 'Salaries & Wages', type: 'expense', reconcile: false },
    { code: '7010', name: 'PF Contribution', type: 'expense', reconcile: false },
    { code: '7020', name: 'ESI Contribution', type: 'expense', reconcile: false },
    { code: '7100', name: 'Rent', type: 'expense', reconcile: false },
    { code: '7200', name: 'Electricity & Water', type: 'expense', reconcile: false },
    { code: '7300', name: 'Repairs & Maintenance', type: 'expense', reconcile: false },
    { code: '7400', name: 'Insurance', type: 'expense', reconcile: false },
    { code: '7500', name: 'Telephone & Internet', type: 'expense', reconcile: false },
    { code: '7600', name: 'Printing & Stationery', type: 'expense', reconcile: false },
    { code: '7700', name: 'Travelling & Conveyance', type: 'expense', reconcile: false },
    { code: '7800', name: 'Motor Car Expenses', type: 'expense', reconcile: false },
    { code: '7900', name: 'Legal & Professional Charges', type: 'expense', reconcile: false },
    { code: '8000', name: 'Audit Fees', type: 'expense', reconcile: false },
    { code: '8100', name: 'Bank Charges', type: 'expense', reconcile: false },
    { code: '8200', name: 'Interest on Loan', type: 'expense', reconcile: false },
    { code: '8300', name: 'Depreciation', type: 'expense', reconcile: false },
    { code: '8400', name: 'Advertisement', type: 'expense', reconcile: false },
    { code: '8500', name: 'Commission', type: 'expense', reconcile: false },
    { code: '8600', name: 'Discount Allowed', type: 'expense', reconcile: false },
    { code: '8700', name: 'Bad Debts', type: 'expense', reconcile: false },
    { code: '8800', name: 'Income Tax', type: 'expense', reconcile: false }
  ],
  taxes: [
    { name: 'Indian GST 0%', amount: 0, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Indian GST 5% (Reduced)', amount: 5, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Indian GST 12% (Reduced)', amount: 12, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Indian GST 18% (Standard)', amount: 18, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Indian GST 28% (Special)', amount: 28, amount_type: 'percent', type_tax_use: 'sale' }
  ]
};

export default IN;
