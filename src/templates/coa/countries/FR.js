/**
 * France Chart of Accounts Template
 * Based on Odoo's French PCG (Plan Comptable Général)
 */

export const FR = {
  code: 'fr_pcg',
  country: 'FR',
  name: 'France - PCG',
  description: 'French general accounting plan with TVA support',
  currency: 'EUR',
  accounts: [
    // Immobilisations (Fixed Assets)
    { code: '2010', name: 'Frais d\'établissement', type: 'asset', reconcile: false },
    { code: '2030', name: 'Frais de recherche et développement', type: 'asset', reconcile: false },
    { code: '2050', name: 'Concessions et brevets', type: 'asset', reconcile: false },
    { code: '2070', name: 'Fonds commercial', type: 'asset', reconcile: false },
    { code: '2110', name: 'Terrains', type: 'asset', reconcile: false },
    { code: '2130', name: 'Constructions', type: 'asset', reconcile: false },
    { code: '2150', name: 'Installations techniques', type: 'asset', reconcile: false },
    { code: '2180', name: 'Autres immobilisations corporelles', type: 'asset', reconcile: false },
    { code: '2800', name: 'Amortissements', type: 'asset', reconcile: false },
    // Stocks et créances (Current Assets)
    { code: '3100', name: 'Matières premières', type: 'asset', reconcile: false },
    { code: '3200', name: 'En-cours de production', type: 'asset', reconcile: false },
    { code: '3300', name: 'Produits', type: 'asset', reconcile: false },
    { code: '3500', name: 'Marchandises', type: 'asset', reconcile: false },
    { code: '4100', name: 'Clients', type: 'receivable', reconcile: true },
    { code: '4160', name: 'Clients douteux', type: 'receivable', reconcile: true },
    { code: '4300', name: 'Créances clients', type: 'receivable', reconcile: true },
    { code: '4500', name: 'Autres créances', type: 'receivable', reconcile: true },
    { code: '4800', name: 'Charges constatées d\'avance', type: 'asset', reconcile: false },
    // Disponibilités (Cash)
    { code: '5120', name: 'Banque', type: 'bank', reconcile: true },
    { code: '5140', name: 'Caisse', type: 'bank', reconcile: true },
    { code: '5300', name: 'Caisse espèces', type: 'bank', reconcile: true },
    // Capitaux propres (Equity)
    { code: '1010', name: 'Capital social', type: 'equity', reconcile: false },
    { code: '1050', name: 'Écarts de réévaluation', type: 'equity', reconcile: false },
    { code: '1060', name: 'Réserves', type: 'equity', reconcile: false },
    { code: '1100', name: 'Report à nouveau', type: 'equity', reconcile: false },
    { code: '1200', name: 'Résultat de l\'exercice', type: 'equity', reconcile: false },
    // Provisions
    { code: '1500', name: 'Provisions pour risques', type: 'liability', reconcile: false },
    { code: '1510', name: 'Provisions pour charges', type: 'liability', reconcile: false },
    // Dettes (Liabilities)
    { code: '4010', name: 'Fournisseurs', type: 'payable', reconcile: true },
    { code: '4040', name: 'Fournisseurs - Factures non parvenues', type: 'payable', reconcile: true },
    { code: '4100', name: 'Clients - Acomptes', type: 'payable', reconcile: false },
    { code: '4200', name: 'Personnel', type: 'liability', reconcile: false },
    { code: '4300', name: 'Organismes sociaux', type: 'liability', reconcile: false },
    { code: '4400', name: 'État - TVA à payer', type: 'liability', reconcile: false },
    { code: '4450', name: 'État - TVA à décaisser', type: 'liability', reconcile: false },
    { code: '4500', name: 'Impôts sur les bénéfices', type: 'liability', reconcile: false },
    { code: '4600', name: 'Autres dettes', type: 'payable', reconcile: true },
    { code: '4700', name: 'Produits constatés d\'avance', type: 'liability', reconcile: false },
    // Chiffre d'affaires (Revenue)
    { code: '7010', name: 'Ventes de produits finis', type: 'revenue', reconcile: false },
    { code: '7060', name: 'Prestations de services', type: 'revenue', reconcile: false },
    { code: '7070', name: 'Ventes de marchandises', type: 'revenue', reconcile: false },
    { code: '7090', name: 'Rabais, remises et ristournes', type: 'revenue', reconcile: false },
    // Achats
    { code: '6010', name: 'Achats de matières premières', type: 'expense', reconcile: false },
    { code: '6060', name: 'Achats non stockés', type: 'expense', reconcile: false },
    { code: '6070', name: 'Achats de marchandises', type: 'expense', reconcile: false },
    // Charges
    { code: '6200', name: 'Services extérieurs', type: 'expense', reconcile: false },
    { code: '6300', name: 'Impôts et taxes', type: 'expense', reconcile: false },
    { code: '6400', name: 'Charges de personnel', type: 'expense', reconcile: false },
    { code: '6500', name: 'Autres charges de gestion', type: 'expense', reconcile: false },
    { code: '6600', name: 'Charges financières', type: 'expense', reconcile: false },
    { code: '6700', name: 'Charges exceptionnelles', type: 'expense', reconcile: false },
    { code: '6800', name: 'Dotations aux amortissements', type: 'expense', reconcile: false },
    { code: '6950', name: 'Impôts sur les bénéfices', type: 'expense', reconcile: false },
    // Subventions
    { code: '7400', name: 'Subventions d\'exploitation', type: 'revenue', reconcile: false },
    { code: '7600', name: 'Produits financiers', type: 'revenue', reconcile: false },
    { code: '7700', name: 'Produits exceptionnels', type: 'revenue', reconcile: false }
  ],
  taxes: [
    { name: 'French VAT 0%', amount: 0, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'French TVA 5.5% (Reduced)', amount: 5.5, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'French TVA 10% (Intermediate)', amount: 10, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'French TVA 20% (Standard)', amount: 20, amount_type: 'percent', type_tax_use: 'sale' }
  ]
};

export default FR;
