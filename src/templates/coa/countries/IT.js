/**
 * Italy Chart of Accounts Template
 * Based on Odoo's Italian piano dei conti
 */

export const IT = {
  code: 'it_pdc',
  country: 'IT',
  name: 'Italy - Piano dei Conti',
  description: 'Italian accounting plan with IVA support',
  currency: 'EUR',
  accounts: [
    // Immobilizzazioni (Fixed Assets)
    { code: '1001', name: 'Costi di impianto e ampliamento', type: 'asset', reconcile: false },
    { code: '1002', name: 'Costi di ricerca e sviluppo', type: 'asset', reconcile: false },
    { code: '1003', name: 'Diritti di brevetto industriale', type: 'asset', reconcile: false },
    { code: '1004', name: 'Concessioni e licenze', type: 'asset', reconcile: false },
    { code: '1005', name: 'Avviamento', type: 'asset', reconcile: false },
    { code: '1010', name: 'Terreni e fabbricati', type: 'asset', reconcile: false },
    { code: '1020', name: 'Impianti e macchinari', type: 'asset', reconcile: false },
    { code: '1030', name: 'Attrezzature industriali', type: 'asset', reconcile: false },
    { code: '1040', name: 'Mobili e macchine d\'ufficio', type: 'asset', reconcile: false },
    { code: '1050', name: 'Automezzi', type: 'asset', reconcile: false },
    { code: '1060', name: 'Altre immobilizzazioni', type: 'asset', reconcile: false },
    // Attivo circolante (Current Assets)
    { code: '1100', name: 'Materie prime', type: 'asset', reconcile: false },
    { code: '1110', name: 'Semilavorati', type: 'asset', reconcile: false },
    { code: '1120', name: 'Prodotti in corso di lavorazione', type: 'asset', reconcile: false },
    { code: '1130', name: 'Prodotti finiti', type: 'asset', reconcile: false },
    { code: '1140', name: 'Merci', type: 'asset', reconcile: false },
    { code: '1200', name: 'Clienti', type: 'receivable', reconcile: true },
    { code: '1210', name: 'Clienti effetti attivi', type: 'receivable', reconcile: true },
    { code: '1220', name: 'Crediti vs. imprese controllate', type: 'receivable', reconcile: true },
    { code: '1230', name: 'Crediti vs. imprese collegate', type: 'receivable', reconcile: true },
    { code: '1250', name: 'Crediti tributari', type: 'receivable', reconcile: false },
    { code: '1260', name: 'Crediti vs. altri', type: 'receivable', reconcile: true },
    { code: '1300', name: 'Denaro in cassa', type: 'bank', reconcile: true },
    { code: '1310', name: 'Banche c/c attivi', type: 'bank', reconcile: true },
    { code: '1320', name: 'Banche c/c vincolati', type: 'bank', reconcile: true },
    // Patrimonio netto (Equity)
    { code: '2000', name: 'Capitale sociale', type: 'equity', reconcile: false },
    { code: '2010', name: 'Riserva da sovrapprezzo azioni', type: 'equity', reconcile: false },
    { code: '2020', name: 'Riserva legale', type: 'equity', reconcile: false },
    { code: '2030', name: 'Riserve statutarie', type: 'equity', reconcile: false },
    { code: '2040', name: 'Altre riserve', type: 'equity', reconcile: false },
    { code: '2100', name: 'Utili (perdite) portati a nuovo', type: 'equity', reconcile: false },
    { code: '2200', name: 'Utile (perdita) dell\'esercizio', type: 'equity', reconcile: false },
    // Fondi e debiti (Liabilities)
    { code: '3000', name: 'Fondo trattamento di quiescenza', type: 'liability', reconcile: false },
    { code: '3010', name: 'Fondo imposte', type: 'liability', reconcile: false },
    { code: '3020', name: 'Fondo garanzia prodotti', type: 'liability', reconcile: false },
    { code: '3100', name: 'Fornitori', type: 'payable', reconcile: true },
    { code: '3110', name: 'Fornitori effetti passivi', type: 'payable', reconcile: true },
    { code: '3200', name: 'Debiti vs. banche', type: 'payable', reconcile: false },
    { code: '3300', name: 'Debiti vs. altri finanziatori', type: 'payable', reconcile: false },
    { code: '3400', name: 'Debiti tributari', type: 'liability', reconcile: false },
    { code: '3500', name: 'Debiti vs. istituti di previdenza', type: 'liability', reconcile: false },
    { code: '3600', name: 'Ratei e riscontri passivi', type: 'liability', reconcile: false },
    // Ricavi (Revenue)
    { code: '4000', name: 'Ricavi da vendite', type: 'revenue', reconcile: false },
    { code: '4010', name: 'Ricavi da prestazioni di servizi', type: 'revenue', reconcile: false },
    { code: '4020', name: 'Variazione rimanenze prodotti', type: 'revenue', reconcile: false },
    { code: '4030', name: 'Variazione lavori in corso', type: 'revenue', reconcile: false },
    { code: '4100', name: 'Altri ricavi e proventi', type: 'revenue', reconcile: false },
    // Costi (Expenses)
    { code: '5000', name: 'Acquisti materie prime', type: 'expense', reconcile: false },
    { code: '5010', name: 'Acquisti merci', type: 'expense', reconcile: false },
    { code: '5020', name: 'Acquisti di servizi', type: 'expense', reconcile: false },
    { code: '5100', name: 'Costi per godimento beni di terzi', type: 'expense', reconcile: false },
    { code: '5200', name: 'Costi per il personale', type: 'expense', reconcile: false },
    { code: '5300', name: 'Ammortamenti e svalutazioni', type: 'expense', reconcile: false },
    { code: '5400', name: 'Accantonamenti per rischi', type: 'expense', reconcile: false },
    { code: '5500', name: 'Oneri diversi di gestione', type: 'expense', reconcile: false },
    { code: '6000', name: 'Costi per servizi', type: 'expense', reconcile: false },
    { code: '6100', name: 'Costi per il godimento beni di terzi', type: 'expense', reconcile: false },
    { code: '6200', name: 'Costi per il personale', type: 'expense', reconcile: false },
    { code: '6300', name: 'Svalutazioni crediti', type: 'expense', reconcile: false },
    { code: '6400', name: 'Accantonamenti', type: 'expense', reconcile: false },
    { code: '6500', name: 'Oneri diversi di gestione', type: 'expense', reconcile: false },
    { code: '6600', name: 'Interessi passivi', type: 'expense', reconcile: false },
    { code: '6700', name: 'Svalutazioni immobilizzazioni', type: 'expense', reconcile: false },
    { code: '6800', name: 'Ammortamenti', type: 'expense', reconcile: false },
    { code: '6900', name: 'Imposte sul reddito', type: 'expense', reconcile: false }
  ],
  taxes: [
    { name: 'Italian IVA 0%', amount: 0, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Italian IVA 4% (Super-reduced)', amount: 4, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Italian IVA 10% (Reduced)', amount: 10, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Italian IVA 22% (Standard)', amount: 22, amount_type: 'percent', type_tax_use: 'sale' }
  ]
};

export default IT;
