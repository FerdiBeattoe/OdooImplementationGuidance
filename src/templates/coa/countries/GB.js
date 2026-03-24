/**
 * UK Chart of Accounts Template
 * Based on Odoo's UK-compatible chart of accounts (UK GAAP / IFRS)
 */

export const GB = {
  code: 'uk_gaap',
  country: 'GB',
  name: 'United Kingdom - UK GAAP',
  description: 'UK GAAP-compliant chart of accounts with VAT support',
  currency: 'GBP',
  accounts: [
    // Assets - Current Assets
    { code: '1000', name: 'Bank Current Account', type: 'bank', reconcile: true },
    { code: '1010', name: 'Business Savings Account', type: 'bank', reconcile: true },
    { code: '1020', name: 'Cash in Hand', type: 'bank', reconcile: true },
    { code: '1100', name: 'Trade Debtors', type: 'receivable', reconcile: true },
    { code: '1150', name: 'Other Debtors', type: 'receivable', reconcile: true },
    { code: '1200', name: 'Prepayments', type: 'asset', reconcile: false },
    { code: '1250', name: 'Accrued Income', type: 'asset', reconcile: false },
    { code: '1300', name: 'Stock', type: 'asset', reconcile: false },
    { code: '1350', name: 'Work in Progress', type: 'asset', reconcile: false },
    // Assets - Fixed Assets
    { code: '1500', name: 'Freehold Property', type: 'asset', reconcile: false },
    { code: '1510', name: 'Leasehold Property', type: 'asset', reconcile: false },
    { code: '1520', name: 'Plant & Machinery', type: 'asset', reconcile: false },
    { code: '1530', name: 'Fixtures & Fittings', type: 'asset', reconcile: false },
    { code: '1540', name: 'Motor Vehicles', type: 'asset', reconcile: false },
    { code: '1550', name: 'Computer Equipment', type: 'asset', reconcile: false },
    { code: '1600', name: 'Accumulated Depreciation', type: 'asset', reconcile: false },
    { code: '1700', name: 'Intangible Assets', type: 'asset', reconcile: false },
    { code: '1800', name: 'Investments', type: 'asset', reconcile: false },
    // Liabilities - Current
    { code: '2000', name: 'Trade Creditors', type: 'payable', reconcile: true },
    { code: '2050', name: 'Other Creditors', type: 'payable', reconcile: true },
    { code: '2100', name: 'VAT Control Account', type: 'liability', reconcile: false },
    { code: '2110', name: 'VAT on Purchases', type: 'liability', reconcile: false },
    { code: '2120', name: 'VAT on Sales', type: 'liability', reconcile: false },
    { code: '2200', name: 'PAYE/NIC Payable', type: 'liability', reconcile: false },
    { code: '2250', name: 'Pension Contributions Payable', type: 'liability', reconcile: false },
    { code: '2300', name: 'Accrued Expenses', type: 'liability', reconcile: false },
    { code: '2350', name: 'Deferred Income', type: 'liability', reconcile: false },
    { code: '2400', name: 'Corporation Tax Payable', type: 'liability', reconcile: false },
    { code: '2500', name: 'Dividends Payable', type: 'liability', reconcile: false },
    // Liabilities - Long-Term
    { code: '2800', name: 'Loan Account', type: 'liability', reconcile: false },
    { code: '2850', name: 'HP/Finance Agreements', type: 'liability', reconcile: false },
    // Capital & Reserves
    { code: '3000', name: 'Called Up Share Capital', type: 'equity', reconcile: false },
    { code: '3100', name: 'Share Premium Account', type: 'equity', reconcile: false },
    { code: '3200', name: 'Revaluation Reserve', type: 'equity', reconcile: false },
    { code: '3300', name: 'Profit & Loss Account', type: 'equity', reconcile: false },
    // Turnover
    { code: '4000', name: 'Sales', type: 'revenue', reconcile: false },
    { code: '4100', name: 'Service Fees', type: 'revenue', reconcile: false },
    { code: '4200', name: 'Interest Received', type: 'revenue', reconcile: false },
    { code: '4300', name: 'Other Income', type: 'revenue', reconcile: false },
    // Direct Costs
    { code: '5000', name: 'Cost of Sales', type: 'expense', reconcile: false },
    { code: '5100', name: 'Purchases', type: 'expense', reconcile: false },
    { code: '5200', name: 'Direct Labour', type: 'expense', reconcile: false },
    // Administrative Expenses
    { code: '6000', name: 'Salaries', type: 'expense', reconcile: false },
    { code: '6050', name: 'Employers NIC', type: 'expense', reconcile: false },
    { code: '6100', name: 'Pension Costs', type: 'expense', reconcile: false },
    { code: '6200', name: 'Rent & Rates', type: 'expense', reconcile: false },
    { code: '6300', name: 'Light, Heat & Power', type: 'expense', reconcile: false },
    { code: '6400', name: 'Repairs & Maintenance', type: 'expense', reconcile: false },
    { code: '6500', name: 'Insurance', type: 'expense', reconcile: false },
    { code: '6600', name: 'Printing & Stationery', type: 'expense', reconcile: false },
    { code: '6650', name: 'Telephone & Internet', type: 'expense', reconcile: false },
    { code: '6700', name: 'Postage & Carriage', type: 'expense', reconcile: false },
    { code: '6750', name: 'Travel & Accommodation', type: 'expense', reconcile: false },
    { code: '6800', name: 'Legal & Professional', type: 'expense', reconcile: false },
    { code: '6850', name: 'Audit Fees', type: 'expense', reconcile: false },
    { code: '6900', name: 'Bank Charges', type: 'expense', reconcile: false },
    { code: '6950', name: 'Interest Payable', type: 'expense', reconcile: false },
    { code: '7000', name: 'Depreciation', type: 'expense', reconcile: false },
    { code: '7100', name: 'Amortisation', type: 'expense', reconcile: false },
    { code: '8000', name: 'Corporation Tax', type: 'expense', reconcile: false },
    { code: '9000', name: 'Dividends', type: 'expense', reconcile: false }
  ],
  taxes: [
    { name: 'UK VAT 0%', amount: 0, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'UK VAT 5%', amount: 5, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'UK VAT 20%', amount: 20, amount_type: 'percent', type_tax_use: 'sale' }
  ]
};

export default GB;
