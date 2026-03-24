#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import { CONFIG, validateConfig } from './config/index.js';
import { ImportCommand } from './commands/ImportCommand.js';
import { PreviewCommand } from './commands/PreviewCommand.js';
import { ValidateCommand } from './commands/ValidateCommand.js';
import { ReconcileCommand } from './commands/ReconcileCommand.js';

program
  .name('odoo-onboard')
  .description('Production-grade Odoo 19 onboarding and data migration tool')
  .version('1.0.0');

program
  .command('validate')
  .description('Validate all data files without importing')
  .option('-f, --file <path>', 'Validate specific file only')
  .action(async (options) => {
    try {
      validateConfig();
      const cmd = new ValidateCommand(CONFIG);
      await cmd.execute(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('preview')
  .description('Preview what would be imported (dry run)')
  .option('-c, --customers', 'Preview customers only')
  .option('-p, --products', 'Preview products only')
  .option('--pricelists', 'Preview pricelists only')
  .option('--boms', 'Preview BOMs only')
  .option('--limit <n>', 'Limit preview to N records', '50')
  .action(async (options) => {
    try {
      validateConfig();
      const cmd = new PreviewCommand(CONFIG);
      await cmd.execute(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('import')
  .description('Import data into Odoo')
  .option('-c, --customers', 'Import customers only')
  .option('-p, --products', 'Import products only')
  .option('--pricelists', 'Import pricelists only')
  .option('--boms', 'Import BOMs only')
  .option('--prerequisites', 'Create prerequisite data (categories, UOMs)')
  .option('--dry-run', 'Show what would be imported without writing to Odoo')
  .option('--batch-size <n>', 'Batch size for imports', CONFIG.import.batchSize.toString())
  .option('--continue-on-error', 'Skip failed records and continue')
  .action(async (options) => {
    try {
      validateConfig();
      
      if (options.dryRun) {
        console.log(chalk.yellow('⚡ DRY RUN MODE - No changes will be made to Odoo'));
      }
      
      const cmd = new ImportCommand(CONFIG);
      await cmd.execute(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('reconcile')
  .description('Compare source data with Odoo to find discrepancies')
  .action(async () => {
    try {
      validateConfig();
      const cmd = new ReconcileCommand(CONFIG);
      await cmd.execute();
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('test-connection')
  .description('Test Odoo connection and show environment info')
  .action(async () => {
    try {
      validateConfig();
      const { OdooClient } = await import('./api/OdooClient.js');
      
      const client = new OdooClient(CONFIG.odoo);
      const result = await client.testConnection();
      
      if (result.success) {
        console.log(chalk.green('✓ Connected successfully'));
        console.log('  UID:', client.uid);
      } else {
        console.log(chalk.red('✗ Connection failed'));
        console.log('  Error:', result.error);
      }
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

program.parse();