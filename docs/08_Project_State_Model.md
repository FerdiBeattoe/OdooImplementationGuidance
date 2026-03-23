# Project State Model

## Purpose

This document defines what state the platform must save so implementation work can be governed, reviewed, and resumed accurately.

## What Project State Is Saved

The platform must save enough state to reconstruct:

- what project this is
- what environment it targets
- what stage and domain work is underway
- which checkpoints are complete, blocked, warned, or deferred
- which decisions were made and by whom
- what training is available or required

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
- last reviewed timestamp or placeholder field
- last status transition actor and timestamp or placeholder field

## Decision Log Linkage

Project state must link checkpoints and workspaces to relevant decision records so users can see why a given choice exists and what it affects.

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

This is especially important for Odoo.sh Enterprise change control.

## Resume Behavior

When a project is resumed, the platform should:

- return the user to the last meaningful working location
- restore unresolved blockers and warnings prominently
- preserve unsatisfied dependencies
- preserve deferred items with their review conditions
- preserve environment and target context

Resume must not imply readiness if the saved state only reflects partial configuration work.

## Status Model

The platform uses the following status model:

- `Not Started`
  - no substantive work has begun
- `In Progress`
  - work is active and not yet ready for review
- `Blocked`
  - required progress cannot continue due to unmet conditions
- `Ready For Review`
  - work is complete enough for explicit review or approval
- `Complete`
  - the defined work item satisfies its criteria
- `Deferred`
  - the item is intentionally postponed under recorded conditions

## Configuration Completion Vs Operational Readiness

Configuration completion means the necessary setup work has been performed for the defined scope.

Operational readiness means:

- required checkpoints have passed
- go-live controls are satisfied
- required decisions are approved
- known blockers are resolved
- training requirements, if explicitly mandated by the project owner, are addressed

The platform must never treat configuration completion alone as proof of operational readiness.
