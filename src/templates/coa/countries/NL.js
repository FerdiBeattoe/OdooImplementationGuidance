/**
 * Netherlands Chart of Accounts Template
 * Based on Odoo's Dutch chart of accounts
 */

export const NL = {
  code: 'nl_bw2',
  country: 'NL',
  name: 'Netherlands - BW2',
  description: 'Dutch civil code chart of accounts with BTW support',
  currency: 'EUR',
  accounts: [
    // Vaste activa (Fixed Assets)
    { code: '0100', name: 'Grond', type: 'asset', reconcile: false },
    { code: '0110', name: 'Gebouwen', type: 'asset', reconcile: false },
    { code: '0120', name: 'Machines', type: 'asset', reconcile: false },
    { code: '0130', name: 'Inventaris', type: 'asset', reconcile: false },
    { code: '0140', name: 'Vervoermiddelen', type: 'asset', reconcile: false },
    { code: '0150', name: 'Computerhardware', type: 'asset', reconcile: false },
    { code: '0160', name: 'Immateriële vaste activa', type: 'asset', reconcile: false },
    { code: '0200', name: 'Afschrijvingen', type: 'asset', reconcile: false },
    // Vlottende activa (Current Assets)
    { code: '1000', name: 'Debiteuren', type: 'receivable', reconcile: true },
    { code: '1010', name: 'Debiteuren (vreemde valuta)', type: 'receivable', reconcile: true },
    { code: '1100', name: 'Omzetbelasting', type: 'receivable', reconcile: false },
    { code: '1200', name: 'Vooruitbetaalde kosten', type: 'asset', reconcile: false },
    { code: '1300', name: 'Voorraden', type: 'asset', reconcile: false },
    { code: '1400', name: 'Grondstoffen', type: 'asset', reconcile: false },
    { code: '1500', name: 'Onderhanden werk', type: 'asset', reconcile: false },
    { code: '1600', name: 'Gereed product', type: 'asset', reconcile: false },
    { code: '1700', name: 'Handelsgoederen', type: 'asset', reconcile: false },
    // Liquide middelen (Cash)
    { code: '1900', name: 'Kas', type: 'bank', reconcile: true },
    { code: '1910', name: 'Bank', type: 'bank', reconcile: true },
    { code: '1920', name: 'Postbank', type: 'bank', reconcile: true },
    // Eigen vermogen (Equity)
    { code: '0100', name: 'Aandelenkapitaal', type: 'equity', reconcile: false },
    { code: '0200', name: 'Agioreserve', type: 'equity', reconcile: false },
    { code: '0300', name: 'Herwaarderingsreserve', type: 'equity', reconcile: false },
    { code: '0400', name: 'Wettelijke reserve', type: 'equity', reconcile: false },
    { code: '0500', name: 'Overige reserves', type: 'equity', reconcile: false },
    { code: '0900', name: 'Resultaat boekjaar', type: 'equity', reconcile: false },
    // Voorzieningen (Provisions)
    { code: '2000', name: 'Voorziening voor belastingen', type: 'liability', reconcile: false },
    { code: '2100', name: 'Voorziening voor pensioenen', type: 'liability', reconcile: false },
    { code: '2200', name: 'Overige voorzieningen', type: 'liability', reconcile: false },
    // Schulden (Liabilities)
    { code: '3000', name: 'Crediteuren', type: 'payable', reconcile: true },
    { code: '3100', name: 'Crediteuren (vreemde valuta)', type: 'payable', reconcile: true },
    { code: '3200', name: 'Te betalen btw', type: 'liability', reconcile: false },
    { code: '3300', name: 'Loonheffing', type: 'liability', reconcile: false },
    { code: '3400', name: 'Omzetbelasting', type: 'liability', reconcile: false },
    { code: '3500', name: 'Vooruitontvangen bedragen', type: 'liability', reconcile: false },
    { code: '3600', name: 'Transitorische passiva', type: 'liability', reconcile: false },
    { code: '4000', name: 'Schulden aan kredietinstellingen', type: 'liability', reconcile: false },
    { code: '4100', name: 'Hypotheekleningen', type: 'liability', reconcile: false },
    // Omzet (Revenue)
    { code: '8000', name: 'Omzet', type: 'revenue', reconcile: false },
    { code: '8010', name: 'Opbrengsten diensten', type: 'revenue', reconcile: false },
    { code: '8020', name: 'Huuropbrengsten', type: 'revenue', reconcile: false },
    { code: '8090', name: 'Overige opbrengsten', type: 'revenue', reconcile: false },
    // Kosten bedrijfsuitoefening (Operating Costs)
    { code: '4000', name: 'Kosten van grondstoffen', type: 'expense', reconcile: false },
    { code: '4100', name: 'Kosten van handelsgoederen', type: 'expense', reconcile: false },
    { code: '4200', name: 'Kosten van derden', type: 'expense', reconcile: false },
    { code: '4300', name: 'Lonen en salarissen', type: 'expense', reconcile: false },
    { code: '4400', name: 'Sociale lasten', type: 'expense', reconcile: false },
    { code: '4500', name: 'Afschrijvingen', type: 'expense', reconcile: false },
    { code: '4600', name: 'Huisvestingskosten', type: 'expense', reconcile: false },
    { code: '4700', name: 'Exploitatiekosten', type: 'expense', reconcile: false },
    { code: '4800', name: 'Verkoopkosten', type: 'expense', reconcile: false },
    { code: '4900', name: 'Kantoorkosten', type: 'expense', reconcile: false },
    { code: '5000', name: 'Autokosten', type: 'expense', reconcile: false },
    { code: '5100', name: 'Verzekeringen', type: 'expense', reconcile: false },
    { code: '5200', name: 'Adm. en consultancy', type: 'expense', reconcile: false },
    { code: '5300', name: 'Energiekosten', type: 'expense', reconcile: false },
    { code: '5500', name: 'Financieringskosten', type: 'expense', reconcile: false }
  ],
  taxes: [
    { name: 'Dutch BTW 0%', amount: 0, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Dutch BTW 9% (Reduced)', amount: 9, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Dutch BTW 21% (Standard)', amount: 21, amount_type: 'percent', type_tax_use: 'sale' }
  ]
};

export default NL;
