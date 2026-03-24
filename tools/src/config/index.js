import { config } from 'dotenv';
import { resolve } from 'path';

config();

export const CONFIG = {
  odoo: {
    baseUrl: process.env.ODOO_BASE_URL?.replace(/\/$/, ''),
    database: process.env.ODOO_DATABASE,
    username: process.env.ODOO_USERNAME,
    password: process.env.ODOO_PASSWORD,
  },
  
  import: {
    batchSize: parseInt(process.env.BATCH_SIZE, 10) || 100,
    dryRun: process.env.DRY_RUN === 'true',
    skipErrors: process.env.SKIP_ERRORS !== 'false',
    verbose: process.env.VERBOSE === 'true',
  },
  
  features: {
    customers: process.env.IMPORT_CUSTOMERS !== 'false',
    products: process.env.IMPORT_PRODUCTS !== 'false',
    pricelists: process.env.IMPORT_PRICELISTS !== 'false',
    boms: process.env.IMPORT_BOMS !== 'false',
  },
  
  files: {
    customers: process.env.CUSTOMERS_FILE || './data/customers.xlsx',
    products: process.env.PRODUCTS_FILE || './data/products.xlsx',
    pricelists: process.env.PRICELISTS_FILE || './data/pricelists.xlsx',
    boms: process.env.BOMS_FILE || './data/boms.xls',
  },
  
  output: {
    dir: process.env.OUTPUT_DIR || './output',
    logLevel: process.env.LOG_LEVEL || 'info',
  }
};

export function validateConfig() {
  const required = ['baseUrl', 'database', 'username', 'password'];
  const missing = required.filter(key => !CONFIG.odoo[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required config: ${missing.join(', ')}. Check your .env file.`);
  }
  
  return true;
}