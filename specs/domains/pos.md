# Point of Sale (POS) Domain Specification

## Domain Identity

- **Domain ID**: `pos`
- **Label**: Point of Sale
- **Module Dependencies**: `point_of_sale`, `pos_sale` (for sales integration)
- **Edition**: Community and Enterprise

## Purpose

Guide users through configuring the POS domain in Odoo 19, including:
- POS configurations and profiles
- Payment methods (cash, card, digital)
- Receipt printers and hardware
- Product availability for POS
- Session management and cash control
- Integration with inventory and accounting

## Checkpoints

### Foundational

#### POS-FOUND-001: POS Configuration Profile Created
- **Class**: Foundational
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - POS profile name and location
  - Warehouse/stock location assigned
  - Default customer for walk-ins
  - Fiscal position for taxes
- **Downstream Impact**: 
  - Affects stock movements
  - Affects tax application
- **Write Safety**: `safe` — creates `pos.config` records

#### POS-FOUND-002: Payment Methods Configured
- **Class**: Foundational
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Cash payment method set up
  - Card payment method configured (if applicable)
  - Split payment capability enabled
  - Reconciliation journals assigned
- **Downstream Impact**: 
  - Affects end-of-day closing
  - Affects bank reconciliation
- **Write Safety**: `safe` — creates `pos.payment.method` records

### Domain Required

#### POS-DREQ-001: POS Product Catalog Defined
- **Class**: Domain Required
- **Validation Source**: user_asserted + system_detected
- **Evidence Required**: 
  - Products marked "Available in POS"
  - Barcodes assigned for scanning
  - Categories organized for POS display
  - Prices confirmed accurate
- **Downstream Impact**: 
  - Affects what staff can sell
  - Affects pricing accuracy at register
- **Write Safety**: `conditional` — product changes affect live pricing

#### POS-DREQ-002: Inventory Integration Verified
- **Class**: Domain Required
- **Validation Source**: user_asserted + system_detected
- **Evidence Required**: 
  - Stock location linked to POS
  - Real-time stock updates confirmed
  - Negative stock handling defined
- **Downstream Impact**: 
  - Prevents overselling
  - Affects stock availability for other channels
- **Write Safety**: `conditional` — affects inventory reservations

#### POS-DREQ-003: Receipt and Customer Display Configured
- **Class**: Domain Required
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Receipt template customized (logo, footer)
  - Customer-facing display configured
  - Kitchen/bar printer configured (restaurant mode)
- **Downstream Impact**: 
  - Customer experience
  - Brand presentation
- **Write Safety**: `safe` — configuration only

### Go-Live

#### POS-GL-001: Test Transactions Processed
- **Class**: Go-Live
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Test sale with cash payment
  - Test sale with card payment (if applicable)
  - Test return/refund processed
  - End-of-day closing validated
- **Downstream Impact**: 
  - Validates accounting entries
  - Confirms stock movements
- **Write Safety**: `safe` — test transactions can be reversed

#### POS-GL-002: Cash Control Procedures Established
- **Class**: Go-Live
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Opening cash float recorded
  - Cash drop procedures documented
  - Closing reconciliation process tested
- **Downstream Impact**: 
  - Cash security
  - Audit compliance
- **Write Safety**: `safe` — creates `pos.session` and cash records

### Recommended

#### POS-REC-001: Loyalty and Promotions Configured
- **Class**: Recommended
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Loyalty program rules defined
  - Promotion periods and discounts configured
  - Gift card/product support enabled
- **Downstream Impact**: 
  - Customer retention
  - Revenue impact
- **Write Safety**: `safe` — creates loyalty and promotion records

#### POS-REC-002: Multi-Device Setup (Tablets/Phones)
- **Class**: Recommended
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Mobile devices tested
  - Offline mode validated
  - Sync confirmed
- **Downstream Impact**: 
  - Staff flexibility
  - Line busting capability
- **Write Safety**: `safe` — device configuration

## Configuration Model

### Sections

1. **POS Configurations** (`pos_configs`)
   - Label: POS Configurations
   - Description: Define your point of sale profiles
   - Records: config name, location, warehouse, pricelist, journal
   - Linked Checkpoint: POS-FOUND-001

2. **Payment Methods** (`payment_methods`)
   - Label: Payment Methods
   - Description: Configure accepted payment types
   - Records: method name, type, journal, reconciliation
   - Linked Checkpoint: POS-FOUND-002

3. **POS Products** (`pos_products`)
   - Label: POS Product Catalog
   - Description: Manage products available for sale
   - Records: product, barcode, POS category, price
   - Linked Checkpoint: POS-DREQ-001

4. **Hardware Setup** (`hardware_setup`)
   - Label: Hardware Setup
   - Description: Configure printers and displays
   - Records: printer type, connection, receipt template
   - Linked Checkpoint: POS-DREQ-003

## Inspection Capabilities

### Models to Inspect

- `pos.config` — POS configurations
- `pos.payment.method` — Payment methods
- `pos.session` — Active and closed sessions
- `pos.order` — Order counts and totals
- `product.product` — POS-available products

### Signals to Detect

- POS configs with no payment methods
- Payment methods without journals
- Products with no barcodes (scanning issues)
- Open sessions with no activity (forgotten)
- Negative stock on POS products

## Preview/Execution Actions

### Safe Actions

- Create POS config (`pos.config`)
- Create payment method (`pos.payment.method`)
- Update product POS availability
- Open POS session
- Close POS session

### Conditional Actions

- Modify active session — requires closing first
- Change product price — affects live sales
- Change inventory location — affects stock tracking

### Blocked Actions

- Delete POS config with historical orders
- Delete payment method with historical transactions
- Modify posted POS accounting entries
- Direct database manipulation of POS tables

## Guidance Content

### Getting Started

The POS domain manages your retail front-end operations. Before configuring POS:

1. **Define your locations**: How many registers? Where?
2. **Inventory strategy**: Shared stock or dedicated POS stock?
3. **Payment methods**: What will you accept? Do you need integrated card processing?
4. **Hardware**: Receipt printers? Barcode scanners? Customer displays?

### POS vs. Sales Orders

**Use POS for**:
- Walk-in retail customers
- Quick transactions
- Cash register operations
- Immediate payment

**Use Sales Orders for**:
- Large/complex orders
- Delivery arrangements
- Deposit or installment payments
- Formal quotations

### Inventory Handling

**Real-time stock** (default):
- Updates inventory immediately on sale
- Prevents overselling
- Requires network connectivity

**Offline mode**:
- Queues transactions locally
- Syncs when reconnected
- Risk of overselling if stock low

### Common Pitfalls

- **Tax misconfiguration**: Ensure fiscal positions apply correct tax rates per product/location.
- **Barcode duplicates**: Duplicate barcodes cause scanning errors. Maintain uniqueness.
- **Receipt printer delays**: Test printer speed during peak hours.
- **Cash float accuracy**: Opening/closing counts must be precise for reconciliation.
- **Product availability lag**: Changes to products may not appear in POS until session restart.

### Multi-Channel Considerations

If you also sell online or via sales orders:
- Ensure stock is shared appropriately
- Understand reservation conflicts
- Set priorities (e.g., POS can sell reserved stock in emergency)

### Downstream Impact Summary

Changes in POS affect:
- **Inventory**: Immediate stock deductions
- **Accounting**: Cash/bank entries, revenue recognition
- **Sales**: Order history, customer records
- **Reporting**: Daily sales, payment method reconciliation

## Readiness Criteria

POS domain is operationally ready when:
- [ ] POS-FOUND-001: Configuration profile created
- [ ] POS-FOUND-002: Payment methods configured
- [ ] POS-DREQ-001: Product catalog defined
- [ ] POS-DREQ-002: Inventory integration verified
- [ ] POS-DREQ-003: Receipt/display configured
- [ ] POS-GL-001: Test transactions processed
- [ ] POS-GL-002: Cash control procedures established
- [ ] Staff trained on POS interface and closing
