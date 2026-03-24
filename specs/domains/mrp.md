# Manufacturing (MRP) Domain Specification

## Domain Identity

- **Domain ID**: `mrp`
- **Label**: Manufacturing
- **Module Dependencies**: `mrp`, `mrp_workorder`, `mrp_plm` (Enterprise), `quality` (Enterprise)
- **Edition**: Community (basic BOMs and MOs) and Enterprise (work orders, PLM, quality)

## Purpose

Guide users through configuring the Manufacturing domain in Odoo 19, including:
- Bills of Materials (BOMs) and routings
- Work centers and capacity planning
- Manufacturing orders and workflows
- Product lifecycle management (Enterprise)
- Quality control points (Enterprise)

## Checkpoints

### Foundational

#### MRP-FOUND-001: Work Centers Defined
- **Class**: Foundational
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Physical work centers mapped (assembly, machining, painting)
  - Capacity per work center (units, hours)
  - Operating hours and calendars established
- **Downstream Impact**: 
  - Affects production scheduling
  - Affects capacity planning
- **Write Safety**: `safe` — creates `mrp.workcenter` records

#### MRP-FOUND-002: Product Structure (BOMs) Documented
- **Class**: Foundational
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - BOMs for manufactured products
  - Component quantities and units
  - By-products and scrap defined (if applicable)
- **Downstream Impact**: 
  - Affects material requirements planning
  - Affects cost rollups
- **Write Safety**: `conditional` — BOM changes affect open manufacturing orders

### Domain Required

#### MRP-DREQ-001: Routings Configured
- **Class**: Domain Required
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Operation sequences defined
  - Work center assignments per operation
  - Time standards (setup, run, cleanup)
- **Downstream Impact**: 
  - Affects production scheduling accuracy
  - Affects labor cost calculations
- **Write Safety**: `safe` — creates `mrp.routing` and `mrp.routing.workcenter` records

#### MRP-DREQ-002: Manufacturing Order Workflow Established
- **Class**: Domain Required
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - MO creation triggers (MTO, MTS, manual)
  - Confirmation and reservation rules
  - Completion and closing process
- **Downstream Impact**: 
  - Affects shop floor control
  - Affects inventory movements
- **Write Safety**: `conditional` — workflow changes affect open MOs

#### MRP-DREQ-003: Component Availability Rules Defined
- **Class**: Domain Required
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Reservation strategies (at MO confirmation, at operation start)
  - Substitute component rules
  - Kit/phantom BOM handling
- **Downstream Impact**: 
  - Affects stock availability for sales
  - Affects production delays
- **Write Safety**: `safe` — configuration records

### Go-Live

#### MRP-GL-001: Sample Manufacturing Orders Processed
- **Class**: Go-Live
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Test MO created from BOM
  - Components reserved and consumed
  - Operations completed (Enterprise: work orders)
  - Finished product received to stock
- **Downstream Impact**: 
  - Validates production workflow
  - Confirms costing integration
- **Write Safety**: `safe` — test transactions

#### MRP-GL-002: Costing Integration Validated
- **Class**: Go-Live
- **Validation Source**: user_asserted + system_detected
- **Evidence Required**: 
  - Component costs rolled up to finished good
  - Work center costs allocated
  - Inventory valuation reflects production costs
- **Downstream Impact**: 
  - Accurate COGS
  - Inventory asset valuation
- **Write Safety**: `conditional` — requires accounting alignment

### Recommended

#### MRP-REC-001: PLM and Engineering Changes Active (Enterprise)
- **Class**: Recommended
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - ECO workflow defined
  - Approval stages configured
  - Effective date management established
- **Downstream Impact**: 
  - Controlled BOM evolution
  - Audit trail for changes
- **Write Safety**: `safe` — creates `mrp.eco` records

#### MRP-REC-002: Quality Control Points Configured (Enterprise)
- **Class**: Recommended
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Quality checks defined per operation
  - Pass/fail criteria documented
  - Corrective action process established
- **Downstream Impact**: 
  - Product quality consistency
  - Defect tracking
- **Write Safety**: `safe` — creates `quality.point` records

## Configuration Model

### Sections

1. **Work Centers** (`work_centers`)
   - Label: Work Centers
   - Description: Define your production resources
   - Records: work center name, capacity, efficiency, operating hours
   - Linked Checkpoint: MRP-FOUND-001

2. **Bills of Materials** (`boms`)
   - Label: Bills of Materials
   - Description: Document your product recipes
   - Records: product, components, quantities, by-products, operations
   - Linked Checkpoint: MRP-FOUND-002

3. **Routings** (`routings`)
   - Label: Routings
   - Description: Define manufacturing operation sequences
   - Records: routing name, operations, work centers, times
   - Linked Checkpoint: MRP-DREQ-001

4. **Manufacturing Orders** (`manufacturing_orders`)
   - Label: Manufacturing Orders
   - Description: Configure production order management
   - Records: MO triggers, reservation rules, completion workflow
   - Linked Checkpoint: MRP-DREQ-002

## Inspection Capabilities

### Models to Inspect

- `mrp.workcenter` — Work centers
- `mrp.bom` — Bills of materials
- `mrp.routing` — Routings
- `mrp.production` — Manufacturing orders
- `mrp.workorder` — Work orders (Enterprise)

### Signals to Detect

- BOMs with no components
- Routings with no operations
- Work centers with zero capacity
- MOs without BOMs
- Overlapping work center schedules

## Preview/Execution Actions

### Safe Actions

- Create work center (`mrp.workcenter`)
- Create BOM (`mrp.bom`)
- Create routing (`mrp.routing`)
- Create manufacturing order (`mrp.production`)
- Confirm manufacturing order
- Produce finished goods

### Conditional Actions

- Modify BOM — requires confirmation if MOs exist
- Modify routing times — affects scheduling
- Cancel MO — requires confirmation if components consumed
- Scrap production — requires accounting alignment

### Blocked Actions

- Delete BOM with historical MOs
- Delete work center with historical operations
- Modify posted production accounting entries
- Direct database manipulation of manufacturing tables

## Guidance Content

### Getting Started

The Manufacturing domain manages your production operations. Before configuring MRP:

1. **Document your products**: Which are manufactured vs. purchased?
2. **Map your shop floor**: What work centers exist? What do they do?
3. **Gather BOM data**: Product structures from engineering or current systems
4. **Understand your planning**: Make-to-stock vs. make-to-order?

### BOM Types

**Manufacture this product**:
- Standard BOM for production
- Components consumed, finished product created

**Kit/Phantom BOM**:
- Explodes into components at sale
- No production order created
- Useful for: Bundles, configured sets

**Subcontracting**:
- Production performed by external vendor
- Components sent to vendor
- Finished product received back

### Make-to-Stock vs. Make-to-Order

**Make-to-Stock (MTS)**:
- Forecast demand, produce to inventory
- Uses reorder points or planning scheduler
- Best for: Predictable demand, standardized products

**Make-to-Order (MTO)**:
- Produce only when order received
- No finished goods inventory risk
- Longer customer lead times
- Best for: Custom products, configured items

### Common Pitfalls

- **BOM accuracy**: Wrong components = wrong product. Validate with samples.
- **Routing times**: Underestimated times break scheduling. Start conservative.
- **Unit of measure**: BOM component UOM must match stock UOM or conversion defined.
- **Component availability**: Unavailable components stop production. Monitor closely.
- **Cost rollups**: Verify all component costs and work center rates before first production.

### Enterprise vs. Community

**Community Edition**:
- BOMs and manufacturing orders
- Basic planning
- Manual operation tracking

**Enterprise Edition**:
- Work orders with operation tracking
- PLM (Product Lifecycle Management)
- Quality control points
- Tablet/shop floor interface
- Overall Equipment Effectiveness (OEE)

### Downstream Impact Summary

Changes in Manufacturing affect:
- **Inventory**: Component consumption, finished goods production
- **Accounting**: WIP valuation, COGS, production variances
- **Sales**: Available-to-promise for MTS products, lead times for MTO
- **Purchase**: Component demand, make-or-buy decisions
- **Planning**: Capacity utilization, scheduling accuracy

## Readiness Criteria

Manufacturing domain is operationally ready when:
- [ ] MRP-FOUND-001: Work centers defined with capacity
- [ ] MRP-FOUND-002: BOMs documented and validated
- [ ] MRP-DREQ-001: Routings configured
- [ ] MRP-DREQ-002: MO workflow established
- [ ] MRP-DREQ-003: Component availability rules defined
- [ ] MRP-GL-001: Sample MOs processed end-to-end
- [ ] MRP-GL-002: Costing integration validated
- [ ] Production floor staff trained on workflows
