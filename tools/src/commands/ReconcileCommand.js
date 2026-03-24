import chalk from 'chalk';
import { existsSync } from 'fs';
import { OdooClient } from '../api/OdooClient.js';
import { ExcelParser } from '../parsers/ExcelParser.js';

export class ReconcileCommand {
  constructor(config) {
    this.config = config;
    this.client = null;
    this.parser = new ExcelParser();
  }

  async execute() {
    console.log(chalk.blue.bold('\n=== Reconciliation Mode ===\n'));
    console.log(chalk.gray('Comparing source data with Odoo...\n'));

    this.client = new OdooClient(this.config.odoo);
    await this.client.connect();

    await this.reconcileCustomers();
    await this.reconcileProducts();

    console.log(chalk.green('\n✓ Reconciliation complete\n'));
  }

  async reconcileCustomers() {
    console.log(chalk.blue('Customer Reconciliation'));

    const filePath = this.config.files.customers;
    if (!existsSync(filePath)) {
      console.log(chalk.yellow('  No customer file to reconcile'));
      return;
    }

    const data = this.parser.parse(filePath);
    const sourceRows = Object.values(data).flat();
    
    console.log(chalk.gray(`  Source: ${sourceRows.length} customers`));

    const odooCustomers = await this.client.searchRead(
      'res.partner',
      [['customer_rank', '>', 0]],
      ['id', 'name', 'ref'],
      { limit: 10000 }
    );

    console.log(chalk.gray(`  Odoo: ${odooCustomers.length} customers`));

    const sourceNames = new Set(sourceRows.map(r => r.customer?.toLowerCase().trim()));
    const odooNames = new Set(odooCustomers.map(c => c.name?.toLowerCase().trim()));

    const missing = sourceRows.filter(r => !odooNames.has(r.customer?.toLowerCase().trim()));
    const extra = odooCustomers.filter(c => !sourceNames.has(c.name?.toLowerCase().trim()));

    console.log(chalk.gray(`  Missing in Odoo: ${missing.length}`));
    console.log(chalk.gray(`  Extra in Odoo: ${extra.length}`));

    if (missing.length > 0) {
      console.log(chalk.red('\n  Missing customers:'));
      missing.slice(0, 5).forEach(c => console.log(chalk.red(`    • ${c.customer}`)));
    }
  }

  async reconcileProducts() {
    console.log(chalk.blue('\nProduct Reconciliation'));

    const filePath = this.config.files.products;
    if (!existsSync(filePath)) {
      console.log(chalk.yellow('  No product file to reconcile'));
      return;
    }

    const data = this.parser.parseSingle(filePath);
    console.log(chalk.gray(`  Source: ${data.length} products`));

    const odooProducts = await this.client.searchRead(
      'product.product',
      [['type', '=', 'product']],
      ['id', 'name', 'default_code'],
      { limit: 10000 }
    );

    console.log(chalk.gray(`  Odoo: ${odooProducts.length} products`));

    const sourceCodes = new Set(data.map(r => r.code?.toLowerCase().trim()).filter(Boolean));
    const odooCodes = new Set(odooProducts.map(p => p.default_code?.toLowerCase().trim()).filter(Boolean));

    const missing = data.filter(r => r.code && !odooCodes.has(r.code?.toLowerCase().trim()));

    console.log(chalk.gray(`  Missing in Odoo: ${missing.length}`));

    if (missing.length > 0) {
      console.log(chalk.red('\n  Missing products:'));
      missing.slice(0, 5).forEach(p => console.log(chalk.red(`    • [${p.code}] ${p.description}`)));
    }
  }
}