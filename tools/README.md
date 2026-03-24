# Odoo 19 Onboarding Tool

Production-grade data migration and onboarding tool for Odoo 19.

## Features

- **Environment-based configuration** — No hardcoded credentials
- **CLI interface** — Professional command-line tool
- **Dry-run mode** — Preview changes before committing
- **Transaction safety** — Batch processing with error handling
- **Data validation** — Catch errors before touching Odoo
- **Reconciliation** — Compare source data with Odoo
- **Detailed reporting** — JSON audit trails

## Installation

```bash
npm install
```

## Configuration

Create `.env` file:

```env
ODOO_BASE_URL=https://your-instance.odoo.com
ODOO_DATABASE=your_database
ODOO_USERNAME=your@email.com
ODOO_PASSWORD=your_password

BATCH_SIZE=100
DRY_RUN=false

CUSTOMERS_FILE=./data/customers.xlsx
PRODUCTS_FILE=./data/products.xlsx
```

## Usage

### Test Connection

```bash
node src/cli.js test-connection
```

### Validate Data Files

```bash
node src/cli.js validate
```

### Preview Import

```bash
node src/cli.js preview --customers
node src/cli.js preview --products --limit 100
```

### Import Data

```bash
# Dry run (no changes)
node src/cli.js import --dry-run

# Live import
node src/cli.js import

# Import specific data types
node src/cli.js import --customers --products
```

### Reconcile

```bash
node src/cli.js reconcile
```

## Architecture

```
src/
├── api/           # Odoo JSON-RPC client
├── commands/      # CLI commands
├── config/        # Configuration management
├── parsers/       # Excel/CSV parsing
├── transformers/  # Data transformation
└── validators/    # Input validation
```

## License

MIT