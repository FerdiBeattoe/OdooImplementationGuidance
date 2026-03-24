/**
 * Brazil Chart of Accounts Template
 * Based on Odoo's Brazilian chart of accounts (SPED)
 */

export const BR = {
  code: 'br_pcasp',
  country: 'BR',
  name: 'Brazil - PCASP',
  description: 'Brazilian chart of accounts with ICMS/ISS support',
  currency: 'BRL',
  accounts: [
    // Ativo Circulante (Current Assets)
    { code: '1010', name: 'Caixa', type: 'bank', reconcile: true },
    { code: '1015', name: 'Bancos Conta Movimento', type: 'bank', reconcile: true },
    { code: '1020', name: 'Bancos Conta Poupança', type: 'bank', reconcile: true },
    { code: '1030', name: 'Numerários em Trânsito', type: 'bank', reconcile: true },
    { code: '1110', name: 'Clientes', type: 'receivable', reconcile: true },
    { code: '1120', name: 'Duplicatas a Receber', type: 'receivable', reconcile: true },
    { code: '1130', name: 'Créditos de Funcionários', type: 'receivable', reconcile: true },
    { code: '1210', name: 'ICMS a Recuperar', type: 'receivable', reconcile: false },
    { code: '1220', name: 'IPI a Recuperar', type: 'receivable', reconcile: false },
    { code: '1230', name: 'PIS/COFINS a Recuperar', type: 'receivable', reconcile: false },
    { code: '1310', name: 'Estoque de Mercadorias', type: 'asset', reconcile: false },
    { code: '1320', name: 'Estoque de Matérias-Primas', type: 'asset', reconcile: false },
    { code: '1330', name: 'Estoque de Produtos', type: 'asset', reconcile: false },
    { code: '1410', name: 'Despesas Antecipadas', type: 'asset', reconcile: false },
    // Ativo Não Circulante
    { code: '1510', name: 'Terrenos', type: 'asset', reconcile: false },
    { code: '1520', name: 'Edificações', type: 'asset', reconcile: false },
    { code: '1530', name: 'Máquinas e Equipamentos', type: 'asset', reconcile: false },
    { code: '1540', name: 'Veículos', type: 'asset', reconcile: false },
    { code: '1550', name: 'Móveis e Utensílios', type: 'asset', reconcile: false },
    { code: '1560', name: 'Depreciação Acumulada', type: 'asset', reconcile: false },
    { code: '1710', name: 'Marcas e Patentes', type: 'asset', reconcile: false },
    { code: '1720', name: 'Direitos Autorais', type: 'asset', reconcile: false },
    // Passivo Circulante (Current Liabilities)
    { code: '2010', name: 'Fornecedores', type: 'payable', reconcile: true },
    { code: '2020', name: 'Duplicatas a Pagar', type: 'payable', reconcile: true },
    { code: '2030', name: 'Obrigações Tributárias', type: 'liability', reconcile: false },
    { code: '2110', name: 'ICMS a Recolher', type: 'liability', reconcile: false },
    { code: '2120', name: 'IPI a Recolher', type: 'liability', reconcile: false },
    { code: '2130', name: 'PIS/COFINS a Recolher', type: 'liability', reconcile: false },
    { code: '2140', name: 'IRPJ a Recolher', type: 'liability', reconcile: false },
    { code: '2150', name: 'CSLL a Recolher', type: 'liability', reconcile: false },
    { code: '2210', name: 'Salários a Pagar', type: 'liability', reconcile: false },
    { code: '2220', name: 'INSS a Recolher', type: 'liability', reconcile: false },
    { code: '2230', name: 'FGTS a Recolher', type: 'liability', reconcile: false },
    { code: '2310', name: 'Aluguéis a Pagar', type: 'liability', reconcile: false },
    { code: '2320', name: 'Pró-Labore a Pagar', type: 'liability', reconcile: false },
    // Passivo Não Circulante
    { code: '2510', name: 'Empréstimos Bancários', type: 'liability', reconcile: false },
    { code: '2520', name: 'Financiamentos', type: 'liability', reconcile: false },
    // Patrimônio Líquido (Equity)
    { code: '3010', name: 'Capital Social', type: 'equity', reconcile: false },
    { code: '3020', name: 'Reserva Legal', type: 'equity', reconcile: false },
    { code: '3030', name: 'Reservas de Lucros', type: 'equity', reconcile: false },
    { code: '3110', name: 'Lucros Acumulados', type: 'equity', reconcile: false },
    { code: '3120', name: 'Prejuízos Acumulados', type: 'equity', reconcile: false },
    { code: '3210', name: 'Custo da Mercadoria Vendida', type: 'expense', reconcile: false },
    // Receitas (Revenue)
    { code: '4010', name: 'Receita Bruta de Vendas', type: 'revenue', reconcile: false },
    { code: '4020', name: 'Receita com Serviços', type: 'revenue', reconcile: false },
    { code: '4030', name: 'Receita Financeira', type: 'revenue', reconcile: false },
    { code: '4100', name: 'Devoluções de Vendas', type: 'revenue', reconcile: false },
    { code: '4200', name: 'ICMS sobre Vendas', type: 'revenue', reconcile: false },
    { code: '4210', name: 'PIS/COFINS sobre Vendas', type: 'revenue', reconcile: false },
    // Custos (Expenses)
    { code: '5010', name: 'Custo das Mercadorias Vendidas', type: 'expense', reconcile: false },
    { code: '5020', name: 'Custo dos Serviços Prestados', type: 'expense', reconcile: false },
    // Despesas Operacionais
    { code: '6010', name: 'Despesas com Pessoal', type: 'expense', reconcile: false },
    { code: '6020', name: 'Salários e Ordenados', type: 'expense', reconcile: false },
    { code: '6030', name: 'Encargos Sociais', type: 'expense', reconcile: false },
    { code: '6110', name: 'Aluguéis', type: 'expense', reconcile: false },
    { code: '6120', name: 'Depreciações', type: 'expense', reconcile: false },
    { code: '6130', name: 'Serviços de Terceiros', type: 'expense', reconcile: false },
    { code: '6140', name: 'Luz e Água', type: 'expense', reconcile: false },
    { code: '6150', name: 'Telefone e Internet', type: 'expense', reconcile: false },
    { code: '6160', name: 'Material de Escritório', type: 'expense', reconcile: false },
    { code: '6170', name: 'Despesas com Veículos', type: 'expense', reconcile: false },
    { code: '6180', name: 'Propaganda e Marketing', type: 'expense', reconcile: false },
    { code: '6210', name: 'Despesas Financeiras', type: 'expense', reconcile: false },
    { code: '6220', name: 'Juros Passivos', type: 'expense', reconcile: false },
    { code: '6310', name: 'IRPJ', type: 'expense', reconcile: false },
    { code: '6320', name: 'CSLL', type: 'expense', reconcile: false }
  ],
  taxes: [
    { name: 'Brazilian ICMS 0%', amount: 0, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Brazilian ICMS 7%', amount: 7, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Brazilian ICMS 12%', amount: 12, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Brazilian ICMS 18%', amount: 18, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Brazilian ISS 0%', amount: 0, amount_type: 'percent', type_tax_use: 'sale' },
    { name: 'Brazilian ISS 5%', amount: 5, amount_type: 'percent', type_tax_use: 'sale' }
  ]
};

export default BR;
