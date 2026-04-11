# Information Architecture

## Purpose

This document defines the primary navigation and workspace structure for the human-guided Odoo self-implementation platform.

## Fixed Product Surfaces

The platform has three fixed product surfaces. These must be present, navigable, and functional. They are not interchangeable and may not be removed, merged into one surface, or treated as subordinate to each other.

### Pipeline

The Pipeline is the logic and control layer. It sequences implementation stages, drives discovery questions, enforces checkpoints, determines domain activation, governs execution eligibility, and tracks implementation state. Users see their progress, blockers, and next required actions here.

### Module Dashboard

The Module Dashboard is the module-level workspace. It exposes each activated domain's checkpoints, guidance, inspection output, and execution surface. Where truthful governed writes exist, the Module Dashboard writes configuration to Odoo through the governed execution path. Users interact with Odoo here.

### Import Wizard

The Import Wizard is the data import surface. It guides the user through data preparation, template download, validation, and governed import execution that writes records directly to Odoo.

## Primary Navigation Model

The primary navigation structure supports access to all three fixed surfaces and their supporting context:

1. Dashboard — project summary, stage progress, domain progress, blockers, next actions
2. Implementation Roadmap — stage-ordered view of the implementation journey
3. Module Setup (Module Dashboard) — domain-level workspaces, checkpoints, inspection, preview, execution
4. Data Import (Import Wizard) — governed data import and template preparation
5. Pipeline — checkpoint state, domain activation, governed execution layer
6. Knowledge Base — methodology content and decision reference
7. Analytics — implementation progress and audit reporting
8. Audit Log — execution and checkpoint audit trail
9. Team — team members, roles, and access

This navigation model keeps the product centered on governed implementation work rather than a generic settings or admin interface.

## Stage Navigation Vs Domain Navigation

### Stage Navigation

Use stage navigation when the user needs to move through the implementation journey in dependency order.

Stage navigation should:

- reflect the master implementation sequence
- highlight stage-level blockers and completion status
- expose prerequisite relationships
- support required progression discipline

### Domain Navigation

Use domain navigation when the user needs deep, topic-specific work within a functional area.

Domain navigation should:

- group checkpoints, guidance, inspection, preview, and validation by business domain
- surface cross-stage dependencies
- show whether the domain is required, go-live, recommended, or optional
- show whether the current domain surface is manual-only, inspectable, previewable, or executable

Stage navigation controls sequencing. Domain navigation controls working depth. Both must reflect the same checkpoint state.

## Dashboard Structure

The dashboard should summarize:

- project identity and mode
- version, edition, deployment, and environment context
- connection status
- stage progress
- domain progress
- blocked checkpoints
- warnings needing review
- ready-for-review items
- deferred items
- go-live readiness summary
- the next required manual, preview, or execution action

The dashboard is a control surface, not a reporting warehouse or admin console.

## Section Workspace Structure

Each stage or domain workspace should contain:

1. context header
2. current status
3. checkpoint list
4. guidance blocks
5. evidence and validation panel
6. inspection summary where implemented
7. preview panel where implemented
8. execution result panel where implemented
9. decision log references
10. training entry points where available

This structure must remain stable enough that users can resume work without re-learning the interface.

## Connection And Execution Surfaces

- Connection must be its own explicit workspace section or dashboard section.
- The UI must state exactly which connection methods are supported in the current build.
- The UI must distinguish:
  - not connected
  - connected for inspection only
  - connected for preview
  - connected for bounded execution
- Unsupported connection or execution paths must be stated directly rather than implied.

## Grid-Builder Page Pattern

Grid builders are section-specific structured pages used to capture repeatable implementation decisions with controlled fields.

Rules for grid builders:

- use them only where structured comparison or repeated records improve clarity
- scope them to a section or domain, not as a single generic mega-grid
- connect each row or item to checkpoint, preview, and validation state where relevant
- distinguish editable data from read-only derived status
- do not let grids become unrestricted bulk-edit tools

## Checkpoint Panel Pattern

Each checkpoint panel should show:

- checkpoint name
- checkpoint class
- status
- validation source
- evidence state
- downstream impact summary
- blocker or deferment indicator
- execution safety classification
- preview or execution state where implemented

Checkpoint panels must make it clear why a user can or cannot proceed or execute.

## Training Access Pattern

Training access must be available but not forced by default.

The interface should:

- show training availability next to relevant guidance or checkpoint groups
- allow project owners to mark specific training items as required
- distinguish available training from required training

## Save-And-Resume Pattern

Save-and-resume is mandatory.

The interface must:

- preserve stage position
- preserve checkpoint state
- preserve unresolved warnings and blockers
- preserve decision log links
- preserve connection context where relevant
- preserve preview and execution history where relevant
- preserve environment and branch target state where relevant
- restore users to a meaningful last-working context

## Odoo.sh Branch-Targeting UI Considerations

Where Odoo.sh Enterprise changes are relevant, the UI should:

- display the current branch or environment target prominently
- distinguish production from non-production targets
- prevent ambiguous completion marking when target context is missing
- attach branch-target evidence to affected checkpoints
- keep execution blocked or conditional until the target is explicit

## Advanced/Admin Mode Boundaries

Advanced or admin-oriented views may expose more detail, but they must not:

- bypass checkpoint rules
- expose blocked write paths as if they were allowed
- redefine scope or project mode
- convert the product into an unrestricted developer diagnostic console
- expose direct database, shell, or unrestricted Odoo administration

Advanced mode increases visibility, not authority.
