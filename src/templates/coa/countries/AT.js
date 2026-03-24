/**
 * Austria Chart of Accounts Template
 * Based on Odoo's Austrian chart of accounts (UGB)
 */

export const AT = {
  code: 'at_ugb',
  country: 'AT',
  name: 'Austria - UGB',
  description: 'Austrian commercial code chart with USt/VAT support',
  currency: 'EUR',
  accounts: [
    // Anlagevermögen (Fixed Assets)
    { code: '0100', name: 'Grundstücke', type: 'asset', reconcile: false },
    { code: '0200', name: 'Gebäude', type: 'asset', reconcile: false },
    { code: '0300', name: 'Technische Anlagen', type: 'asset', reconcile: false },
    { code: '0400', name: 'Büromaschinen', type: 'asset', reconcile: false },
    { code: '0500', name: 'Kraftfahrzeuge', type: 'asset', reconcile: false },
    { code: '0600', name: 'Betriebs- und Geschäftsausstattung', type: 'asset', reconcile: false },
    { code: '0700', name: 'Immaterielle Anlagewerte', type: 'asset', reconcile: false },
    { code: '0800', name: 'Geleistete Anzahlungen', type: 'asset', reconcile: false },
    { code: '0900', name: 'Abschreibungen', type: 'asset', reconcile: false },
    // Umlaufvermögen (Current Assets)
    { code: '1000', name: 'Kassa', type: 'bank', reconcile: true },
    { code: '1100', name: 'Bank', type: 'bank', reconcile: true },
    { code: '1200', name: 'Schecks', type: 'bank', reconcile: true },
    { code: '2000', name: 'Forderungen aus Lieferungen', type: 'receivable', reconcile: true },
    { code: '2100', name: 'Sonstige Forderungen', type: 'receivable', reconcile: true },
    { code: '2200', name: 'Umsatzsteuer', type: 'receivable', reconcile: false },
    { code: '2300', name: 'Vorsteuer', type: 'receivable', reconcile: false },
    { code: '2500', name: 'Roh-, Hilfs- und Betriebsstoffe', type: 'asset', reconcile: false },
    { code: '2600', name: 'Unfertige Erzeugnisse', type: 'asset', reconcile: false },
    { code: '2700', name: 'Fertige Erzeugnisse', type: 'asset', reconcile: false },
    { code: '2800', name: 'Handelswaren', type: 'asset', reconcile: false },
    // Eigenkapital (Equity)
    { code: '3000', name: 'Stammkapital', type: 'equity', reconcile: false },
    { code: '3100', name: 'Kapitalrücklagen', type: 'equity', reconcile: false },
    { code: '3200', name: 'Gewinnrücklagen', type: 'equity', reconcile: false },
    { code: '3300', name: 'Gewinnvortrag', type: 'equity', reconcile: false },
    { code: '3400', name: 'Jahresüberschuss', type: 'equity', reconcile: false },
    // Rückstellungen
    { code: '3500', name: 'Rückstellungen für Abfindungen', type: 'liability', reconcile: false },
    { code: '3600', name: 'Rückstellungen für Steuern', type: 'liability', reconcile: false },
    { code: '3700', name: 'Sonstige Rückstellungen', type: 'liability', reconcile: false },
    // Verbindlichkeiten (Liabilities)
    { code: '4000', name: 'Verbindlichkeiten aus Lieferungen', type: 'payable', reconcile: true },
    { code: '4100', name: 'Verbindlichkeiten gegenüber Kreditinstituten', type: 'payable', reconcile: false },
    { code: '4200', name: 'Sonstige Verbindlichkeiten', type: 'payable', reconcile: true },
    { code: '4300', name: 'Umsatzsteuer', type: 'liability', reconcile: false },
    { code: '4400', name: 'Lohnsteuer', type: 'liability', reconcile: false },
    { code: '4500', name: 'Dienstgeberbeitrag', type: 'liability', reconcile: false },
    // Erlöse (Revenue)
    { code: '8000', name: 'Umsatzerlöse', type: 'revenue', reconcile: false },
    { code: '8100', name: 'Erlöse aus Dienstleistungen', type: 'revenue', reconcile: false },
    { code: '8200', name: 'Erlöse aus Provisionen', type: 'revenue', reconcile: false },
    { code: '8300', name: 'Sonstige Erlöse', type: 'revenue', reconcile: false },
    { code: '8400', name: 'Zinserträge', type: 'revenue', reconcile: false },
    { code: '8500', name: 'Beteiligungserträge', type: 'revenue', reconcile: false },
    // Materialaufwand
    { code: '4000', name: 'Aufwendungen für Rohstoffe', type: 'expense', reconcile: false },
    { code: '4100', name: 'Aufwendungen für Handelswaren', type: 'expense', reconcile: false },
    // Personalaufwand
    { code: '5000', name: 'Gehälter', type: 'expense', reconcile: false },
    { code: '5100', name: 'Löhne', type: 'expense', reconcile: false },
    { code: '5200', name: 'Sozialversicherungsbeiträge', type: 'expense', reconcile: false },
    { code: '5300', name: 'Abfertigungen', type: 'expense', reconcile: false },
    { code: '5400', name: 'Pensionsbeiträge', type: 'expense', reconcile: false },
    // Betriebliche Aufwendungen
    { code: '6000', name: 'Raumkosten', type: 'expense', reconcile: false },
    { code: '6100', name: 'Energiekosten', type: 'expense', reconcile: false },
    { code: '6200', name: 'Versicherungsprämien', type: 'expense', reconcile: false },
    { code: '6300', name: 'Reinigung', type: 'expense', reconcile: false },
    { code: '6400', name: 'Reisekosten', type: 'expense', reconcile: false },
    { code: '6500', name: 'Büromaterial', type: 'expense', reconcile: false },
    { code: '6600', name: 'Telekommunikation', type: 'expense', reconcile: false },
    { code: '6700', name: 'Werbekosten', type: 'expense', reconcile: false },
    { code: '6800', name: 'Rechts- und Beratungskosten', type: 'expense', reconcile: false },
    { code: '6900', name: 'IT-Kosten', type: 'expense', reconcile: false },
    { code: '7000', name: 'Abschreibungen', type: 'expense', reconcile: false },
    { code: '7100', name: 'Zinsaufwendungen', type: 'expense', reconcile: false },
    { code: '7200', name: 'Steuern', type: 'expense', reconcile: false }
  ],
  taxes: [
    { name: 'Austrian USt 0%', amount: 0, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Austrian USt 7% (Reduced)', amount: 7, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Austrian USt 10% (Reduced)', amount: 10, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Austrian USt 20% (Standard)', amount: 20, amount_type: 'percent', type_tax_use: 'sale' }
  ]
};

export default AT;
