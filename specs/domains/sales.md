# Sales Domain Specification

## Domain Identity

- **Domain ID**: `sales`
- **Label**: Sales
- **Module Dependencies**: `sale`, `crm` (for pipeline), `product` (for pricelists)
- **Edition**: Community and Enterprise

## Purpose

Guide users through configuring the Sales domain in Odoo 19, including:
- Sales team structure and assignment
- Customer pipeline and opportunity management
- Product pricelists and pricing strategies
- Quotation templates and terms
- Sales workflow stages

## Checkpoints

### Foundational

#### SALES-FOUND-001: Sales Team Structure Defined
- **Class**: Foundational
- **Validation Source**: user_asserted + system_detected
- **Evidence Required**: 
  - Team names and purposes documented
  - Team member assignments confirmed
  - Alias configuration for incoming leads
- **Downstream Impact**: 
  - Affects CRM pipeline assignment
  - Affects opportunity routing
  - Affects sales reporting by team
- **Write Safety**: `safe` — creates `crm.team` records

#### SALES-FOUND-002: Default Sales Workflow Understood
- **Class**: Foundational
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Sales process stages mapped to business workflow
  - Stage probabilities aligned with business reality
- **Downstream Impact**: 
  - Affects pipeline forecasting accuracy
  - Affects win/loss rate reporting
- **Write Safety**: `conditional` — modifies `crm.stage` (may have existing data)

### Domain Required

#### SALES-DREQ-001: Pricelist Strategy Configured
- **Class**: Domain Required
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Pricing tiers defined (public, partner, VIP, etc.)
  - Currency handling confirmed
  - Discount policies documented
- **Downstream Impact**: 
  - Affects all quotations and orders
  - Affects margin calculations
  - Affects customer-specific pricing
- **Write Safety**: `safe` — creates `product.pricelist` records

#### SALES-DREQ-002: Quotation Template Established
- **Class**: Domain Required
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Standard terms and conditions captured
  - Default payment terms selected
  - Validity period configured
- **Downstream Impact**: 
  - Affects customer-facing quotation format
  - Affects legal compliance
- **Write Safety**: `safe` — creates `sale.order.template` records

#### SALES-DREQ-003: Product Catalog Sales-Ready
- **Class**: Domain Required
- **Validation Source**: system_detected + user_asserted
- **Evidence Required**: 
  - Products have sales prices assigned
  - Products assigned to correct categories
  - Tax configurations confirmed
- **Downstream Impact**: 
  - Affects quotation generation
  - Affects inventory reservations
  - Affects invoicing
- **Write Safety**: `conditional` — modifies `product.template` (may affect existing orders)

### Go-Live

#### SALES-GL-001: Sales Flow Tested End-to-End
- **Class**: Go-Live
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Test quotation created and sent
  - Test order processed through confirmation
  - Test invoice generated correctly
- **Downstream Impact**: 
  - Validates entire sales-to-cash chain
  - Confirms accounting integration
- **Write Safety**: `safe` — test transactions in training database

#### SALES-GL-002: Sales Reporting Validated
- **Class**: Go-Live
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Pipeline report shows expected opportunities
  - Sales team dashboard configured
  - Forecasting inputs confirmed
- **Downstream Impact**: 
  - Management visibility into sales performance
  - Forecast accuracy for planning
- **Write Safety**: `blocked` — reporting is read-only, no writes needed

### Recommended

#### SALES-REC-001: Advanced Sales Features Enabled
- **Class**: Recommended
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Subscription products configured (if applicable)
  - Rental functionality enabled (if applicable)
  - Rental pricing rules established
- **Downstream Impact**: 
  - Enables recurring revenue streams
  - Affects subscription billing
- **Write Safety**: `conditional` — depends on specific feature

#### SALES-REC-002: Sales Integration Points Configured
- **Class**: Recommended
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Website e-commerce integration confirmed
  - POS integration confirmed (if applicable)
  - External system connectors validated
- **Downstream Impact**: 
  - Omnichannel order entry
  - Unified customer view
- **Write Safety**: `conditional` — varies by integration

## Configuration Model

### Sections

1. **Sales Teams** (`sales_teams`)
   - Label: Sales Teams
   - Description: Define your sales organization structure
   - Records: team name, team leader, members, alias
   - Linked Checkpoint: SALES-FOUND-001

2. **Pricelists** (`pricelists`)
   - Label: Product Pricelists
   - Description: Configure your pricing tiers and strategies
   - Records: pricelist name, currency, rules, item lines
   - Linked Checkpoint: SALES-DREQ-001

3. **Quotation Templates** (`quotation_templates`)
   - Label: Quotation Templates
   - Description: Standardize your customer quotations
   - Records: template name, terms, validity period, line items
   - Linked Checkpoint: SALES-DREQ-002

## Inspection Capabilities

### Models to Inspect

- `crm.team` — Sales teams and configuration
- `crm.stage` — Pipeline stages
- `product.pricelist` — Pricing configurations
- `sale.order.template` — Quotation templates
- `product.template` — Product sales settings

### Signals to Detect

- Duplicate team names
- Missing team assignments
- Pricelists without rules
- Products without sales prices
- Stages with zero probability

## Preview/Execution Actions

### Safe Actions

- Create sales team (`crm.team`)
- Create pricelist (`product.pricelist`)
- Create quotation template (`sale.order.template`)
- Update product sales price (`product.template`)

### Conditional Actions

- Modify pipeline stages (`crm.stage`) — requires confirmation if opportunities exist
- Modify pricelist rules (`product.pricelist.item`) — requires confirmation if quotations exist
- Archive sales team — requires confirmation if open opportunities exist

### Blocked Actions

- Delete sales team with historical orders
- Delete pricelist with historical quotations
- Modify confirmed sale order lines
- Direct database manipulation of sales tables

## Guidance Content

### Getting Started

The Sales domain connects your customer-facing processes to your fulfillment operations. Before configuring sales:

1. Ensure your company data is correct (Foundation domain)
2. Define your product catalog structure (Master Data domain)
3. Understand your sales workflow and team structure

### Common Pitfalls

- **Pricing inconsistencies**: Ensure pricelist rules don't conflict. Test with sample quotations.
- **Team assignment gaps**: Every opportunity needs a team. Define a catch-all team.
- **Stage probability**: Zero-probability stages break forecasting. Review before go-live.
- **Tax configuration**: Sales tax must align with accounting. Verify with accounting domain.

### Downstream Impact Summary

Changes in Sales affect:
- **CRM**: Pipeline visibility, opportunity management
- **Inventory**: Stock reservations, availability promises
- **Accounting**: Revenue recognition, tax calculations
- **Purchasing**: Make-to-order demand signals
- **Manufacturing**: Make-to-order production orders

## Readiness Criteria

Sales domain is operationally ready when:
- [ ] SALES-FOUND-001: Teams defined and assigned
- [ ] SALES-FOUND-002: Workflow stages mapped
- [ ] SALES-DREQ-001: Pricing strategy active
- [ ] SALES-DREQ-002: Quotation templates ready
- [ ] SALES-DREQ-003: Product catalog configured
- [ ] SALES-GL-001: End-to-end flow tested
- [ ] SALES-GL-002: Reporting validated
