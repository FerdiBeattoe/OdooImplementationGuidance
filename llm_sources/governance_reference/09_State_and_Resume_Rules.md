# State And Resume Rules

## Project Identity Fields

- project name
- project identifier
- customer or organizational entity
- project owner
- implementation lead
- selected project mode
- target Odoo version
- target edition
- target deployment type

## Environment Context

Must capture:

- deployment type
- hosting constraints
- company scope
- localization context
- module/domain scope
- Odoo.sh branch/environment target where relevant

Odoo.sh branch/environment target is mandatory for deployment-sensitive Enterprise work.

## Workflow State

Must capture:

- current stage
- current domain workspace
- last active section
- stage completion status
- domain completion status
- readiness summary state

## Checkpoint State

Each checkpoint record must capture:

- checkpoint identifier
- checkpoint class
- status
- validation source
- evidence status
- checkpoint owner
- reviewer or approver where applicable
- evidence reference or evidence location
- write safety class
- blocker flag
- blocked reason
- deferment flag
- deferment reason and constraint
- dependency references
- last reviewed timestamp or placeholder field
- last status transition actor and timestamp or placeholder field

## Linked State

- checkpoint and workspace state must link to relevant decision records
- training state must capture training available, training assigned, training required by project owner, and training completed
- branch/environment target state must capture target environment or branch, target status, and whether validation evidence is environment-specific

## Status Model

- `Not Started`
- `In Progress`
- `Blocked`
- `Ready For Review`
- `Complete`
- `Deferred`

## Resume Rules

When a project is resumed, the platform should:

- return the user to the last meaningful working location
- restore unresolved blockers and warnings prominently
- preserve unsatisfied dependencies
- preserve deferred items with their review conditions
- preserve environment and target context

Resume must not imply readiness if the saved state only reflects partial configuration work.

## Readiness Distinction

- configuration completion means the necessary setup work has been performed for the defined scope
- operational readiness requires required checkpoints, go-live controls, approved decisions, resolved known blockers, and any explicitly mandated training requirements
- configuration completion alone is never proof of operational readiness
