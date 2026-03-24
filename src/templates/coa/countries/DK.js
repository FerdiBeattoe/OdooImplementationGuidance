/**
 * Denmark Chart of Accounts Template
 * Based on Odoo's Danish chart of accounts
 */

export const DK = {
  code: 'dk_std',
  country: 'DK',
  name: 'Denmark - Standard',
  description: 'Danish standard chart of accounts with Moms/VAT support',
  currency: 'DKK',
  accounts: [
    // Anlægsaktiver (Fixed Assets)
    { code: '1010', name: 'Grunde', type: 'asset', reconcile: false },
    { code: '1020', name: 'Bygninger', type: 'asset', reconcile: false },
    { code: '1030', name: 'Produktionsanlæg', type: 'asset', reconcile: false },
    { code: '1040', name: 'Inventar', type: 'asset', reconcile: false },
    { code: '1050', name: 'Biler', type: 'asset', reconcile: false },
    { code: '1060', name: 'EDB-udstyr', type: 'asset', reconcile: false },
    { code: '1070', name: 'Goodwill', type: 'asset', reconcile: false },
    { code: '1080', name: 'Patenter', type: 'asset', reconcile: false },
    // Tilgodehavender (Current Assets)
    { code: '1100', name: 'Tilgodehavender', type: 'receivable', reconcile: true },
    { code: '1110', name: 'Tilgodehavender fra salg', type: 'receivable', reconcile: true },
    { code: '1120', name: 'Usikre tilgodehavender', type: 'receivable', reconcile: true },
    { code: '1130', name: 'Moms tilgodehavende', type: 'receivable', reconcile: false },
    { code: '1140', name: 'Skyldig moms', type: 'liability', reconcile: false },
    { code: '1200', name: 'Varebeholdning', type: 'asset', reconcile: false },
    { code: '1210', name: 'Råvarer', type: 'asset', reconcile: false },
    { code: '1220', name: 'Varer under fremstilling', type: 'asset', reconcile: false },
    { code: '1230', name: 'Færdigvarer', type: 'asset', reconcile: false },
    { code: '1300', name: 'Periodeafgrænsninger', type: 'asset', reconcile: false },
    // Kasse og bank (Cash)
    { code: '1510', name: 'Kasse', type: 'bank', reconcile: true },
    { code: '1520', name: 'Bank', type: 'bank', reconcile: true },
    { code: '1530', name: 'Giro', type: 'bank', reconcile: true },
    // Egenkapital (Equity)
    { code: '2000', name: 'Selskabskapital', type: 'equity', reconcile: false },
    { code: '2100', name: 'Overkurs ved emission', type: 'equity', reconcile: false },
    { code: '2200', name: 'Reserver', type: 'equity', reconcile: false },
    { code: '2300', name: 'Overført resultat', type: 'equity', reconcile: false },
    { code: '2400', name: 'Årets resultat', type: 'equity', reconcile: false },
    // Hensatte forpligtelser
    { code: '2600', name: 'Hensættelse til pension', type: 'liability', reconcile: false },
    { code: '2700', name: 'Hensættelse til skat', type: 'liability', reconcile: false },
    // Gældsforpligtelser (Liabilities)
    { code: '3000', name: 'Leverandører', type: 'payable', reconcile: true },
    { code: '3010', name: 'Skyldig løn', type: 'payable', reconcile: false },
    { code: '3020', name: 'Skyldige feriepenge', type: 'liability', reconcile: false },
    { code: '3100', name: 'AM-bidrag', type: 'liability', reconcile: false },
    { code: '3110', name: 'A-skat', type: 'liability', reconcile: false },
    { code: '3120', name: 'Moms', type: 'liability', reconcile: false },
    { code: '3200', name: 'Skyldig selskabsskat', type: 'liability', reconcile: false },
    { code: '3300', name: 'Anden gæld', type: 'payable', reconcile: true },
    { code: '3400', name: 'Periodeafgrænsninger', type: 'liability', reconcile: false },
    { code: '3500', name: 'Kortfristet gæld', type: 'liability', reconcile: false },
    { code: '3600', name: 'Langfristet gæld', type: 'liability', reconcile: false },
    // Salg (Revenue)
    { code: '4000', name: 'Salg', type: 'revenue', reconcile: false },
    { code: '4010', name: 'Salg af varer', type: 'revenue', reconcile: false },
    { code: '4020', name: 'Salg af tjenesteydelser', type: 'revenue', reconcile: false },
    { code: '4100', name: 'Salg momspligtigt', type: 'revenue', reconcile: false },
    { code: '4900', name: 'Andre driftsindtægter', type: 'revenue', reconcile: false },
    // Vareforbrug
    { code: '5000', name: 'Varekøb', type: 'expense', reconcile: false },
    { code: '5100', name: 'Råvarer', type: 'expense', reconcile: false },
    { code: '5200', name: 'Hjælpematerialer', type: 'expense', reconcile: false },
    // Omkostninger
    { code: '6000', name: 'Lønninger', type: 'expense', reconcile: false },
    { code: '6100', name: 'Ferieløn', type: 'expense', reconcile: false },
    { code: '6200', name: 'Pensionsbidrag', type: 'expense', reconcile: false },
    { code: '6300', name: 'Arbejdsgiverbidrag', type: 'expense', reconcile: false },
    { code: '6400', name: 'Husleje', type: 'expense', reconcile: false },
    { code: '6500', name: 'El, varme, vand', type: 'expense', reconcile: false },
    { code: '6600', name: 'Kontorartikler', type: 'expense', reconcile: false },
    { code: '6700', name: 'Telekommunikation', type: 'expense', reconcile: false },
    { code: '6800', name: 'Rejse og transport', type: 'expense', reconcile: false },
    { code: '6900', name: 'Markedsføring', type: 'expense', reconcile: false },
    { code: '7000', name: 'Vedligeholdelse', type: 'expense', reconcile: false },
    { code: '7100', name: 'Forsikringer', type: 'expense', reconcile: false },
    { code: '7200', name: 'Bankgebyrer', type: 'expense', reconcile: false },
    { code: '7300', name: 'Renteudgifter', type: 'expense', reconcile: false },
    { code: '7400', name: 'Afskrivninger', type: 'expense', reconcile: false },
    { code: '7500', name: 'Moms', type: 'expense', reconcile: false }
  ],
  taxes: [
    { name: 'Danish Moms 0%', amount: 0, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Danish Moms 25% (Standard)', amount: 25, amount_type: 'percent', type_tax_use: 'sale' }
  ]
};

export default DK;
