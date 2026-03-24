/**
 * Finland Chart of Accounts Template
 * Based on Odoo's Finnish chart of accounts
 */

export const FI = {
  code: 'fi_tili',
  country: 'FI',
  name: 'Finland - Tili',
  description: 'Finnish chart of accounts with ALV/VAT support',
  currency: 'EUR',
  accounts: [
    // Käyttöomaisuus (Fixed Assets)
    { code: '1000', name: 'Maa-alueet', type: 'asset', reconcile: false },
    { code: '1010', name: 'Rakennukset', type: 'asset', reconcile: false },
    { code: '1020', name: 'Koneet ja kalusto', type: 'asset', reconcile: false },
    { code: '1030', name: 'Ajoneuvot', type: 'asset', reconcile: false },
    { code: '1040', name: 'Tietokoneet', type: 'asset', reconcile: false },
    { code: '1050', name: 'Aineettomat oikeudet', type: 'asset', reconcile: false },
    { code: '1060', name: 'Liikearvo', type: 'asset', reconcile: false },
    { code: '1100', name: 'Poistot', type: 'asset', reconcile: false },
    // Vaihto-omaisuus (Current Assets)
    { code: '1200', name: 'Myyntisaamiset', type: 'receivable', reconcile: true },
    { code: '1210', name: 'Epävarmat saamiset', type: 'receivable', reconcile: true },
    { code: '1220', name: 'Siirtosaamiset', type: 'receivable', reconcile: false },
    { code: '1300', name: 'Varastot', type: 'asset', reconcile: false },
    { code: '1310', name: 'Raa\'at-aineet', type: 'asset', reconcile: false },
    { code: '1320', name: 'Keskeneräiset tuotteet', type: 'asset', reconcile: false },
    { code: '1330', name: 'Valmiit tuotteet', type: 'asset', reconcile: false },
    { code: '1400', name: 'Ostovelat', type: 'payable', reconcile: true },
    // Rahat (Cash)
    { code: '1500', name: 'Kassa', type: 'bank', reconcile: true },
    { code: '1510', name: 'Pankkitilit', type: 'bank', reconcile: true },
    { code: '1520', name: 'Shekkitilit', type: 'bank', reconcile: true },
    // Oma pääoma (Equity)
    { code: '2000', name: 'Osakepääoma', type: 'equity', reconcile: false },
    { code: '2010', name: 'Ylikurssi', type: 'equity', reconcile: false },
    { code: '2020', name: 'Vararahasto', type: 'equity', reconcile: false },
    { code: '2100', name: 'Edellisten tilikausien voitto', type: 'equity', reconcile: false },
    { code: '2200', name: 'Tilikauden tulos', type: 'equity', reconcile: false },
    // Velat (Liabilities)
    { code: '2500', name: 'Lainat', type: 'liability', reconcile: false },
    { code: '2600', name: 'Eläkevastuut', type: 'liability', reconcile: false },
    { code: '2700', name: 'Veronvelat', type: 'liability', reconcile: false },
    { code: '2800', name: 'ALV-velat', type: 'liability', reconcile: false },
    { code: '2900', name: 'Muut velat', type: 'payable', reconcile: true },
    // Liikevaihto (Revenue)
    { code: '3000', name: 'Myyntituotot', type: 'revenue', reconcile: false },
    { code: '3010', name: 'Palvelutuotot', type: 'revenue', reconcile: false },
    { code: '3020', name: 'Vuokratuotot', type: 'revenue', reconcile: false },
    { code: '3100', name: 'Korkotuotot', type: 'revenue', reconcile: false },
    // Kulut (Expenses)
    { code: '4000', name: 'Aineostot', type: 'expense', reconcile: false },
    { code: '4010', name: 'Raaka-aineet', type: 'expense', reconcile: false },
    { code: '4100', name: 'Henkilöstökulut', type: 'expense', reconcile: false },
    { code: '4200', name: 'Palkat', type: 'expense', reconcile: false },
    { code: '4300', name: 'Sosiaalikulut', type: 'expense', reconcile: false },
    { code: '4400', name: 'Vuokrakulut', type: 'expense', reconcile: false },
    { code: '4500', name: 'Sähkö ja lämpö', type: 'expense', reconcile: false },
    { code: '4600', name: 'Vakuutukset', type: 'expense', reconcile: false },
    { code: '4700', name: 'Matkakulut', type: 'expense', reconcile: false },
    { code: '4800', name: 'Toimistokulut', type: 'expense', reconcile: false },
    { code: '4900', name: 'Puhelin ja tietoliikenne', type: 'expense', reconcile: false },
    { code: '5000', name: 'Markkinointikulut', type: 'expense', reconcile: false },
    { code: '5100', name: 'Korjaus ja huolto', type: 'expense', reconcile: false },
    { code: '5200', name: 'Konsulttipalvelut', type: 'expense', reconcile: false },
    { code: '5300', name: 'Hallintokulut', type: 'expense', reconcile: false },
    { code: '5400', name: 'Poistot', type: 'expense', reconcile: false },
    { code: '5500', name: 'Rahoituskulut', type: 'expense', reconcile: false },
    { code: '5600', name: 'Verot', type: 'expense', reconcile: false }
  ],
  taxes: [
    { name: 'Finnish ALV 0%', amount: 0, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Finnish ALV 10% (Reduced)', amount: 10, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Finnish ALV 14% (Reduced)', amount: 14, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Finnish ALV 24% (Standard)', amount: 24, amount_type: 'percent', type_tax_use: 'sale' }
  ]
};

export default FI;
