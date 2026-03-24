/**
 * China Chart of Accounts Template
 * Based on Odoo's Chinese chart of accounts
 */

export const CN = {
  code: 'cn_basic',
  country: 'CN',
  name: 'China - Basic',
  description: 'Chinese basic chart of accounts with VAT support',
  currency: 'CNY',
  accounts: [
    // 资产类 (Assets)
    { code: '1001', name: '库存现金', type: 'bank', reconcile: true },
    { code: '1002', name: '银行存款', type: 'bank', reconcile: true },
    { code: '1003', name: '其他货币资金', type: 'bank', reconcile: true },
    { code: '1012', name: '其他应收款', type: 'receivable', reconcile: true },
    { code: '1121', name: '应收票据', type: 'receivable', reconcile: true },
    { code: '1122', name: '应收账款', type: 'receivable', reconcile: true },
    { code: '1123', name: '预付账款', type: 'receivable', reconcile: true },
    { code: '1131', name: '应收利息', type: 'receivable', reconcile: true },
    { code: '1132', name: '应收股利', type: 'receivable', reconcile: true },
    { code: '1221', name: '其他应收款', type: 'receivable', reconcile: true },
    { code: '1405', name: '原材料', type: 'asset', reconcile: false },
    { code: '1406', name: '库存商品', type: 'asset', reconcile: false },
    { code: '1407', name: '发出商品', type: 'asset', reconcile: false },
    { code: '1408', name: '委托加工物资', type: 'asset', reconcile: false },
    { code: '1411', name: '周转材料', type: 'asset', reconcile: false },
    { code: '1501', name: '长期股权投资', type: 'asset', reconcile: false },
    { code: '1502', name: '长期股权投资减值准备', type: 'asset', reconcile: false },
    // 固定资产 (Fixed Assets)
    { code: '1601', name: '固定资产', type: 'asset', reconcile: false },
    { code: '1602', name: '累计折旧', type: 'asset', reconcile: false },
    { code: '1603', name: '固定资产减值准备', type: 'asset', reconcile: false },
    { code: '1604', name: '在建工程', type: 'asset', reconcile: false },
    { code: '1605', name: '工程物资', type: 'asset', reconcile: false },
    { code: '1606', name: '固定资产清理', type: 'asset', reconcile: false },
    // 无形资产 (Intangible Assets)
    { code: '1701', name: '无形资产', type: 'asset', reconcile: false },
    { code: '1702', name: '累计摊销', type: 'asset', reconcile: false },
    { code: '1703', name: '无形资产减值准备', type: 'asset', reconcile: false },
    // 负债类 (Liabilities)
    { code: '2001', name: '短期借款', type: 'liability', reconcile: false },
    { code: '2201', name: '应付票据', type: 'payable', reconcile: true },
    { code: '2202', name: '应付账款', type: 'payable', reconcile: true },
    { code: '2203', name: '预收账款', type: 'payable', reconcile: true },
    { code: '2211', name: '应付职工薪酬', type: 'liability', reconcile: false },
    { code: '2221', name: '应交税费', type: 'liability', reconcile: false },
    { code: '2231', name: '应付利息', type: 'liability', reconcile: false },
    { code: '2232', name: '应付股利', type: 'liability', reconcile: false },
    { code: '2241', name: '其他应付款', type: 'payable', reconcile: true },
    { code: '2401', name: '递延收益', type: 'liability', reconcile: false },
    { code: '2501', name: '长期借款', type: 'liability', reconcile: false },
    { code: '2502', name: '应付债券', type: 'liability', reconcile: false },
    // 所有者权益 (Equity)
    { code: '4001', name: '实收资本', type: 'equity', reconcile: false },
    { code: '4002', name: '资本公积', type: 'equity', reconcile: false },
    { code: '4003', name: '盈余公积', type: 'equity', reconcile: false },
    { code: '4101', name: '本年利润', type: 'equity', reconcile: false },
    { code: '4103', name: '利润分配', type: 'equity', reconcile: false },
    // 成本类 (Cost)
    { code: '5001', name: '生产成本', type: 'expense', reconcile: false },
    { code: '5101', name: '制造费用', type: 'expense', reconcile: false },
    // 损益类 (Revenue and Expenses)
    { code: '6001', name: '主营业务收入', type: 'revenue', reconcile: false },
    { code: '6051', name: '其他业务收入', type: 'revenue', reconcile: false },
    { code: '6101', name: '公允价值变动损益', type: 'revenue', reconcile: false },
    { code: '6111', name: '投资收益', type: 'revenue', reconcile: false },
    { code: '6301', name: '营业外收入', type: 'revenue', reconcile: false },
    { code: '6401', name: '主营业务成本', type: 'expense', reconcile: false },
    { code: '6402', name: '其他业务成本', type: 'expense', reconcile: false },
    { code: '6403', name: '营业税金及附加', type: 'expense', reconcile: false },
    { code: '6601', name: '销售费用', type: 'expense', reconcile: false },
    { code: '6602', name: '管理费用', type: 'expense', reconcile: false },
    { code: '6603', name: '财务费用', type: 'expense', reconcile: false },
    { code: '6701', name: '资产减值损失', type: 'expense', reconcile: false },
    { code: '6711', name: '营业外支出', type: 'expense', reconcile: false },
    { code: '6801', name: '所得税费用', type: 'expense', reconcile: false }
  ],
  taxes: [
    { name: 'Chinese VAT 0%', amount: 0, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Chinese VAT 3% (Small-scale)', amount: 3, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Chinese VAT 6% (Services)', amount: 6, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Chinese VAT 9% (Low)', amount: 9, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Chinese VAT 13% (Standard)', amount: 13, amount_type: 'percent', type_tax_use: 'sale' }
  ]
};

export default CN;
