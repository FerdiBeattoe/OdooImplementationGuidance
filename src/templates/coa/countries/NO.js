/**
 * Norway Chart of Accounts Template
 * Based on Odoo's Norwegian chart of accounts
 */

export const NO = {
  code: 'no_k ass',
  country: 'NO',
  name: 'Norway - KASS',
  description: 'Norwegian chart of accounts with MVA/VAT support',
  currency: 'NOK',
  accounts: [
    // Anleggsmidler (Fixed Assets)
    { code: '0100', name: 'Tomter', type: 'asset', reconcile: false },
    { code: '0110', name: 'Bygninger', type: 'asset', reconcile: false },
    { code: '0120', name: 'Maskiner', type: 'asset', reconcile: false },
    { code: '0130', name: 'Inventar', type: 'asset', reconcile: false },
    { code: '0140', name: 'Biler', type: 'asset', reconcile: false },
    { code: '0150', name: 'EDB-utstyr', type: 'asset', reconcile: false },
    { code: '0200', name: 'Goodwill', type: 'asset', reconcile: false },
    { code: '0210', name: 'Patenter', type: 'asset', reconcile: false },
    { code: '0220', name: 'Lisenser', type: 'asset', reconcile: false },
    // Omløpsmidre (Current Assets)
    { code: '1500', name: 'Kundefordringer', type: 'receivable', reconcile: true },
    { code: '1510', name: 'Kundefordringer usikre', type: 'receivable', reconcile: true },
    { code: '1520', name: 'Veksler', type: 'receivable', reconcile: true },
    { code: '1530', name: 'Mva-krav', type: 'receivable', reconcile: false },
    { code: '1900', name: 'Bank', type: 'bank', reconcile: true },
    { code: '1910', name: 'Kasse', type: 'bank', reconcile: true },
    { code: '1920', name: 'Postgiro', type: 'bank', reconcile: true },
    // Eigenkapital (Equity)
    { code: '2000', name: 'Aksjekapital', type: 'equity', reconcile: false },
    { code: '2050', name: 'Overkursfond', type: 'equity', reconcile: false },
    { code: '2100', name: 'Andre fond', type: 'equity', reconcile: false },
    { code: '2200', name: 'Årsresultat', type: 'equity', reconcile: false },
    // Gjeld (Liabilities)
    { code: '2400', name: 'Leverandørgjeld', type: 'payable', reconcile: true },
    { code: '2410', name: 'Leverandørgjeld usikre', type: 'payable', reconcile: true },
    { code: '2500', name: 'Mva-gjeld', type: 'liability', reconcile: false },
    { code: '2600', name: 'Skatt trekk', type: 'liability', reconcile: false },
    { code: '2700', name: 'Arbeidsgiveravgift', type: 'liability', reconcile: false },
    { code: '2800', name: 'Forskuddsstrekk', type: 'liability', reconcile: false },
    { code: '2900', name: 'Påløpte kostnader', type: 'liability', reconcile: false },
    // Driftsinntekter (Revenue)
    { code: '3000', name: 'Salg', type: 'revenue', reconcile: false },
    { code: '3100', name: 'Tjenestelønnsinntekter', type: 'revenue', reconcile: false },
    { code: '3900', name: 'Andre driftsinntekter', type: 'revenue', reconcile: false },
    // Varekjøp
    { code: '4000', name: 'Varekjøp', type: 'expense', reconcile: false },
    { code: '4100', name: 'Direkte materialer', type: 'expense', reconcile: false },
    // Driftskostnader
    { code: '4300', name: 'Lønn', type: 'expense', reconcile: false },
    { code: '4400', name: 'Arbeidsgiveravgift', type: 'expense', reconcile: false },
    { code: '4500', name: 'Pensjonskostnader', type: 'expense', reconcile: false },
    { code: '5000', name: 'Husleie', type: 'expense', reconcile: false },
    { code: '5100', name: 'Strøm', type: 'expense', reconcile: false },
    { code: '5200', name: 'Forsikring', type: 'expense', reconcile: false },
    { code: '5300', name: 'Reiser og diett', type: 'expense', reconcile: false },
    { code: '5400', name: 'Kontorrekvisita', type: 'expense', reconcile: false },
    { code: '5500', name: 'Telekommunikasjon', type: 'expense', reconcile: false },
    { code: '5600', name: 'Reklamekostnader', type: 'expense', reconcile: false },
    { code: '5700', name: 'Transportkostnader', type: 'expense', reconcile: false },
    { code: '5800', name: 'Verksted og reparasjoner', type: 'expense', reconcile: false },
    { code: '6300', name: 'Avskrivninger', type: 'expense', reconcile: false },
    { code: '6500', name: 'Bank- og finansieringskostnader', type: 'expense', reconcile: false },
    { code: '6600', name: 'Rentekostnader', type: 'expense', reconcile: false },
    { code: '7000', name: 'Mva', type: 'expense', reconcile: false }
  ],
  taxes: [
    { name: 'Norwegian MVA 0%', amount: 0, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Norwegian MVA 15% (Reduced)', amount: 15, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Norwegian MVA 25% (Standard)', amount: 25, amount_type: 'percent', type_tax_use: 'sale' }
  ]
};

export default NO;
