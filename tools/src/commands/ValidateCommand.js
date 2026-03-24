import chalk from 'chalk';
import { existsSync } from 'fs';
import { ExcelParser } from '../parsers/ExcelParser.js';

export class ValidateCommand {
  constructor(config) {
    this.config = config;
    this.parser = new ExcelParser();
    this.errors = [];
    this.warnings = [];
  }

  async execute(options = {}) {
    console.log(chalk.blue.bold('\n=== Validation Mode ===\n'));

    let filesToValidate = [];
    
    if (options.file) {
      filesToValidate = [options.file];
    } else {
      filesToValidate = [
        this.config.files.customers,
        this.config.files.products,
        this.config.files.pricelists,
        this.config.files.boms
      ].filter(Boolean);
    }

    for (const filePath of filesToValidate) {
      await this.validateFile(filePath);
    }

    this.printSummary();
    
    const hasErrors = this.errors.length > 0;
    process.exit(hasErrors ? 1 : 0);
  }

  async validateFile(filePath) {
    if (!existsSync(filePath)) {
      console.log(chalk.yellow(`⚠ File not found: ${filePath}`));
      return;
    }

    console.log(chalk.blue(`Validating: ${filePath}`));

    try {
      const preview = this.parser.preview(filePath, 5);
      
      let totalRows = 0;
      for (const [sheetName, data] of Object.entries(preview)) {
        totalRows += data.total;
        
        if (data.total === 0) {
          this.warnings.push({ file: filePath, sheet: sheetName, message: 'Empty sheet' });
        }

        if (data.columns.length === 0) {
          this.errors.push({ file: filePath, sheet: sheetName, message: 'No columns detected' });
        }

        console.log(chalk.gray(`  ✓ ${sheetName}: ${data.total} rows, ${data.columns.length} columns`));
        
        const requiredColumns = this._getRequiredColumns(filePath, sheetName);
        const missingColumns = requiredColumns.filter(col => !data.columns.includes(col));
        
        if (missingColumns.length > 0) {
          this.errors.push({
            file: filePath,
            sheet: sheetName,
            message: `Missing required columns: ${missingColumns.join(', ')}`
          });
        }
      }

      if (totalRows === 0) {
        this.errors.push({ file: filePath, message: 'No data found in any sheet' });
      }

    } catch (error) {
      this.errors.push({ file: filePath, message: `Parse error: ${error.message}` });
    }
  }

  _getRequiredColumns(filePath, sheetName) {
    const lowerPath = filePath.toLowerCase();
    
    if (lowerPath.includes('customer')) {
      return ['customer', 'name'];
    }
    
    if (lowerPath.includes('product')) {
      return ['description', 'name', 'code'];
    }
    
    return [];
  }

  printSummary() {
    console.log(chalk.blue('\n=== Validation Summary ==='));
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log(chalk.green('\n✓ All files are valid'));
      return;
    }

    if (this.errors.length > 0) {
      console.log(chalk.red(`\n✗ ${this.errors.length} error(s) found:`));
      this.errors.forEach(err => {
        const location = err.sheet ? `${err.file} [${err.sheet}]` : err.file;
        console.log(chalk.red(`  • ${location}: ${err.message}`));
      });
    }

    if (this.warnings.length > 0) {
      console.log(chalk.yellow(`\n⚠ ${this.warnings.length} warning(s):`));
      this.warnings.forEach(warn => {
        const location = warn.sheet ? `${warn.file} [${warn.sheet}]` : warn.file;
        console.log(chalk.yellow(`  • ${location}: ${warn.message}`));
      });
    }
  }
}