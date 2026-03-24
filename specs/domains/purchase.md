# Purchase Domain Specification

## Domain Identity

- **Domain ID**: `purchase`
- **Label**: Purchase
- **Module Dependencies**: `purchase`, `purchase_stock`, `purchase_requisition` (Enterprise)
- **Edition**: Community and Enterprise

## Purpose

Guide users through configuring the Purchase domain in Odoo 19, including:
- Vendor and supplier management
- Purchase order workflows
- Procurement rules and automation
- Vendor price lists and contracts
- Three-way matching (PO, receipt, invoice)
- Purchase analysis and reporting

## Checkpoints

### Foundational

#### PUR-FOUND-001: Vendor Data Established
- **Class**: Foundational
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Key vendors identified and categorized
  - Vendor contact information complete
  - Payment terms assigned per vendor
  - Currency requirements noted
- **Downstream Impact**: 
  - Affects purchase order routing
  - Affects payment scheduling
  - Affects vendor performance tracking
- **Write Safety**: `safe` — creates `res.partner` (vendor) records

#### PUR-FOUND-002: Purchase Order Workflow Defined
- **Class**: Foundational
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Approval levels defined (amount thresholds)
  - Confirmation workflow documented
  - Receipt and invoice matching process clear
- **Downstream Impact**: 
  - Affects spending control
  - Affects audit compliance
- **Write Safety**: `conditional` — workflow changes affect open orders

### Domain Required

#### PUR-DREQ-001: Product Vendor Linkages Configured
- **Class**: Domain Required
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Vendor product codes mapped to internal SKUs
  - Vendor pricing captured (minimum qty, lead time)
  - Primary/alternate vendor assignments
- **Downstream Impact**: 
  - Affects automated procurement suggestions
  - Affects cost calculations
- **Write Safety**: `safe` — creates `product.supplierinfo` records

#### PUR-DREQ-002: Procurement Automation Rules Active
- **Class**: Domain Required
- **Validation Source**: user_asserted + system_detected
- **Evidence Required**: 
  - Reorder points configured for stock items
  - Make-to-order rules for configured products
  - Vendor lead times accurate
- **Downstream Impact**: 
  - Automatic purchase order generation
  - Stockout prevention
- **Write Safety**: `safe` — creates `stock.warehouse.orderpoint` and routes

#### PUR-DREQ-003: Receipt and Inspection Process Defined
- **Class**: Domain Required
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Receipt workflow (1-step, 2-step, 3-step)
  - Quality control checkpoints identified
  - Return process documented
- **Downstream Impact**: 
  - Inventory accuracy
  - Vendor dispute handling
- **Write Safety**: `conditional` — workflow changes affect in-transit stock

### Go-Live

#### PUR-GL-001: Sample Purchase Orders Processed
- **Class**: Go-Live
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Test PO created and confirmed
  - Receipt recorded against PO
  - Vendor bill matched to PO and receipt
  - Payment registered
- **Downstream Impact**: 
  - Validates procure-to-pay cycle
  - Confirms accounting integration
- **Write Safety**: `safe` — test transactions

#### PUR-GL-002: Vendor Performance Baseline Established
- **Class**: Go-Live
- **Validation Source**: user_asserted + system_detected
- **Evidence Required**: 
  - On-time delivery metrics calculable
  - Price variance tracking configured
  - Quality rejection rates measurable
- **Downstream Impact**: 
  - Vendor negotiations
  - Supplier scorecards
- **Write Safety**: `blocked` — reporting is read-only

### Recommended

#### PUR-REC-001: Blanket Orders and Contracts Configured
- **Class**: Recommended
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Framework agreements documented
  - Release order process defined
  - Contract pricing loaded
- **Downstream Impact**: 
  - Long-term vendor relationships
  - Volume pricing enforcement
- **Write Safety**: `safe` — creates `purchase.requisition` (Enterprise)

#### PUR-REC-002: Purchase Analytics Dashboard Configured
- **Class**: Recommended
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Spend by vendor visible
  - Price trends trackable
  - Budget vs. actual comparison ready
- **Downstream Impact**: 
  - Procurement optimization
  - Cost reduction identification
- **Write Safety**: `blocked` — reporting is read-only

## Configuration Model

### Sections

1. **Vendor Master Data** (`vendor_master`)
   - Label: Vendor Master Data
   - Description: Configure your supplier records
   - Records: vendor name, contact, payment terms, currency, category
   - Linked Checkpoint: PUR-FOUND-001

2. **Vendor Pricelists** (`vendor_pricelists`)
   - Label: Vendor Pricelists
   - Description: Capture supplier pricing and terms
   - Records: vendor, product, minimum qty, price, delivery time
   - Linked Checkpoint: PUR-DREQ-001

3. **Procurement Rules** (`procurement_rules`)
   - Label: Procurement Rules
   - Description: Define automated purchasing logic
   - Records: product, reorder point, max quantity, vendor
   - Linked Checkpoint: PUR-DREQ-002

4. **Receipt Configuration** (`receipt_config`)
   - Label: Receipt Configuration
   - Description: Configure goods receipt workflows
   - Records: warehouse, operation type, quality steps
   - Linked Checkpoint: PUR-DREQ-003

## Inspection Capabilities

### Models to Inspect

- `res.partner` — Vendor records
- `product.supplierinfo` — Vendor pricing
- `purchase.order` — Purchase order counts and status
- `purchase.order.line` — Line item counts
- `stock.picking` — Receipt status

### Signals to Detect

- Vendors without payment terms
- Products without supplier info (no procurement source)
- Open purchase orders past expected date
- Receipts without matching PO
- Negative vendor balances

## Preview/Execution Actions

### Safe Actions

- Create vendor (`res.partner`)
- Create supplier info (`product.supplierinfo`)
- Create purchase order (`purchase.order`)
- Confirm purchase order
- Record goods receipt

### Conditional Actions

- Cancel purchase order — requires confirmation if receipts exist
- Modify confirmed PO line quantities — affects vendor commitment
- Change vendor on open PO — requires business approval

### Blocked Actions

- Delete vendor with historical transactions
- Delete PO with posted vendor bills
- Direct database manipulation of purchase tables
- Modify posted vendor bill accounting entries

## Guidance Content

### Getting Started

The Purchase domain manages your procurement operations. Before configuring purchase:

1. **Gather vendor information**: Current contracts, price lists, contacts
2. **Understand your replenishment needs**: What triggers new purchases?
3. **Define receipt workflows**: Who receives goods? Where? How is quality checked?

### Three-Way Matching

Odoo supports automatic matching of:
1. **Purchase Order**: What was ordered (qty, price)
2. **Receipt**: What was received (qty, condition)
3. **Vendor Bill**: What is being invoiced (qty, price, taxes)

Matching ensures you only pay for what you received at agreed prices.

### Procurement Methods

**Buy to Stock** (reorder point):
- Minimize stockouts
- Requires safety stock calculation
- Best for: Predictable demand items

**Buy to Order** (make-to-order):
- Zero inventory risk
- Longer customer lead times
- Best for: Custom/configured products

### Common Pitfalls

- **Vendor lead time neglect**: Accurate lead times are essential for reorder point calculation.
- **Price list staleness**: Vendor prices change. Schedule regular updates.
- **Unit of measure mismatches**: Ensure vendor UOM matches your internal UOM or conversion is set.
- **Tax configuration**: Vendor taxes must align with your tax setup. Verify with accounting.
- **Approval bottlenecks**: Set realistic approval thresholds to avoid delays.

### Downstream Impact Summary

Changes in Purchase affect:
- **Inventory**: Stock receipts, valuations, availability
- **Accounting**: Accounts payable, expenses, asset purchases
- **Sales**: Available-to-promise (via stock availability)
- **Manufacturing**: Component availability for production orders

## Readiness Criteria

Purchase domain is operationally ready when:
- [ ] PUR-FOUND-001: Vendor data established
- [ ] PUR-FOUND-002: PO workflow defined
- [ ] PUR-DREQ-001: Product-vendor linkages configured
- [ ] PUR-DREQ-002: Procurement automation rules active
- [ ] PUR-DREQ-003: Receipt process defined
- [ ] PUR-GL-001: Sample POs processed end-to-end
- [ ] PUR-GL-002: Vendor performance baseline established
