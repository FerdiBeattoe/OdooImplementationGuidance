/**
 * Mexico Chart of Accounts Template
 * Based on Odoo's Mexican chart of accounts (SAT)
 */

export const MX = {
  code: 'mx_cta',
  country: 'MX',
  name: 'Mexico - CTA',
  description: 'Mexican chart of accounts with IVA support',
  currency: 'MXN',
  accounts: [
    // Activo (Assets)
    { code: '1000', name: 'Activo Circulante', type: 'asset', reconcile: false },
    { code: '1100', name: 'Caja', type: 'bank', reconcile: true },
    { code: '1110', name: 'Caja Chica', type: 'bank', reconcile: true },
    { code: '1120', name: 'Bancos', type: 'bank', reconcile: true },
    { code: '1130', name: 'Inversiones Temporales', type: 'bank', reconcile: true },
    { code: '1200', name: 'Clientes', type: 'receivable', reconcile: true },
    { code: '1210', name: 'Documentos por Cobrar', type: 'receivable', reconcile: true },
    { code: '1220', name: 'Deudores Diversos', type: 'receivable', reconcile: true },
    { code: '1300', name: 'IVA Acreditable', type: 'receivable', reconcile: false },
    { code: '1400', name: 'Inventarios', type: 'asset', reconcile: false },
    { code: '1500', name: 'Pagos Anticipados', type: 'asset', reconcile: false },
    // Activo Fijo
    { code: '1600', name: 'Terrenos', type: 'asset', reconcile: false },
    { code: '1610', name: 'Edificios', type: 'asset', reconcile: false },
    { code: '1620', name: 'Maquinaria y Equipo', type: 'asset', reconcile: false },
    { code: '1630', name: 'Equipo de Transporte', type: 'asset', reconcile: false },
    { code: '1640', name: 'Equipo de Computo', type: 'asset', reconcile: false },
    { code: '1650', name: 'Depreciación Acumulada', type: 'asset', reconcile: false },
    { code: '1700', name: 'Activos Intangibles', type: 'asset', reconcile: false },
    // Pasivo (Liabilities)
    { code: '2000', name: 'Pasivo Circulante', type: 'liability', reconcile: false },
    { code: '2100', name: 'Proveedores', type: 'payable', reconcile: true },
    { code: '2110', name: 'Documentos por Pagar', type: 'payable', reconcile: true },
    { code: '2120', name: 'Acreedores Diversos', type: 'payable', reconcile: true },
    { code: '2200', name: 'IVA por Pagar', type: 'liability', reconcile: false },
    { code: '2300', name: 'Impuestos por Pagar', type: 'liability', reconcile: false },
    { code: '2400', name: 'ISR Provisionado', type: 'liability', reconcile: false },
    { code: '2500', name: 'PTU Provisionada', type: 'liability', reconcile: false },
    { code: '2600', name: 'Sueldos por Pagar', type: 'liability', reconcile: false },
    { code: '2700', name: 'Dividendos por Pagar', type: 'liability', reconcile: false },
    // Pasivo Largo Plazo
    { code: '3000', name: 'Pasivo Largo Plazo', type: 'liability', reconcile: false },
    { code: '3100', name: 'Hipotecas', type: 'liability', reconcile: false },
    { code: '3200', name: 'Préstamos Bancarios', type: 'liability', reconcile: false },
    // Capital Contable (Equity)
    { code: '4000', name: 'Capital Social', type: 'equity', reconcile: false },
    { code: '4100', name: 'Aportaciones para Futuros Aumentos', type: 'equity', reconcile: false },
    { code: '4200', name: 'Prima en Emisión de Acciones', type: 'equity', reconcile: false },
    { code: '4300', name: 'Reservas de Capital', type: 'equity', reconcile: false },
    { code: '4400', name: 'Resultado de Ejercicios Anteriores', type: 'equity', reconcile: false },
    { code: '4500', name: 'Resultado del Ejercicio', type: 'equity', reconcile: false },
    // Ingresos (Revenue)
    { code: '5000', name: 'Ventas', type: 'revenue', reconcile: false },
    { code: '5100', name: 'Devoluciones sobre Ventas', type: 'revenue', reconcile: false },
    { code: '5200', name: 'Descuentos sobre Ventas', type: 'revenue', reconcile: false },
    { code: '5300', name: 'Servicios', type: 'revenue', reconcile: false },
    { code: '5900', name: 'Otros Ingresos', type: 'revenue', reconcile: false },
    // Costos (Expenses)
    { code: '6000', name: 'Costo de Ventas', type: 'expense', reconcile: false },
    { code: '6100', name: 'Costo de Servicios', type: 'expense', reconcile: false },
    // Gastos (Expenses)
    { code: '7000', name: 'Gastos de Venta', type: 'expense', reconcile: false },
    { code: '7100', name: 'Sueldos y Salarios', type: 'expense', reconcile: false },
    { code: '7200', name: 'Prestaciones al Personal', type: 'expense', reconcile: false },
    { code: '7300', name: 'Renta', type: 'expense', reconcile: false },
    { code: '7400', name: 'Depreciaciones', type: 'expense', reconcile: false },
    { code: '7500', name: 'Servicios Generales', type: 'expense', reconcile: false },
    { code: '7600', name: 'Gastos de Administración', type: 'expense', reconcile: false },
    { code: '7700', name: 'Impuestos y Derechos', type: 'expense', reconcile: false },
    { code: '7800', name: 'Fletes y Acarreos', type: 'expense', reconcile: false },
    { code: '7900', name: 'Comisiones', type: 'expense', reconcile: false },
    { code: '8000', name: 'Gastos Financieros', type: 'expense', reconcile: false },
    { code: '8100', name: 'Productos Financieros', type: 'revenue', reconcile: false },
    { code: '8200', name: 'ISR', type: 'expense', reconcile: false },
    { code: '8300', name: 'CTA', type: 'expense', reconcile: false }
  ],
  taxes: [
    { name: 'Mexican IVA 0%', amount: 0, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Mexican IVA 8% (Border)', amount: 8, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Mexican IVA 16% (Standard)', amount: 16, amount_type: 'percent', type_tax_use: 'sale' }
  ]
};

export default MX;
