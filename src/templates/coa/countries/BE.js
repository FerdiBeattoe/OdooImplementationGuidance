/**
 * Belgium Chart of Accounts Template
 * Based on Odoo's Belgian minimum chart of accounts
 */

export const BE = {
  code: 'be_min',
  country: 'BE',
  name: 'Belgium - Minimum Chart',
  description: 'Belgian minimum chart of accounts with BTW/VAT support',
  currency: 'EUR',
  accounts: [
    // Immobilisations (Fixed Assets)
    { code: '2000', name: 'Frais de constitution', type: 'asset', reconcile: false },
    { code: '2010', name: 'Frais de recherche', type: 'asset', reconcile: false },
    { code: '2030', name: 'Brevets et licences', type: 'asset', reconcile: false },
    { code: '2040', name: 'Fonds de commerce', type: 'asset', reconcile: false },
    { code: '2100', name: 'Terrains', type: 'asset', reconcile: false },
    { code: '2110', name: 'Constructions', type: 'asset', reconcile: false },
    { code: '2200', name: 'Machines', type: 'asset', reconcile: false },
    { code: '2300', name: 'Mobilier', type: 'asset', reconcile: false },
    { code: '2400', name: 'Véhicules', type: 'asset', reconcile: false },
    { code: '2500', name: 'Ordinateurs', type: 'asset', reconcile: false },
    { code: '2800', name: 'Amortissements actés', type: 'asset', reconcile: false },
    // Créances (Current Assets)
    { code: '4000', name: 'Clients', type: 'receivable', reconcile: true },
    { code: '4010', name: 'Clients effets à recevoir', type: 'receivable', reconcile: true },
    { code: '4060', name: 'Clients douteux', type: 'receivable', reconcile: true },
    { code: '4090', name: 'Rémunérations dues', type: 'receivable', reconcile: false },
    { code: '4160', name: 'TVA à récupérer', type: 'receivable', reconcile: false },
    { code: '4200', name: 'Administrations publiques', type: 'receivable', reconcile: false },
    { code: '4300', name: 'Autres créances', type: 'receivable', reconcile: true },
    { code: '4400', name: 'Stocks', type: 'asset', reconcile: false },
    // Trésorerie (Cash)
    { code: '5500', name: 'Banque', type: 'bank', reconcile: true },
    { code: '5700', name: 'Caisse', type: 'bank', reconcile: true },
    // Capitaux propres (Equity)
    { code: '1000', name: 'Capital souscrit', type: 'equity', reconcile: false },
    { code: '1300', name: 'Réserve légale', type: 'equity', reconcile: false },
    { code: '1310', name: 'Réserves indisponibles', type: 'equity', reconcile: false },
    { code: '1320', name: 'Réserves disponibles', type: 'equity', reconcile: false },
    { code: '1400', name: 'Bénéfice reporté', type: 'equity', reconcile: false },
    { code: '1500', name: 'Perte reportée', type: 'equity', reconcile: false },
    // Provisions
    { code: '1600', name: 'Provisions pour risques et charges', type: 'liability', reconcile: false },
    // Dettes (Liabilities)
    { code: '4400', name: 'Fournisseurs', type: 'payable', reconcile: true },
    { code: '4410', name: 'Fournisseurs effets à payer', type: 'payable', reconcile: true },
    { code: '4420', name: 'Fournisseurs - Factures non parvenues', type: 'payable', reconcile: true },
    { code: '4500', name: 'Dettes fiscales', type: 'liability', reconcile: false },
    { code: '4510', name: 'TVA à payer', type: 'liability', reconcile: false },
    { code: '4520', name: 'Impôts sur le résultat', type: 'liability', reconcile: false },
    { code: '4600', name: 'Dettes sociales', type: 'liability', reconcile: false },
    { code: '4700', name: 'Autres dettes', type: 'payable', reconcile: true },
    { code: '4900', name: 'Charges à imputer', type: 'liability', reconcile: false },
    { code: '4920', name: 'Produits Estimés', type: 'liability', reconcile: false },
    { code: '5500', name: 'Emprunts auprès des établissements de crédit', type: 'liability', reconcile: false },
    // Ventes (Revenue)
    { code: '7000', name: 'Ventes de marchandises', type: 'revenue', reconcile: false },
    { code: '7010', name: 'Ventes de produits finis', type: 'revenue', reconcile: false },
    { code: '7020', name: 'Prestations de services', type: 'revenue', reconcile: false },
    { code: '7090', name: 'Rabais, remises et ristournes', type: 'revenue', reconcile: false },
    // Achats
    { code: '6000', name: 'Achats de marchandises', type: 'expense', reconcile: false },
    { code: '6010', name: 'Achats de matières premières', type: 'expense', reconcile: false },
    { code: '6040', name: 'Achats de services', type: 'expense', reconcile: false },
    { code: '6080', name: 'Rémunérations des tiers', type: 'expense', reconcile: false },
    { code: '6090', name: 'Rabais, remises et ristournes', type: 'expense', reconcile: false },
    // Charges
    { code: '6100', name: 'Services extérieurs', type: 'expense', reconcile: false },
    { code: '6200', name: 'Rémunérations', type: 'expense', reconcile: false },
    { code: '6210', name: 'Charges sociales', type: 'expense', reconcile: false },
    { code: '6300', name: 'Amortissements', type: 'expense', reconcile: false },
    { code: '6400', name: 'Réductions de valeur', type: 'expense', reconcile: false },
    { code: '6500', name: 'Provisions pour risques et charges', type: 'expense', reconcile: false },
    { code: '6600', name: 'Charges financières', type: 'expense', reconcile: false },
    { code: '6700', name: 'Charges exceptionelles', type: 'expense', reconcile: false },
    { code: '6800', name: 'Impôts et taxes', type: 'expense', reconcile: false },
    // Produits
    { code: '7200', name: 'Variation des stocks', type: 'revenue', reconcile: false },
    { code: '7400', name: 'Subventions', type: 'revenue', reconcile: false },
    { code: '7500', name: 'Produits financiers', type: 'revenue', reconcile: false },
    { code: '7600', name: 'Produits exceptionnels', type: 'revenue', reconcile: false }
  ],
  taxes: [
    { name: 'Belgian VAT 0%', amount: 0, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Belgian VAT 6% (Reduced)', amount: 6, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Belgian VAT 12% (Intermediate)', amount: 12, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Belgian VAT 21% (Standard)', amount: 21, amount_type: 'percent', type_tax_use: 'sale' }
  ]
};

export default BE;
