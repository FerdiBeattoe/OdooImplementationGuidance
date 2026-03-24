# Project State Model

## Purpose

This document defines what state the platform must save so implementation work can be governed, previewed, reviewed, executed where allowed, and resumed accurately.

## What Project State Is Saved

The platform must save enough state to reconstruct:

- what project this is
- what environment it targets
- what stage and domain work is underway
- which checkpoints are complete, blocked, warned, or deferred
- which decisions were made and by whom
- what training is available or required
- what connection context was active where relevant
- what previews were generated
- what execution attempts succeeded or failed

## Project Identity Fields

Required identity fields:

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

The state model must capture environment context relevant to the supported deployment:

- deployment type
- hosting constraints
- company scope
- localization context
- module/domain scope
- Odoo.sh branch/environment target where relevant
- connection capability state
- connection target identifiers sufficient to resume governed work safely

Odoo.sh branch/environment target is mandatory for deployment-sensitive Enterprise work.

## Workflow State

Workflow state must capture:

- current stage
- current domain workspace
- last active section
- stage completion status
- domain completion status
- readiness summary state

## Checkpoint State

Each checkpoint record should capture:

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
- linked preview identifiers where applicable
- linked execution outcome identifiers where applicable
- last reviewed timestamp or placeholder field
- last status transition actor and timestamp or placeholder field

## Connection State

Where connection is implemented, project state must capture:

- connection mode
- connection status
- supported capability level such as inspection-only, preview-enabled, or execution-enabled
- authenticated environment identity sufficient for safe resume
- explicit note when the build or target does not support connection

Secrets must not be stored in project state.

## Preview State

Preview state should capture:

- preview identifier
- target deployment or branch context
- target model or setting
- intended operation
- intended field/value changes where relevant
- safety class
- prerequisite snapshot
- downstream impact summary
- preview actor and timestamp

## Execution State

Execution state should capture:

- execution identifier
- linked preview identifier
- execution actor
- target environment or branch
- status such as planned, approved, succeeded, failed, or cancelled
- execution result summary
- failure reason where applicable
- user confirmation or approval linkage where applicable
- timestamp fields for requested, started, and completed

## Decision Log Linkage

Project state must link checkpoints, previews, executions, and workspaces to relevant decision records so users can see why a given choice exists, what it affects, and what was actually applied.

## Training State

Training state should capture:

- training available
- training assigned
- training required by project owner
- training completed

Training assignment remains optional by default unless explicitly elevated by project owner.

## Branch / Environment Target State

Where relevant, the platform must save:

- target environment or branch
- target status such as planned, in review, approved, or applied
- whether validation evidence is environment-specific
- whether preview or execution was environment-specific

This is especially important for Odoo.sh Enterprise change control.

## Resume Behavior

When a project is resumed, the platform should:

- return the user to the last meaningful working location
- restore unresolved blockers and warnings prominently
- preserve unsatisfied dependencies
- preserve deferred items with their review conditions
- preserve environment and target context
- preserve preview and execution history where relevant

Resume must not imply readiness if the saved state only reflects partial configuration work, inspection, or incomplete preview.

## Status Model

The platform uses the following status model:

- `Not Started`
  - no substantive work has begun
- `In Progress`
  - work is active and not yet ready for review
- `Blocked`
  - required progress or execution cannot continue due to unmet conditions
- `Ready For Review`
  - work is complete enough for explicit review or approval
- `Complete`
  - the defined work item satisfies its criteria
- `Deferred`
  - the item is intentionally postponed under recorded conditions

## Configuration Completion Vs Operational Readiness

Configuration completion means the necessary setup work has been planned, previewed, or performed for the defined scope.

Operational readiness means:

- required checkpoints have passed
- go-live controls are satisfied
- required decisions are approved
- known blockers are resolved
- required preview and execution records, where applicable, are complete
- training requirements, if explicitly mandated by the project owner, are addressed

The platform must never treat configuration completion or isolated execution success alone as proof of operational readiness.
