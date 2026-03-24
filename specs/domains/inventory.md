# Inventory Domain Specification

## Domain Identity

- **Domain ID**: `inventory`
- **Label**: Inventory
- **Module Dependencies**: `stock`, `stock_account` (for valuation)
- **Edition**: Community and Enterprise

## Purpose

Guide users through configuring the Inventory domain in Odoo 19, including:
- Warehouse and location structure
- Stock operations and picking types
- Inventory valuation methods
- Product tracking (lots, serials)
- Replenishment rules
- Stock reservations

## Checkpoints

### Foundational

#### INV-FOUND-001: Warehouse Structure Defined
- **Class**: Foundational
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Physical warehouse locations mapped
  - Warehouse codes established (e.g., WH, WH2)
  - Address and contact information captured
- **Downstream Impact**: 
  - Affects all stock movements
  - Affects delivery address selection
  - Affects inter-warehouse transfers
- **Write Safety**: `safe` — creates `stock.warehouse` records

#### INV-FOUND-002: Location Hierarchy Established
- **Class**: Foundational
- **Validation Source**: user_asserted + system_detected
- **Evidence Required**: 
  - Physical locations mapped (zones, aisles, bins)
  - Location types assigned (internal, customer, vendor, inventory loss)
  - Parent-child relationships logical
- **Downstream Impact**: 
  - Affects putaway and picking strategies
  - Affects stock availability visibility
- **Write Safety**: `safe` — creates `stock.location` records

#### INV-FOUND-003: Operation Types Defined
- **Class**: Foundational
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Receipt, delivery, internal transfer operations configured
  - Default source and destination locations set
  - Sequence prefixes defined
- **Downstream Impact**: 
  - Affects how orders generate pickings
  - Affects barcode scanning workflows
- **Write Safety**: `safe` — creates `stock.picking.type` records

### Domain Required

#### INV-DREQ-001: Product Tracking Strategy Configured
- **Class**: Domain Required
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Products requiring lot tracking identified
  - Products requiring serial tracking identified
  - Tracking settings applied to product categories
- **Downstream Impact**: 
  - Affects expiry date management (lots)
  - Affects warranty tracking (serials)
  - Affects traceability reporting
- **Write Safety**: `conditional` — changing tracking on products with stock requires adjustment

#### INV-DREQ-002: Valuation Method Selected
- **Class**: Domain Required
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Costing method chosen (standard, average, FIFO, specific identification)
  - Inventory valuation account configured
  - Stock input/output accounts mapped
- **Downstream Impact**: 
  - Affects COGS calculations
  - Affects inventory asset valuation
  - Affects margin reporting
- **Write Safety**: `conditional` — changing valuation method mid-period is complex

#### INV-DREQ-003: Stock Rules and Routes Established
- **Class**: Domain Required
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Procurement routes defined (buy, manufacture, dropship)
  - Push rules configured (putaway strategies)
  - Pull rules configured (pick strategies)
- **Downstream Impact**: 
  - Affects automatic procurement
  - Affects order fulfillment efficiency
- **Write Safety**: `safe` — creates `stock.rule` and route records

### Go-Live

#### INV-GL-001: Initial Stock Counted and Loaded
- **Class**: Go-Live
- **Validation Source**: user_asserted + system_detected
- **Evidence Required**: 
  - Physical count completed
  - Count sheets signed
  - Inventory adjustments posted
  - Valuation matches accounting records
- **Downstream Impact**: 
  - Establishes baseline stock positions
  - Affects all future stock transactions
- **Write Safety**: `conditional` — requires sign-off; creates `stock.quant` and adjustment entries

#### INV-GL-002: Stock Movement Workflows Tested
- **Class**: Go-Live
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Receipt workflow tested end-to-end
  - Delivery workflow tested end-to-end
  - Internal transfer tested
  - Returns workflow tested (customer and supplier)
- **Downstream Impact**: 
  - Validates operational procedures
  - Confirms barcode/picking device workflows
- **Write Safety**: `safe` — test transactions

#### INV-GL-003: Reservation Strategy Validated
- **Class**: Go-Live
- **Validation Source**: system_detected
- **Evidence Required**: 
  - Reservation rules confirmed (at order, at delivery, manual)
  - Reservation horizon appropriate
  - Partial reservation behavior tested
- **Downstream Impact**: 
  - Affects order promising accuracy
  - Affects stock availability for other orders
- **Write Safety**: `conditional` — reservation strategy changes affect open orders

### Recommended

#### INV-REC-001: Replenishment Automation Configured
- **Class**: Recommended
- **Validation Source**: user_asserted + system_detected
- **Evidence Required**: 
  - Reorder points set for key products
  - Vendor lead times captured
  - Safety stock levels calculated
- **Downstream Impact**: 
  - Automatic purchase order generation
  - Stockout prevention
- **Write Safety**: `safe` — creates `stock.warehouse.orderpoint` records

#### INV-REC-002: Barcode and Mobile Workflows Enabled
- **Class**: Recommended
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Barcode nomenclature configured
  - Mobile devices tested
  - Scan validation rules established
- **Downstream Impact**: 
  - Warehouse operation efficiency
  - Picking accuracy
- **Write Safety**: `safe` — creates `barcode.rule` records

## Configuration Model

### Sections

1. **Warehouses** (`warehouses`)
   - Label: Warehouses
   - Description: Define your physical warehouse locations
   - Records: warehouse name, code, address, receipt/delivery steps
   - Linked Checkpoint: INV-FOUND-001

2. **Locations** (`locations`)
   - Label: Storage Locations
   - Description: Configure your internal storage structure
   - Records: location name, barcode, type, parent location
   - Linked Checkpoint: INV-FOUND-002

3. **Operation Types** (`operation_types`)
   - Label: Operation Types
   - Description: Configure your stock movement workflows
   - Records: operation name, type, source/destination locations, sequence
   - Linked Checkpoint: INV-FOUND-003

4. **Product Tracking** (`product_tracking`)
   - Label: Product Tracking
   - Description: Configure lot and serial number requirements
   - Records: tracking type, product/category mapping, expiry rules
   - Linked Checkpoint: INV-DREQ-001

5. **Routes and Rules** (`routes_rules`)
   - Label: Routes and Rules
   - Description: Define your procurement and fulfillment logic
   - Records: route name, rules, applicable warehouses
   - Linked Checkpoint: INV-DREQ-003

6. **Initial Stock** (`initial_stock`)
   - Label: Initial Stock
   - Description: Record your opening inventory positions
   - Records: product, location, lot/serial, quantity, unit cost
   - Linked Checkpoint: INV-GL-001

## Inspection Capabilities

### Models to Inspect

- `stock.warehouse` — Warehouse configuration
- `stock.location` — Location hierarchy
- `stock.picking.type` — Operation types
- `stock.quant` — Stock on hand (quantities only, no costs in inspection)
- `stock.rule` — Pull/push rules
- `stock.warehouse.orderpoint` — Reorder points
- `product.template` — Tracking settings

### Signals to Detect

- Warehouses with no locations
- Locations with no parent (except root)
- Operation types without sequences
- Products with stock but no tracking (if tracking required)
- Negative stock quantities (if not allowed)
- Duplicate location barcodes

## Preview/Execution Actions

### Safe Actions

- Create warehouse (`stock.warehouse`)
- Create location (`stock.location`)
- Create operation type (`stock.picking.type`)
- Create stock rule (`stock.rule`)
- Create reorder point (`stock.warehouse.orderpoint`)
- Update product tracking setting (if no stock)

### Conditional Actions

- Post inventory adjustment — requires confirmation and valuation impact review
- Change product tracking — requires stock adjustment if stock exists
- Change valuation method — requires period-end timing and accounting alignment
- Modify routes with active procurement — affects open orders

### Blocked Actions

- Delete warehouse with historical stock moves
- Delete location with quants
- Force stock quantity without proper adjustment
- Direct database manipulation of inventory tables
- Modify posted stock valuation entries

## Guidance Content

### Getting Started

The Inventory domain manages your physical goods. Before configuring inventory:

1. **Map your physical space**: Walk the warehouse and document locations
2. **Decide on tracking**: Which products need lot/serial control? (regulated goods, electronics, etc.)
3. **Choose valuation**: Match your accounting policy (FIFO for perishables, average for commodities)
4. **Plan your go-live date**: Physical counts take time; schedule accordingly

### Warehouse Receipt/Delivery Steps

Odoo supports multi-step workflows:
- **1-step**: Receive directly to stock / deliver directly from stock
- **2-step**: Input → Stock / Pick → Output
- **3-step**: Input → Quality → Stock / Pick → Pack → Output

Choose based on your operational complexity. Start simple and expand.

### Lot and Serial Tracking

**Lots** (batch tracking):
- Used for: Food, pharmaceuticals, chemicals
- Tracks: Expiry dates, recall batches
- One product = many quantities per lot

**Serial Numbers** (unit tracking):
- Used for: Electronics, appliances, vehicles
- Tracks: Individual unit warranty, service history
- One product = one quantity per serial

**No tracking**:
- Used for: Commodities, low-value items
- Simpler operations, less traceability

### Common Pitfalls

- **Location depth**: Overly complex hierarchies slow operations. Keep it practical.
- **Negative stock**: Disable unless you understand the implications. Can cause valuation errors.
- **Reservation conflicts**: Too aggressive reservation blocks other orders. Balance with availability promises.
- **Valuation timing**: Inventory valuation entries post at stock move validation, not invoice. Match with accounting cutoff.
- **UOM confusion**: Ensure unit of measure conversions are accurate. Test with real quantities.

### Downstream Impact Summary

Changes in Inventory affect:
- **Sales**: Available-to-promise quantities, delivery scheduling
- **Purchase**: Receiving workflows, vendor performance tracking
- **Manufacturing**: Component availability, WIP tracking, finished goods receipt
- **Accounting**: Inventory valuation, COGS, asset accounts
- **POS**: Real-time stock visibility, multi-location availability

## Readiness Criteria

Inventory domain is operationally ready when:
- [ ] INV-FOUND-001: Warehouse structure defined
- [ ] INV-FOUND-002: Location hierarchy established
- [ ] INV-FOUND-003: Operation types configured
- [ ] INV-DREQ-001: Product tracking strategy applied
- [ ] INV-DREQ-002: Valuation method selected
- [ ] INV-DREQ-003: Stock rules and routes established
- [ ] INV-GL-001: Initial stock loaded and balanced
- [ ] INV-GL-002: Movement workflows tested
- [ ] INV-GL-003: Reservation strategy validated
- [ ] Physical warehouse staff trained on new locations/codes
