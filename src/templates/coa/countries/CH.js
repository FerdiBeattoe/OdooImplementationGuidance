/**
 * Switzerland Chart of Accounts Template
 * Based on Odoo's Swiss chart of accounts
 */

export const CH = {
  code: 'ch_kmu',
  country: 'CH',
  name: 'Switzerland - KMU',
  description: 'Swiss SME chart of accounts with VAT support',
  currency: 'CHF',
  accounts: [
    // Anlagevermögen (Fixed Assets)
    { code: '1000', name: 'Geldwerte Post', type: 'bank', reconcile: true },
    { code: '1020', name: 'Bank', type: 'bank', reconcile: true },
    { code: '1100', name: 'Forderungen aus Lieferungen', type: 'receivable', reconcile: true },
    { code: '1130', name: 'Zweig debitoren', type: 'receivable', reconcile: true },
    { code: '1140', name: 'Forderungen Verrechnungssteuer', type: 'receivable', reconcile: false },
    { code: '1170', name: 'Aktive Rechnungsabgrenzung', type: 'asset', reconcile: false },
    { code: '1200', name: 'Immaterielle Anlagewerte', type: 'asset', reconcile: false },
    { code: '1400', name: 'Liegenschaften', type: 'asset', reconcile: false },
    { code: '1500', name: 'Maschinen', type: 'asset', reconcile: false },
    { code: '1600', name: 'Mobilien', type: 'asset', reconcile: false },
    { code: '1700', name: 'Fahrzeuge', type: 'asset', reconcile: false },
    // Umlaufvermögen (Current Assets)
    { code: '1000', name: 'Kassa', type: 'bank', reconcile: true },
    { code: '1010', name: 'Postcheck', type: 'bank', reconcile: true },
    { code: '1300', name: 'Warenbestand', type: 'asset', reconcile: false },
    // Eigenkapital (Equity)
    { code: '2000', name: 'Kreditoren', type: 'payable', reconcile: true },
    { code: '2010', name: 'Zweig kreditoren', type: 'payable', reconcile: true },
    { code: '2100', name: 'Passive Rechnungsabgrenzung', type: 'liability', reconcile: false },
    { code: '2200', name: 'MWST', type: 'liability', reconcile: false },
    { code: '2300', name: 'Lohndritter', type: 'liability', reconcile: false },
    { code: '2400', name: 'Dividenden', type: 'liability', reconcile: false },
    { code: '2500', name: 'Aktienkapital', type: 'equity', reconcile: false },
    { code: '2800', name: 'Gewinnreserve', type: 'equity', reconcile: false },
    { code: '2900', name: 'Jahresgewinn', type: 'equity', reconcile: false },
    // Langfristige Schulden
    { code: '2800', name: 'Hypotheken', type: 'liability', reconcile: false },
    { code: '2900', name: 'Darlehen', type: 'liability', reconcile: false },
    // Ertrag (Revenue)
    { code: '3000', name: 'Handelsertrag', type: 'revenue', reconcile: false },
    { code: '3100', name: 'Produktionsertrag', type: 'revenue', reconcile: false },
    { code: '3200', name: 'Dienstleistungsertrag', type: 'revenue', reconcile: false },
    { code: '3400', name: 'Zinsertrag', type: 'revenue', reconcile: false },
    { code: '3500', name: 'Mietzinsertrag', type: 'revenue', reconcile: false },
    { code: '3800', name: 'Ausserordentlicher Ertrag', type: 'revenue', reconcile: false },
    // Aufwand (Expenses)
    { code: '4000', name: 'Handelswarenaufwand', type: 'expense', reconcile: false },
    { code: '4100', name: 'Fertigungsmaterial', type: 'expense', reconcile: false },
    { code: '4200', name: 'Fremdmaterial', type: 'expense', reconcile: false },
    { code: '4400', name: 'Buchhaltungsaufwand', type: 'expense', reconcile: false },
    { code: '4500', name: 'Löhne', type: 'expense', reconcile: false },
    { code: '4600', name: 'Sozialversicherungsaufwand', type: 'expense', reconcile: false },
    { code: '4700', name: 'BVG-Beiträge', type: 'expense', reconcile: false },
    { code: '4800', name: 'Pensionskassenbeiträge', type: 'expense', reconcile: false },
    { code: '5000', name: 'Mietzinsaufwand', type: 'expense', reconcile: false },
    { code: '5100', name: 'Versicherungsaufwand', type: 'expense', reconcile: false },
    { code: '5200', name: 'Energie- und Entsorgungsaufwand', type: 'expense', reconcile: false },
    { code: '5300', name: 'Unterhalt und Reparaturen', type: 'expense', reconcile: false },
    { code: '5400', name: 'Fahrzeug- und Transportaufwand', type: 'expense', reconcile: false },
    { code: '5500', name: 'Verwaltungskosten', type: 'expense', reconcile: false },
    { code: '5600', name: 'Werbeaufwand', type: 'expense', reconcile: false },
    { code: '5700', name: 'Sonstiger Betriebsaufwand', type: 'expense', reconcile: false },
    { code: '5800', name: 'Abschreibungen', type: 'expense', reconcile: false },
    { code: '5900', name: 'Finanzaufwand', type: 'expense', reconcile: false },
    { code: '6000', name: 'Steuern', type: 'expense', reconcile: false }
  ],
  taxes: [
    { name: 'Swiss VAT 0%', amount: 0, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Swiss VAT 2.5% (Reduced)', amount: 2.5, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Swiss VAT 3.7% (Special)', amount: 3.7, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Swiss VAT 7.7% (Standard)', amount: 7.7, amount_type: 'percent', type_tax_use: 'sale' }
  ]
};

export default CH;
