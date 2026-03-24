/**
 * Germany Chart of Accounts Template
 * Based on Odoo's German commercial chart (SKR03/SKR04)
 */

export const DE = {
  code: 'de_skr04',
  country: 'DE',
  name: 'Germany - SKR04',
  description: 'German standard chart of accounts (SKR04) with VAT support',
  currency: 'EUR',
  accounts: [
    // Anlagevermögen (Fixed Assets)
    { code: '0200', name: 'Immaterielle Anlagewerte', type: 'asset', reconcile: false },
    { code: '0400', name: 'Grundstücke und Gebäude', type: 'asset', reconcile: false },
    { code: '0440', name: 'Bebaute Grundstücke', type: 'asset', reconcile: false },
    { code: '0500', name: 'Technische Anlagen', type: 'asset', reconcile: false },
    { code: '0600', name: 'Betriebs- und Geschäftsausstattung', type: 'asset', reconcile: false },
    { code: '0700', name: 'Fahrzeuge', type: 'asset', reconcile: false },
    { code: '0900', name: 'Geleistete Anzahlungen auf Anlagen', type: 'asset', reconcile: false },
    // Umlaufvermögen (Current Assets)
    { code: '1200', name: 'Forderungen aus Lieferungen', type: 'receivable', reconcile: true },
    { code: '1240', name: 'Sonstige Forderungen', type: 'receivable', reconcile: true },
    { code: '1400', name: 'Vorräte', type: 'asset', reconcile: false },
    { code: '1460', name: 'Unfertige Erzeugnisse', type: 'asset', reconcile: false },
    { code: '1500', name: 'Bank', type: 'bank', reconcile: true },
    { code: '1600', name: 'Kasse', type: 'bank', reconcile: true },
    { code: '1800', name: 'Umsatzsteuer', type: 'liability', reconcile: false },
    // Eigenkapital (Equity)
    { code: '2000', name: 'Gezeichnetes Kapital', type: 'equity', reconcile: false },
    { code: '2100', name: 'Gewinnrücklagen', type: 'equity', reconcile: false },
    { code: '2200', name: 'Gewinnvortrag', type: 'equity', reconcile: false },
    { code: '2300', name: 'Jahresüberschuss', type: 'equity', reconcile: false },
    // Verbindlichkeiten (Liabilities)
    { code: '3000', name: 'Verbindlichkeiten aus Lieferungen', type: 'payable', reconcile: true },
    { code: '3200', name: 'Sonstige Verbindlichkeiten', type: 'payable', reconcile: true },
    { code: '3400', name: 'Darlehen', type: 'liability', reconcile: false },
    { code: '3800', name: 'Umsatzsteuer-vorauszahlung', type: 'liability', reconcile: false },
    // Erlöse (Revenue)
    { code: '4000', name: 'Umsatzerlöse', type: 'revenue', reconcile: false },
    { code: '4200', name: 'Sonstige Erlöse', type: 'revenue', reconcile: false },
    { code: '4400', name: 'Erträge aus Beteiligungen', type: 'revenue', reconcile: false },
    { code: '4600', name: 'Zinserträge', type: 'revenue', reconcile: false },
    // Materialaufwand
    { code: '6000', name: 'Aufwendungen für Rohstoffe', type: 'expense', reconcile: false },
    { code: '6100', name: 'Aufwendungen für bezogene Leistungen', type: 'expense', reconcile: false },
    // Personalaufwand
    { code: '6200', name: 'Löhne und Gehälter', type: 'expense', reconcile: false },
    { code: '6300', name: 'Soziale Abgaben', type: 'expense', reconcile: false },
    // Sachaufwand
    { code: '6400', name: 'Raumkosten', type: 'expense', reconcile: false },
    { code: '6500', name: 'Versicherungen', type: 'expense', reconcile: false },
    { code: '6600', name: 'Reparaturen', type: 'expense', reconcile: false },
    { code: '6700', name: 'Reisekosten', type: 'expense', reconcile: false },
    { code: '6800', name: 'Büromaterial', type: 'expense', reconcile: false },
    { code: '6900', name: 'Telekommunikation', type: 'expense', reconcile: false },
    { code: '7000', name: 'Werbekosten', type: 'expense', reconcile: false },
    { code: '7100', name: 'IT-Kosten', type: 'expense', reconcile: false },
    // Abschreibungen
    { code: '7500', name: 'Abschreibungen', type: 'expense', reconcile: false },
    // Zinsen
    { code: '8000', name: 'Zinsaufwendungen', type: 'expense', reconcile: false },
    // Steuern
    { code: '9000', name: 'Steuern', type: 'expense', reconcile: false }
  ],
  taxes: [
    { name: 'German VAT 0%', amount: 0, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'German VAT 7% (Reduced)', amount: 7, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'German VAT 19% (Standard)', amount: 19, amount_type: 'percent', type_tax_use: 'sale' }
  ]
};

export default DE;
