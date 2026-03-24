/**
 * Sweden Chart of Accounts Template
 * Based on Odoo's Swedish BAS chart of accounts
 */

export const SE = {
  code: 'se_bas',
  country: 'SE',
  name: 'Sweden - BAS',
  description: 'Swedish BAS chart of accounts with VAT support',
  currency: 'SEK',
  accounts: [
    // Anläggningstillgångar (Fixed Assets)
    { code: '1110', name: 'Byggnader', type: 'asset', reconcile: false },
    { code: '1120', name: 'Mark', type: 'asset', reconcile: false },
    { code: '1130', name: 'Maskiner', type: 'asset', reconcile: false },
    { code: '1140', name: 'Inventarier', type: 'asset', reconcile: false },
    { code: '1150', name: 'Bilar', type: 'asset', reconcile: false },
    { code: '1160', name: 'Datorer', type: 'asset', reconcile: false },
    { code: '1210', name: 'Goodwill', type: 'asset', reconcile: false },
    { code: '1220', name: 'Patent', type: 'asset', reconcile: false },
    { code: '1230', name: 'Licenser', type: 'asset', reconcile: false },
    { code: '1310', name: 'Aktier', type: 'asset', reconcile: false },
    { code: '1330', name: 'Andra långfristiga fordringar', type: 'asset', reconcile: false },
    // Omsättningstillgångar (Current Assets)
    { code: '1510', name: 'Kundfordringar', type: 'receivable', reconcile: true },
    { code: '1520', name: 'Kundfordringar - utländska', type: 'receivable', reconcile: true },
    { code: '1530', name: 'Osäkra kundfordringar', type: 'receivable', reconcile: true },
    { code: '1610', name: 'Lager', type: 'asset', reconcile: false },
    { code: '1620', name: 'Råvaror', type: 'asset', reconcile: false },
    { code: '1630', name: 'Varor under tillverkning', type: 'asset', reconcile: false },
    { code: '1640', name: 'Färdiga varor', type: 'asset', reconcile: false },
    { code: '1650', name: 'Handelsvaror', type: 'asset', reconcile: false },
    { code: '1710', name: 'Förutbetalda kostnader', type: 'asset', reconcile: false },
    { code: '1730', name: 'Upplupna intäkter', type: 'asset', reconcile: false },
    { code: '1740', name: 'Momsfordran', type: 'receivable', reconcile: false },
    // Kassa och bank (Cash)
    { code: '1910', name: 'Kassa', type: 'bank', reconcile: true },
    { code: '1920', name: 'Bank', type: 'bank', reconcile: true },
    { code: '1930', name: 'Giro', type: 'bank', reconcile: true },
    { code: '1940', name: 'Bankomat', type: 'bank', reconcile: true },
    // Eget kapital (Equity)
    { code: '2010', name: 'Aktiekapital', type: 'equity', reconcile: false },
    { code: '2020', name: 'Fritt eget kapital', type: 'equity', reconcile: false },
    { code: '2090', name: 'Årets resultat', type: 'equity', reconcile: false },
    // Obeskattade reserver
    { code: '2150', name: 'Ackumulerade överavskrivningar', type: 'equity', reconcile: false },
    // Avsättningar
    { code: '2200', name: 'Pensionsavsättningar', type: 'liability', reconcile: false },
    { code: '2210', name: 'Skatteskulder', type: 'liability', reconcile: false },
    // Kortfristiga skulder (Current Liabilities)
    { code: '2400', name: 'Leverantörsskulder', type: 'payable', reconcile: true },
    { code: '2410', name: 'Leverantörsskulder - utländska', type: 'payable', reconcile: true },
    { code: '2440', name: 'Fakturerade kostnader', type: 'liability', reconcile: false },
    { code: '2510', name: 'Skatteskulder', type: 'liability', reconcile: false },
    { code: '2520', name: 'Moms', type: 'liability', reconcile: false },
    { code: '2530', name: 'Personalens skatter', type: 'liability', reconcile: false },
    { code: '2540', name: 'Arbetsgivaravgifter', type: 'liability', reconcile: false },
    { code: '2550', name: 'Semesterlöneskuld', type: 'liability', reconcile: false },
    { code: '2560', name: 'Löneskuld', type: 'liability', reconcile: false },
    { code: '2610', name: 'Upplupna kostnader', type: 'liability', reconcile: false },
    { code: '2710', name: 'Lön', type: 'liability', reconcile: false },
    { code: '2900', name: 'Övriga kortfristiga skulder', type: 'payable', reconcile: true },
    // Långfristiga skulder
    { code: '2800', name: 'Långfristiga lån', type: 'liability', reconcile: false },
    { code: '2840', name: 'Checkkredit', type: 'liability', reconcile: false },
    // Intäkter (Revenue)
    { code: '3000', name: 'Försäljning', type: 'revenue', reconcile: false },
    { code: '3010', name: 'Varuförsäljning', type: 'revenue', reconcile: false },
    { code: '3020', name: 'Tjänsteintäkter', type: 'revenue', reconcile: false },
    { code: '3050', name: 'Leasingintäkter', type: 'revenue', reconcile: false },
    { code: '3960', name: 'Valutakursvinster', type: 'revenue', reconcile: false },
    { code: '3970', name: 'Ränteintäkter', type: 'revenue', reconcile: false },
    { code: '3980', name: 'Övriga finansiella intäkter', type: 'revenue', reconcile: false },
    // Kostnader (Expenses)
    { code: '4000', name: 'Kostnader', type: 'expense', reconcile: false },
    { code: '4010', name: 'Varuinköp', type: 'expense', reconcile: false },
    { code: '4020', name: 'Direkta kostnader', type: 'expense', reconcile: false },
    { code: '5010', name: 'Lokalkostnader', type: 'expense', reconcile: false },
    { code: '5020', name: 'El, värme, vatten', type: 'expense', reconcile: false },
    { code: '5200', name: 'Reparation och underhåll', type: 'expense', reconcile: false },
    { code: '5300', name: 'Konsulttjänster', type: 'expense', reconcile: false },
    { code: '5400', name: 'Kontorsmaterial', type: 'expense', reconcile: false },
    { code: '5500', name: 'Telefon och internet', type: 'expense', reconcile: false },
    { code: '5600', name: 'Resekostnader', type: 'expense', reconcile: false },
    { code: '5700', name: 'Frakt och transport', type: 'expense', reconcile: false },
    { code: '5800', name: 'Marknadsföring', type: 'expense', reconcile: false },
    { code: '5910', name: 'Personalkostnader', type: 'expense', reconcile: false },
    { code: '6000', name: 'Löner', type: 'expense', reconcile: false },
    { code: '6210', name: 'Arbetsgivaravgifter', type: 'expense', reconcile: false },
    { code: '6300', name: 'Avskrivningar', type: 'expense', reconcile: false },
    { code: '6600', name: 'Bankkostnader', type: 'expense', reconcile: false },
    { code: '6710', name: 'Räntekostnader', type: 'expense', reconcile: false },
    { code: '6960', name: 'Valutakursförluster', type: 'expense', reconcile: false },
    { code: '6990', name: 'Övriga finansiella kostnader', type: 'expense', reconcile: false },
    { code: '7710', name: 'Moms', type: 'expense', reconcile: false }
  ],
  taxes: [
    { name: 'Swedish VAT 0%', amount: 0, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Swedish VAT 6% (Reduced)', amount: 6, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Swedish VAT 12% (Reduced)', amount: 12, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Swedish VAT 25% (Standard)', amount: 25, amount_type: 'percent', type_tax_use: 'sale' }
  ]
};

export default SE;
