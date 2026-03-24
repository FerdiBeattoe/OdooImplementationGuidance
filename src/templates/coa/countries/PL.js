/**
 * Poland Chart of Accounts Template
 * Based on Odoo's Polish chart of accounts
 */

export const PL = {
  code: 'pl_pkoi',
  country: 'PL',
  name: 'Poland - PKOI',
  description: 'Polish accounting plan with VAT support',
  currency: 'PLN',
  accounts: [
    // Aktywa trwałe (Fixed Assets)
    { code: '010', name: 'Środki trwałe', type: 'asset', reconcile: false },
    { code: '011', name: 'Grunty', type: 'asset', reconcile: false },
    { code: '012', name: 'Budynki', type: 'asset', reconcile: false },
    { code: '013', name: 'Maszyny i urządzenia', type: 'asset', reconcile: false },
    { code: '014', name: 'Środki transportu', type: 'asset', reconcile: false },
    { code: '020', name: 'Wartości niematerialne i prawne', type: 'asset', reconcile: false },
    { code: '030', name: 'Długoterminowe należności', type: 'asset', reconcile: false },
    { code: '071', name: 'Odpisy umorzeniowe', type: 'asset', reconcile: false },
    // Aktywa obrotowe (Current Assets)
    { code: '100', name: 'Kasa', type: 'bank', reconcile: true },
    { code: '101', name: 'Rachunki bankowe', type: 'bank', reconcile: true },
    { code: '130', name: 'Rozrachunki z odbiorcami', type: 'receivable', reconcile: true },
    { code: '131', name: 'Weksle obce', type: 'receivable', reconcile: true },
    { code: '140', name: 'Rozrachunki z dostawcami', type: 'payable', reconcile: true },
    { code: '150', name: 'Ubezpieczenia społeczne', type: 'liability', reconcile: false },
    { code: '160', name: 'Rozrachunki z Urzędem Skarbowym', type: 'liability', reconcile: false },
    { code: '200', name: 'Rozliczenia międzyokresowe', type: 'asset', reconcile: false },
    { code: '300', name: 'Materiały', type: 'asset', reconcile: false },
    { code: '330', name: 'Produkcja w toku', type: 'asset', reconcile: false },
    { code: '340', name: 'Wyroby gotowe', type: 'asset', reconcile: false },
    { code: '350', name: 'Towary', type: 'asset', reconcile: false },
    // Kapitał własny (Equity)
    { code: '0100', name: 'Kapitał zakładowy', type: 'equity', reconcile: false },
    { code: '0200', name: 'Kapitał zapasowy', type: 'equity', reconcile: false },
    { code: '0300', name: 'Kapitał rezerwowy', type: 'equity', reconcile: false },
    { code: '0400', name: 'Niepodzielony wynik finansowy', type: 'equity', reconcile: false },
    { code: '0500', name: 'Wynik finansowy roku bieżącego', type: 'equity', reconcile: false },
    // Rezerwy i rozliczenia międzyokresowe
    { code: '800', name: 'Rezerwy na zobowiązania', type: 'liability', reconcile: false },
    { code: '840', name: 'Rozliczenia międzyokresowe bierne', type: 'liability', reconcile: false },
    // Zobowiązania (Liabilities)
    { code: '200', name: 'Zobowiązania długoterminowe', type: 'liability', reconcile: false },
    { code: '210', name: 'Kredyty bankowe', type: 'liability', reconcile: false },
    { code: '220', name: 'Pożyczki', type: 'liability', reconcile: false },
    { code: '230', name: 'Zobowiązania z tytułu dostaw', type: 'payable', reconcile: true },
    { code: '240', name: 'Zobowiązania wekslowe', type: 'payable', reconcile: true },
    { code: '250', name: 'Zobowiązania publicznoprawne', type: 'liability', reconcile: false },
    { code: '260', name: 'Zobowiązania z tytułu wynagrodzeń', type: 'liability', reconcile: false },
    // Przychody (Revenue)
    { code: '700', name: 'Sprzedaż produktów', type: 'revenue', reconcile: false },
    { code: '701', name: 'Sprzedaż towarów', type: 'revenue', reconcile: false },
    { code: '702', name: 'Przychody z usług', type: 'revenue', reconcile: false },
    { code: '704', name: 'Zmiana stanu produktów', type: 'revenue', reconcile: false },
    { code: '706', name: 'Przychody ze sprzedaży', type: 'revenue', reconcile: false },
    { code: '708', name: 'Inne przychody operacyjne', type: 'revenue', reconcile: false },
    { code: '750', name: 'Przychody finansowe', type: 'revenue', reconcile: false },
    { code: '760', name: 'Pozostałe przychody operacyjne', type: 'revenue', reconcile: false },
    // Koszty (Expenses)
    { code: '500', name: 'Zużycie materiałów', type: 'expense', reconcile: false },
    { code: '501', name: 'Zużycie energii', type: 'expense', reconcile: false },
    { code: '502', name: 'Wynagrodzenia', type: 'expense', reconcile: false },
    { code: '503', name: 'Ubezpieczenia społeczne', type: 'expense', reconcile: false },
    { code: '504', name: 'Amortyzacja', type: 'expense', reconcile: false },
    { code: '505', name: 'Koszty transportu', type: 'expense', reconcile: false },
    { code: '506', name: 'Koszty najmu', type: 'expense', reconcile: false },
    { code: '507', name: 'Usługi obce', type: 'expense', reconcile: false },
    { code: '508', name: 'Podatki i opłaty', type: 'expense', reconcile: false },
    { code: '509', name: 'Koszty delegacji', type: 'expense', reconcile: false },
    { code: '510', name: 'Koszty ubezpieczeń', type: 'expense', reconcile: false },
    { code: '511', name: 'Koszty reklamy', type: 'expense', reconcile: false },
    { code: '512', name: 'Pozostałe koszty', type: 'expense', reconcile: false },
    { code: '750', name: 'Koszty finansowe', type: 'expense', reconcile: false },
    { code: '760', name: 'Pozostałe koszty operacyjne', type: 'expense', reconcile: false },
    { code: '770', name: 'Podatek dochodowy', type: 'expense', reconcile: false }
  ],
  taxes: [
    { name: 'Polish VAT 0%', amount: 0, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Polish VAT 5% (Reduced)', amount: 5, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Polish VAT 8% (Reduced)', amount: 8, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Polish VAT 23% (Standard)', amount: 23, amount_type: 'percent', type_tax_use: 'sale' }
  ]
};

export default PL;
