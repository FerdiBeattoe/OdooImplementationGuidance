/**
 * Japan Chart of Accounts Template
 * Based on Odoo's Japanese chart of accounts
 */

export const JP = {
  code: 'jp_basic',
  country: 'JP',
  name: 'Japan - Basic',
  description: 'Japanese basic chart of accounts with Consumption Tax support',
  currency: 'JPY',
  accounts: [
    // 流動資産 (Current Assets)
    { code: '1001', name: '現金', type: 'bank', reconcile: true },
    { code: '1002', name: '普通預金', type: 'bank', reconcile: true },
    { code: '1003', name: '当座預金', type: 'bank', reconcile: true },
    { code: '1004', name: '定期預金', type: 'bank', reconcile: true },
    { code: '1101', name: '受取手形', type: 'receivable', reconcile: true },
    { code: '1102', name: '売掛金', type: 'receivable', reconcile: true },
    { code: '1103', name: '立替金', type: 'receivable', reconcile: true },
    { code: '1104', name: '前払金', type: 'receivable', reconcile: true },
    { code: '1105', name: '仮払金', type: 'receivable', reconcile: false },
    { code: '1201', name: '商品', type: 'asset', reconcile: false },
    { code: '1202', name: '製品', type: 'asset', reconcile: false },
    { code: '1203', name: '原材料', type: 'asset', reconcile: false },
    { code: '1204', name: '仕掛品', type: 'asset', reconcile: false },
    { code: '1301', name: '消耗品', type: 'asset', reconcile: false },
    { code: '1302', name: '前払費用', type: 'asset', reconcile: false },
    // 固定資産 (Fixed Assets)
    { code: '1501', name: '土地', type: 'asset', reconcile: false },
    { code: '1502', name: '建物', type: 'asset', reconcile: false },
    { code: '1503', name: '構築物', type: 'asset', reconcile: false },
    { code: '1504', name: '機械装置', type: 'asset', reconcile: false },
    { code: '1505', name: '船舶', type: 'asset', reconcile: false },
    { code: '1506', name: '車両運命', type: 'asset', reconcile: false },
    { code: '1507', name: '工具器具備品', type: 'asset', reconcile: false },
    { code: '1601', name: '減価償却累計額', type: 'asset', reconcile: false },
    { code: '1701', name: '電話加入権', type: 'asset', reconcile: false },
    { code: '1702', name: 'ソフトウェア', type: 'asset', reconcile: false },
    { code: '1703', name: 'のれん', type: 'asset', reconcile: false },
    // 流動負債 (Current Liabilities)
    { code: '2001', name: '支払手形', type: 'payable', reconcile: true },
    { code: '2002', name: '買掛金', type: 'payable', reconcile: true },
    { code: '2003', name: '短期借入金', type: 'liability', reconcile: false },
    { code: '2004', name: '未払金', type: 'payable', reconcile: true },
    { code: '2005', name: '未払費用', type: 'liability', reconcile: false },
    { code: '2006', name: '前受金', type: 'liability', reconcile: false },
    { code: '2007', name: '預り金', type: 'liability', reconcile: false },
    { code: '2008', name: '仮受金', type: 'liability', reconcile: false },
    { code: '2101', name: '消費税等', type: 'liability', reconcile: false },
    { code: '2102', name: '法人税等', type: 'liability', reconcile: false },
    // 固定負債 (Fixed Liabilities)
    { code: '2501', name: '長期借入金', type: 'liability', reconcile: false },
    { code: '2502', name: '社債', type: 'liability', reconcile: false },
    // 純資産 (Equity)
    { code: '3001', name: '股本', type: 'equity', reconcile: false },
    { code: '3002', name: '優先株式', type: 'equity', reconcile: false },
    { code: '3101', name: '資本準備金', type: 'equity', reconcile: false },
    { code: '3201', name: '利益準備金', type: 'equity', reconcile: false },
    { code: '3301', name: '別途積立金', type: 'equity', reconcile: false },
    { code: '3302', name: '繰越利益剰余金', type: 'equity', reconcile: false },
    // 収益 (Revenue)
    { code: '4001', name: '売上', type: 'revenue', reconcile: false },
    { code: '4002', name: '製品売上', type: 'revenue', reconcile: false },
    { code: '4003', name: '商品売上', type: 'revenue', reconcile: false },
    { code: '4004', name: '役務売上', type: 'revenue', reconcile: false },
    { code: '4101', name: '受取利息', type: 'revenue', reconcile: false },
    { code: '4102', name: '受取配当金', type: 'revenue', reconcile: false },
    { code: '4103', name: '有価証券売却益', type: 'revenue', reconcile: false },
    { code: '4201', name: '雑収入', type: 'revenue', reconcile: false },
    // 費用 (Expenses)
    { code: '5001', name: '売上原価', type: 'expense', reconcile: false },
    { code: '5002', name: '商品仕入', type: 'expense', reconcile: false },
    { code: '5003', name: '期首商品棚卸高', type: 'expense', reconcile: false },
    { code: '5004', name: '期末商品棚卸高', type: 'expense', reconcile: false },
    { code: '5101', name: '支払手数料', type: 'expense', reconcile: false },
    { code: '5102', name: '広告宣伝費', type: 'expense', reconcile: false },
    { code: '5103', name: '接待交際費', type: 'expense', reconcile: false },
    { code: '5104', name: '旅費交通費', type: 'expense', reconcile: false },
    { code: '5105', name: '通信費', type: 'expense', reconcile: false },
    { code: '5106', name: '消耗品費', type: 'expense', reconcile: false },
    { code: '5107', name: '印刷製本費', type: 'expense', reconcile: false },
    { code: '5108', name: '光熱費', type: 'expense', reconcile: false },
    { code: '5109', name: '貸倒引当金繰入', type: 'expense', reconcile: false },
    { code: '5201', name: '役員報酬', type: 'expense', reconcile: false },
    { code: '5202', name: '従業員給与', type: 'expense', reconcile: false },
    { code: '5203', name: '獎与方法', type: 'expense', reconcile: false },
    { code: '5204', name: '法定福利費', type: 'expense', reconcile: false },
    { code: '5205', name: '福利施設負担費', type: 'expense', reconcile: false },
    { code: '5301', name: '租税公課', type: 'expense', reconcile: false },
    { code: '5302', name: '煙損費', type: 'expense', reconcile: false },
    { code: '5303', name: '減価償却費', type: 'expense', reconcile: false },
    { code: '5401', name: '支払利息', type: 'expense', reconcile: false },
    { code: '5402', name: '社債利息', type: 'expense', reconcile: false },
    { code: '5403', name: '有価証券売却損', type: 'expense', reconcile: false },
    { code: '5404', name: '雑損失', type: 'expense', reconcile: false }
  ],
  taxes: [
    { name: 'Japanese Consumption Tax 0%', amount: 0, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Japanese Consumption Tax 8%', amount: 8, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Japanese Consumption Tax 10%', amount: 10, amount_type: 'percent', type_tax_use: 'sale' }
  ]
};

export default JP;
