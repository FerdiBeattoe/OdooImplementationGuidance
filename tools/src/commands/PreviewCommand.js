import chalk from 'chalk';
import { existsSync } from 'fs';
import { ExcelParser } from '../parsers/ExcelParser.js';
import { CustomerTransformer } from '../transformers/CustomerTransformer.js';
import { ProductTransformer } from '../transformers/ProductTransformer.js';

export class PreviewCommand {
  constructor(config) {
    this.config = config;
    this.parser = new ExcelParser();
  }

  async execute(options = {}) {
    console.log(chalk.blue.bold('\n=== Preview Mode ===\n'));
    console.log(chalk.yellow('This shows what would be imported without making changes\n'));

    const limit = parseInt(options.limit, 10) || 50;

    if (options.customers || !options.products) {
      await this.previewCustomers(limit);
    }

    if (options.products || !options.customers) {
      await this.previewProducts(limit);
    }

    console.log(chalk.blue('\nRun with --dry-run to simulate the full import\n'));
  }

  async previewCustomers(limit) {
    console.log(chalk.blue('Customer Import Preview'));
    
    const filePath = this.config.files.customers;
    if (!existsSync(filePath)) {
      console.log(chalk.yellow(`  File not found: ${filePath}`));
      return;
    }

    const preview = this.parser.preview(filePath, limit);
    
    for (const [sheetName, data] of Object.entries(preview)) {
      console.log(chalk.gray(`\n  Sheet: ${sheetName}`));
      console.log(chalk.gray(`  Total: ${data.total} records`));
      console.log(chalk.gray(`  Columns: ${data.columns.join(', ')}`));
      
      console.log(chalk.gray(`\n  Sample (first ${Math.min(data.sample.length, 3)}):`));
      data.sample.slice(0, 3).forEach((row, i) => {
        const name = row.customer || row.name || 'N/A';
        console.log(chalk.gray(`    ${i + 1}. ${name}`));
      });
    }

    const fullData = this.parser.parse(filePath);
    const allRows = Object.values(fullData).flat();
    
    const transformer = new CustomerTransformer();
    const transformed = transformer.transformBatch(allRows);
    
    console.log(chalk.gray(`\n  Transform Summary:`));
    console.log(chalk.gray(`    Valid: ${transformed.valid.length}`));
    console.log(chalk.gray(`    Invalid: ${transformed.invalid.length}`));
    
    if (transformed.invalid.length > 0) {
      console.log(chalk.red(`\n  First 3 errors:`));
      transformed.invalid.slice(0, 3).forEach(err => {
        console.log(chalk.red(`    • ${err.error}`));
      });
    }

    console.log(chalk.green(`\n  Would create ${transformed.valid.length} customers`));
  }

  async previewProducts(limit) {
    console.log(chalk.blue('\nProduct Import Preview'));
    
    const filePath = this.config.files.products;
    if (!existsSync(filePath)) {
      console.log(chalk.yellow(`  File not found: ${filePath}`));
      return;
    }

    const preview = this.parser.preview(filePath, limit);
    
    for (const [sheetName, data] of Object.entries(preview)) {
      console.log(chalk.gray(`\n  Sheet: ${sheetName}`));
      console.log(chalk.gray(`  Total: ${data.total} records`));
      console.log(chalk.gray(`  Columns: ${data.columns.join(', ')}`));
      
      console.log(chalk.gray(`\n  Sample (first ${Math.min(data.sample.length, 3)}):`));
      data.sample.slice(0, 3).forEach((row, i) => {
        const name = row.description || row.name || 'N/A';
        const code = row.code || '';
        console.log(chalk.gray(`    ${i + 1}. [${code}] ${name}`));
      });
    }

    const data = this.parser.parseSingle(filePath);
    
    const transformer = new ProductTransformer();
    const transformed = transformer.transformBatch(data);
    
    console.log(chalk.gray(`\n  Transform Summary:`));
    console.log(chalk.gray(`    Valid: ${transformed.valid.length}`));
    console.log(chalk.gray(`    Invalid: ${transformed.invalid.length}`));
    console.log(chalk.gray(`    Duplicates: ${transformed.duplicates.length}`));
    
    if (Object.keys(transformed.byCategory).length > 0) {
      console.log(chalk.gray(`\n  By Category:`));
      Object.entries(transformed.byCategory)
        .sort((a, b) => b[1] - a[1])
        .forEach(([cat, count]) => {
          console.log(chalk.gray(`    ${cat}: ${count}`));
        });
    }

    if (transformed.invalid.length > 0) {
      console.log(chalk.red(`\n  First 3 errors:`));
      transformed.invalid.slice(0, 3).forEach(err => {
        console.log(chalk.red(`    • ${err.error}`));
        if (err.suggestion) {
          console.log(chalk.yellow(`      Suggestion: ${err.suggestion}`));
        }
      });
    }

    console.log(chalk.green(`\n  Would create ${transformed.valid.length} products`));
  }
}