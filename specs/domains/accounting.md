# Accounting Domain Specification

## Domain Identity

- **Domain ID**: `accounting`
- **Label**: Accounting
- **Module Dependencies**: `account`, `account_accountant` (Enterprise), `l10n_*` (localization)
- **Edition**: Community (basic) and Enterprise (full)
- **Deployment Note**: Localization packages differ by country; Odoo Online may auto-install

## Purpose

Guide users through configuring the Accounting domain in Odoo 19, including:
- Chart of accounts setup and localization
- Tax configuration and compliance
- Fiscal years and periods
- Bank and payment methods
- Journals and posting rules
- Financial reporting structure

## Checkpoints

### Foundational

#### ACCT-FOUND-001: Fiscal Year Defined
- **Class**: Foundational
- **Validation Source**: user_asserted + system_detected
- **Evidence Required**: 
  - Fiscal year start and end dates
  - Year-opening entry confirmed (if applicable)
  - Prior year closure status (for existing implementations)
- **Downstream Impact**: 
  - Affects all dated transactions
  - Affects reporting periods
  - Affects tax return periods
- **Write Safety**: `safe` — creates `account.fiscal.year` records

#### ACCT-FOUND-002: Chart of Accounts Installed
- **Class**: Foundational
- **Validation Source**: system_detected
- **Evidence Required**: 
  - Localization package installed (l10n_*)
  - COA accounts present in system
  - Account codes match local standards
- **Downstream Impact**: 
  - Affects every financial transaction
  - Affects reporting compliance
  - Affects tax calculations
- **Write Safety**: `conditional` — COA modification requires care if transactions exist

#### ACCT-FOUND-003: Base Currency Established
- **Class**: Foundational
- **Validation Source**: user_asserted + system_detected
- **Evidence Required**: 
  - Company currency matches legal entity currency
  - Rounding rules appropriate for currency
  - Exchange rate sources configured (if multi-currency)
- **Downstream Impact**: 
  - Affects all monetary values
  - Affects exchange gain/loss calculations
- **Write Safety**: `blocked` — currency change after transactions is not supported

### Domain Required

#### ACCT-DREQ-001: Tax Structure Configured
- **Class**: Domain Required
- **Validation Source**: user_asserted + system_detected
- **Evidence Required**: 
  - Tax rates match jurisdiction requirements
  - Tax accounts mapped correctly
  - Tax groups organized logically
  - Tax reporting codes assigned
- **Downstream Impact**: 
  - Affects every line on customer invoices and vendor bills
  - Affects tax authority reporting
  - Affects cash flow for tax payments
- **Write Safety**: `conditional` — modifying active taxes affects open documents

#### ACCT-DREQ-002: Bank Accounts Configured
- **Class**: Domain Required
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Bank account details captured
  - Journals created for each account
  - Opening balances recorded (if existing implementation)
- **Downstream Impact**: 
  - Affects payment processing
  - Affects bank reconciliation
  - Affects cash flow reporting
- **Write Safety**: `safe` — creates `res.partner.bank` and `account.journal` records

#### ACCT-DREQ-003: Journals and Posting Rules Established
- **Class**: Domain Required
- **Validation Source**: user_asserted + system_detected
- **Evidence Required**: 
  - Journal types appropriate for operations (sales, purchase, cash, bank, general)
  - Default accounts configured per journal
  - Sequence numbers validated
- **Downstream Impact**: 
  - Affects transaction categorization
  - Affects audit trail
- **Write Safety**: `safe` — journal configuration

#### ACCT-DREQ-004: Payment Terms Defined
- **Class**: Domain Required
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Standard customer payment terms (e.g., Net 30, 2/10 Net 30)
  - Standard vendor payment terms
  - Terms mapped to cash flow expectations
- **Downstream Impact**: 
  - Affects customer invoice due dates
  - Affects vendor payment scheduling
  - Affects cash flow forecasting
- **Write Safety**: `safe` — creates `account.payment.term` records

### Go-Live

#### ACCT-GL-001: Opening Balances Verified
- **Class**: Go-Live
- **Validation Source**: user_asserted + system_detected
- **Evidence Required**: 
  - Trial balance from prior system matches Odoo opening entries
  - AR/AP balances reconciled to customer/vendor statements
  - Inventory valuation matches
- **Downstream Impact**: 
  - Establishes baseline for all reporting
  - Affects comparative period analysis
- **Write Safety**: `conditional` — opening entries are critical; require sign-off

#### ACCT-GL-002: First Period Transactions Processed
- **Class**: Go-Live
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Test invoice posted and validated
  - Test payment recorded and reconciled
  - Test journal entry balanced
- **Downstream Impact**: 
  - Validates full accounting cycle
  - Confirms tax calculations
- **Write Safety**: `safe` — test transactions in training environment

#### ACCT-GL-003: Financial Reports Validated
- **Class**: Go-Live
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Balance Sheet shows expected structure
  - Profit & Loss shows expected categories
  - Tax reports show expected bases
- **Downstream Impact**: 
  - Management and compliance reporting
  - Audit readiness
- **Write Safety**: `blocked` — reporting is read-only

### Recommended

#### ACCT-REC-001: Advanced Payment Methods Configured
- **Class**: Recommended
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Payment acquirers configured (Stripe, Adyen, etc.)
  - Payment tokens and PCI compliance
  - Batch payment processing rules
- **Downstream Impact**: 
  - Customer payment experience
  - Cash application efficiency
- **Write Safety**: `conditional` — payment provider integration

#### ACCT-REC-002: Analytic Accounting Activated
- **Class**: Recommended
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Analytic dimensions defined (departments, projects, cost centers)
  - Distribution models configured
  - Budgets established
- **Downstream Impact**: 
  - Management accounting visibility
  - Project profitability tracking
- **Write Safety**: `safe` — creates `account.analytic.plan` and related records

## Configuration Model

### Sections

1. **Chart of Accounts** (`chart_of_accounts`)
   - Label: Chart of Accounts
   - Description: Review and customize your account structure
   - Records: account code, name, type, reconcile flag, deprecated
   - Linked Checkpoint: ACCT-FOUND-002

2. **Taxes** (`taxes`)
   - Label: Tax Configuration
   - Description: Configure your tax rates and rules
   - Records: tax name, amount, type, account mapping, tax group
   - Linked Checkpoint: ACCT-DREQ-001

3. **Fiscal Periods** (`fiscal_periods`)
   - Label: Fiscal Years and Periods
   - Description: Define your reporting calendar
   - Records: year name, date from/to, status
   - Linked Checkpoint: ACCT-FOUND-001

4. **Journals** (`journals`)
   - Label: Accounting Journals
   - Description: Configure your transaction entry points
   - Records: journal name, type, default account, sequence
   - Linked Checkpoint: ACCT-DREQ-003

5. **Bank Accounts** (`bank_accounts`)
   - Label: Bank and Cash Accounts
   - Description: Configure your financial institution connections
   - Records: bank name, account number, journal, opening balance
   - Linked Checkpoint: ACCT-DREQ-002

6. **Payment Terms** (`payment_terms`)
   - Label: Payment Terms
   - Description: Define your standard payment conditions
   - Records: term name, due date computation, early payment discounts
   - Linked Checkpoint: ACCT-DREQ-004

## Inspection Capabilities

### Models to Inspect

- `account.account` — Chart of accounts
- `account.tax` — Tax configuration
- `account.journal` — Journals
- `account.fiscal.year` — Fiscal years
- `account.payment.term` — Payment terms
- `res.partner.bank` — Bank accounts
- `account.move` — Journal entries (counts only)

### Signals to Detect

- Accounts with no code or duplicate codes
- Taxes without account mappings
- Journals without default accounts
- Fiscal year gaps or overlaps
- Bank accounts without journals
- Unbalanced opening entries

## Preview/Execution Actions

### Safe Actions

- Create fiscal year (`account.fiscal.year`)
- Create payment term (`account.payment.term`)
- Create bank account (`res.partner.bank`)
- Create journal (`account.journal`)
- Update account configuration (non-critical fields)
- Create analytic plan (`account.analytic.plan`)

### Conditional Actions

- Modify tax rate (`account.tax`) — requires confirmation if used in transactions
- Modify account type (`account.account`) — requires confirmation if transactions exist
- Modify journal default account — requires confirmation if entries exist
- Post opening entries — requires explicit approval and review

### Blocked Actions

- Delete account with transactions
- Delete tax with historical usage
- Change company currency after transactions
- Direct database manipulation of accounting tables
- Modify posted journal entries (must use reversal in Odoo)

## Guidance Content

### Getting Started

The Accounting domain is the backbone of your Odoo financial operations. Before configuring accounting:

1. **Engage your accountant**: This domain requires professional input
2. **Gather documentation**: Prior year-end balances, tax registration, bank statements
3. **Understand your localization**: Odoo 19 includes country-specific accounting packages
4. **Set your fiscal year**: Align with your legal reporting calendar

### Fiscal Year Transition (Existing Implementations)

For existing Odoo 19 implementations expanding accounting:
- Do not attempt mid-year COA changes without professional advice
- Opening balances should be captured at fiscal year start
- Prior period adjustments require journal entries, not data edits

### Common Pitfalls

- **Account code gaps**: Non-sequential codes complicate reporting. Use logical ranges.
- **Tax mapping errors**: Tax account misconfigurations create reconciliation nightmares.
- **Journal sequence breaks**: Never manually edit journal entry numbers.
- **Multi-currency confusion**: Exchange rate differences create automatic entries. Review before go-live.
- **Bank reconciliation timing**: Opening bank balances must match statements exactly.

### Enterprise vs. Community

**Community Edition**:
- Basic accounting (invoicing, bills, bank)
- Manual reconciliation
- Limited automation

**Enterprise Edition**:
- Full accounting (journals, ledgers, analytics)
- Automatic reconciliation
- OCR for bill scanning
- Consolidation (multi-company)
- Budget management

### Downstream Impact Summary

Changes in Accounting affect:
- **Sales**: Invoice generation, tax application, revenue recognition
- **Purchase**: Bill processing, vendor payments, expense tracking
- **Inventory**: Valuation methods, COGS calculations, landed costs
- **Payroll**: Salary expense allocation, liability tracking
- **Manufacturing**: Workcenter costs, BOM cost rollups
- **Reporting**: All financial statements, tax returns, audit trails

## Readiness Criteria

Accounting domain is operationally ready when:
- [ ] ACCT-FOUND-001: Fiscal year defined and active
- [ ] ACCT-FOUND-002: Chart of accounts installed and reviewed
- [ ] ACCT-FOUND-003: Base currency confirmed
- [ ] ACCT-DREQ-001: Tax structure configured and validated
- [ ] ACCT-DREQ-002: Bank accounts configured
- [ ] ACCT-DREQ-003: Journals established
- [ ] ACCT-DREQ-004: Payment terms defined
- [ ] ACCT-GL-001: Opening balances verified (if applicable)
- [ ] ACCT-GL-002: First period transactions processed successfully
- [ ] ACCT-GL-003: Financial reports validated
- [ ] Professional accountant sign-off obtained
