# Product Lifecycle Management (PLM) Domain Specification

## Domain Identity

- **Domain ID**: `plm`
- **Label**: PLM
- **Module Dependencies**: `mrp_plm` (Enterprise only)
- **Edition**: Enterprise only (not available in Community)
- **Deployment Note**: Requires Manufacturing app as prerequisite

## Purpose

Guide users through configuring the PLM domain in Odoo 19 Enterprise, including:
- Engineering Change Order (ECO) workflows
- Version control for BOMs and routings
- Approval stages and sign-offs
- Effectivity dates and change implementation
- ECO types and categorization

## Checkpoints

### Foundational

#### PLM-FOUND-001: ECO Types Defined
- **Class**: Foundational
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - ECO type categories established (New Product, BOM Change, Process Change, Obsolescence)
  - Type-specific workflows mapped
  - Stakeholder roles identified
- **Downstream Impact**: 
  - Affects change categorization
  - Affects reporting and metrics
- **Write Safety**: `safe` — creates `mrp.eco.type` records

#### PLM-FOUND-002: ECO Approval Stages Configured
- **Class**: Foundational
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Approval stages defined (Draft → Engineering Review → Approval → Implementation)
  - Approver assignments per stage
  - Stage gate criteria documented
- **Downstream Impact**: 
  - Affects change velocity
  - Affects audit compliance
- **Write Safety**: `safe` — creates approval workflow configuration

### Domain Required

#### PLM-DREQ-001: Effectivity Date Management Established
- **Class**: Domain Required
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Effectivity date policies defined
  - Immediate vs. scheduled changes distinguished
  - Cutover procedures documented
- **Downstream Impact**: 
  - Affects production continuity
  - Affects inventory transition
- **Write Safety**: `conditional` — date changes affect planning

#### PLM-DREQ-002: BOM Versioning Strategy Implemented
- **Class**: Domain Required
- **Validation Source**: user_asserted + system_detected
- **Evidence Required**: 
  - Version numbering scheme defined
  - Obsolete version handling rules
  - Revision history retention policy
- **Downstream Impact**: 
  - Affects production order referencing
  - Affects cost tracking
- **Write Safety**: `conditional` — versioning changes affect historical records

#### PLM-DREQ-003: ECO Impact Assessment Workflow Active
- **Class**: Domain Required
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Impact assessment checklist defined
  - Inventory impact evaluation required
  - WIP impact evaluation required
  - Customer order impact evaluation required
- **Downstream Impact**: 
  - Prevents production disruptions
  - Affects change success rate
- **Write Safety**: `safe` — process documentation

### Go-Live

#### PLM-GL-001: Pilot ECO Processed End-to-End
- **Class**: Go-Live
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Test ECO created and categorized
  - Approval workflow executed
  - BOM changes applied
  - Implementation verified
- **Downstream Impact**: 
  - Validates PLM workflow
  - Confirms integration with Manufacturing
- **Write Safety**: `safe` — test ECOs can be archived

#### PLM-GL-002: ECO Metrics and Reporting Validated
- **Class**: Go-Live
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - ECO cycle time measurable
  - Approval bottleneck identification possible
  - Implementation success rate trackable
- **Downstream Impact**: 
  - Continuous improvement visibility
  - Team performance management
- **Write Safety**: `blocked` — reporting is read-only

### Recommended

#### PLM-REC-001: Advanced ECO Automation Configured
- **Class**: Recommended
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Automatic approver assignment rules
  - Notification triggers configured
  - Escalation rules for stalled ECOs
- **Downstream Impact**: 
  - Change velocity improvement
  - Reduced manual coordination
- **Write Safety**: `safe` — automation rules

#### PLM-REC-002: Integration with CAD/External PLM
- **Class**: Recommended
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - CAD connector configured (if applicable)
  - External PLM sync established (if applicable)
  - Drawing/document attachment workflow defined
- **Downstream Impact**: 
  - Engineering productivity
  - Data consistency
- **Write Safety**: `conditional` — integration configuration

## Configuration Model

### Sections

1. **ECO Types** (`eco_types`)
   - Label: ECO Types
   - Description: Categorize your engineering changes
   - Records: type name, description, default workflow
   - Linked Checkpoint: PLM-FOUND-001

2. **Approval Stages** (`approval_stages`)
   - Label: Approval Stages
   - Description: Define your change approval workflow
   - Records: stage name, sequence, approvers, approval type
   - Linked Checkpoint: PLM-FOUND-002

3. **Effectivity Policies** (`effectivity_policies`)
   - Label: Effectivity Policies
   - Description: Manage change timing
   - Records: policy name, effectivity mode, cutover rules
   - Linked Checkpoint: PLM-DREQ-001

4. **Version Control** (`version_control`)
   - Label: Version Control
   - Description: Configure BOM and routing versioning
   - Records: version scheme, retention rules, obsolete handling
   - Linked Checkpoint: PLM-DREQ-002

## Inspection Capabilities

### Models to Inspect

- `mrp.eco.type` — ECO types
- `mrp.eco` — Engineering change orders
- `mrp.eco.approval` — Approval records
- `mrp.bom` — BOM versions
- `mrp.routing` — Routing versions

### Signals to Detect

- ECOs stuck in approval for >30 days
- BOMs with multiple unrevised versions active
- Approved ECOs with future effectivity dates approaching
- ECOs without impact assessments
- Obsolete BOMs still referenced in planning

## Preview/Execution Actions

### Safe Actions

- Create ECO type (`mrp.eco.type`)
- Create ECO (`mrp.eco`)
- Submit ECO for approval
- Approve ECO (authorized approvers)
- Apply ECO changes (when approved)

### Conditional Actions

- Modify ECO after submission — requires recall and resubmission
- Modify approved BOM — requires new ECO
- Change effectivity date — requires replanning
- Archive ECO — requires status validation

### Blocked Actions

- Delete ECO with approval history
- Modify applied ECO changes retroactively
- Delete BOM version referenced by historical MOs
- Direct database manipulation of PLM tables
- Bypass approval workflow

## Guidance Content

### Getting Started

The PLM domain manages controlled engineering changes. Before configuring PLM:

1. **Assess your change volume**: How many BOM/process changes per month?
2. **Identify stakeholders**: Who must approve changes before implementation?
3. **Define criticality**: Which changes need immediate implementation vs. scheduled?
4. **Establish governance**: Who can initiate ECOs? Who approves?

### ECO vs. Direct BOM Edit

**Always use ECO for**:
- Production BOMs
- Customer-facing products
- Regulated products (medical, aerospace)
- Changes requiring traceability

**Direct edit acceptable for**:
- Prototype/R&D BOMs
- Pre-production planning
- Internal tooling

### Effectivity Date Strategy

**Immediate effectivity**:
- Applied as soon as approved
- May require immediate production notification
- Risk of WIP disruption

**Scheduled effectivity**:
- Applied on specific date
- Allows inventory run-down
- Aligns with production schedule
- Preferred for most changes

### Impact Assessment Checklist

Before approving any ECO, evaluate:
- [ ] **Inventory**: Existing stock of old components
- [ ] **WIP**: Work in process using old BOM
- [ ] **Purchase**: Open purchase orders for old components
- [ ] **Sales**: Customer orders promising old configuration
- [ ] **Cost**: Cost impact of component or process change
- [ ] **Quality**: Testing/validation requirements
- [ ] **Documentation**: Customer notification, specification updates

### Common Pitfalls

- **Approval bottlenecks**: Too many approvers slow changes. Streamline.
- **Effectivity confusion**: Immediate vs. scheduled must be explicit.
- **Version proliferation**: Uncontrolled versioning creates planning confusion.
- **WIP disruption**: Failing to assess WIP impact causes scrap/rework.
- **Legacy data**: Historical BOM versions must remain accessible.

### Enterprise Only Considerations

PLM requires Enterprise edition. If you're on Community:
- Document changes manually outside Odoo
- Use version numbers in BOM names
- Maintain change log in external system
- Consider upgrade path to Enterprise for PLM

### Downstream Impact Summary

Changes in PLM affect:
- **Manufacturing**: BOM versions used in production orders
- **Inventory**: Component demand, stock transitions
- **Purchasing**: Component procurement changes
- **Sales**: Product availability and configuration
- **Costing**: Product cost rollups and variances
- **Quality**: Inspection requirements, compliance documentation

## Readiness Criteria

PLM domain is operationally ready when:
- [ ] PLM-FOUND-001: ECO types defined
- [ ] PLM-FOUND-002: Approval stages configured
- [ ] PLM-DREQ-001: Effectivity date management established
- [ ] PLM-DREQ-002: BOM versioning strategy implemented
- [ ] PLM-DREQ-003: Impact assessment workflow active
- [ ] PLM-GL-001: Pilot ECO processed end-to-end
- [ ] PLM-GL-002: ECO metrics validated
- [ ] Engineering team trained on ECO process
- [ ] **Note**: PLM requires Enterprise edition. Community users need alternative change control.
