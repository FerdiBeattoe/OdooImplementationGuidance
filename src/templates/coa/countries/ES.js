/**
 * Spain Chart of Accounts Template
 * Based on Odoo's Spanish PGC (Plan General de Contabilidad)
 */

export const ES = {
  code: 'es_pgc',
  country: 'ES',
  name: 'Spain - PGC',
  description: 'Spanish general accounting plan with IVA support',
  currency: 'EUR',
  accounts: [
    // Activo no corriente (Non-current Assets)
    { code: '2000', name: 'Gastos de investigación', type: 'asset', reconcile: false },
    { code: '2020', name: 'Concesiones administrativas', type: 'asset', reconcile: false },
    { code: '2030', name: 'Propiedad industrial', type: 'asset', reconcile: false },
    { code: '2040', name: 'Fondo de comercio', type: 'asset', reconcile: false },
    { code: '2100', name: 'Terrenos y bienes naturales', type: 'asset', reconcile: false },
    { code: '2110', name: 'Construcciones', type: 'asset', reconcile: false },
    { code: '2130', name: 'Maquinaria', type: 'asset', reconcile: false },
    { code: '2140', name: 'Utillaje', type: 'asset', reconcile: false },
    { code: '2160', name: 'Mobiliario', type: 'asset', reconcile: false },
    { code: '2170', name: 'Equipos para procesos de información', type: 'asset', reconcile: false },
    { code: '2180', name: 'Elementos de transporte', type: 'asset', reconcile: false },
    { code: '2810', name: 'Amortización acumulada del inmovilizado intangible', type: 'asset', reconcile: false },
    { code: '2820', name: 'Amortización acumulada del inmovilizado material', type: 'asset', reconcile: false },
    // Activo corriente (Current Assets)
    { code: '3000', name: 'Mercaderías', type: 'asset', reconcile: false },
    { code: '3100', name: 'Materias primas', type: 'asset', reconcile: false },
    { code: '3300', name: 'Productos en curso', type: 'asset', reconcile: false },
    { code: '3500', name: 'Productos terminados', type: 'asset', reconcile: false },
    { code: '3900', name: 'Provisión por deterioro de mercaderías', type: 'asset', reconcile: false },
    { code: '4100', name: 'Clientes', type: 'receivable', reconcile: true },
    { code: '4110', name: 'Clientes, efectos comerciales en cartera', type: 'receivable', reconcile: true },
    { code: '4300', name: 'Deudores varios', type: 'receivable', reconcile: true },
    { code: '4400', name: 'Deudores', type: 'receivable', reconcile: true },
    { code: '4600', name: 'Créditos a corto plazo', type: 'asset', reconcile: false },
    { code: '4700', name: 'Hacienda Pública deudora', type: 'receivable', reconcile: false },
    { code: '4710', name: 'Organismos de la Seguridad Social deudores', type: 'receivable', reconcile: false },
    { code: '4800', name: 'Gastos anticipados', type: 'asset', reconcile: false },
    // Tesorería (Cash)
    { code: '5700', name: 'Caja, pesetas', type: 'bank', reconcile: true },
    { code: '5710', name: 'Caja, moneda extranjera', type: 'bank', reconcile: true },
    { code: '5720', name: 'Bancos, cuentas corrientes', type: 'bank', reconcile: true },
    { code: '5740', name: 'Bancos, cuentas de ahorro', type: 'bank', reconcile: true },
    // Patrimonio neto (Net Assets)
    { code: '1000', name: 'Capital social', type: 'equity', reconcile: false },
    { code: '1010', name: 'Capital', type: 'equity', reconcile: false },
    { code: '1100', name: 'Prima de emisión de acciones', type: 'equity', reconcile: false },
    { code: '1120', name: 'Reserva legal', type: 'equity', reconcile: false },
    { code: '1130', name: 'Reservas voluntarias', type: 'equity', reconcile: false },
    { code: '1200', name: 'Remanente', type: 'equity', reconcile: false },
    { code: '1290', name: 'Resultado del ejercicio', type: 'equity', reconcile: false },
    // Pasivo (Liabilities)
    { code: '4000', name: 'Proveedores', type: 'payable', reconcile: true },
    { code: '4010', name: 'Proveedores, efectos a pagar', type: 'payable', reconcile: true },
    { code: '4100', name: 'Acreedores por prestación de servicios', type: 'payable', reconcile: true },
    { code: '4200', name: 'Acreedores varios', type: 'payable', reconcile: true },
    { code: '4100', name: 'Personal, remuneraciones pendientes de pago', type: 'payable', reconcile: false },
    { code: '4750', name: 'Hacienda Pública acreedora', type: 'liability', reconcile: false },
    { code: '4760', name: 'Organismos de la Seguridad Social acreedores', type: 'liability', reconcile: false },
    { code: '4770', name: 'Hacienda Pública, IVA soportado', type: 'liability', reconcile: false },
    { code: '4780', name: 'Hacienda Pública, IVA reaccionado', type: 'liability', reconcile: false },
    { code: '4850', name: 'Ingresos anticipados', type: 'liability', reconcile: false },
    { code: '5200', name: 'Deudas a corto plazo con entidades de crédito', type: 'liability', reconcile: false },
    { code: '1700', name: 'Deudas a largo plazo con entidades de crédito', type: 'liability', reconcile: false },
    // Ventas e ingresos (Revenue)
    { code: '7000', name: 'Venta de mercaderías', type: 'revenue', reconcile: false },
    { code: '7010', name: 'Venta de productos terminados', type: 'revenue', reconcile: false },
    { code: '7020', name: 'Venta de subproductos y residuos', type: 'revenue', reconcile: false },
    { code: '7050', name: 'Prestaciones de servicios', type: 'revenue', reconcile: false },
    { code: '7080', name: 'Devoluciones de ventas', type: 'revenue', reconcile: false },
    { code: '7090', name: 'Rappels sobre ventas', type: 'revenue', reconcile: false },
    // Compras
    { code: '6000', name: 'Compra de mercaderías', type: 'expense', reconcile: false },
    { code: '6010', name: 'Compra de materias primas', type: 'expense', reconcile: false },
    { code: '6020', name: 'Compra de otros aprovisionamientos', type: 'expense', reconcile: false },
    // Gastos
    { code: '6200', name: 'Gastos en investigación', type: 'expense', reconcile: false },
    { code: '6210', name: 'Arrendamientos y cánones', type: 'expense', reconcile: false },
    { code: '6220', name: 'Reparaciones y conservación', type: 'expense', reconcile: false },
    { code: '6230', name: 'Servicios de profesionales independientes', type: 'expense', reconcile: false },
    { code: '6240', name: 'Transportes', type: 'expense', reconcile: false },
    { code: '6250', name: 'Primas de seguros', type: 'expense', reconcile: false },
    { code: '6260', name: 'Servicios bancarios', type: 'expense', reconcile: false },
    { code: '6270', name: 'Publicidad, propaganda y relaciones públicas', type: 'expense', reconcile: false },
    { code: '6280', name: 'Suministros', type: 'expense', reconcile: false },
    { code: '6290', name: 'Otros servicios', type: 'expense', reconcile: false },
    { code: '6400', name: 'Sueldos y salarios', type: 'expense', reconcile: false },
    { code: '6420', name: 'Seguridad Social a cargo de la empresa', type: 'expense', reconcile: false },
    { code: '6500', name: 'Otros tributos', type: 'expense', reconcile: false },
    { code: '6600', name: 'Gastos financieros', type: 'expense', reconcile: false },
    { code: '6800', name: 'Amortización del inmovilizado intangible', type: 'expense', reconcile: false },
    { code: '6820', name: 'Amortización del inmovilizado material', type: 'expense', reconcile: false },
    { code: '6950', name: 'Dotación a la provisión por deterioro de créditos', type: 'expense', reconcile: false },
    // Ingresos
    { code: '7500', name: 'Ingresos de propriétés', type: 'revenue', reconcile: false },
    { code: '7600', name: 'Ingresos financieros', type: 'revenue', reconcile: false },
    { code: '7700', name: 'Ingresos excepcionales', type: 'revenue', reconcile: false }
  ],
  taxes: [
    { name: 'Spanish IVA 0%', amount: 0, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Spanish IVA 4% (Super-reduced)', amount: 4, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Spanish IVA 10% (Reduced)', amount: 10, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Spanish IVA 21% (Standard)', amount: 21, amount_type: 'percent', type_tax_use: 'sale' }
  ]
};

export default ES;
