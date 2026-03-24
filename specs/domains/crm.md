# CRM Domain Specification

## Domain Identity

- **Domain ID**: `crm`
- **Label**: CRM
- **Module Dependencies**: `crm`, `crm_iap_mine` (lead mining), `crm_sms`
- **Edition**: Community and Enterprise

## Purpose

Guide users through configuring the CRM domain in Odoo 19, including:
- Lead and opportunity pipeline stages
- Sales teams and assignment rules
- Activity types and follow-up scheduling
- Lead scoring and automation
- Customer communication tracking

## Checkpoints

### Foundational

#### CRM-FOUND-001: Pipeline Stages Defined
- **Class**: Foundational
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Stage names reflect sales process (New, Qualified, Proposal, Negotiation, Won, Lost)
  - Probability percentages assigned to each stage
  - Stage sequence logical and ordered
- **Downstream Impact**: 
  - Affects forecasting accuracy
  - Affects conversion rate reporting
  - Affects pipeline visibility
- **Write Safety**: `safe` — creates `crm.stage` records

#### CRM-FOUND-002: Sales Teams Configured
- **Class**: Foundational
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Team structure matches organization
  - Team members assigned with correct roles
  - Team-specific pipelines configured
- **Downstream Impact**: 
  - Affects opportunity assignment
  - Affects activity distribution
  - Affects team performance metrics
- **Write Safety**: `safe` — creates `crm.team` records

### Domain Required

#### CRM-DREQ-001: Lead Scoring Activated
- **Class**: Domain Required
- **Validation Source**: user_asserted + system_detected
- **Evidence Required**: 
  - Scoring rules based on relevant criteria (country, industry, size)
  - Score thresholds for priority levels
  - Assignment rules based on scores
- **Downstream Impact**: 
  - Affects lead prioritization
  - Affects sales team workload distribution
- **Write Safety**: `safe` — creates `crm.lead.scoring.frequency` records

#### CRM-DREQ-002: Activity Types Established
- **Class**: Domain Required
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Standard activities defined (Call, Meeting, Email, Quote)
  - Default scheduling intervals
  - Icons and colors for visual identification
- **Downstream Impact**: 
  - Affects follow-up discipline
  - Affects activity reporting
- **Write Safety**: `safe` — creates `mail.activity.type` records

#### CRM-DREQ-003: Lost Reasons Catalogued
- **Class**: Domain Required
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Common loss reasons defined (Price, Timing, Competitor, No Budget)
  - Reasons specific to business captured
  - Analysis framework prepared
- **Downstream Impact**: 
  - Affects loss analysis
  - Guides product/pricing improvements
- **Write Safety**: `safe` — creates `crm.lost.reason` records

### Go-Live

#### CRM-GL-001: Sample Opportunities Processed
- **Class**: Go-Live
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Test lead entered and converted to opportunity
  - Opportunity moved through pipeline stages
  - Activities scheduled and logged
  - Opportunity marked won with order generated
- **Downstream Impact**: 
  - Validates full lead-to-cash flow
  - Confirms integration with Sales
- **Write Safety**: `safe` — test data

#### CRM-GL-002: Reporting Dashboards Validated
- **Class**: Go-Live
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Pipeline report shows expected funnel
  - Activity report shows planned actions
  - Forecast report reflects stage probabilities
- **Downstream Impact**: 
  - Management visibility
  - Sales coaching data
- **Write Safety**: `blocked` — reporting is read-only

### Recommended

#### CRM-REC-001: Lead Enrichment Configured
- **Class**: Recommended
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - IAP credits available (Odoo IAP)
  - Enrichment rules defined
  - Data privacy compliance confirmed
- **Downstream Impact**: 
  - Lead data quality
  - Reduced manual research
- **Write Safety**: `conditional` — requires IAP account

#### CRM-REC-002: Automated Actions Enabled
- **Class**: Recommended
- **Validation Source**: user_asserted
- **Evidence Required**: 
  - Automation rules for stage changes
  - Email templates for follow-ups
  - Escalation rules for dormant opportunities
- **Downstream Impact**: 
  - Sales productivity
  - Response time consistency
- **Write Safety**: `safe` — creates `base.automation` records

## Configuration Model

### Sections

1. **Pipeline Stages** (`pipeline_stages`)
   - Label: Pipeline Stages
   - Description: Define your sales funnel stages
   - Records: stage name, probability, sequence, fold status
   - Linked Checkpoint: CRM-FOUND-001

2. **Sales Teams** (`sales_teams`)
   - Label: Sales Teams
   - Description: Configure your sales organization
   - Records: team name, members, alias, invoicing target
   - Linked Checkpoint: CRM-FOUND-002

3. **Activity Types** (`activity_types`)
   - Label: Activity Types
   - Description: Standardize your follow-up activities
   - Records: activity name, icon, default schedule, mail template
   - Linked Checkpoint: CRM-DREQ-002

4. **Lost Reasons** (`lost_reasons`)
   - Label: Lost Reasons
   - Description: Capture why opportunities don't close
   - Records: reason name, category
   - Linked Checkpoint: CRM-DREQ-003

## Inspection Capabilities

### Models to Inspect

- `crm.stage` — Pipeline stages
- `crm.team` — Sales teams
- `crm.lead` — Lead counts and status
- `crm.opportunity` — Opportunity counts by stage
- `mail.activity.type` — Activity types

### Signals to Detect

- Stages with zero probability (breaks forecasting)
- Duplicate stage names
- Teams without members
- Opportunities without assigned team
- Stale opportunities (no activity for 30+ days)

## Preview/Execution Actions

### Safe Actions

- Create pipeline stage (`crm.stage`)
- Create sales team (`crm.team`)
- Create activity type (`mail.activity.type`)
- Create lost reason (`crm.lost.reason`)
- Update opportunity stage
- Log activity on opportunity

### Conditional Actions

- Modify stage probability — affects forecasting
- Archive stage — requires moving existing opportunities
- Reassign opportunities between teams
- Merge duplicate leads

### Blocked Actions

- Delete stage with historical opportunities
- Delete team with historical opportunities
- Direct database manipulation of lead/opportunity tables
- Modify closed opportunity historical data

## Guidance Content

### Getting Started

The CRM domain manages your sales pipeline and customer relationships. Before configuring CRM:

1. **Map your sales process**: Document current lead-to-close workflow
2. **Define your teams**: Clarify territories or product-based assignments
3. **Set expectations**: Probability percentages should reflect historical win rates

### Stage Probability Guidelines

Probabilities should reflect historical conversion rates:
- **New/Lead**: 5-10%
- **Qualified**: 20-30%
- **Proposal**: 40-60%
- **Negotiation**: 70-90%
- **Won**: 100%
- **Lost**: 0%

Inaccurate probabilities break forecasting. Review and adjust based on actual data.

### Lead vs. Opportunity

**Leads**: Unqualified contacts (marketing qualified)
- Bulk import from trade shows, website forms
- May convert to opportunity or archived as unqualified
- Minimal data entry required

**Opportunities**: Qualified deals with revenue potential
- Created from leads or directly for known prospects
- Require expected revenue and close date
- Drive forecasting and pipeline value

### Common Pitfalls

- **Too many stages**: Complicates forecasting. Keep it simple (5-7 stages).
- **Probability guessing**: Without historical data, start conservative.
- **Activity neglect**: Unlogged activities break follow-up tracking.
- **Team overlap**: Ensure clear assignment rules to avoid conflicts.
- **Lost reason laziness**: Always capture lost reasons for analysis.

### Downstream Impact Summary

Changes in CRM affect:
- **Sales**: Quotation generation from opportunities
- **Marketing**: Campaign effectiveness tracking
- **Reporting**: Revenue forecasting, conversion analysis
- **Service**: Post-sale issue escalation visibility

## Readiness Criteria

CRM domain is operationally ready when:
- [ ] CRM-FOUND-001: Pipeline stages defined with probabilities
- [ ] CRM-FOUND-002: Sales teams configured
- [ ] CRM-DREQ-001: Lead scoring rules active (if applicable)
- [ ] CRM-DREQ-002: Activity types established
- [ ] CRM-DREQ-003: Lost reasons catalogued
- [ ] CRM-GL-001: Sample opportunities processed end-to-end
- [ ] CRM-GL-002: Reporting dashboards validated
