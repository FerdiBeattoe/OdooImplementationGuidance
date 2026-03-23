# IA And Navigation Guards

## Primary Navigation

Top-level views:

1. Dashboard
2. Stages
3. Domains
4. Decisions and Readiness

## Navigation Rules

Stage navigation:

- reflects the master implementation sequence
- highlights stage-level blockers and completion status
- exposes prerequisite relationships
- supports required progression discipline

Domain navigation:

- groups checkpoints, guidance, and validation by business domain
- surfaces cross-stage dependencies
- shows whether the domain is required, go-live, recommended, or optional

Stage navigation controls sequencing. Domain navigation controls working depth. Both must reflect the same checkpoint state.

## Dashboard Structure

The dashboard should summarize:

- project identity and mode
- version, edition, deployment, and environment context
- stage progress
- domain progress
- blocked checkpoints
- warnings needing review
- ready-for-review items
- deferred items
- go-live readiness summary

The dashboard is a control surface, not a reporting warehouse.

## Workspace Structure

Each stage or domain workspace should contain:

1. context header
2. current status
3. checkpoint list
4. guidance blocks
5. evidence and validation panel
6. decision log references
7. training entry points where available

## Grid-Builder Guards

- use only where structured comparison or repeated records improve clarity
- scope to a section or domain, not as a single generic mega-grid
- connect each row or item to checkpoint and validation state where relevant
- distinguish editable data from read-only derived status
- do not let grids become unrestricted bulk-edit tools

## Checkpoint Panel Guards

Each checkpoint panel should show:

- checkpoint name
- checkpoint class
- status
- validation source
- evidence state
- downstream impact summary
- blocker or deferment indicator
- write safety classification

Checkpoint panels must make it clear why a user can or cannot proceed.

## Training Access Pattern

- training access must be available but not forced by default
- show training availability next to relevant guidance or checkpoint groups
- allow project owners to mark specific training items as required
- distinguish available training from required training

## Save-And-Resume And Odoo.sh UI Guards

- save-and-resume is mandatory
- preserve stage position, checkpoint state, unresolved warnings and blockers, decision log links, and environment/branch target state where relevant
- where Odoo.sh Enterprise changes are relevant, display the current branch or environment target prominently
- distinguish production from non-production targets
- prevent ambiguous completion marking when target context is missing
- attach branch-target evidence to affected checkpoints

## Advanced/Admin Boundaries

Advanced or admin-oriented views may expose more detail, but they must not:

- bypass checkpoint rules
- expose blocked write paths as if they were allowed
- redefine scope or project mode
- convert the product into a developer diagnostic console

Advanced mode increases visibility, not authority.
