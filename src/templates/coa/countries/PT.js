/**
 * Portugal Chart of Accounts Template
 * Based on Odoo's Portuguese chart of accounts (SNC)
 */

export const PT = {
  code: 'pt_snc',
  country: 'PT',
  name: 'Portugal - SNC',
  description: 'Portuguese accounting system with IVA support',
  currency: 'EUR',
  accounts: [
    // Ativos Fixos Tangíveis
    { code: '4311', name: 'Terrenos', type: 'asset', reconcile: false },
    { code: '4312', name: 'Edifícios', type: 'asset', reconcile: false },
    { code: '433', name: 'Equipamento básico', type: 'asset', reconcile: false },
    { code: '434', name: 'Equipamento de transporte', type: 'asset', reconcile: false },
    { code: '435', name: 'Ferramentas e utensílios', type: 'asset', reconcile: false },
    { code: '436', name: 'Equipamento administrativo', type: 'asset', reconcile: false },
    { code: '437', name: 'Outras imunhas', type: 'asset', reconcile: false },
    { code: '438', name: 'Depreciações acumuladas', type: 'asset', reconcile: false },
    // Ativos Intangíveis
    { code: '441', name: 'Goodwill', type: 'asset', reconcile: false },
    { code: '443', name: 'Projetos de desenvolvimento', type: 'asset', reconcile: false },
    { code: '445', name: 'Propriedade industrial', type: 'asset', reconcile: false },
    { code: '449', name: 'Ativos intangíveis em curso', type: 'asset', reconcile: false },
    // Inventários
    { code: '311', name: 'Mercadorias', type: 'asset', reconcile: false },
    { code: '312', name: 'Matérias-primas', type: 'asset', reconcile: false },
    { code: '313', name: 'Produtos acabados', type: 'asset', reconcile: false },
    { code: '314', name: 'Produtos e trabalhos em curso', type: 'asset', reconcile: false },
    // Clientes
    { code: '211', name: 'Clientes - Conta corrente', type: 'receivable', reconcile: true },
    { code: '212', name: 'Clientes - Títulos a receber', type: 'receivable', reconcile: true },
    { code: '218', name: 'Clientes de cobrança duvidosa', type: 'receivable', reconcile: true },
    // Estado e outros entes públicos
    { code: '243', name: 'IVA - Liquidação', type: 'receivable', reconcile: false },
    { code: '245', name: 'IVA - Regularizações', type: 'receivable', reconcile: false },
    // Outras contas a receber
    { code: '261', name: 'Adiantamentos a fornecedores', type: 'receivable', reconcile: true },
    { code: '262', name: 'Fornecedores - Mercadorias', type: 'receivable', reconcile: false },
    { code: '271', name: 'Pessoal', type: 'receivable', reconcile: false },
    { code: '272', name: 'Acionistas/Sócios', type: 'receivable', reconcile: false },
    // Caixa e depósitos bancários
    { code: '11', name: 'Caixa', type: 'bank', reconcile: true },
    { code: '12', name: 'Depósitos à ordem', type: 'bank', reconcile: true },
    { code: '13', name: 'Depósitos a prazo', type: 'bank', reconcile: true },
    // Capital próprio
    { code: '51', name: 'Capital subscrito', type: 'equity', reconcile: false },
    { code: '52', name: 'Ações (quotas) próprias', type: 'equity', reconcile: false },
    { code: '53', name: 'Prestações suplementares', type: 'equity', reconcile: false },
    { code: '54', name: 'Prémios de emissão', type: 'equity', reconcile: false },
    { code: '55', name: 'Reservas legais', type: 'equity', reconcile: false },
    { code: '56', name: 'Reservas livres', type: 'equity', reconcile: false },
    { code: '88', name: 'Resultado líquido do período', type: 'equity', reconcile: false },
    // Provisões
    { code: '29', name: 'Provisões', type: 'liability', reconcile: false },
    // Fornecedores
    { code: '221', name: 'Fornecedores - Conta corrente', type: 'payable', reconcile: true },
    { code: '222', name: 'Fornecedores - Títulos a pagar', type: 'payable', reconcile: true },
    // Estado e outros entes públicos
    { code: '241', name: 'IVA - Recolhimento', type: 'liability', reconcile: false },
    { code: '244', name: 'IRC - Estimativa', type: 'liability', reconcile: false },
    { code: '245', name: 'IRS - Retenção', type: 'liability', reconcile: false },
    { code: '246', name: 'Contribuições para a Segurança Social', type: 'liability', reconcile: false },
    // Outras contas a pagar
    { code: '2611', name: 'Fornecedores de imobilizado', type: 'payable', reconcile: true },
    { code: '272', name: 'Acionistas/Sócios - Lucros', type: 'payable', reconcile: false },
    { code: '278', name: 'Outros devedores e credores', type: 'payable', reconcile: true },
    // Réditos
    { code: '711', name: 'Vendas de mercadorias', type: 'revenue', reconcile: false },
    { code: '712', name: 'Vendas de produtos', type: 'revenue', reconcile: false },
    { code: '713', name: 'Prestações de serviços', type: 'revenue', reconcile: false },
    { code: '72', name: 'Proveitos suplementares', type: 'revenue', reconcile: false },
    { code: '78', name: 'Outros proveitos e ganhos', type: 'revenue', reconcile: false },
    // Custos
    { code: '611', name: 'Custo das mercadorias vendidas', type: 'expense', reconcile: false },
    { code: '612', name: 'Custo das matérias consumidas', type: 'expense', reconcile: false },
    { code: '62', name: 'Fornecimentos e serviços externos', type: 'expense', reconcile: false },
    { code: '63', name: 'Gastos com o pessoal', type: 'expense', reconcile: false },
    { code: '64', name: 'Gastos de depreciação', type: 'expense', reconcile: false },
    { code: '65', name: 'Provisões', type: 'expense', reconcile: false },
    { code: '68', name: 'Outros gastos e perdas', type: 'expense', reconcile: false },
    { code: '69', name: 'Gastos de financiamento', type: 'expense', reconcile: false }
  ],
  taxes: [
    { name: 'Portuguese IVA 0%', amount: 0, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Portuguese IVA 6% (Reduced)', amount: 6, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Portuguese IVA 13% (Intermediate)', amount: 13, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Portuguese IVA 23% (Standard)', amount: 23, amount_type: 'percent', type_tax_use: 'sale' }
  ]
};

export default PT;
