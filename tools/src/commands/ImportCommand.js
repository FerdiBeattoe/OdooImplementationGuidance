import chalk from 'chalk';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { OdooClient } from '../api/OdooClient.js';
import { ExcelParser } from '../parsers/ExcelParser.js';
import { CustomerTransformer } from '../transformers/CustomerTransformer.js';
import { ProductTransformer } from '../transformers/ProductTransformer.js';

export class ImportCommand {
  constructor(config) {
    this.config = config;
    this.client = null;
    this.parser = new ExcelParser();
    this.results = {
      customers: { created: 0, failed: 0, errors: [] },
      products: { created: 0, failed: 0, errors: [] },
      categories: { created: 0, failed: 0, errors: [] },
      startTime: new Date(),
      endTime: null
    };
  }

  async execute(options = {}) {
    console.log(chalk.blue.bold('\n=== Odoo 19 Onboarding Tool ===\n'));
    
    const isDryRun = options.dryRun || this.config.import.dryRun;
    
    if (isDryRun) {
      console.log(chalk.yellow('DRY RUN MODE: No changes will be made to Odoo\n'));
    }

    this.client = new OdooClient(this.config.odoo);
    
    console.log('Connecting to Odoo...');
    await this.client.connect();
    console.log(chalk.green(`✓ Connected (UID: ${this.client.uid})\n`));

    if (!existsSync(this.config.output.dir)) {
      mkdirSync(this.config.output.dir, { recursive: true });
    }

    const tasks = [];
    
    if (options.prerequisites || (!options.customers && !options.products && !options.pricelists && !options.boms)) {
      tasks.push(this.createPrerequisites(isDryRun));
    }
    
    if (options.customers || (!options.customers && !options.products && !options.pricelists && !options.boms)) {
      tasks.push(this.importCustomers(isDryRun));
    }
    
    if (options.products || (!options.customers && !options.products && !options.pricelists && !options.boms)) {
      tasks.push(this.importProducts(isDryRun));
    }

    for (const task of tasks) {
      await task;
    }

    this.results.endTime = new Date();
    await this.generateReport(isDryRun);
    
    console.log(chalk.green('\n✓ Import completed\n'));
  }

  async createPrerequisites(isDryRun) {
    console.log(chalk.blue('Creating prerequisite data...'));
    
    const partnerCategories = ['Trade Customer', 'Retail Customer', 'Pool Industry', 'Manufacturing'];
    const productCategories = [
      'Water Treatment', 'Top Products', 'Tools', 'Solvents', 
      'PE Equipment', 'Lamination', 'Moulds', 'Resin', 'Consumables', 'Miscellaneous'
    ];

    if (isDryRun) {
      console.log(chalk.gray(`  Would create ${partnerCategories.length} partner categories`));
      console.log(chalk.gray(`  Would create ${productCategories.length} product categories`));
      return;
    }

    for (const name of partnerCategories) {
      try {
        const existing = await this.client.search('res.partner.category', [['name', '=', name]]);
        if (existing.length === 0) {
          await this.client.create('res.partner.category', { name });
          this.results.categories.created++;
          console.log(chalk.green(`  ✓ Partner category: ${name}`));
        } else {
          console.log(chalk.gray(`  • Partner category exists: ${name}`));
        }
      } catch (error) {
        this.results.categories.failed++;
        this.results.categories.errors.push({ type: 'partner_category', name, error: error.message });
      }
    }

    for (const name of productCategories) {
      try {
        const existing = await this.client.search('product.category', [['name', '=', name]]);
        if (existing.length === 0) {
          await this.client.create('product.category', { name });
          this.results.categories.created++;
          console.log(chalk.green(`  ✓ Product category: ${name}`));
        } else {
          console.log(chalk.gray(`  • Product category exists: ${name}`));
        }
      } catch (error) {
        this.results.categories.failed++;
        this.results.categories.errors.push({ type: 'product_category', name, error: error.message });
      }
    }
  }

  async importCustomers(isDryRun) {
    console.log(chalk.blue('\nImporting customers...'));
    
    const filePath = this.config.files.customers;
    if (!existsSync(filePath)) {
      console.log(chalk.yellow(`  Skipped: File not found ${filePath}`));
      return;
    }

    const data = this.parser.parse(filePath);
    const transformer = new CustomerTransformer();
    
    const allRows = Object.values(data).flat();
    console.log(chalk.gray(`  Found ${allRows.length} customer records`));

    const transformed = transformer.transformBatch(allRows);
    console.log(chalk.gray(`  Valid: ${transformed.valid.length}, Invalid: ${transformed.invalid.length}`));

    if (isDryRun) {
      console.log(chalk.yellow(`  Would create ${transformed.valid.length} customers`));
      return;
    }

    for (const record of transformed.valid) {
      try {
        await this.client.create('res.partner', record.data);
        this.results.customers.created++;
      } catch (error) {
        this.results.customers.failed++;
        this.results.customers.errors.push({ 
          name: record.data.name, 
          error: error.message,
          source: record.source._meta
        });
      }
    }

    console.log(chalk.green(`  ✓ Created ${this.results.customers.created} customers`));
    if (this.results.customers.failed > 0) {
      console.log(chalk.red(`  ✗ Failed ${this.results.customers.failed} customers`));
    }
  }

  async importProducts(isDryRun) {
    console.log(chalk.blue('\nImporting products...'));
    
    const filePath = this.config.files.products;
    if (!existsSync(filePath)) {
      console.log(chalk.yellow(`  Skipped: File not found ${filePath}`));
      return;
    }

    await this.loadCaches();
    
    const data = this.parser.parseSingle(filePath);
    console.log(chalk.gray(`  Found ${data.length} product records`));

    const transformer = new ProductTransformer();
    await transformer.prepareCaches(this.client);

    const categoryMap = {};
    const categories = await this.client.searchRead('product.category', [], ['id', 'name']);
    categories.forEach(cat => {
      categoryMap[cat.name.toLowerCase()] = cat.id;
    });

    const transformed = transformer.transformBatch(data, { categoryMap });
    console.log(chalk.gray(`  Valid: ${transformed.valid.length}, Invalid: ${transformed.invalid.length}, Duplicates: ${transformed.duplicates.length}`));

    if (isDryRun) {
      console.log(chalk.yellow(`  Would create ${transformed.valid.length} products`));
      return;
    }

    for (const record of transformed.valid) {
      try {
        await this.client.create('product.product', record.data);
        this.results.products.created++;
      } catch (error) {
        this.results.products.failed++;
        this.results.products.errors.push({ 
          name: record.data.name, 
          error: error.message,
          source: record.source._meta
        });
      }
    }

    console.log(chalk.green(`  ✓ Created ${this.results.products.created} products`));
    if (this.results.products.failed > 0) {
      console.log(chalk.red(`  ✗ Failed ${this.results.products.failed} products`));
    }
  }

  async loadCaches() {
    console.log(chalk.gray('  Loading reference data...'));
  }

  async generateReport(isDryRun) {
    const report = {
      timestamp: new Date().toISOString(),
      mode: isDryRun ? 'DRY_RUN' : 'LIVE',
      odoo: {
        url: this.config.odoo.baseUrl,
        database: this.config.odoo.database
      },
      results: this.results,
      duration: this.results.endTime - this.results.startTime
    };

    const reportPath = join(this.config.output.dir, `import-report-${Date.now()}.json`);
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(chalk.gray(`\nReport saved: ${reportPath}`));
  }
}